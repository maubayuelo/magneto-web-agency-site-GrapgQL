// LLM layer (spec §3.2, §4): batching, prompt, caps, bounded re-ask, response validation. Depends on the LlmClient
// interface only; the SDK lives in anthropic-client.ts. Flags only: the output schema has no field for new text.
import { clip, hasPlaceholder, htmlToText, makeFinding, onlyKeptTerms } from './checks.ts';
import type { Glossary, Pricing } from './inputs.ts';
import {
  LLM_CHECKS, LlmOutputEnvelopeSchema, llmFindingSchema, llmOutputSchema, toWireSchema, type BatchStatus, type DeterministicCheck,
  type Finding, type JsonSchema, type LlmCheck, type Source, type TargetLang, type Unit,
} from './schema.ts';

export const PROMPT_VERSION = '2026-11-09.1';

export interface Usage { inputTokens: number; outputTokens: number; cacheCreationInputTokens: number; cacheReadInputTokens: number }
export interface LlmRequest { model: string; system: string; user: string; outputSchema: JsonSchema; maxOutputTokens: number }
export interface LlmResponse { output: unknown; usage: Usage; stopReason: string; requestId?: string }
export interface LlmClient { review(req: LlmRequest): Promise<LlmResponse> }

export interface Caps { maxRequests: number; maxInputTokens: number; maxOutputTokens: number }
export const DEFAULT_CAPS: Caps = { maxRequests: 60, maxInputTokens: 400_000, maxOutputTokens: 4096 };
/** Absolute ceilings: no flag can raise a cap above these (§4.5). */
export const CEILINGS = { maxRequests: 150, maxInputTokens: 1_000_000 } as const;

export interface Batch {
  id: string;
  source: Source;
  lang: TargetLang;
  units: Unit[];
  checks: [LlmCheck, ...LlmCheck[]];
  system: string;
  user: string;
  outputSchema: JsonSchema;
  estInputTokens: number;
}

const LANG_NAME: Record<TargetLang, string> = { fr: 'French (Canada, FR-CA)', es: 'Spanish (ES)' };
const DICT_GROUP_MAX = 60;

/** Conservative estimate (§4.5): ceil(chars / 3) × 1.2. */
export const estimateTokens = (chars: number) => Math.ceil(Math.ceil(chars / 3) * 1.2);

/** Text shown to the model and used for the evidence check: HTML reduced to lines, list items as "- ". */
export function promptText(value: string): string {
  if (!/<[a-z][^>]*>/i.test(value)) return value;
  // \u0001 marks line breaks through htmlToText, whose whitespace collapse would eat "\n" (and U+2028).
  return htmlToText(value.replace(/<li\b[^>]*>/gi, '\n- ').replace(/<\/(p|li|h[1-6])>|<br\s*\/?>/gi, '\n').replace(/\n/g, '\u0001'))
    .split('\u0001').map((l) => l.trim()).filter(Boolean).join('\n');
}

/** Checks the model is asked for. The register and glossary checks stay off until the glossary is approved (D-9). */
export function enabledChecks(glossary: Glossary): [LlmCheck, ...LlmCheck[]] {
  const approved = Boolean(glossary.approved.by && glossary.approved.on);
  return LLM_CHECKS.filter((c) => approved || (c !== 'register' && c !== 'glossary')) as [LlmCheck, ...LlmCheck[]];
}

const CHECK_TEXT: Record<LlmCheck, string> = {
  'meaning-drift': 'the target says something different from EN (a fact, offer, scope, who does what, a condition)',
  omission: 'a claim, condition, list item or sentence in EN is missing from the target',
  addition: 'the target adds a claim, condition, list item or sentence that EN does not have',
  glossary: 'a glossary rule is broken: a keep term is translated, or a CTA label differs from the approved label',
  register: 'the register rule of the target language is broken, or the register is mixed inside one batch',
  untranslated: 'an English fragment is left inside the target text (keep terms are allowed and are not findings)',
};

