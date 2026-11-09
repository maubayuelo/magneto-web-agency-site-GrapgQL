// Deterministic checks (spec §3.1): pure functions over Units. They flag only; nothing here edits text.
import { createHash } from 'node:crypto';
import type { Glossary, KeepTerm, LengthLimits, SourcePin } from './inputs.ts';
import {
  EXCERPT_MAX, REASON_MAX, type DeterministicCheck, type Finding, type Lang, type LlmCheck, type Location, type Severity,
  type TargetLang, type Unit,
} from './schema.ts';

export interface CheckContext {
  glossary: Glossary;
  /** dictKey → value per language, read from the dictionaries at run time (never hard-coded). */
  ctaLabels: Record<string, Partial<Record<Lang, string>>>;
  langs: TargetLang[];
}

// ---------------------------------------------------------------- helpers

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };

/** Visible text of an HTML value: tags removed, common entities decoded, whitespace collapsed. */
export function htmlToText(value: string): string {
  return value
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/div)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export const clip = (s: string, max = EXCERPT_MAX) => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

export function findingId(layer: Finding['layer'], check: string, unitId: string, lang: Lang, excerpt: string): string {
  return createHash('sha256').update(`${layer}|${check}|${unitId}|${lang}|${excerpt}`).digest('hex').slice(0, 12);
}

export function makeFinding(args: {
  layer?: Finding['layer']; check: DeterministicCheck | LlmCheck; severity: Severity; lang: Lang; unitId: string; location: Location;
  en: string; target: string; reason: string;
}): Finding {
  const layer = args.layer ?? 'deterministic';
  const en = clip(args.en);
  const target = clip(args.target);
  return {
    id: findingId(layer, args.check, args.unitId, args.lang, `${en}|${target}`),
    layer,
    check: args.check,
    severity: args.severity,
    lang: args.lang,
    unitId: args.unitId,
    location: args.location,
    evidence: { en, target, reason: clip(args.reason, REASON_MAX) },
  };
}

const PLACEHOLDER = [/\[(FR|ES) (TEST|TODO)\]/, /\bTODO\b/, /\bTBD\b/, /lorem ipsum/i];
export const hasPlaceholder = (v: string) => PLACEHOLDER.some((re) => re.test(v));

// ---------------------------------------------------------------- numbers (§3.1 normalizer)

// Grouped integers (",", ".", space, U+00A0, U+202F; exactly 3 digits per group) or plain numbers, with an optional
// decimal part and "%". "3.5" stays 3.5; "3,500", "3 500" and "3 500" are 3500; a trailing "." is punctuation.
const NUMBER = /\d{1,3}(?:[,.   ]\d{3})+(?!\d)(?:[.,]\d+)?%?|\d+(?:[.,]\d+)?%?/g;

export function extractNumbers(value: string): string[] {
  const text = htmlToText(value).replace(/https?:\/\/\S+/g, ' ').replace(/\{[A-Za-z_]+\}/g, ' ');
  return (text.match(NUMBER) ?? []).map((raw) => {
    const pct = raw.endsWith('%');
    const body = pct ? raw.slice(0, -1) : raw;
    const grouped = /^\d{1,3}(?:[,.   ]\d{3})+/.exec(body);
    let n: number;
    if (grouped) {
      const intPart = grouped[0].replace(/[,.   ]/g, '');
      const dec = body.slice(grouped[0].length);
      n = Number(`${intPart}${dec ? `.${dec.slice(1)}` : ''}`);
    } else {
      n = Number(body.replace(',', '.'));
    }
    return `${n}${pct ? '%' : ''}`;
  });
}

const sortedEqual = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

// ---------------------------------------------------------------- kept terms

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function termRegex(t: KeepTerm): RegExp {
  const body = escapeRe(t.term);
  if (t.match === 'exact') return new RegExp(body, 'gu');
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, t.match === 'word-case-insensitive' ? 'giu' : 'gu');
}

/** Count of each keep term; the longest term matches first and masks its span ("Magneto Web Consulting" ≠ "Magneto"). */
export function countKeepTerms(text: string, keep: KeepTerm[]): Map<string, number> {
  let work = text;
  const counts = new Map<string, number>();
  for (const t of [...keep].sort((a, b) => b.term.length - a.term.length)) {
    let n = 0;
    work = work.replace(termRegex(t), (m) => {
      n += 1;
      return ' '.repeat(m.length);
    });
    if (n > 0) counts.set(t.term, n);
  }
  return counts;
}

