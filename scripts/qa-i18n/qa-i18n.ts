// npm run qa:i18n: EN ↔ FR-CA / ES copy QA (phase-5g spec, ADR 0009). Flags only: never edits text, writes only
// report.json + report.md outside the repo. LLM mode is opt-in (--llm); without it, the API key is never read.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkLength, ctaLabelsFrom, runDeterministic, type CheckContext } from './checks.ts';
import {
  ConfigError, GlossarySchema, LengthLimitsSchema, PricingSchema, REPO_INPUTS, REPO_ROOT, TOOL_DIR, adaptersFor, readJsonConfig, sha256File,
  type Glossary, type InputFile, type InputPaths, type LengthLimits, type Pricing, type SourcePin,
} from './inputs.ts';
import {
  CEILINGS, DEFAULT_CAPS, PROMPT_VERSION, buildBatches, costLine, makePlan, runLlm, actualUsd,
  type Batch, type Caps, type LlmClient, type LlmRunResult, type Plan,
} from './llm.ts';
import { DEFAULT_OUT_ROOT, guardOutDir, timestamp, writeReport } from './report.ts';
import {
  SEVERITY_RANK, SOURCES, SeveritySchema, SourceSchema, TARGET_LANGS, type Finding, type Report, type Severity, type Source,
  type TargetLang, type Unit,
} from './schema.ts';

export const TOOL_VERSION = '1.0.0';
export const KEY_VAR = 'MAGNETO_QA_ANTHROPIC_API_KEY';
export const DEFAULT_MODEL = 'claude-haiku-5-5'; // D-4 decided 2026-11-09: cheapest model that passed the AC-9 eval (D-8)
export const DEFAULT_SOURCES: Source[] = ['content-json', 'dictionary', 'export'];
export const MISSING_KEY_MESSAGE = `--llm needs ${KEY_VAR} in the environment. Run without --llm for the deterministic checks only.`;

export interface Deps {
  env: Record<string, string | undefined>;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  /** Loads the SDK-backed client. Called only with --llm, after the key check (tests spy on it). */
  loadClient: (apiKey: string) => Promise<LlmClient>;
  now: () => Date;
  inputs?: InputPaths;
  glossaryFile?: string;
  pricingFile?: string;
  gitCommit?: () => string;
}

export const defaultLoadClient = async (apiKey: string): Promise<LlmClient> => (await import('./anthropic-client.ts')).createAnthropicClient(apiKey);

export class UsageError extends Error {}

// ---------------------------------------------------------------- arguments (§5.5, complete list)

export interface Options {
  llm: boolean;
  deterministicOnly: boolean;
  plan: boolean;
  langs: TargetLang[];
  sources: Source[];
  model?: string;
  caps: Caps;
  failOn: Severity;
  out?: string;
}

const VALUE_FLAGS = new Set(['--langs', '--sources', '--model', '--max-requests', '--max-input-tokens', '--max-output-tokens', '--fail-on', '--out']);
const BOOL_FLAGS = new Set(['--llm', '--deterministic-only', '--plan']);

function positiveInt(flag: string, v: string): number {
  if (!/^\d+$/.test(v) || Number(v) < 1) throw new UsageError(`${flag} needs a positive integer`);
  return Number(v);
}

export function parseArgs(argv: string[], extraBool: string[] = [], extraValue: string[] = []): Options & { extra: Record<string, string | true> } {
  const o: Options & { extra: Record<string, string | true> } = {
    llm: false, deterministicOnly: false, plan: false, langs: [...TARGET_LANGS], sources: [...DEFAULT_SOURCES], caps: { ...DEFAULT_CAPS }, failOn: 'error', extra: {},
  };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inline] = argv[i].includes('=') ? [argv[i].slice(0, argv[i].indexOf('=')), argv[i].slice(argv[i].indexOf('=') + 1)] : [argv[i], undefined];
    if (BOOL_FLAGS.has(flag) || extraBool.includes(flag)) {
      if (inline !== undefined) throw new UsageError(`${flag} takes no value`);
      if (flag === '--llm') o.llm = true;
      else if (flag === '--deterministic-only') o.deterministicOnly = true;
      else if (flag === '--plan') o.plan = true;
      else o.extra[flag] = true;
      continue;
    }
    if (!VALUE_FLAGS.has(flag) && !extraValue.includes(flag)) throw new UsageError(`unknown argument: ${argv[i]}`);
    const v = inline ?? argv[++i];
    if (v === undefined || v.startsWith('--')) throw new UsageError(`${flag} needs a value`);
    switch (flag) {
      case '--langs': {
        const list = v.split(',').map((s) => s.trim());
        if (!list.length || list.some((l) => !(TARGET_LANGS as readonly string[]).includes(l))) throw new UsageError('--langs takes fr, es or fr,es');
        o.langs = [...new Set(list)] as TargetLang[];
        break;
      }
      case '--sources': {
        const list = v.split(',').map((s) => s.trim());
        if (!list.length || list.some((s) => !SourceSchema.safeParse(s).success)) throw new UsageError(`--sources takes ${SOURCES.join(', ')}`);
        o.sources = [...new Set(list)] as Source[];
        break;
      }
      case '--model':
        o.model = v;
        break;
      case '--max-requests':
        o.caps.maxRequests = positiveInt(flag, v);
        break;
      case '--max-input-tokens':
        o.caps.maxInputTokens = positiveInt(flag, v);
        break;
      case '--max-output-tokens':
        o.caps.maxOutputTokens = positiveInt(flag, v);
        break;
      case '--fail-on': {
        const s = SeveritySchema.safeParse(v);
        if (!s.success) throw new UsageError('--fail-on takes error, warning or info');
        o.failOn = s.data;
        break;
      }
      case '--out':
        o.out = v;
        break;
      default:
        o.extra[flag] = v;
    }
  }
  if (o.llm && o.deterministicOnly) throw new UsageError('--llm and --deterministic-only exclude each other');
  if (o.caps.maxRequests > CEILINGS.maxRequests) throw new UsageError(`--max-requests is capped at ${CEILINGS.maxRequests}`);
  if (o.caps.maxInputTokens > CEILINGS.maxInputTokens) throw new UsageError(`--max-input-tokens is capped at ${CEILINGS.maxInputTokens}`);
  return o;
}

