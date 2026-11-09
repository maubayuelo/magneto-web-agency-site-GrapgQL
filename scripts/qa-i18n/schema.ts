// zod schemas: the single source for units, findings, the LLM output format and the report (ADR 0009 §1).
// Erasable TypeScript only (Node type stripping): no enum, namespace or parameter properties.
import { z } from 'zod';

export const LANGS = ['en', 'fr', 'es'] as const;
export const TARGET_LANGS = ['fr', 'es'] as const;
export const LangSchema = z.enum(LANGS);
export type Lang = z.infer<typeof LangSchema>;
export type TargetLang = (typeof TARGET_LANGS)[number];

export const SOURCES = ['content-json', 'dictionary', 'export'] as const;
export const SourceSchema = z.enum(SOURCES);
export type Source = z.infer<typeof SourceSchema>;

export const UnitKindSchema = z.enum(['text', 'html', 'label', 'structural']);
export type UnitKind = z.infer<typeof UnitKindSchema>;

const LangRecord = <T extends z.ZodType>(value: T) =>
  z.object({ en: value.optional(), fr: value.optional(), es: value.optional() }).strict();

export const LocationSchema = z
  .object({
    file: LangRecord(z.string()),
    post: z.string().optional(),
    field: z.string().optional(),
    row: z.number().int().optional(),
    subKey: z.string().optional(),
    dictKey: z.string().optional(),
    section: z.string().optional(),
    lines: LangRecord(z.tuple([z.number().int(), z.number().int()])).optional(),
  })
  .strict();
export type Location = z.infer<typeof LocationSchema>;

export const UnitSchema = z
  .object({
    id: z.string(),
    source: SourceSchema,
    location: LocationSchema,
    kind: UnitKindSchema,
    llm: z.boolean(),
    values: LangRecord(z.string()),
  })
  .strict();
export type Unit = z.infer<typeof UnitSchema>;

export const DETERMINISTIC_CHECKS = [
  'missing', 'empty', 'placeholder', 'identical-to-en', 'numbers', 'currency', 'structural-equality', 'urls',
  'interpolation', 'kept-terms', 'main-cta', 'label-consistency', 'list-items', 'source-pin', 'length',
] as const;
export const LLM_CHECKS = ['meaning-drift', 'omission', 'addition', 'glossary', 'register', 'untranslated'] as const;
export type DeterministicCheck = (typeof DETERMINISTIC_CHECKS)[number];
export type LlmCheck = (typeof LLM_CHECKS)[number];

export const SeveritySchema = z.enum(['error', 'warning', 'info']);
export type Severity = z.infer<typeof SeveritySchema>;
export const SEVERITY_RANK: Record<Severity, number> = { info: 0, warning: 1, error: 2 };

export const EXCERPT_MAX = 300;
export const REASON_MAX = 400;

export const FindingSchema = z
  .object({
    id: z.string().regex(/^[0-9a-f]{12}$/),
    layer: z.enum(['deterministic', 'llm']),
    check: z.enum([...DETERMINISTIC_CHECKS, ...LLM_CHECKS]),
    severity: SeveritySchema,
    lang: LangSchema,
    unitId: z.string(),
    location: LocationSchema,
    evidence: z
      .object({ en: z.string().max(EXCERPT_MAX), target: z.string().max(EXCERPT_MAX), reason: z.string().max(REASON_MAX) })
      .strict(),
  })
  .strict();
export type Finding = z.infer<typeof FindingSchema>;

/**
 * One finding as the model returns it. `.strict()`: there is no field for replacement text, and any extra property
 * (e.g. "suggestion") rejects the finding.
 */
export function llmFindingSchema(unitIds: readonly [string, ...string[]], checks: readonly [LlmCheck, ...LlmCheck[]]) {
  return z
    .object({
      unitId: z.enum(unitIds),
      check: z.enum(checks),
      severity: SeveritySchema,
      enExcerpt: z.string().max(EXCERPT_MAX),
      targetExcerpt: z.string().max(EXCERPT_MAX),
      reason: z.string().max(REASON_MAX),
    })
    .strict();
}
export type LlmFindingInput = z.infer<ReturnType<typeof llmFindingSchema>>;