export function systemPrompt(lang: TargetLang, checks: LlmCheck[], glossary: Glossary, ctaLabels: Record<string, Partial<Record<string, string>>>): string {
  const lines = [
    `You are a QA reviewer for website copy translated from English (EN) into ${LANG_NAME[lang]}. EN is the source of meaning.`,
    'Report problems only. Never propose, write or quote a new translation, in any field.',
    'enExcerpt and targetExcerpt are copied verbatim from the input: the shortest span that shows the problem (at most 300 characters). For an omission targetExcerpt may be empty; for an addition enExcerpt may be empty.',
    'reason is at most 400 characters, in English, and describes the problem without rewriting the text.',
    'An empty findings array is a valid answer. Only report what you are confident about.',
    '',
    'Checks (use exactly these names):',
    ...checks.map((c) => `- ${c}: ${CHECK_TEXT[c]}`),
    '',
    'Severity:',
    '- error: the reader would get a wrong fact, price, condition or commitment.',
    '- warning: the meaning is weakened, the glossary or register is broken, or a fragment is left untranslated.',
    '- info: a stylistic observation.',
    '',
    `Keep terms (never translated, allowed in the target as-is): ${glossary.keep.map((k) => k.term).join(', ')}.`,
  ];
  if (checks.includes('register')) lines.push(`Register (${lang.toUpperCase()}): ${glossary.register[lang].description}`);
  if (checks.includes('glossary')) {
    const labels = Object.entries(ctaLabels).filter(([, v]) => v.en && v[lang]).map(([k, v]) => `"${v.en}" → "${v[lang]}" (${k})`);
    if (labels.length) lines.push(`Approved CTA labels: ${labels.join('; ')}.`);
    glossary.required.forEach((r) => r[lang] && lines.push(`Required rendering: "${r.en}" → "${r[lang]}".`));
  }
  lines.push('', 'Each unit starts with a line "unit <id> (<kind>)". Copy that id exactly as unitId.');
  return lines.join('\n');
}

export function userPrompt(lang: TargetLang, units: Unit[]): string {
  const blocks = units.map((u) => `unit ${u.id} (${u.kind})\nEN:\n${promptText(u.values.en as string)}\n${lang.toUpperCase()}:\n${promptText(u.values[lang] as string)}`);
  return `Target language: ${lang.toUpperCase()}. ${units.length} units.\n\n${blocks.join('\n\n')}`;
}

/** Units the LLM sees for one language: llm units, not structural, EN and target present, non-empty, no placeholder. */
export function eligible(unit: Unit, lang: TargetLang): boolean {
  const en = unit.values.en;
  const t = unit.values[lang];
  return unit.llm && unit.kind !== 'structural' && !!en?.trim() && !!t?.trim() && !hasPlaceholder(en) && !hasPlaceholder(t);
}

function groupUnits(source: Source, units: Unit[]): [string, Unit[]][] {
  if (source === 'content-json') {
    const byPost = new Map<string, Unit[]>();
    units.forEach((u) => byPost.set(u.location.post ?? '?', [...(byPost.get(u.location.post ?? '?') ?? []), u]));
    return [...byPost.entries()];
  }
  if (source === 'dictionary') {
    const byNs = new Map<string, Unit[]>();
    units.forEach((u) => {
      const ns = (u.location.dictKey ?? '?').split('.')[0];
      byNs.set(ns, [...(byNs.get(ns) ?? []), u]);
    });
    const out: [string, Unit[]][] = [];
    let cur: Unit[] = [];
    let names: string[] = [];
    const flush = () => {
      if (cur.length) out.push([names.join('+'), cur]);
      cur = [];
      names = [];
    };
    for (const [ns, list] of byNs) {
      for (let i = 0; i < list.length; i += DICT_GROUP_MAX) {
        const chunk = list.slice(i, i + DICT_GROUP_MAX);
        if (cur.length + chunk.length > DICT_GROUP_MAX) flush();
        cur.push(...chunk);
        names.push(list.length > DICT_GROUP_MAX ? `${ns}#${i / DICT_GROUP_MAX + 1}` : ns);
      }
    }
    flush();
    return out;
  }
  const bySection = new Map<string, Unit[]>();
  units.forEach((u) => bySection.set(u.location.section ?? '?', [...(bySection.get(u.location.section ?? '?') ?? []), u]));
  return [...bySection.entries()];
}

export function buildBatches(units: Unit[], opts: { langs: TargetLang[]; glossary: Glossary; ctaLabels: Record<string, Partial<Record<string, string>>> }): Batch[] {
  const checks = enabledChecks(opts.glossary);
  const batches: Batch[] = [];
  for (const source of ['content-json', 'dictionary', 'export'] as Source[]) {
    for (const lang of opts.langs) {
      const pool = units.filter((u) => u.source === source && eligible(u, lang));
      for (const [group, list] of groupUnits(source, pool)) {
        const ids = list.map((u) => u.id) as [string, ...string[]];
        const outputSchema = toWireSchema(llmOutputSchema(ids, checks));
        const system = systemPrompt(lang, checks, opts.glossary, opts.ctaLabels);
        const user = userPrompt(lang, list);
        batches.push({
          id: `${source}:${group}:${lang}`, source, lang, units: list, checks, system, user, outputSchema,
          estInputTokens: estimateTokens(system.length + user.length + JSON.stringify(outputSchema).length),
        });
      }
    }
  }
  return batches;
}