// ---------------------------------------------------------------- pipeline (shared with evals/eval.ts)

export interface Loaded { units: Unit[]; inputs: InputFile[]; pins: SourcePin[]; deterministic: Finding[]; ctx: CheckContext; lengthSelectors: { used: string[]; unused: string[] } }

export const readLengthLimits = (file = path.join(TOOL_DIR, 'config/length-limits.json')) => readJsonConfig(file, LengthLimitsSchema);

export async function loadAndCheck(paths: InputPaths, sources: Source[], langs: TargetLang[], glossary: Glossary, lengthLimits: LengthLimits = readLengthLimits()): Promise<Loaded> {
  const units: Unit[] = [];
  const inputs: InputFile[] = [];
  const pins: SourcePin[] = [];
  for (const adapter of adaptersFor(paths, sources)) {
    const r = await adapter.load();
    units.push(...r.units);
    inputs.push(...r.inputs);
    pins.push(...r.pins);
  }
  // CTA labels always come from the dictionaries, even when the dictionary source is not selected.
  const dictUnits = sources.includes('dictionary') ? units : (await adaptersFor(paths, ['dictionary'])[0].load()).units;
  const ctx: CheckContext = { glossary, ctaLabels: ctaLabelsFrom(dictUnits, glossary), langs };
  const currentSha = (file: string) => {
    try {
      return sha256File(path.resolve(REPO_ROOT, file));
    } catch {
      return null;
    }
  };
  const length = checkLength(units, lengthLimits, langs);
  return {
    units, inputs, pins, ctx, lengthSelectors: { used: length.used, unused: length.unused },
    deterministic: [...runDeterministic(units, pins, ctx, currentSha), ...length.findings],
  };
}

export function summarize(findings: Finding[], units: number, batches: LlmRunResult['batches']): Report['summary'] {
  const count = (key: (f: Finding) => string) => findings.reduce<Record<string, number>>((acc, f) => ((acc[key(f)] = (acc[key(f)] ?? 0) + 1), acc), {});
  return {
    bySeverity: count((f) => f.severity), byLayer: count((f) => f.layer), byLang: count((f) => f.lang), byCheck: count((f) => f.check), units,
    batches: { ok: batches.filter((b) => b.status === 'ok').length, failed: batches.filter((b) => b.status === 'failed').length, skippedCap: batches.filter((b) => b.status === 'skipped-cap').length },
  };
}

export function exitCodeFor(findings: Finding[], failOn: Severity, incomplete: boolean): number {
  if (incomplete) return 3;
  return findings.some((f) => SEVERITY_RANK[f.severity] >= SEVERITY_RANK[failOn]) ? 1 : 0;
}

export function planLines(plan: Plan, pricing: Pricing): string[] {
  return [
    `Plan (no request sent): ${plan.batches} batches (${Object.entries(plan.bySource).map(([s, n]) => `${s} ${n}`).join(', ') || 'none'})`,
    `Estimated tokens: input ${plan.estInputTokens} (ceil(chars/3)×1.2), output ≤ ${plan.estOutputTokens} (${plan.batches} × ${plan.caps.maxOutputTokens}); re-asks not included`,
    `Caps: requests ${plan.caps.maxRequests}, input tokens ${plan.caps.maxInputTokens}, output tokens/request ${plan.caps.maxOutputTokens}`,
    costLine(pricing, plan.model, plan.estimatedUsd, null),
    ...(plan.overCap.length ? [`Over cap: ${plan.overCap.join('; ')}`] : []),
  ];
}

export function currentGitCommit(): string {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : 'unknown';
}

// ---------------------------------------------------------------- main

