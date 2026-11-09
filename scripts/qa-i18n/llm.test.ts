// LLM layer with a fake LlmClient (spec §6.1): no SDK, no network, no key.
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlossarySchema, TOOL_DIR, readJsonConfig } from './inputs.ts';
import {
  DEFAULT_CAPS, buildBatches, enabledChecks, estimateTokens, makePlan, promptText, runLlm, type LlmClient, type LlmRequest, type LlmResponse,
} from './llm.ts';
import { ReportSchema, toWireSchema, llmOutputSchema, type Finding, type Unit } from './schema.ts';

beforeEach(() => {
  delete process.env.MAGNETO_QA_ANTHROPIC_API_KEY;
});

const glossary = readJsonConfig(path.join(TOOL_DIR, 'config/glossary.json'), GlossarySchema);
const pricing = { source: 'https://example.test/pricing', date: '2026-11-09', models: { 'model-a': { input: 1, output: 5, cacheWrite5m: 1.25, cacheRead: 0.1 } } };

const unit = (id: string, en: string, fr: string, post = 'p'): Unit => ({
  id, source: 'content-json', location: { file: { en: 'en.json', fr: 'fr.json' }, post }, kind: 'html', llm: true, values: { en, fr },
});
const A = unit('content:p/a', '<p>You approve the improvements before work starts.</p>', '<p>Magneto approuve les améliorations avant le début des travaux.</p>');
const B = unit('content:p/b', 'All prices are in Canadian dollars.', 'Tous les prix sont en dollars canadiens.');
const C = unit('content:q/c', 'Ask about CARE', 'Discutons de CARE', 'q');

const usage = (inputTokens = 100) => ({ inputTokens, outputTokens: 50, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 });
const reply = (output: unknown, stopReason = 'end_turn', u = usage()): LlmResponse => ({ output, usage: u, stopReason, requestId: 'req_test' });
const drift = { unitId: 'content:p/a', check: 'meaning-drift', severity: 'error', enExcerpt: 'You approve the improvements', targetExcerpt: 'Magneto approuve les améliorations', reason: 'EN: the client approves; FR: Magneto approves.' };

function fake(respond: (req: LlmRequest, n: number) => LlmResponse | Promise<LlmResponse>) {
  let n = 0;
  const review = vi.fn(async (req: LlmRequest) => respond(req, ++n));
  return { client: { review } as LlmClient, review };
}

const batches = (units = [A, B]) => buildBatches(units, { langs: ['fr'], glossary, ctaLabels: {} });
const run = (client: LlmClient, opts: { units?: Unit[]; caps?: typeof DEFAULT_CAPS; deterministic?: Finding[] } = {}) =>
  runLlm({ batches: batches(opts.units), client, model: 'model-a', caps: opts.caps ?? DEFAULT_CAPS, glossary, deterministic: opts.deterministic ?? [] });

describe('batching, schema and plan', () => {
  it('one batch per (post, language); the wire schema has no length keywords and enumerates the unit ids', () => {
    const b = batches([A, B, C]);
    expect(b.map((x) => x.id)).toEqual(['content-json:p:fr', 'content-json:q:fr']);
    const wire = JSON.stringify(b[0].outputSchema);
    expect(wire).not.toMatch(/maxLength|\$schema/);
    expect(wire).toContain('"additionalProperties":false');
    expect(wire).toContain('content:p/a');
    expect(b[0].system).toContain('Never propose, write or quote a new translation');
    expect(b[0].system).toContain('vous'); // register rule: glossary approved
  });
  it('register and glossary checks are off until the glossary is approved (D-9)', () => {
    expect(enabledChecks({ ...glossary, approved: { by: null, on: null } })).not.toContain('register');
    expect(enabledChecks(glossary)).toEqual(['meaning-drift', 'omission', 'addition', 'glossary', 'register', 'untranslated']);
  });
  it('plan: ceil(chars/3)×1.2 per request, output = requests × max tokens, over-cap reported', () => {
    expect(estimateTokens(300)).toBe(120);
    const plan = makePlan(batches(), 'model-a', DEFAULT_CAPS, pricing);
    expect(plan.batches).toBe(1);
    expect(plan.estOutputTokens).toBe(DEFAULT_CAPS.maxOutputTokens);
    expect(plan.overCap).toEqual([]);
    expect(makePlan(batches([A, C]), 'model-a', { ...DEFAULT_CAPS, maxRequests: 1 }, pricing).overCap[0]).toMatch(/requests 2 > --max-requests 1/);
    expect(makePlan(batches(), 'unpriced', DEFAULT_CAPS, pricing).estimatedUsd).toBeNull();
  });
  it('promptText turns HTML into lines and list items', () => {
    expect(promptText('<p>Intro</p><ul><li>One</li><li>Two</li></ul>')).toBe('Intro\n- One\n- Two');
  });
});