/** The whole model output for one batch. */
export function llmOutputSchema(unitIds: readonly [string, ...string[]], checks: readonly [LlmCheck, ...LlmCheck[]]) {
  return z.object({ findings: z.array(llmFindingSchema(unitIds, checks)) }).strict();
}

/** Outer shape only: findings are validated one by one, so one bad finding doesn't discard the batch. */
export const LlmOutputEnvelopeSchema = z.object({ findings: z.array(z.unknown()) }).strict();

// Keywords the structured-outputs grammar rejects (platform.claude.com/docs/en/build-with-claude/structured-outputs,
// "JSON Schema limitations", read 2026-11-09). The local zod validation still enforces them.
const UNSUPPORTED_KEYWORDS = new Set(['$schema', 'minLength', 'maxLength', 'minimum', 'maximum', 'exclusiveMinimum',
  'exclusiveMaximum', 'multipleOf', 'maxItems', 'pattern', 'format']);

export type JsonSchema = { [key: string]: unknown };

function stripUnsupported(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripUnsupported);
  if (node === null || typeof node !== 'object') return node;
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node)) {
    if (UNSUPPORTED_KEYWORDS.has(key)) continue;
    if (key === 'minItems' && typeof value === 'number' && value > 1) continue;
    out[key] = stripUnsupported(value);
  }
  return out;
}

/** The JSON Schema sent as `output_config.format.schema`, derived from the zod schema (one source of truth). */
export function toWireSchema(schema: z.ZodType): JsonSchema {
  return stripUnsupported(z.toJSONSchema(schema)) as JsonSchema;
}

const Counts = z.record(z.string(), z.number().int());

export const BatchStatusSchema = z.enum(['ok', 'failed', 'skipped-cap']);
export type BatchStatus = z.infer<typeof BatchStatusSchema>;

export const ReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    tool: z.object({ name: z.literal('qa-i18n'), version: z.string(), promptVersion: z.string() }).strict(),
    runId: z.string(),
    startedAt: z.string(),
    finishedAt: z.string(),
    gitCommit: z.string(),
    mode: z.enum(['full', 'deterministic-only']),
    inputs: z.array(z.object({ file: z.string(), sha256: z.string() }).strict()),
    options: z
      .object({
        model: z.string().optional(),
        caps: z.object({ maxRequests: z.number().int(), maxInputTokens: z.number().int(), maxOutputTokens: z.number().int() }).strict(),
        langs: z.array(LangSchema),
        sources: z.array(SourceSchema),
        failOn: SeveritySchema,
      })
      .strict(),
    summary: z
      .object({
        bySeverity: Counts,
        byLayer: Counts,
        byLang: Counts,
        byCheck: Counts,
        units: z.number().int(),
        batches: z.object({ ok: z.number().int(), failed: z.number().int(), skippedCap: z.number().int() }).strict(),
      })
      .strict(),
    findings: z.array(FindingSchema),
    rejectedLlmFindings: z.array(z.object({ raw: z.unknown(), reason: z.string() }).strict()),
    duplicatesDropped: z.number().int(),
    batches: z.array(
      z.object({ id: z.string(), source: SourceSchema, lang: LangSchema, units: z.number().int(), status: BatchStatusSchema, note: z.string().optional() }).strict(),
    ),
    usage: z
      .object({
        inputTokens: z.number().int(),
        outputTokens: z.number().int(),
        cache: z.object({ creationInputTokens: z.number().int(), readInputTokens: z.number().int() }).strict().optional(),
        requests: z.number().int(),
      })
      .strict(),
    cost: z.union([
      z.object({ estimatedUsd: z.number(), actualUsd: z.number(), priceSource: z.string() }).strict(),
      z.object({ unknown: z.string() }).strict(),
    ]),
    lengthSelectors: z.object({ used: z.array(z.string()), unused: z.array(z.string()) }).strict().optional(),
    incomplete: z.boolean(),
  })
  .strict();
export type Report = z.infer<typeof ReportSchema>;