/** True when nothing translatable is left once keep terms, placeholders, numbers, URLs and punctuation are removed. */
export function onlyKeptTerms(value: string, keep: KeepTerm[]): boolean {
  let work = htmlToText(value).replace(/https?:\/\/\S+/g, ' ').replace(/\{[A-Za-z_]+\}/g, ' ');
  for (const t of [...keep].sort((a, b) => b.term.length - a.term.length)) work = work.replace(termRegex(t), ' ');
  return !/\p{L}/u.test(work);
}

// ---------------------------------------------------------------- per-unit checks

const hrefs = (v: string) => [...v.matchAll(/href\s*=\s*"([^"]*)"/gi), ...v.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
const interpolations = (v: string) => [...new Set(v.match(/\{[A-Za-z_]+\}/g) ?? [])].sort();
const listItems = (v: string) => (v.match(/<li[\s>]/gi) ?? []).length + (v.match(/^- /gm) ?? []).length;
const CURRENCY = /\$|\bCAD\b/;
const norm = (v: string) => htmlToText(v).replace(/\s+/g, ' ').trim();

export function checkUnit(unit: Unit, ctx: CheckContext): Finding[] {
  const out: Finding[] = [];
  const f = (check: DeterministicCheck, severity: Severity, lang: Lang, en: string, target: string, reason: string) =>
    out.push(makeFinding({ check, severity, lang, unitId: unit.id, location: unit.location, en, target, reason }));

  // placeholder: checked in every language, EN included (Phase 1 note 1, OQ-2).
  for (const lang of ['en', ...ctx.langs] as Lang[]) {
    const v = unit.values[lang];
    if (v !== undefined && hasPlaceholder(v)) {
      f('placeholder', 'error', lang, lang === 'en' ? v : (unit.values.en ?? ''), v, 'placeholder marker (TODO / TEST / TBD / lorem ipsum) in the value');
    }
  }
  const en = unit.values.en;
  if (en === undefined) return out; // target-only unit: meaning checks run EN → target only (OQ-2)

  let reverseEmptyFlagged = false;
  for (const lang of ctx.langs) {
    const t = unit.values[lang];
    if (t === undefined) {
      f('missing', 'error', lang, en, '', `the ${lang.toUpperCase()} file has no value for this key/row/sub-key`);
      continue;
    }
    const enEmpty = en.trim() === '';
    const tEmpty = t.trim() === '';
    if (!enEmpty && tEmpty) {
      f('empty', 'error', lang, en, t, `EN has text, ${lang.toUpperCase()} is empty`);
      continue;
    }
    if (enEmpty && !tEmpty) {
      if (!reverseEmptyFlagged) f('empty', 'warning', 'en', en, t, `EN is empty while ${lang.toUpperCase()} has text`);
      reverseEmptyFlagged = true;
      continue;
    }
    if (enEmpty && tEmpty) continue;
    if (hasPlaceholder(t) || hasPlaceholder(en)) continue; // already reported once; other checks would only add noise

    if (unit.kind === 'structural') {
      if (t !== en) f('structural-equality', 'error', lang, en, t, 'structural value (path / anchor / group) differs from EN');
      continue;
    }

    const tNorm = norm(t);
    if (tNorm === norm(en) && !ctx.glossary.identicalAllowed[lang].includes(t.trim()) && !onlyKeptTerms(t, ctx.glossary.keep)) {
      f('identical-to-en', 'warning', lang, en, t, `${lang.toUpperCase()} value is identical to EN`);
    }

    const nEn = extractNumbers(en);
    const nT = extractNumbers(t);
    if (!sortedEqual(nEn, nT)) {
      f('numbers', 'error', lang, en, t, `numbers differ: EN [${nEn.join(', ')}] vs ${lang.toUpperCase()} [${nT.join(', ')}]`);
    }

    const cEn = CURRENCY.test(htmlToText(en));
    const cT = CURRENCY.test(htmlToText(t));
    if (cEn !== cT) f('currency', 'error', lang, en, t, cEn ? `EN has a currency marker ($ / CAD), ${lang.toUpperCase()} has none` : `${lang.toUpperCase()} has a currency marker ($ / CAD), EN has none`);

    const exceptions = ctx.glossary.urlExceptions;
    const uEn = hrefs(en);
    const uT = hrefs(t).map((u) => exceptions.find((x) => x[lang] === u)?.en ?? u);
    if (!sortedEqual(uEn, uT)) f('urls', 'error', lang, en, t, `link targets differ: EN [${uEn.join(', ')}] vs ${lang.toUpperCase()} [${hrefs(t).join(', ')}]`);

    const iEn = interpolations(en);
    const iT = interpolations(t);
    if (iEn.join() !== iT.join()) f('interpolation', 'error', lang, en, t, `placeholders differ: EN {${iEn.join(' ')}} vs ${lang.toUpperCase()} {${iT.join(' ')}}`);

    const kEn = countKeepTerms(htmlToText(en), ctx.glossary.keep);
    const kT = countKeepTerms(htmlToText(t), ctx.glossary.keep);
    for (const [term, n] of kEn) {
      const m = kT.get(term) ?? 0;
      if (m === 0) f('kept-terms', 'error', lang, en, t, `kept term "${term}" is in EN but not in ${lang.toUpperCase()} (it must stay unchanged)`);
      else if (m !== n) f('kept-terms', 'info', lang, en, t, `kept term "${term}" appears ${n}× in EN and ${m}× in ${lang.toUpperCase()}`);
    }

    const lEn = listItems(en);
    const lT = listItems(t);
    if (lEn !== lT) f('list-items', 'warning', lang, en, t, `list item count differs: EN ${lEn} vs ${lang.toUpperCase()} ${lT}`);

    if (unit.kind === 'label') {
      for (const [dictKey, labels] of Object.entries(ctx.ctaLabels)) {
        if (unit.id === `dict:${dictKey}`) continue;
        const want = labels[lang];
        if (labels.en !== undefined && en === labels.en && want !== undefined && !hasPlaceholder(want) && t !== want) {
          f('main-cta', 'error', lang, en, t, `CTA label must equal ${lang.toUpperCase()} ${dictKey} "${want}"`);
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- cross-unit checks

/** The same EN label rendered in two or more ways in one target language (all sources). */
export function checkLabelConsistency(units: Unit[], ctx: CheckContext): Finding[] {
  const out: Finding[] = [];
  const groups = new Map<string, Unit[]>();
  for (const u of units) {
    if (u.kind !== 'label' || !u.values.en?.trim()) continue;
    const key = norm(u.values.en);
    groups.set(key, [...(groups.get(key) ?? []), u]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const lang of ctx.langs) {
      const rendered = group.filter((u) => u.values[lang]?.trim() && !hasPlaceholder(u.values[lang] as string));
      const distinct = [...new Set(rendered.map((u) => norm(u.values[lang] as string)))];
      if (distinct.length < 2) continue;
      // Reference: the most frequent rendering; a rendering used by a dictionary key wins a tie.
      const score = (v: string) => {
        const users = rendered.filter((u) => norm(u.values[lang] as string) === v);
        return users.length * 2 + (users.some((u) => u.source === 'dictionary') ? 1 : 0);
      };
      const reference = [...distinct].sort((a, b) => score(b) - score(a))[0];
      const dict = rendered.find((u) => u.source === 'dictionary' && norm(u.values[lang] as string) === reference);
      for (const u of rendered) {
        const t = norm(u.values[lang] as string);
        if (t === reference) continue;
        out.push(makeFinding({
          check: 'label-consistency', severity: 'warning', lang, unitId: u.id, location: u.location, en: u.values.en as string, target: u.values[lang] as string,
          reason: `EN label rendered ${distinct.length} ways in ${lang.toUpperCase()}: ${distinct.map((d) => `"${d}"`).join(', ')}; reference "${reference}"${dict ? ` (${dict.id})` : ''}`,
        }));
      }
    }
  }
  return out;
}

/** A content file's source.sha256 ≠ the current export's sha256: the content may be stale. */
export function checkSourcePins(pins: SourcePin[], currentSha: (file: string) => string | null): Finding[] {
  return pins.flatMap((pin) => {
    const now = currentSha(pin.exportFile);
    if (now === pin.pinnedSha256) return [];
    return [makeFinding({
      check: 'source-pin', severity: 'warning', lang: pin.lang, unitId: `content-file:${pin.contentFile}`, location: { file: { [pin.lang]: pin.contentFile } },
      en: '', target: '', reason: now === null ? `export ${pin.exportFile} is not readable` : `${pin.contentFile} is pinned to ${pin.pinnedSha256.slice(0, 12)}…, ${pin.exportFile} is now ${now.slice(0, 12)}…`,
    })];
  });
}

// ---------------------------------------------------------------- length (D-10, §3.4)

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
/** Grapheme count of the visible text: HTML stripped, whitespace collapsed, so a composed or decomposed "é" is 1. */
export const visibleLength = (value: string) => [...graphemes.segment(htmlToText(value))].length;

const globRegex = (glob: string) => new RegExp(`^${glob.split('*').map(escapeRe).join('.*')}$`);
/** content-json units match on their field path (e.g. "heroContent.heroTitle", "x.packagesElements.ctaText"); dictionary units on the key. */
const selectorTarget = (u: Unit) => (u.source === 'dictionary' ? u.location.dictKey : `${u.location.field ?? ''}${u.location.subKey ? `.${u.location.subKey}` : ''}`);

export interface LengthResult { findings: Finding[]; used: string[]; unused: string[] }

export function checkLength(units: Unit[], limits: LengthLimits, langs: TargetLang[]): LengthResult {
  const placeholder = limits.status === 'placeholder';
  const tag = placeholder ? ' (placeholder limit)' : '';
  const used = new Set<string>();
  const all: string[] = [];
  const typed = new Map<Unit, { type: string; maxChars: number }>();
  for (const [type, def] of Object.entries(limits.types)) {
    for (const source of ['content-json', 'dictionary'] as const) {
      for (const glob of def.select[source] ?? []) {
        const name = `${source}:${glob}`;
        all.push(name);
        const re = globRegex(glob);
        for (const u of units) {
          const target = selectorTarget(u);
          if (u.source !== source || target === undefined || !re.test(target)) continue;
          used.add(name);
          const cur = typed.get(u);
          if (!cur || def.maxChars < cur.maxChars) typed.set(u, { type, maxChars: def.maxChars }); // stricter type wins
        }
      }
    }
  }
  const findings: Finding[] = [];
  for (const [u, { type, maxChars }] of typed) {
    const en = u.values.en;
    const enLen = en !== undefined && !hasPlaceholder(en) ? visibleLength(en) : null;
    for (const lang of ['en', ...langs] as Lang[]) {
      const v = u.values[lang];
      if (v === undefined || v.trim() === '' || hasPlaceholder(v)) continue;
      const len = visibleLength(v);
      const reasons: string[] = [];
      if (len > maxChars) reasons.push(`${len} characters > ${type} max ${maxChars}`);
      if (lang !== 'en' && enLen && len > enLen * limits.ratioWarnAbove) reasons.push(`${len} characters > EN ${enLen} × ${limits.ratioWarnAbove}`);
      if (!reasons.length) continue;
      const severity: Severity = placeholder || lang === 'en' ? 'info' : 'warning';
      findings.push(makeFinding({ check: 'length', severity, lang, unitId: u.id, location: u.location, en: en ?? '', target: lang === 'en' ? '' : v, reason: `${reasons.join('; ')}${tag}` }));
    }
  }
  return { findings, used: all.filter((s) => used.has(s)), unused: all.filter((s) => !used.has(s)) };
}

export function runDeterministic(units: Unit[], pins: SourcePin[], ctx: CheckContext, currentSha: (file: string) => string | null): Finding[] {
  return [...units.flatMap((u) => checkUnit(u, ctx)), ...checkLabelConsistency(units, ctx), ...checkSourcePins(pins, currentSha)];
}

/** CTA labels per language from the dictionary units (glossary.ctaLabels names the keys). */
export function ctaLabelsFrom(units: Unit[], glossary: Glossary): CheckContext['ctaLabels'] {
  return Object.fromEntries(glossary.ctaLabels.map(({ dictKey }) => [dictKey, units.find((u) => u.id === `dict:${dictKey}`)?.values ?? {}]));
}
