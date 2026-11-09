// Input adapters → aligned Units (spec §2). Read-only: nothing here opens a file for writing.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { LANGS, type Lang, type Location, type Source, type Unit, type UnitKind } from './schema.ts';

// From the import.meta.url string: under Vitest's jsdom environment the global URL is jsdom's, not Node's.
export const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(TOOL_DIR, '../..');

/** Thrown for unreadable inputs or bad config: the CLI maps it to exit 2. */
export class ConfigError extends Error {}

export interface InputFile { file: string; sha256: string }
export interface SourcePin { lang: Lang; contentFile: string; exportFile: string; pinnedSha256: string }
export interface AdapterResult { units: Unit[]; inputs: InputFile[]; pins: SourcePin[] }
export interface Adapter { id: Source; load(): Promise<AdapterResult> }

const rel = (file: string) => path.relative(REPO_ROOT, file) || file;
const sha256 = (buf: Buffer | string) => createHash('sha256').update(buf).digest('hex');

function readInput(file: string): Buffer {
  try {
    return readFileSync(file);
  } catch {
    throw new ConfigError(`unreadable input: ${rel(file)}`);
  }
}

// ---------------------------------------------------------------- content-json (§2.1)

type Row = Record<string, unknown>;
type FieldValue = string | Row[] | Record<string, unknown>;
interface ContentField { key: string; label: string; value: FieldValue; subfields?: Record<string, string> }
interface ContentPost { slug: string; fields: ContentField[] }
interface ContentFile { source?: { file?: string; sha256?: string }; posts: ContentPost[] }

/** Same rule as scripts/phase-5c/content.test.ts `STRUCTURAL`, plus the hero CTA path (spec §2.1). */
const STRUCTURAL = /_(cta_path|anchor_id|service_group)$/;
const HERO_CTA_PATH = 'field_p5_herocontent_hero_cta_path';
const LABEL_NAMES = new Set(['ctaText', 'ctaTextHero', 'prefooterCtaText', 'secondaryCtaText', 'linkText', 'aboutCtaText']);
const HTML_TAG = /<[a-z][^>]*>/i;

interface Leaf { locator: string; acfKey: string; name: string; field: string; post: string; row?: number; subKey?: string; value: string }

const clean = (name: string) => name.replace(/\[\]$/, '');
const str = (v: unknown) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));

function leaves(file: ContentFile): Leaf[] {
  const out: Leaf[] = [];
  for (const post of file.posts) {
    for (const f of post.fields) {
      const base = `${post.slug}/${f.label}`;
      const sub = (k: string) => clean(f.subfields?.[k] ?? k);
      const lastSeg = f.label.split('.').pop() ?? f.label;
      const leaf = (l: Omit<Leaf, 'post' | 'field'>) => out.push({ ...l, post: post.slug, field: f.label });
      if (typeof f.value === 'string') {
        leaf({ locator: base, acfKey: f.key, name: lastSeg, value: f.value });
      } else if (Array.isArray(f.value)) {
        f.value.forEach((row, i) =>
          Object.entries(row).forEach(([k, v]) =>
            leaf({ locator: `${base}[${i}].${sub(k)}`, acfKey: k, name: sub(k), row: i, subKey: sub(k), value: str(v) })));
      } else {
        for (const [k, v] of Object.entries(f.value)) {
          if (Array.isArray(v)) {
            (v as Row[]).forEach((row, j) =>
              Object.entries(row).forEach(([k2, v2]) =>
                leaf({ locator: `${base}.${sub(k)}[${j}].${sub(k2)}`, acfKey: k2, name: sub(k2), row: j, subKey: `${sub(k)}.${sub(k2)}`, value: str(v2) })));
          } else {
            leaf({ locator: `${base}.${sub(k)}`, acfKey: k, name: sub(k), subKey: sub(k), value: str(v) });
          }
        }
      }
    }
  }
  return out;
}

function contentKind(leaf: Leaf, values: string[]): UnitKind {
  if (STRUCTURAL.test(leaf.acfKey) || leaf.acfKey === HERO_CTA_PATH) return 'structural';
  if (LABEL_NAMES.has(leaf.name)) return 'label';
  return values.some((v) => HTML_TAG.test(v)) ? 'html' : 'text';
}

