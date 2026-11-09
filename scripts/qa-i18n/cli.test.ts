// CLI: key handling, outputs, exit codes, and the AC-4 cross-check on the real repo files (spec §6.1).
// The client loader is a spy: no test imports anthropic-client.ts or the SDK, and none needs a key or the network.
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findTodoKeys } from '../../src/i18n/dictionary';
import { en } from '../../src/i18n/dictionaries/en';
import { es } from '../../src/i18n/dictionaries/es';
import { fr } from '../../src/i18n/dictionaries/fr';
import { REPO_INPUTS, REPO_ROOT } from './inputs.ts';
import type { LlmClient, LlmRequest } from './llm.ts';
import { KEY_VAR, MISSING_KEY_MESSAGE, main, type Deps } from './qa-i18n.ts';
import { FLAGS_ONLY } from './report.ts';
import { ReportSchema, type Report } from './schema.ts';

beforeEach(() => {
  delete process.env.MAGNETO_QA_ANTHROPIC_API_KEY;
});

const PLANTED = 'sk-test-planted-0123456789abcdef';
const tmpOut = () => path.join(mkdtempSync(path.join(os.tmpdir(), 'qa-i18n-out-')), 'run');

function harness(env: Record<string, string> = {}, client?: LlmClient) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const loadClient = vi.fn(async () => client ?? ({ review: vi.fn() } as unknown as LlmClient));
  const deps: Deps = { env, stdout: (l) => stdout.push(l), stderr: (l) => stderr.push(l), loadClient, now: () => new Date('2026-11-10T09:00:00Z'), gitCommit: () => 'test123' };
  return { deps, stdout, stderr, loadClient, all: () => [...stdout, ...stderr].join('\n') };
}
const readReport = (dir: string) => JSON.parse(readFileSync(path.join(dir, 'report.json'), 'utf8')) as Report;

describe('deterministic run on the current repo files (AC-4)', () => {
  it('exits 1; placeholder findings equal findTodoKeys(fr) + findTodoKeys(es) exactly; no client', async () => {
    const out = tmpOut();
    const h = harness({ [KEY_VAR]: PLANTED }); // key set, no --llm → never used
    expect(await main(['--out', out], h.deps)).toBe(1);
    expect(h.loadClient).not.toHaveBeenCalled();
    const report = readReport(out);
    expect(ReportSchema.safeParse(report).success).toBe(true);
    expect(report.mode).toBe('deterministic-only');
    const placeholder = (lang: string) => report.findings.filter((f) => f.check === 'placeholder' && f.lang === lang).map((f) => f.unitId.replace(/^dict:/, '')).sort();
    expect(placeholder('fr')).toEqual(findTodoKeys(fr).sort());
    expect(placeholder('es')).toEqual(findTodoKeys(es).sort());
    expect(placeholder('en')).toEqual(findTodoKeys(en));
    expect(report.findings.filter((f) => f.check === 'placeholder' && !f.unitId.startsWith('dict:'))).toEqual([]);
  });
  it('AC-4b: placeholder length limits → every length finding is info and marked in report.md; selectors listed', async () => {
    const out = tmpOut();
    await main(['--out', out], harness().deps);
    const report = readReport(out);
    const length = report.findings.filter((f) => f.check === 'length');
    expect(length.every((f) => f.severity === 'info' && f.evidence.reason.endsWith('(placeholder limit)'))).toBe(true);
    expect(report.lengthSelectors?.used.length).toBeGreaterThan(0);
    const md = readFileSync(path.join(out, 'report.md'), 'utf8');
    expect(md).toMatch(/Length selectors used: .* · unused: /);
    expect(md.split('\n').filter((l) => l.includes('[det] length')).every((l) => l.includes('[det] length (placeholder limit)'))).toBe(true);
  });
});

describe('key handling (§4.6)', () => {
  it('--llm with a missing key → exit 2, the client factory is never called, the message names the variable', async () => {
    for (const env of [{}, { [KEY_VAR]: '' }, { [KEY_VAR]: '   ' }]) {
      const h = harness(env);
      expect(await main(['--llm', '--out', tmpOut()], h.deps)).toBe(2);
      expect(h.loadClient).not.toHaveBeenCalled();
      expect(h.stderr).toContain(MISSING_KEY_MESSAGE);
      expect(MISSING_KEY_MESSAGE).toContain(KEY_VAR);
    }
  });
  it('key set but no --llm → no client, no request; --plan → no client either', async () => {
    const h = harness({ [KEY_VAR]: PLANTED });
    await main(['--out', tmpOut()], h.deps);
    expect(await main(['--plan'], h.deps)).toBe(0);
    expect(await main(['--plan', '--llm'], h.deps)).toBe(0);
    expect(h.loadClient).not.toHaveBeenCalled();
    expect(h.all()).not.toContain(PLANTED);
  });
  it('a planted fake key appears in no stdout, stderr or report output, including on a client error', async () => {
    const review = vi.fn(async (req: LlmRequest) => {
      throw new Error(`boom ${PLANTED} ${req.model}`);
    });
    const out = tmpOut();
    const h = harness({ [KEY_VAR]: PLANTED }, { review });
    expect(await main(['--llm', '--langs', 'fr', '--sources', 'content-json', '--out', out], h.deps)).toBe(3);
    expect(h.loadClient).toHaveBeenCalledWith(PLANTED);
    expect(review).toHaveBeenCalled();
    expect(h.all()).not.toContain(PLANTED);
    for (const file of readdirSync(out)) expect(readFileSync(path.join(out, file), 'utf8')).not.toContain(PLANTED);
    expect(readReport(out).batches.every((b) => b.status === 'failed' && b.note?.includes('[redacted]'))).toBe(true);
  });
  it('--llm with --deterministic-only → exit 2 before anything else', async () => {
    const h = harness({ [KEY_VAR]: PLANTED });
    expect(await main(['--llm', '--deterministic-only'], h.deps)).toBe(2);
    expect(h.loadClient).not.toHaveBeenCalled();
  });
});