describe('response validation with the fake client', () => {
  it('a valid output → findings (layer llm, language of the batch)', async () => {
    const { client } = fake(() => reply({ findings: [drift] }));
    const r = await run(client);
    expect(r.findings.map((f) => `${f.layer}:${f.check}:${f.lang}:${f.severity}:${f.unitId}`)).toEqual(['llm:meaning-drift:fr:error:content:p/a']);
    expect(r.batches.map((b) => b.status)).toEqual(['ok']);
    expect(r.incomplete).toBe(false);
    expect(r.usage.inputTokens).toBe(100);
  });
  it('an empty findings array is valid', async () => {
    const { client, review } = fake(() => reply({ findings: [] }));
    expect((await run(client)).findings).toEqual([]);
    expect(review).toHaveBeenCalledTimes(1);
  });
  it('an invalid output → exactly one re-ask, then the batch is failed (incomplete)', async () => {
    const { client, review } = fake(() => reply({ result: 'nope' }));
    const r = await run(client);
    expect(review).toHaveBeenCalledTimes(2);
    expect(r.batches.map((b) => b.status)).toEqual(['failed']);
    expect(r.incomplete).toBe(true);
  });
  it('max_tokens or refusal stop reasons count as invalid; the re-ask can succeed', async () => {
    const { client, review } = fake((_req, n) => (n === 1 ? reply(undefined, 'max_tokens') : reply({ findings: [drift] })));
    const r = await run(client);
    expect(review).toHaveBeenCalledTimes(2);
    expect(r.batches.map((b) => b.status)).toEqual(['ok']);
    expect(r.findings).toHaveLength(1);
  });
  it('an excerpt that is not a substring → rejectedLlmFindings (excerpt-not-found)', async () => {
    const { client } = fake(() => reply({ findings: [{ ...drift, targetExcerpt: 'Magneto valide les changements' }] }));
    const r = await run(client);
    expect(r.findings).toEqual([]);
    expect(r.rejected.map((x) => x.reason)).toEqual(['excerpt-not-found']);
  });
  it('an unknown unitId → rejected', async () => {
    const { client } = fake(() => reply({ findings: [{ ...drift, unitId: 'content:p/zzz' }] }));
    expect((await run(client)).rejected.map((x) => x.reason)).toEqual(['unknown-unitId']);
  });
  it('an extra "suggestion" property → rejected by the strict schema (no field for new text)', async () => {
    const { client } = fake(() => reply({ findings: [{ ...drift, suggestion: 'Vous approuvez les améliorations' }] }));
    const r = await run(client);
    expect(r.findings).toEqual([]);
    expect(r.rejected[0].reason).toMatch(/^schema: .*suggestion/);
  });
  it('an "untranslated" finding that only quotes keep terms → rejected (keep-term-only)', async () => {
    const f = { unitId: 'content:q/c', check: 'untranslated', severity: 'warning', enExcerpt: 'CARE', targetExcerpt: 'CARE', reason: 'English left.' };
    const { client } = fake(() => reply({ findings: [f] }));
    expect((await run(client, { units: [C] })).rejected.map((x) => x.reason)).toEqual(['keep-term-only']);
  });
  it('a finding that duplicates a deterministic one (same unit, language, equivalent check) is dropped and counted', async () => {
    const det = { check: 'numbers', unitId: 'content:p/a', lang: 'fr' } as Finding;
    const { client } = fake(() => reply({ findings: [drift] }));
    const r = await run(client, { deterministic: [det] });
    expect(r.findings).toEqual([]);
    expect(r.duplicatesDropped).toBe(1);
  });
  it('a client error marks the batch failed without a re-ask', async () => {
    const { client, review } = fake(() => {
      throw new Error('Anthropic API error: status 529');
    });
    const r = await run(client);
    expect(review).toHaveBeenCalledTimes(1);
    expect(r.batches[0]).toMatchObject({ status: 'failed', note: 'Anthropic API error: status 529' });
  });
});

describe('caps', () => {
  it('a cap reached mid-run → remaining batches skipped-cap, incomplete', async () => {
    const two = batches([A, C]);
    const caps = { ...DEFAULT_CAPS, maxInputTokens: two[0].estInputTokens + two[1].estInputTokens + 10 };
    const { client, review } = fake(() => reply({ findings: [] }, 'end_turn', usage(caps.maxInputTokens - 5)));
    const r = await run(client, { units: [A, C], caps });
    expect(review).toHaveBeenCalledTimes(1);
    expect(r.batches.map((b) => b.status)).toEqual(['ok', 'skipped-cap']);
    expect(r.incomplete).toBe(true);
  });
  it('the request cap counts re-asks', async () => {
    const { client, review } = fake(() => reply({ bad: true }));
    const r = await run(client, { units: [A, C], caps: { ...DEFAULT_CAPS, maxRequests: 2 } });
    expect(review).toHaveBeenCalledTimes(2);
    expect(r.batches.map((b) => b.status)).toEqual(['failed', 'skipped-cap']);
  });
});

it('ReportSchema and the wire schema derive from the same zod source', () => {
  expect(toWireSchema(llmOutputSchema(['u1'], ['omission']))).toMatchObject({ type: 'object', additionalProperties: false, required: ['findings'] });
  expect(ReportSchema.safeParse({}).success).toBe(false);
});
