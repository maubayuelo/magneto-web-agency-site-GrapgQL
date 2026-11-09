// Deterministic layer (spec §6.1). Runs in the default jsdom environment: vitest.setup.ts hooks use `window`, so the
// node environment the spec names would fail them; nothing here depends on the DOM. No network, no key.
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkLabelConsistency, checkLength, checkSourcePins, checkUnit, countKeepTerms, extractNumbers, htmlToText, visibleLength, type CheckContext,
} from './checks.ts';
import { GlossarySchema, TOOL_DIR, readJsonConfig, type LengthLimits } from './inputs.ts';
import type { Unit } from './schema.ts';

beforeEach(() => {
  delete process.env.MAGNETO_QA_ANTHROPIC_API_KEY;
});

const glossary = readJsonConfig(path.join(TOOL_DIR, 'config/glossary.json'), GlossarySchema);
const ctx: CheckContext = {
  glossary,
  // Fixture labels: the check must read them from here, not from constants.
  ctaLabels: {
    'common.bookStrategyCall': { en: 'Book a Call', fr: 'Réserver un appel', es: 'Agenda una llamada' },
    'header.scheduleCall': { en: 'Book a Strategy Call', fr: 'Réserver un appel-conseil', es: 'Reservar consulta' },
  },
  langs: ['fr', 'es'],
};

const unit = (values: Unit['values'], over: Partial<Unit> = {}): Unit => ({
  id: 'content:test/field', source: 'content-json', location: { file: { en: 'en.json', fr: 'fr.json', es: 'es.json' } }, kind: 'text', llm: true, values, ...over,
});
const checks = (u: Unit) => checkUnit(u, ctx).map((f) => `${f.check}:${f.lang}:${f.severity}`);

describe('number normalizer', () => {
  it('$3,500 = 3 500 $ CA = 3 500 $ (U+00A0) = 3 500 $ (U+202F)', () => {
    for (const v of ['$3,500', '3 500 $ CA', '3 500 $', '3 500 $']) expect(extractNumbers(v)).toEqual(['3500']);
  });
  it('5 000 à 8 000 → {5000, 8000}', () => expect(extractNumbers('5 000 à 8 000 $ CA')).toEqual(['5000', '8000']));
  it('1,000. with trailing punctuation', () => expect(extractNumbers('Starting at C$1,000.')).toEqual(['1000']));
  it('3.5 is a decimal, not 35', () => {
    expect(extractNumbers('3.5 days')).toEqual(['3.5']);
    expect(extractNumbers('3,5 jours')).toEqual(['3.5']);
  });
  it('keeps % as a unit', () => expect(extractNumbers('50% off, 50 pages')).toEqual(['50%', '50']));
  it('ignores href URLs and {placeholders}', () => expect(extractNumbers('<a href="/p/2026">{n} pages</a>')).toEqual([]));
});