// ---------------------------------------------------------------- plan and cost

export interface Plan {
  model: string;
  caps: Caps;
  batches: number;
  bySource: Record<string, number>;
  estInputTokens: number;
  estOutputTokens: number;
  estimatedUsd: number | null;
  overCap: string[];
}

export function priceOf(pricing: Pricing, model: string) {
  return pricing.models[model] ?? null;
}

export function makePlan(batches: Batch[], model: string, caps: Caps, pricing: Pricing): Plan {
  const bySource: Record<string, number> = {};
  batches.forEach((b) => (bySource[b.source] = (bySource[b.source] ?? 0) + 1));
  const estInputTokens = batches.reduce((n, b) => n + b.estInputTokens, 0);
  const estOutputTokens = batches.length * caps.maxOutputTokens;
  const price = priceOf(pricing, model);
  const overCap: string[] = [];
  if (batches.length > caps.maxRequests) overCap.push(`requests ${batches.length} > --max-requests ${caps.maxRequests}`);
  if (estInputTokens > caps.maxInputTokens) overCap.push(`estimated input tokens ${estInputTokens} > --max-input-tokens ${caps.maxInputTokens}`);
  return {
    model, caps, batches: batches.length, bySource, estInputTokens, estOutputTokens, overCap,
    estimatedUsd: price ? (estInputTokens * price.input + estOutputTokens * price.output) / 1e6 : null,
  };
}

export function actualUsd(pricing: Pricing, model: string, usage: Usage): number | null {
  const p = priceOf(pricing, model);
  if (!p) return null;
  return (usage.inputTokens * p.input + usage.outputTokens * p.output + usage.cacheCreationInputTokens * p.cacheWrite5m + usage.cacheReadInputTokens * p.cacheRead) / 1e6;
}

export function costLine(pricing: Pricing, model: string, estimated: number | null, usage: Usage | null): string {
  if (!priceOf(pricing, model)) return `cost: unknown (no price for ${model}) · model ${model}`;
  const actual = usage ? actualUsd(pricing, model, usage) : null;
  const cache = usage && (usage.cacheCreationInputTokens || usage.cacheReadInputTokens)
    ? `, cache write ${usage.cacheCreationInputTokens}, cache read ${usage.cacheReadInputTokens}` : '';
  const act = usage ? `$${(actual ?? 0).toFixed(2)} (input ${usage.inputTokens}, output ${usage.outputTokens}${cache})` : 'n/a (no request sent)';
  return `est. before run: $${(estimated ?? 0).toFixed(2)} · actual: ${act} · model ${model} · prices from ${pricing.source} (${pricing.date})`;
}

// ---------------------------------------------------------------- run

/** Deterministic checks that already cover an LLM check on the same unit + language (duplicates are dropped). */
const EQUIVALENT: Record<LlmCheck, DeterministicCheck[]> = {
  'meaning-drift': ['numbers', 'currency'],
  omission: ['list-items', 'numbers'],
  addition: ['list-items', 'numbers'],
  glossary: ['kept-terms', 'main-cta', 'label-consistency'],
  register: [],
  untranslated: ['identical-to-en', 'placeholder'],
};