export function contentJsonAdapter(files: Record<Lang, string>): Adapter {
  return {
    id: 'content-json',
    async load() {
      const inputs: InputFile[] = [];
      const pins: SourcePin[] = [];
      const byLang = {} as Record<Lang, Map<string, Leaf>>;
      const order: string[] = [];
      const seen = new Set<string>();
      for (const lang of LANGS) {
        const buf = readInput(files[lang]);
        inputs.push({ file: rel(files[lang]), sha256: sha256(buf) });
        let parsed: ContentFile;
        try {
          parsed = JSON.parse(buf.toString('utf8')) as ContentFile;
        } catch {
          throw new ConfigError(`invalid JSON: ${rel(files[lang])}`);
        }
        if (!Array.isArray(parsed.posts)) throw new ConfigError(`no posts[] in ${rel(files[lang])}`);
        if (parsed.source?.file && parsed.source.sha256) {
          pins.push({ lang, contentFile: rel(files[lang]), exportFile: parsed.source.file, pinnedSha256: parsed.source.sha256 });
        }
        // Entries sharing a slug (EN about-magneto twice) are merged, as the loader does.
        const map = new Map<string, Leaf>();
        for (const l of leaves(parsed)) {
          map.set(l.locator, l);
          if (!seen.has(l.locator)) {
            seen.add(l.locator);
            order.push(l.locator);
          }
        }
        byLang[lang] = map;
      }
      const units: Unit[] = order.map((locator) => {
        const present = LANGS.filter((l) => byLang[l].has(locator));
        const ref = byLang.en.get(locator) ?? (byLang[present[0]].get(locator) as Leaf);
        const values: Unit['values'] = {};
        present.forEach((l) => (values[l] = (byLang[l].get(locator) as Leaf).value));
        const kind = contentKind(ref, Object.values(values) as string[]);
        const location: Location = {
          file: { en: rel(files.en), fr: rel(files.fr), es: rel(files.es) },
          post: ref.post,
          field: ref.field,
          ...(ref.row !== undefined ? { row: ref.row } : {}),
          ...(ref.subKey !== undefined ? { subKey: ref.subKey } : {}),
        };
        return { id: `content:${locator}`, source: 'content-json', location, kind, llm: kind !== 'structural', values };
      });
      return { units, inputs, pins };
    },
  };
}

// ---------------------------------------------------------------- dictionary (§2.2)

type Tree = { [key: string]: unknown };

/** "a.b.c" → value for every string leaf (own copy: dictionary.ts imports ./format without an extension). */
export function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[p] = value;
    else if (value && typeof value === 'object') Object.assign(out, flatten(value as Tree, p));
  }
  return out;
}

/** Modules export `en` / `fr` / `es` (src/i18n/dictionaries/*.ts, ADR 0005). Their only import is `import type`. */
export type ModuleLoader = (file: string) => Promise<Record<string, unknown>>;
const importModule: ModuleLoader = async (file) => (await import(pathToFileURL(file).href)) as Record<string, unknown>;

export function dictionaryAdapter(files: Record<Lang, string>, load: ModuleLoader = importModule): Adapter {
  return {
    id: 'dictionary',
    async load() {
      const inputs: InputFile[] = [];
      const flat = {} as Record<Lang, Record<string, string>>;
      for (const lang of LANGS) {
        inputs.push({ file: rel(files[lang]), sha256: sha256(readInput(files[lang])) });
        const mod = await load(files[lang]);
        const tree = mod[lang];
        if (!tree || typeof tree !== 'object') throw new ConfigError(`${rel(files[lang])} has no export "${lang}"`);
        flat[lang] = flatten(tree as Tree);
      }
      const keys = [...new Set(LANGS.flatMap((l) => Object.keys(flat[l])))];
      const units: Unit[] = keys.map((dictKey) => {
        const values: Unit['values'] = {};
        LANGS.forEach((l) => {
          if (dictKey in flat[l]) values[l] = flat[l][dictKey];
        });
        return {
          id: `dict:${dictKey}`,
          source: 'dictionary',
          location: { file: { en: rel(files.en), fr: rel(files.fr), es: rel(files.es) }, dictKey },
          kind: 'label',
          llm: true,
          values,
        };
      });
      return { units, inputs, pins: [] };
    },
  };
}