describe('deterministic checks: one positive and one negative case each', () => {
  it('missing', () => {
    expect(checks(unit({ en: 'Hello', fr: 'Bonjour' }))).toEqual(['missing:es:error']);
    expect(checks(unit({ en: 'Hello', fr: 'Bonjour', es: 'Hola' }))).toEqual([]);
  });
  it('empty (and the reverse, on EN, as a warning)', () => {
    expect(checks(unit({ en: 'Hello', fr: '  ', es: 'Hola' }))).toEqual(['empty:fr:error']);
    expect(checks(unit({ en: '', fr: 'Bonjour', es: 'Hola' }))).toEqual(['empty:en:warning']);
    expect(checks(unit({ en: '', fr: '', es: '' }))).toEqual([]);
  });
  it('placeholder in any language, EN included', () => {
    expect(checks(unit({ en: 'Hello', fr: '[FR TODO] Hello', es: 'Hola' }))).toEqual(['placeholder:fr:error']);
    expect(checks(unit({ en: 'TBD', fr: 'Bonjour', es: 'Hola' }))).toContain('placeholder:en:error');
    expect(checks(unit({ en: 'Lorem ipsum', fr: 'Bonjour', es: '[ES TEST] Hola' }))).toEqual(['placeholder:en:error', 'placeholder:es:error']);
    expect(checks(unit({ en: 'Today', fr: 'Aujourd’hui', es: 'Hoy' }))).toEqual([]);
  });
  it('identical-to-en, with the allow-list and keep-term-only values exempt', () => {
    expect(checks(unit({ en: 'Expertise', fr: 'Expertise', es: 'Experiencia' }))).toEqual(['identical-to-en:fr:warning']);
    expect(checks(unit({ en: 'Services', fr: 'Services', es: 'Servicios' }))).toEqual([]);
    expect(checks(unit({ en: 'Magneto Web Consulting © {year}', fr: 'Magneto Web Consulting © {year}', es: 'Magneto Web Consulting © {year}' }))).toEqual([]);
  });
  it('numbers', () => {
    expect(checks(unit({ en: 'from C$3,500', fr: 'à partir de 3 050 $ CA', es: 'desde 3 500 CAD' }))).toEqual(['numbers:fr:error']);
    expect(checks(unit({ en: 'C$5,000–8,000', fr: '5 000 à 8 000 $ CA', es: '5 000–8 000 CAD' }))).toEqual([]);
  });
  it('currency', () => {
    expect(checks(unit({ en: 'from C$3,500', fr: 'à partir de 3 500', es: 'desde 3 500 CAD' }))).toEqual(['currency:fr:error']);
    expect(checks(unit({ en: 'from C$3,500', fr: 'à partir de 3 500 $ CA', es: 'desde 3 500 CAD' }))).toEqual([]);
  });
  it('structural-equality (and no other check on structural units)', () => {
    expect(checks(unit({ en: '/packages#build', fr: '/forfaits#build', es: '/packages#build' }, { kind: 'structural' }))).toEqual(['structural-equality:fr:error']);
    expect(checks(unit({ en: '/contact', fr: '/contact', es: '/contact' }, { kind: 'structural' }))).toEqual([]);
  });
  it('urls (HTML href and Markdown links), with glossary exceptions', () => {
    const u = unit({ en: '<a href="/contact">Contact</a>', fr: '<a href="/fr/contact">Joindre</a>', es: '<a href="/contact">Contacto</a>' });
    expect(checks(u)).toEqual(['urls:fr:error']);
    expect(checks(unit({ en: 'See [it](https://a.b/x)', fr: 'Voir [ça](https://a.b/x)', es: 'Ver [eso](https://a.b/x)' }))).toEqual([]);
    const withException = { ...ctx, glossary: { ...glossary, urlExceptions: [{ en: '/contact', fr: '/fr/contact' }] } };
    expect(checkUnit(u, withException)).toEqual([]);
  });
  it('interpolation', () => {
    expect(checks(unit({ en: 'View {domain}', fr: 'Voir {domaine}', es: 'Ver {domain}' }, { kind: 'label' }))).toEqual(['interpolation:fr:error']);
    expect(checks(unit({ en: 'View {domain}', fr: 'Voir {domain}', es: 'Ver {domain}' }, { kind: 'label' }))).toEqual([]);
  });
  it('kept-terms: missing → error, different count → info, longest term first', () => {
    expect(checks(unit({ en: 'BUILD, FIX and CARE', fr: 'CONSTRUIRE, FIX et CARE', es: 'BUILD, FIX y CARE' }))).toEqual(['kept-terms:fr:error']);
    expect(checks(unit({ en: 'Magneto helps', fr: 'Magneto aide Magneto', es: 'Magneto ayuda' }))).toEqual(['kept-terms:fr:info']);
    expect(checks(unit({ en: 'BUILD and FIX', fr: 'BUILD et FIX', es: 'BUILD y FIX' }))).toEqual([]);
    expect(countKeepTerms('Magneto Web Consulting and Magneto', glossary.keep)).toEqual(new Map([['Magneto Web Consulting', 1], ['Magneto', 1]]));
    expect(countKeepTerms('fix the care plan', glossary.keep)).toEqual(new Map()); // word-exact-case
    expect(countKeepTerms('TRÉPIED and Trépied', glossary.keep)).toEqual(new Map([['Trépied', 2]])); // case-insensitive
  });
  it('main-cta: a label equal to the EN main CTA must equal the target dictionary label', () => {
    expect(checks(unit({ en: 'Book a Call', fr: 'Réserver un appel', es: 'Agendar una llamada' }, { kind: 'label' }))).toEqual(['main-cta:es:error']);
    expect(checks(unit({ en: 'Book a Call', fr: 'Réserver un appel', es: 'Agenda una llamada' }, { kind: 'label' }))).toEqual([]);
    expect(checks(unit({ en: 'Book a Call', fr: 'X', es: 'Y' }, { kind: 'label', id: 'dict:common.bookStrategyCall' }))).toEqual([]);
  });
  it('list-items', () => {
    expect(checks(unit({ en: '<ul><li>one</li><li>two</li></ul>', fr: '<ul><li>un</li></ul>', es: '<ul><li>uno</li><li>dos</li></ul>' }))).toEqual(['list-items:fr:warning']);
    expect(checks(unit({ en: '- one\n- two', fr: '- un\n- deux', es: '- uno\n- dos' }))).toEqual([]);
  });
});

