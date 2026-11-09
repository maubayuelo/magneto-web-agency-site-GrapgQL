// npm run qa:i18n:eval: seeded-defect eval (spec §6.2). Runs the qa-i18n pipeline on evals/fixture (mutated test data,
// not copy) and scores it against defects.json. --llm is opt-in, as in the CLI; without it, only the deterministic half.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { ConfigError, GlossarySchema, PricingSchema, TOOL_DIR, readJsonConfig, type Glossary, type InputPaths, type Pricing } from '../inputs.ts';
import { buildBatches, costLine, makePlan, runLlm, type Caps, type LlmClient, type LlmRunResult, type Usage } from '../llm.ts';
import {
  DEFAULT_MODEL, KEY_VAR, MISSING_KEY_MESSAGE, UsageError, currentGitCommit, defaultLoadClient, loadAndCheck, parseArgs, planLines, type Deps,
} from '../qa-i18n.ts';
import { DEFAULT_OUT_ROOT, FLAGS_ONLY, guardOutDir, timestamp } from '../report.ts';
import { SEVERITY_RANK, type Finding, type Lang } from '../schema.ts';

const EVAL_DIR = path.join(TOOL_DIR, 'evals');
export const FIXTURE: InputPaths = {
  content: { en: path.join(EVAL_DIR, 'fixture/content/en.json'), fr: path.join(EVAL_DIR, 'fixture/content/fr.json'), es: path.join(EVAL_DIR, 'fixture/content/es.json') },
  dictionaries: { en: path.join(EVAL_DIR, 'fixture/dictionaries/en.ts'), fr: path.join(EVAL_DIR, 'fixture/dictionaries/fr.ts'), es: path.join(EVAL_DIR, 'fixture/dictionaries/es.ts') },
};

const DefectsSchema = z.object({
  threshold: z.object({ deterministicRecall: z.number().int(), llmRecallMin: z.number().int(), controlErrorsMax: z.number().int(), unplantedWarningOrAboveMax: z.number().int() }),
  defects: z.array(z.object({ id: z.string(), layer: z.enum(['deterministic', 'llm']), check: z.string(), accept: z.array(z.string()).min(1), unitId: z.string(), lang: z.enum(['fr', 'es']), description: z.string() })),
  controls: z.array(z.string()),
});
export type Defects = z.infer<typeof DefectsSchema>;
export const loadDefects = (file = path.join(EVAL_DIR, 'defects.json')) => readJsonConfig(file, DefectsSchema);

export interface Score {
  deterministic: { found: string[]; missed: string[] };
  llm: { found: string[]; missed: string[] } | null;
  controlErrors: Finding[];
  unplanted: Finding[];
  pass: boolean;
}

const matches = (f: Finding, d: Defects['defects'][number]) => f.unitId === d.unitId && f.lang === (d.lang as Lang) && d.accept.includes(f.check);

export function score(all: Finding[], defects: Defects, withLlm: boolean): Score {
  const findings = all.filter((f) => f.check !== 'length'); // D-10: the length check is not part of the seeded set
  const half = (layer: 'deterministic' | 'llm') => {
    const list = defects.defects.filter((d) => d.layer === layer);
    const found = list.filter((d) => findings.some((f) => matches(f, d))).map((d) => d.id);
    return { found, missed: list.map((d) => d.id).filter((id) => !found.includes(id)) };
  };
  const deterministic = half('deterministic');
  const llm = withLlm ? half('llm') : null;
  const controlErrors = findings.filter((f) => defects.controls.includes(f.unitId) && f.severity === 'error');
  // Unplanted: warning or above that matches no defect (LLM defects only count as planted when the LLM half runs).
  const unplanted = findings.filter((f) => SEVERITY_RANK[f.severity] >= SEVERITY_RANK.warning
    && !defects.defects.some((d) => (withLlm || d.layer === 'deterministic') && matches(f, d)));
  const t = defects.threshold;
  const pass = deterministic.found.length >= t.deterministicRecall && controlErrors.length <= t.controlErrorsMax
    && unplanted.length <= t.unplantedWarningOrAboveMax && (!llm || llm.found.length >= t.llmRecallMin);
  return { deterministic, llm, controlErrors, unplanted, pass };
}

/** Lower is worse: fail before pass, then LLM recall, then control errors, then unplanted findings. */
const rank = (s: Score) => [s.pass ? 1 : 0, s.llm?.found.length ?? 0, -s.controlErrors.length, -s.unplanted.length];
export function worse(a: Score, b: Score): Score {
  const ra = rank(a);
  const rb = rank(b);
  for (let i = 0; i < ra.length; i += 1) if (ra[i] !== rb[i]) return ra[i] < rb[i] ? a : b;
  return a;
}

export interface EvalRun { score: Score; findings: Finding[]; llm: LlmRunResult | null }