// ---------------------------------------------------------------- export (§2.3)

export const ExportSectionsSchema = z.object({
  version: z.literal(1),
  note: z.string().optional(),
  reviewed: z.object({ by: z.string().nullable(), on: z.string().nullable() }),
  sections: z.array(z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
    anchors: z.object({ en: z.string(), fr: z.string(), es: z.string() }),
    coveredBy: z.literal('content-json').nullable(),
  })).min(1),
});
export type ExportSections = z.infer<typeof ExportSectionsSchema>;

const HEADING = /^(#{1,6})\s+\S/;
// A whole line in italics is an editor note (E3, e.g. "*Publish only when the guide is complete…*"), never copy.
const EDITOR_NOTE = /^\s*(\*[^*\s][^*]*\*|_[^_\s][^_]*_)\s*$/;

/**
 * The section that starts at the heading line equal to `anchor` (exact text, level included) and runs to the next
 * heading of the same or a higher level. Not found or found twice → ConfigError (exit 2), never a silent skip.
 */
export function sliceSection(lines: string[], anchor: string, where: string): { text: string; lines: [number, number] } {
  const wanted = anchor.trim();
  const level = HEADING.exec(wanted)?.[1].length;
  if (!level) throw new ConfigError(`${where}: anchor "${anchor}" is not a Markdown heading`);
  const hits = lines.flatMap((l, i) => (l.trim() === wanted ? [i] : []));
  if (hits.length !== 1) throw new ConfigError(`${where}: anchor "${anchor}" found ${hits.length} times (expected exactly 1)`);
  const start = hits[0];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const h = HEADING.exec(lines[i]);
    if (h && h[1].length <= level) {
      end = i;
      break;
    }
  }
  while (end > start + 1 && !lines[end - 1].trim()) end--;
  const body = lines.slice(start, end).map((l, i) => (i === 0 ? l.replace(/^#+\s+/, '') : l)).filter((l) => !EDITOR_NOTE.test(l));
  return { text: body.join('\n').trim(), lines: [start + 1, end] };
}

/** Comparable export sections (config/export-sections.json). Only the listed sections are read. */
export function exportAdapter(files: Record<Lang, string>, mapFile: string): Adapter {
  return {
    id: 'export',
    async load() {
      const map = readJsonConfig(mapFile, ExportSectionsSchema);
      const ids = map.sections.map((s) => s.id);
      const dup = ids.find((id, i) => ids.indexOf(id) !== i);
      if (dup) throw new ConfigError(`${rel(mapFile)}: section id "${dup}" is listed twice`);
      const inputs: InputFile[] = [];
      const text = {} as Record<Lang, string[]>;
      for (const lang of LANGS) {
        const buf = readInput(files[lang]);
        inputs.push({ file: rel(files[lang]), sha256: sha256(buf) });
        text[lang] = buf.toString('utf8').split(/\r?\n/);
      }
      const units: Unit[] = map.sections.map((s) => {
        const values: Unit['values'] = {};
        const lines = {} as Record<Lang, [number, number]>;
        for (const lang of LANGS) {
          const sec = sliceSection(text[lang], s.anchors[lang], `${rel(mapFile)} · ${s.id} · ${lang}`);
          values[lang] = sec.text;
          lines[lang] = sec.lines;
        }
        return {
          id: `export:${s.id}`,
          source: 'export',
          location: { file: { en: rel(files.en), fr: rel(files.fr), es: rel(files.es) }, section: s.id, lines },
          kind: 'text',
          // D-7: sections already loaded into the content files get deterministic checks only.
          llm: s.coveredBy === null,
          values,
        };
      });
      return { units, inputs, pins: [] };
    },
  };
}

// ---------------------------------------------------------------- configuration

const MatchSchema = z.enum(['exact', 'word-exact-case', 'word-case-insensitive']);
export const GlossarySchema = z.object({
  version: z.literal(1),
  source: z.string(),
  approved: z.object({ by: z.string().nullable(), on: z.string().nullable() }),
  register: z.object({ fr: z.object({ rule: z.string(), description: z.string() }), es: z.object({ rule: z.string(), description: z.string() }) }),
  keep: z.array(z.object({ term: z.string().min(1), match: MatchSchema })),
  ctaLabels: z.array(z.object({ dictKey: z.string(), note: z.string().optional() })),
  required: z.array(z.object({ en: z.string(), fr: z.string().optional(), es: z.string().optional() })),
  identicalAllowed: z.object({ fr: z.array(z.string()), es: z.array(z.string()) }),
  urlExceptions: z.array(z.object({ en: z.string(), fr: z.string().optional(), es: z.string().optional() })),
});
export type Glossary = z.infer<typeof GlossarySchema>;
export type KeepTerm = Glossary['keep'][number];

export const PricingSchema = z.object({
  source: z.string(),
  date: z.string(),
  models: z.record(z.string(), z.object({ input: z.number(), output: z.number(), cacheWrite5m: z.number(), cacheRead: z.number(), note: z.string().optional() })),
});
export type Pricing = z.infer<typeof PricingSchema>;

// D-10, spec §3.4. Values are placeholders until the design round sets status "set".
export const LengthLimitsSchema = z.object({
  version: z.literal(1),
  status: z.enum(['placeholder', 'set']),
  statusNote: z.string().optional(),
  set: z.object({ by: z.string().nullable(), on: z.string().nullable() }),
  ratioWarnAbove: z.number().positive(),
  types: z.record(z.string(), z.object({
    maxChars: z.number().int().positive(),
    select: z.object({ 'content-json': z.array(z.string()).optional(), dictionary: z.array(z.string()).optional() }).strict(),
  })),
});
export type LengthLimits = z.infer<typeof LengthLimitsSchema>;

export function readJsonConfig<T>(file: string, schema: z.ZodType<T>): T {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new ConfigError(`unreadable config: ${rel(file)}`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ConfigError(`invalid config ${rel(file)}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  return parsed.data;
}

export const sha256File = (file: string) => sha256(readInput(file));

// ---------------------------------------------------------------- default input set

export interface InputPaths {
  content: Record<Lang, string>;
  dictionaries: Record<Lang, string>;
  exports?: Record<Lang, string>;
  exportSections?: string;
}

export const REPO_INPUTS: InputPaths = {
  content: {
    en: path.join(REPO_ROOT, 'scripts/phase-5c/content/en.json'),
    fr: path.join(REPO_ROOT, 'scripts/phase-5c/content/fr.json'),
    es: path.join(REPO_ROOT, 'scripts/phase-5c/content/es.json'),
  },
  dictionaries: {
    en: path.join(REPO_ROOT, 'src/i18n/dictionaries/en.ts'),
    fr: path.join(REPO_ROOT, 'src/i18n/dictionaries/fr.ts'),
    es: path.join(REPO_ROOT, 'src/i18n/dictionaries/es.ts'),
  },
  exports: {
    en: path.join(REPO_ROOT, 'docs/content/magneto-copy-en.md'),
    fr: path.join(REPO_ROOT, 'docs/content/magneto-copy-fr-CA.md'),
    es: path.join(REPO_ROOT, 'docs/content/magneto-copy-es.md'),
  },
  exportSections: path.join(TOOL_DIR, 'config/export-sections.json'),
};

export function adaptersFor(paths: InputPaths, sources: Source[]): Adapter[] {
  const all: Adapter[] = [];
  if (sources.includes('content-json')) all.push(contentJsonAdapter(paths.content));
  if (sources.includes('dictionary')) all.push(dictionaryAdapter(paths.dictionaries));
  if (sources.includes('export')) {
    if (!paths.exports || !paths.exportSections) throw new ConfigError('the export source has no input files in this input set');
    all.push(exportAdapter(paths.exports, paths.exportSections));
  }
  return all;
}