describe('cross-unit checks', () => {
  it('label-consistency flags the rendering that differs from the dictionary reference', () => {
    const dict = unit({ en: 'Close', fr: 'Fermer', es: 'Cerrar' }, { id: 'dict:common.close', source: 'dictionary', kind: 'label' });
    const other = unit({ en: 'Close', fr: 'Fermer le menu', es: 'Cerrar' }, { id: 'dict:header.menuClose', source: 'dictionary', kind: 'label' });
    const third = unit({ en: 'Close', fr: 'Fermer', es: 'Cerrar' }, { id: 'content:x/ctaText', kind: 'label' });
    expect(checkLabelConsistency([third, other, dict], ctx).map((f) => `${f.unitId}:${f.lang}`)).toEqual(['dict:header.menuClose:fr']);
    expect(checkLabelConsistency([dict, third], ctx)).toEqual([]);
  });
  it('source-pin: warning when the export sha differs, none when equal', () => {
    const pin = { lang: 'fr' as const, contentFile: 'fr.json', exportFile: 'docs/x.md', pinnedSha256: 'a'.repeat(64) };
    expect(checkSourcePins([pin], () => 'b'.repeat(64)).map((f) => `${f.check}:${f.severity}`)).toEqual(['source-pin:warning']);
    expect(checkSourcePins([pin], () => 'a'.repeat(64))).toEqual([]);
  });
});