export async function runFixture(args: { glossary: Glossary; defects: Defects; client?: LlmClient; model: string; caps: Caps; paths?: InputPaths }): Promise<EvalRun> {
  const loaded = await loadAndCheck(args.paths ?? FIXTURE, ['content-json', 'dictionary'], ['fr', 'es'], args.glossary);
  let llm: LlmRunResult | null = null;
  if (args.client) {
    const batches = buildBatches(loaded.units, { langs: ['fr', 'es'], glossary: args.glossary, ctaLabels: loaded.ctx.ctaLabels });
    llm = await runLlm({ batches, client: args.client, model: args.model, caps: args.caps, glossary: args.glossary, deterministic: loaded.deterministic });
  }
  const findings = [...loaded.deterministic, ...(llm?.findings ?? [])];
  return { score: score(findings, args.defects, Boolean(args.client)), findings, llm };
}

function renderMarkdown(args: { runs: EvalRun[]; worst: EvalRun; defects: Defects; model: string; withLlm: boolean; cost: string }): string {
  const s = args.worst.score;
  const t = args.defects.threshold;
  const lines = [
    FLAGS_ONLY, '',
    `# qa-i18n eval · ${args.withLlm ? `model ${args.model}, ${args.runs.length} run(s), worse run shown` : 'deterministic half only'}`, '',
    `Cost: ${args.cost}`, '',
    '| criterion | threshold | result | ok |', '|---|---|---|---|',
    `| deterministic recall | ${t.deterministicRecall}/6 | ${s.deterministic.found.length}/6 | ${s.deterministic.found.length >= t.deterministicRecall ? 'yes' : 'no'} |`,
    `| LLM recall | ≥ ${t.llmRecallMin}/8 | ${s.llm ? `${s.llm.found.length}/8` : 'not run'} | ${s.llm ? (s.llm.found.length >= t.llmRecallMin ? 'yes' : 'no') : '-'} |`,
    `| errors on the 4 controls | ${t.controlErrorsMax} | ${s.controlErrors.length} | ${s.controlErrors.length <= t.controlErrorsMax ? 'yes' : 'no'} |`,
    `| unplanted findings ≥ warning | ≤ ${t.unplantedWarningOrAboveMax} | ${s.unplanted.length} | ${s.unplanted.length <= t.unplantedWarningOrAboveMax ? 'yes' : 'no'} |`,
    '', `**${s.pass ? 'PASS' : 'FAIL'}**${args.withLlm ? '' : ' (deterministic half)'}`, '',
    '## Defects', '', '| id | layer | lang | expected | found by |', '|---|---|---|---|---|',
    ...args.defects.defects.map((d) => {
      const by = args.worst.findings.filter((f) => matches(f, d)).map((f) => `[${f.layer === 'llm' ? 'llm' : 'det'}] ${f.check}`);
      const shown = d.layer === 'llm' && !args.withLlm ? 'not run' : by.join(', ') || '**missed**';
      return `| ${d.id} | ${d.layer} | ${d.lang} | ${d.check}: ${d.description} | ${shown} |`;
    }),
  ];
  if (s.unplanted.length || s.controlErrors.length) {
    lines.push('', '## Unplanted / control findings', '', '| severity | unit | lang | check | reason |', '|---|---|---|---|---|');
    for (const f of [...s.controlErrors, ...s.unplanted.filter((u) => !s.controlErrors.includes(u))]) {
      lines.push(`| ${f.severity} | ${f.unitId} | ${f.lang} | [${f.layer === 'llm' ? 'llm' : 'det'}] ${f.check} | ${f.evidence.reason.replace(/\|/g, '\\|')} |`);
    }
  }
  if (args.runs.length > 1) {
    lines.push('', '## All runs', '', ...args.runs.map((r, i) => `- run ${i + 1}: ${r.score.pass ? 'pass' : 'fail'} · LLM ${r.score.llm?.found.length ?? '-'}/8 · control errors ${r.score.controlErrors.length} · unplanted ${r.score.unplanted.length} · batches failed ${r.llm?.batches.filter((b) => b.status !== 'ok').length ?? 0}`));
  }
  return `${lines.join('\n')}\n`;
}