describe('LLM run through the CLI with a fake client', () => {
  it('invalid output → one re-ask per batch, batches failed, exit 3, report incomplete', async () => {
    const review = vi.fn(async () => ({ output: { nope: 1 }, usage: { inputTokens: 10, outputTokens: 5, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 }, stopReason: 'end_turn' }));
    const out = tmpOut();
    const h = harness({ [KEY_VAR]: PLANTED }, { review });
    expect(await main(['--llm', '--model', 'claude-haiku-5-5', '--langs', 'fr', '--sources', 'content-json', '--out', out], h.deps)).toBe(3);
    const report = readReport(out);
    expect(review).toHaveBeenCalledTimes(report.batches.length * 2);
    expect(report.incomplete).toBe(true);
    expect(report.summary.batches.failed).toBe(report.batches.length);
    expect(report.cost).toMatchObject({ priceSource: expect.stringContaining('platform.claude.com') });
  });
  it('a cap reached mid-run → skipped-cap, incomplete, exit 3', async () => {
    const review = vi.fn(async () => ({ output: { findings: [] }, usage: { inputTokens: 399_000, outputTokens: 5, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 }, stopReason: 'end_turn' }));
    const out = tmpOut();
    const h = harness({ [KEY_VAR]: PLANTED }, { review });
    expect(await main(['--llm', '--langs', 'fr', '--sources', 'content-json', '--out', out], h.deps)).toBe(3);
    const statuses = readReport(out).batches.map((b) => b.status);
    expect(statuses[0]).toBe('ok');
    expect(statuses.slice(1).every((s) => s === 'skipped-cap')).toBe(true);
    expect(review).toHaveBeenCalledTimes(1);
  });
  it('plan over a cap → exit 2 with no client call', async () => {
    const h = harness({ [KEY_VAR]: PLANTED });
    expect(await main(['--llm', '--max-requests', '1', '--out', tmpOut()], h.deps)).toBe(2);
    expect(h.loadClient).not.toHaveBeenCalled();
    expect(h.stderr.join('\n')).toMatch(/no request sent/);
  });
});

describe('outputs and arguments', () => {
  it('report.json validates, report.md starts with the flags-only line, --out writes exactly two files', async () => {
    const out = tmpOut();
    await main(['--out', out], harness().deps);
    expect(readdirSync(out).sort()).toEqual(['report.json', 'report.md']);
    const md = readFileSync(path.join(out, 'report.md'), 'utf8');
    expect(md.split('\n')[0]).toBe(FLAGS_ONLY);
    expect(md).toMatch(/\| error \| src\/i18n\/dictionaries\/fr\.ts · common\.goHome \| \[det\] placeholder \| Go Home \| \[FR TODO\] Go Home \|/);
  });
  it('--out inside the repo → exit 2, nothing written', async () => {
    for (const out of ['./tmp-qa', REPO_ROOT, path.join(REPO_ROOT, 'scripts/qa-i18n/out')]) {
      const h = harness();
      expect(await main(['--out', out], h.deps)).toBe(2);
      expect(h.stderr.join()).toMatch(/outside the repository/);
    }
  });
  it('usage errors → exit 2', async () => {
    for (const argv of [['--nope'], ['--langs', 'de'], ['--sources', 'cms'], ['--max-requests', '0'], ['--max-requests', '151'], ['--max-input-tokens', '1000001'], ['--fail-on', 'fatal'], ['--model']]) {
      expect(await main(argv, harness().deps), argv.join(' ')).toBe(2);
    }
  });
  it('--fail-on info turns any finding into exit 1; an export anchor not found → exit 2', async () => {
    expect(await main(['--sources', 'content-json', '--fail-on', 'info', '--out', tmpOut()], harness().deps)).toBe(1);
    const badMap = path.join(mkdtempSync(path.join(os.tmpdir(), 'qa-i18n-map-')), 'map.json');
    writeFileSync(badMap, JSON.stringify({ version: 1, reviewed: { by: null, on: null }, sections: [{ id: 'x.s1', anchors: { en: '## Nowhere', fr: '## Nulle part', es: '## Ninguna' }, coveredBy: null }] }));
    const h = harness();
    h.deps.inputs = { ...REPO_INPUTS, exportSections: badMap };
    expect(await main(['--sources', 'export', '--out', tmpOut()], h.deps)).toBe(2);
    expect(h.stderr.join()).toMatch(/found 0 times/);
  });
  it('--plan prints batches per source, the token estimate and the cost line, within the default caps', async () => {
    const h = harness();
    expect(await main(['--plan', '--model', 'claude-opus-5-5'], h.deps)).toBe(0);
    const text = h.stdout.join('\n');
    expect(text).toMatch(/Plan \(no request sent\): \d+ batches \(content-json \d+, dictionary \d+, export \d+\)/);
    expect(text).toMatch(/est\. before run: \$\d+\.\d\d .* model claude-opus-5-5 · prices from https:\/\/platform\.claude\.com/);
    expect(text).not.toMatch(/Over cap/);
    const h2 = harness();
    await main(['--plan', '--model', 'claude-unknown'], h2.deps);
    expect(h2.stdout.join('\n')).toMatch(/unknown \(no price for claude-unknown\)/);
  });
});