const normEvidence = (s: string) => s.replace(/[’‘`´]/g, "'").replace(/[“”«»]/g, '"').replace(/ | /g, ' ').replace(/\s+/g, ' ').trim();

export interface Rejected { raw: unknown; reason: string }
export interface BatchResult { id: string; source: Source; lang: TargetLang; units: number; status: BatchStatus; note?: string }
export interface LlmRunResult {
  findings: Finding[];
  rejected: Rejected[];
  duplicatesDropped: number;
  batches: BatchResult[];
  usage: Usage;
  requests: number;
  incomplete: boolean;
}

/** Validates one batch output; returns null if the envelope is invalid (→ one re-ask). */
export function validateOutput(batch: Batch, output: unknown, keep: Glossary['keep']): { findings: Finding[]; rejected: Rejected[] } | null {
  const env = LlmOutputEnvelopeSchema.safeParse(output);
  if (!env.success) return null;
  const ids = batch.units.map((u) => u.id) as [string, ...string[]];
  const schema = llmFindingSchema(ids, batch.checks);
  const findings: Finding[] = [];
  const rejected: Rejected[] = [];
  for (const raw of env.data.findings) {
    const unitId = raw && typeof raw === 'object' ? (raw as { unitId?: unknown }).unitId : undefined;
    const unit = batch.units.find((u) => u.id === unitId);
    if (!unit) {
      rejected.push({ raw, reason: 'unknown-unitId' });
      continue;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      rejected.push({ raw, reason: `schema: ${parsed.error.issues.map((i) => `${i.path.join('.') || '(finding)'} ${i.message}`).join('; ')}` });
      continue;
    }
    const f = parsed.data;
    const en = normEvidence(promptText(unit.values.en as string));
    const target = normEvidence(promptText(unit.values[batch.lang] as string));
    const enEx = normEvidence(f.enExcerpt);
    const tEx = normEvidence(f.targetExcerpt);
    const enOk = enEx === '' ? f.check === 'addition' : en.includes(enEx);
    const tOk = tEx === '' ? f.check === 'omission' : target.includes(tEx);
    if (!enOk || !tOk) {
      rejected.push({ raw, reason: 'excerpt-not-found' });
      continue;
    }
    if (f.check === 'untranslated' && onlyKeptTerms(f.targetExcerpt, keep)) {
      rejected.push({ raw, reason: 'keep-term-only' });
      continue;
    }
    findings.push(makeFinding({
      layer: 'llm', check: f.check, severity: f.severity, lang: batch.lang, unitId: unit.id, location: unit.location,
      en: f.enExcerpt, target: f.targetExcerpt, reason: f.reason,
    }));
  }
  return { findings, rejected };
}

export async function runLlm(args: {
  batches: Batch[]; client: LlmClient; model: string; caps: Caps; glossary: Glossary; deterministic: Finding[];
  onProgress?: (line: string) => void;
}): Promise<LlmRunResult> {
  const { batches, client, model, caps } = args;
  const usage: Usage = { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 };
  const result: LlmRunResult = { findings: [], rejected: [], duplicatesDropped: 0, batches: [], usage, requests: 0, incomplete: false };
  const fits = (b: Batch) => result.requests + 1 <= caps.maxRequests && usage.inputTokens + usage.cacheReadInputTokens + usage.cacheCreationInputTokens + b.estInputTokens <= caps.maxInputTokens;
  const status = (b: Batch, s: BatchStatus, note?: string) =>
    result.batches.push({ id: b.id, source: b.source, lang: b.lang, units: b.units.length, status: s, ...(note ? { note: clip(note, 300) } : {}) });

  let capped = false;
  for (const batch of batches) {
    if (capped) {
      status(batch, 'skipped-cap');
      continue;
    }
    let done = false;
    for (let attempt = 1; attempt <= 2 && !done; attempt += 1) {
      if (!fits(batch)) {
        capped = true;
        status(batch, 'skipped-cap', 'the next request would cross a cap');
        done = true;
        break;
      }
      let res: LlmResponse;
      try {
        result.requests += 1;
        res = await client.review({ model, system: batch.system, user: batch.user, outputSchema: batch.outputSchema, maxOutputTokens: caps.maxOutputTokens });
      } catch (err) {
        status(batch, 'failed', err instanceof Error ? err.message : 'client error');
        done = true;
        break;
      }
      usage.inputTokens += res.usage.inputTokens;
      usage.outputTokens += res.usage.outputTokens;
      usage.cacheCreationInputTokens += res.usage.cacheCreationInputTokens;
      usage.cacheReadInputTokens += res.usage.cacheReadInputTokens;
      const valid = res.stopReason === 'end_turn' || res.stopReason === 'stop_sequence' ? validateOutput(batch, res.output, args.glossary.keep) : null;
      if (valid) {
        result.rejected.push(...valid.rejected);
        for (const f of valid.findings) {
          const dup = args.deterministic.some((d) => d.unitId === f.unitId && d.lang === f.lang && EQUIVALENT[f.check as LlmCheck].includes(d.check as DeterministicCheck));
          if (dup) result.duplicatesDropped += 1;
          else result.findings.push(f);
        }
        status(batch, 'ok');
        done = true;
      } else if (attempt === 2) {
        status(batch, 'failed', `invalid output after one re-ask (stop_reason ${res.stopReason}${res.requestId ? `, request_id ${res.requestId}` : ''})`);
        done = true;
      }
      args.onProgress?.(`${batch.id}: attempt ${attempt} ${valid ? 'ok' : 'invalid'}`);
    }
  }
  result.incomplete = result.batches.some((b) => b.status !== 'ok');
  return result;
}