describe('length (D-10, §3.4)', () => {
  const limits = (status: 'placeholder' | 'set' = 'placeholder'): LengthLimits => ({
    version: 1, status, set: { by: null, on: null }, ratioWarnAbove: 1.5,
    types: {
      'cta-label': { maxChars: 10, select: { 'content-json': ['*.ctaText'] } },
      'hero-title': { maxChars: 20, select: { 'content-json': ['heroContent.heroTitle'] } },
      button: { maxChars: 8, select: { dictionary: ['common.close', 'nav.unused'] } },
    },
  });
  const cta = (values: Unit['values']) => unit(values, { id: 'content:p/x.items[0].ctaText', kind: 'label', location: { file: {}, field: 'x.items', row: 0, subKey: 'ctaText' } });
  const hero = (values: Unit['values']) => unit(values, { id: 'content:p/heroContent.heroTitle', location: { file: {}, field: 'heroContent.heroTitle' } });
  const button = (values: Unit['values']) => unit(values, { id: 'dict:common.close', source: 'dictionary', kind: 'label', location: { file: {}, dictKey: 'common.close' } });
  const run = (u: Unit, l = limits()) => checkLength([u], l, ['fr', 'es']).findings.map((f) => `${f.lang}:${f.severity}`);

  it('a limit hit and a limit not hit, for each type', () => {
    expect(run(cta({ en: 'Go', fr: 'Allez-y vite', es: 'Ve' }))).toEqual(['fr:info']); // 12 > 10 (and > 2 × 1.5)
    expect(run(cta({ en: 'Go now', fr: 'Allez', es: 'Ve' }))).toEqual([]);
    expect(run(hero({ en: 'A title of twenty ch', fr: 'Un titre de vingt-et-un', es: 'Un título' }))).toEqual(['fr:info']);
    expect(run(hero({ en: 'Short title', fr: 'Titre court', es: 'Título corto' }))).toEqual([]);
    expect(run(button({ en: 'Close', fr: 'Fermer la', es: 'Cerrar' }))).toEqual(['fr:info']); // 9 > 8
    expect(run(button({ en: 'Close', fr: 'Fermer', es: 'Cerrar' }))).toEqual([]);
  });
  it('ratio exactly at the threshold → no finding; just above → finding', () => {
    expect(run(cta({ en: 'abcd', fr: 'abcdef', es: 'abcd' }))).toEqual([]); // 6 = 4 × 1.5
    expect(run(cta({ en: 'abcd', fr: 'abcdefg', es: 'abcd' }))).toEqual(['fr:info']); // 7 > 6
  });
  it('EN over the limit is info even when the limits are set', () => {
    expect(run(button({ en: 'Close this now', fr: 'Fermer', es: 'Cerrar' }), limits('set'))).toEqual(['en:info']);
  });
  it('placeholder → info marked "(placeholder limit)"; set → FR/ES warning', () => {
    const u = button({ en: 'Close', fr: 'Fermer la fenêtre', es: 'Cerrar' });
    const ph = checkLength([u], limits(), ['fr', 'es']).findings[0];
    expect([ph.severity, ph.evidence.reason.endsWith('(placeholder limit)')]).toEqual(['info', true]);
    const set = checkLength([u], limits('set'), ['fr', 'es']).findings[0];
    expect([set.severity, set.evidence.reason.includes('placeholder')]).toEqual(['warning', false]);
  });
  it('composed and decomposed "é" count as one character', () => {
    expect(visibleLength('caf\u00E9')).toBe(4);
    expect(visibleLength('cafe\u0301')).toBe(4);
    expect(run(button({ en: 'Close it', fr: 'Ferme\u0301e!!', es: 'Cerrar' }))).toEqual([]); // 8 graphemes, 9 code units
  });
  it('an HTML value is measured as visible text', () => {
    expect(visibleLength('<p><strong>Book</strong>  now</p>')).toBe(8);
    expect(run(cta({ en: '<strong>Go now</strong>', fr: '<em>Allez</em>', es: 'Ve' }))).toEqual([]);
  });
  it('a selector that matches nothing is listed as unused (not an error); a stricter type wins', () => {
    const r = checkLength([button({ en: 'Close', fr: 'Fermer', es: 'Cerrar' })], limits(), ['fr', 'es']);
    expect(r.used).toEqual(['dictionary:common.close']);
    expect(r.unused).toEqual(['content-json:*.ctaText', 'content-json:heroContent.heroTitle', 'dictionary:nav.unused']);
    const both = { ...limits(), types: { ...limits().types, tight: { maxChars: 4, select: { dictionary: ['common.*'] } } } };
    expect(checkLength([button({ en: 'Close', fr: 'Ferme', es: 'Cierr' })], both, ['fr', 'es']).findings.map((f) => f.evidence.reason))
      .toEqual(['5 characters > tight max 4 (placeholder limit)', '5 characters > tight max 4 (placeholder limit)', '5 characters > tight max 4 (placeholder limit)']);
  });
});

it('htmlToText decodes entities, drops tags and collapses whitespace (NBSP included)', () => {
  expect(htmlToText('<p>A &amp; B&nbsp;C</p><p>D&#39;E</p>')).toBe('A & B C D\'E');
});