export async function main(argv: string[], deps: Deps): Promise<number> {
  const key = deps.env[KEY_VAR];
  const redact = (s: string) => (key ? s.split(key).join('[redacted]') : s);
  const out = (s: string) => deps.stdout(redact(s));
  const err = (s: string) => deps.stderr(redact(s));
  try {
    const opts = parseArgs(argv);
    const startedAt = deps.now();
    const glossary = readJsonConfig(deps.glossaryFile ?? path.join(TOOL_DIR, 'config/glossary.json'), GlossarySchema);
    const pricing = readJsonConfig(deps.pricingFile ?? path.join(TOOL_DIR, 'config/pricing.json'), PricingSchema);
    const model = opts.model ?? deps.env.QA_I18N_MODEL ?? DEFAULT_MODEL;
    const outDir = opts.plan ? null : guardOutDir(opts.out ?? path.join(DEFAULT_OUT_ROOT, timestamp(startedAt)));

    const loaded = await loadAndCheck(deps.inputs ?? REPO_INPUTS, opts.sources, opts.langs, glossary);
    let batches: Batch[] = [];
    let plan: Plan | null = null;
    if (opts.plan || opts.llm) {
      batches = buildBatches(loaded.units, { langs: opts.langs, glossary, ctaLabels: loaded.ctx.ctaLabels });
      plan = makePlan(batches, model, opts.caps, pricing);
    }
    if (opts.plan && plan) {
      planLines(plan, pricing).forEach(out);
      return plan.overCap.length ? 2 : 0;
    }

    let llm: LlmRunResult | null = null;
    if (opts.llm && plan) {
      if (!key || key.trim() === '') {
        err(MISSING_KEY_MESSAGE);
        return 2;
      }
      if (plan.overCap.length) {
        planLines(plan, pricing).forEach(err);
        err('The plan exceeds a cap: no request sent.');
        return 2;
      }
      planLines(plan, pricing).forEach(out);
      const client = await deps.loadClient(key);
      llm = await runLlm({ batches, client, model, caps: opts.caps, glossary, deterministic: loaded.deterministic, onProgress: out });
    }

    const findings = [...loaded.deterministic, ...(llm?.findings ?? [])];
    const usage = llm?.usage ?? { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 };
    const actual = llm ? actualUsd(pricing, model, usage) : 0;
    const line = llm ? costLine(pricing, model, plan?.estimatedUsd ?? null, usage) : 'no LLM request (deterministic-only)';
    const report: Report = {
      schemaVersion: 1,
      tool: { name: 'qa-i18n', version: TOOL_VERSION, promptVersion: PROMPT_VERSION },
      runId: timestamp(startedAt),
      startedAt: startedAt.toISOString(),
      finishedAt: deps.now().toISOString(),
      gitCommit: (deps.gitCommit ?? currentGitCommit)(),
      mode: opts.llm ? 'full' : 'deterministic-only',
      inputs: loaded.inputs,
      options: { ...(opts.llm ? { model } : {}), caps: opts.caps, langs: ['en', ...opts.langs], sources: opts.sources, failOn: opts.failOn },
      summary: summarize(findings, loaded.units.length, llm?.batches ?? []),
      findings,
      rejectedLlmFindings: llm?.rejected ?? [],
      duplicatesDropped: llm?.duplicatesDropped ?? 0,
      batches: llm?.batches ?? [],
      usage: {
        inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, requests: llm?.requests ?? 0,
        ...(usage.cacheCreationInputTokens || usage.cacheReadInputTokens ? { cache: { creationInputTokens: usage.cacheCreationInputTokens, readInputTokens: usage.cacheReadInputTokens } } : {}),
      },
      cost: !llm ? { estimatedUsd: 0, actualUsd: 0, priceSource: 'no LLM request' }
        : actual === null ? { unknown: `no price for ${model}` }
          : { estimatedUsd: plan?.estimatedUsd ?? 0, actualUsd: actual, priceSource: `${pricing.source} (${pricing.date})` },
      lengthSelectors: loaded.lengthSelectors,
      incomplete: llm?.incomplete ?? false,
    };
    const written = writeReport(outDir as string, report, line, redact);

    out(`qa-i18n: ${loaded.units.length} units · ${findings.length} findings · mode ${report.mode}`);
    out(`  by severity: ${JSON.stringify(report.summary.bySeverity)}`);
    out(`  by check: ${JSON.stringify(report.summary.byCheck)}`);
    if (llm) out(`  ${line}`);
    written.files.forEach((f) => out(`  wrote ${f}`));
    if (!written.ok) {
      err(`report failed its own schema: ${written.error}`);
      return 3;
    }
    return exitCodeFor(findings, opts.failOn, report.incomplete);
  } catch (e) {
    if (e instanceof UsageError || e instanceof ConfigError) {
      err(`qa-i18n: ${e.message}`);
      return 2;
    }
    err(`qa-i18n: unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    return 3;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2), {
    env: process.env,
    stdout: (l) => process.stdout.write(`${l}\n`),
    stderr: (l) => process.stderr.write(`${l}\n`),
    loadClient: defaultLoadClient,
    now: () => new Date(),
  }).then((code) => {
    process.exitCode = code;
  });
}
