// Seeded-defect eval: the deterministic half runs in npm test / CI (spec §6.2); the LLM half's plumbing is checked
// with a fake client. No key, no network, no SDK.
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlossarySchema, TOOL_DIR, readJsonConfig } from '../inputs.ts';
import { DEFAULT_CAPS, promptText, type LlmClient, type LlmRequest } from '../llm.ts';
import { KEY_VAR, loadAndCheck, type Deps } from '../qa-i18n.ts';
import { FIXTURE, evalMain, loadDefects, runFixture, score, worse } from './eval.ts';

beforeEach(() => {
  delete process.env.MAGNETO_QA_ANTHROPIC_API_KEY;
});

const glossary = readJsonConfig(path.join(TOOL_DIR, 'config/glossary.json'), GlossarySchema);
const defects = loadDefects();
const usage = { inputTokens: 100, outputTokens: 20, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 };

describe('fixture and defects', () => {
  it('14 defects (6 deterministic + 8 LLM) and 4 clean controls, all pointing at fixture units', async () => {
    expect(defects.defects.filter((d) => d.layer === 'deterministic')).toHaveLength(6);
    expect(defects.defects.filter((d) => d.layer === 'llm')).toHaveLength(8);
    expect(defects.controls).toHaveLength(4);
    const { units } = await loadAndCheck(FIXTURE, ['content-json', 'dictionary'], ['fr', 'es'], glossary);
    const ids = new Set(units.map((u) => u.id));
    [...defects.defects.map((d) => d.unitId), ...defects.controls].forEach((id) => expect(ids.has(id), id).toBe(true));
    expect(defects.controls.some((c) => defects.defects.some((d) => d.unitId === c))).toBe(false);
  });
});

describe('deterministic half (D-8)', () => {
  it('recall 6/6, 0 errors on the controls, ≤ 3 unplanted warnings or above', async () => {
    const run = await runFixture({ glossary, defects, model: 'none', caps: DEFAULT_CAPS });
    expect(run.score.deterministic.missed).toEqual([]);
    expect(run.score.deterministic.found).toHaveLength(6);
    expect(run.score.controlErrors).toEqual([]);
    expect(run.score.unplanted.length).toBeLessThanOrEqual(defects.threshold.unplantedWarningOrAboveMax);
    expect(run.score.llm).toBeNull();
    expect(run.score.pass).toBe(true);
  });
});

describe('LLM half plumbing with a fake client', () => {
  // A perfect fake reviewer: returns each planted LLM defect of the batch with excerpts copied from the input.
  async function perfectClient(): Promise<{ client: LlmClient; review: ReturnType<typeof vi.fn> }> {
    const { units } = await loadAndCheck(FIXTURE, ['content-json', 'dictionary'], ['fr', 'es'], glossary);
    const byId = new Map(units.map((u) => [u.id, u]));
    const review = vi.fn(async (req: LlmRequest) => {
      const lang = /Target language: (FR|ES)/.exec(req.user)?.[1].toLowerCase() as 'fr' | 'es';
      const ids = [...req.user.matchAll(/^unit (\S+) \(/gm)].map((m) => m[1]);
      const findings = defects.defects.filter((d) => d.layer === 'llm' && d.lang === lang && ids.includes(d.unitId)).map((d) => {
        const u = byId.get(d.unitId)!;
        return { unitId: d.unitId, check: d.check, severity: 'warning', enExcerpt: promptText(u.values.en!).slice(0, 20), targetExcerpt: promptText(u.values[lang]!).slice(0, 20), reason: d.description.slice(0, 400) };
      });
      return { output: { findings }, usage, stopReason: 'end_turn' };
    });
    return { client: { review } as LlmClient, review };
  }

  it('a reviewer that reports every planted LLM defect scores 8/8 and passes', async () => {
    const { client } = await perfectClient();
    const run = await runFixture({ glossary, defects, client, model: 'fake', caps: DEFAULT_CAPS });
    expect(run.score.llm?.missed).toEqual([]);
    expect(run.score.pass).toBe(true);
  });

  it('evalMain --llm --repeat 2 with a fake client: two runs, exit 0, eval.json + eval.md outside the repo', async () => {
    const { client, review } = await perfectClient();
    const stdout: string[] = [];
    const out = path.join(mkdtempSync(path.join(os.tmpdir(), 'qa-i18n-eval-')), 'e');
    const loadClient = vi.fn(async () => client);
    const deps: Deps = { env: { [KEY_VAR]: 'sk-test-eval' }, stdout: (l) => stdout.push(l), stderr: () => {}, loadClient, now: () => new Date('2026-11-11T10:00:00Z'), gitCommit: () => 't' };
    expect(await evalMain(['--llm', '--repeat', '2', '--out', out], deps)).toBe(0);
    expect(readdirSync(out).sort()).toEqual(['eval.json', 'eval.md']);
    const perRun = review.mock.calls.length / 2;
    expect(perRun).toBeGreaterThan(0);
    expect(stdout.join('\n')).not.toContain('sk-test-eval');
    // The final cost line carries the plan estimate × runs, not $0.00.
    expect(readFileSync(path.join(out, 'eval.md'), 'utf8')).not.toMatch(/est\. before run: \$0\.00/);
  });

  it('a reviewer that finds nothing fails the threshold (exit 1); --llm without the key → exit 2, no client', async () => {
    const client = { review: vi.fn(async () => ({ output: { findings: [] }, usage, stopReason: 'end_turn' })) } as LlmClient;
    const mk = (env: Record<string, string>) => ({ env, stdout: () => {}, stderr: vi.fn(), loadClient: vi.fn(async () => client), now: () => new Date(), gitCommit: () => 't' });
    const out = path.join(mkdtempSync(path.join(os.tmpdir(), 'qa-i18n-eval-')), 'e');
    expect(await evalMain(['--llm', '--out', out], mk({ [KEY_VAR]: 'sk-test-eval' }))).toBe(1);
    const noKey = mk({});
    expect(await evalMain(['--llm', '--out', out], noKey)).toBe(2);
    expect(noKey.loadClient).not.toHaveBeenCalled();
  });

  it('worse() keeps the run with lower LLM recall', () => {
    const a = score([], defects, true);
    const b = { ...a, llm: { found: ['L1'], missed: [] }, pass: false };
    expect(worse(a, b)).toBe(a);
  });
});