export async function evalMain(argv: string[], deps: Deps): Promise<number> {
  const key = deps.env[KEY_VAR];
  const redact = (s: string) => (key ? s.split(key).join('[redacted]') : s);
  const out = (s: string) => deps.stdout(redact(s));
  const err = (s: string) => deps.stderr(redact(s));
  try {
    const opts = parseArgs(argv, [], ['--repeat']);
    if (argv.some((a) => /^--(sources|langs)(=|$)/.test(a))) throw new UsageError('the eval always uses the fixture, content-json + dictionary, fr + es');
    const repeatRaw = opts.extra['--repeat'];
    const repeat = repeatRaw === undefined ? 1 : Number(repeatRaw);
    if (!Number.isInteger(repeat) || repeat < 1 || repeat > 3) throw new UsageError('--repeat takes 1, 2 or 3');
    const glossary = readJsonConfig(deps.glossaryFile ?? path.join(TOOL_DIR, 'config/glossary.json'), GlossarySchema);
    const pricing: Pricing = readJsonConfig(deps.pricingFile ?? path.join(TOOL_DIR, 'config/pricing.json'), PricingSchema);
    const defects = loadDefects();
    const model = opts.model ?? deps.env.QA_I18N_MODEL ?? DEFAULT_MODEL;

    if (opts.plan) {
      const loaded = await loadAndCheck(deps.inputs ?? FIXTURE, ['content-json', 'dictionary'], ['fr', 'es'], glossary);
      const plan = makePlan(buildBatches(loaded.units, { langs: ['fr', 'es'], glossary, ctaLabels: loaded.ctx.ctaLabels }), model, opts.caps, pricing);
      planLines(plan, pricing).forEach(out);
      out(`× ${repeat} run(s) with --repeat ${repeat}`);
      return plan.overCap.length ? 2 : 0;
    }
    const outDir = guardOutDir(opts.out ?? path.join(DEFAULT_OUT_ROOT, `eval-${timestamp(deps.now())}`));

    let client: LlmClient | undefined;
    if (opts.llm) {
      if (!key || key.trim() === '') {
        err(MISSING_KEY_MESSAGE);
        return 2;
      }
      const loaded = await loadAndCheck(deps.inputs ?? FIXTURE, ['content-json', 'dictionary'], ['fr', 'es'], glossary);
      const plan = makePlan(buildBatches(loaded.units, { langs: ['fr', 'es'], glossary, ctaLabels: loaded.ctx.ctaLabels }), model, opts.caps, pricing);
      // Caps apply per run; --repeat N repeats the same plan N times.
      if (plan.overCap.length) {
        planLines(plan, pricing).forEach(err);
        err('The plan exceeds a cap: no request sent.');
        return 2;
      }
      planLines(plan, pricing).forEach(out);
      out(`× ${repeat} run(s)`);
      client = await deps.loadClient(key);
    }

    const runs: EvalRun[] = [];
    for (let i = 0; i < (opts.llm ? repeat : 1); i += 1) {
      runs.push(await runFixture({ glossary, defects, client, model, caps: opts.caps, paths: deps.inputs }));
    }
    const worst = runs.reduce((a, b) => worse(a.score, b.score) === a.score ? a : b);
    const usage: Usage = { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 };
    runs.forEach((r) => {
      if (!r.llm) return;
      usage.inputTokens += r.llm.usage.inputTokens;
      usage.outputTokens += r.llm.usage.outputTokens;
      usage.cacheCreationInputTokens += r.llm.usage.cacheCreationInputTokens;
      usage.cacheReadInputTokens += r.llm.usage.cacheReadInputTokens;
    });
    const cost = opts.llm ? costLine(pricing, model, null, usage) : 'no LLM request (deterministic half)';
    const md = renderMarkdown({ runs, worst, defects, model, withLlm: opts.llm, cost });
    mkdirSync(outDir, { recursive: true });
    const json = {
      tool: 'qa-i18n eval', model: opts.llm ? model : null, repeat: runs.length, gitCommit: (deps.gitCommit ?? currentGitCommit)(), date: deps.now().toISOString(),
      threshold: defects.threshold, worst: worst.score, runs: runs.map((r) => ({ score: r.score, batches: r.llm?.batches ?? [], rejected: r.llm?.rejected.length ?? 0, usage: r.llm?.usage ?? null })),
      findings: worst.findings, cost,
    };
    writeFileSync(path.join(outDir, 'eval.json'), redact(`${JSON.stringify(json, null, 2)}\n`));
    writeFileSync(path.join(outDir, 'eval.md'), redact(md));
    md.split('\n').slice(2, 14).forEach(out);
    out(`wrote ${path.join(outDir, 'eval.json')}`);
    out(`wrote ${path.join(outDir, 'eval.md')}`);
    if (runs.some((r) => r.llm?.incomplete)) return 3;
    return worst.score.pass ? 0 : 1;
  } catch (e) {
    if (e instanceof UsageError || e instanceof ConfigError) {
      err(`qa-i18n eval: ${e.message}`);
      return 2;
    }
    err(`qa-i18n eval: unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    return 3;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  evalMain(process.argv.slice(2), {
    env: process.env,
    stdout: (l) => process.stdout.write(`${l}\n`),
    stderr: (l) => process.stderr.write(`${l}\n`),
    loadClient: defaultLoadClient,
    now: () => new Date(),
    gitCommit: currentGitCommit,
  }).then((code) => {
    process.exitCode = code;
  });
}
