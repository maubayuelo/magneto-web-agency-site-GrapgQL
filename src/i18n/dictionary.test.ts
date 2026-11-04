/// <reference types="vitest" />
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  assertLocalesReady,
  findTodoKeys,
  flattenDictionary,
  format,
  formatParts,
  getDictionary,
  type Dictionary,
} from './dictionary';
import { en } from './dictionaries/en';
import { fr } from './dictionaries/fr';
import { es } from './dictionaries/es';
import { LOCALES } from './config';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const flat = (d: Dictionary) => flattenDictionary(d);
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionary key parity', () => {
  it.each([
    ['fr', fr],
    ['es', es],
  ] as const)('%s has exactly the EN keys', (_locale, dict) => {
    const enKeys = Object.keys(flat(en));
    const keys = Object.keys(flat(dict));
    expect({ missing: enKeys.filter((k) => !keys.includes(k)), extra: keys.filter((k) => !enKeys.includes(k)) }).toEqual({
      missing: [],
      extra: [],
    });
  });

  it.each(LOCALES)('every %s leaf is a non-empty string', (locale) => {
    for (const [key, value] of Object.entries(flat(getDictionary(locale)))) {
      expect(typeof value, key).toBe('string');
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });

  it.each([
    ['fr', fr],
    ['es', es],
  ] as const)('%s keeps the same {placeholders} per key', (_locale, dict) => {
    const other = flat(dict);
    for (const [key, value] of Object.entries(flat(en))) {
      expect(placeholders(other[key]), key).toEqual(placeholders(value));
    }
  });
});

describe('getDictionary', () => {
  it('returns the object for each locale', () => {
    expect(getDictionary('en')).toBe(en);
    expect(getDictionary('fr')).toBe(fr);
    expect(getDictionary('es')).toBe(es);
  });

  it('keeps the header CTAs and uses the 5b main CTA label everywhere else (spec §5.4, Q-A1/Q-R1)', () => {
    expect(getDictionary('es').header.scheduleCall).toBe('Reservar consulta');
    expect(getDictionary('en').header.scheduleCall).toBe('Book a Strategy Call');
    expect(getDictionary('fr').header.scheduleCall).toBe('Réserver un appel-conseil');
    // magneto-copy-en.md:27, magneto-copy-fr-CA.md:27, magneto-copy-es.md:29 (01ff73f)
    expect(getDictionary('en').common.bookStrategyCall).toBe('Book a Free Strategy Call');
    expect(getDictionary('fr').common.bookStrategyCall).toBe('Réserver un appel-conseil gratuit');
    expect(getDictionary('es').common.bookStrategyCall).toBe('Agendar una llamada de orientación gratuita');
    for (const locale of LOCALES) {
      expect(getDictionary(locale).common.bookStrategyCall, locale).not.toBe(getDictionary(locale).header.scheduleCall);
    }
  });
});

describe('format', () => {
  it('replaces known placeholders', () => {
    expect(format('Gallery image {n}', { n: 2 })).toBe('Gallery image 2');
    expect(format(en.meta.project.title, { title: 'TRÉPIED' })).toBe('TRÉPIED | Magneto Projects');
    expect(format(en.emailModal.errors.subscribeFailed, { status: 500 })).toBe('Failed to subscribe (500)');
  });

  it('leaves unknown placeholders and plain text as is', () => {
    expect(format('a {missing} b', {})).toBe('a {missing} b');
    expect(format('no placeholders', { n: 1 })).toBe('no placeholders');
  });
});

describe('formatParts', () => {
  it('splits the footer like the hand-written JSX children', () => {
    expect(formatParts(en.footer.copyright, { year: 2026 })).toEqual(['Magneto Web Consulting © ', 2026]);
  });

  it('renders the same SSR markup as the original JSX (text separators kept)', () => {
    const year = 2026;
    const before = renderToStaticMarkup(React.createElement('p', null, 'Magneto Web Consulting © ', year));
    const after = renderToStaticMarkup(React.createElement('p', null, formatParts(en.footer.copyright, { year })));
    expect(after).toBe(before);
  });

  it('drops empty text parts and keeps unknown placeholders', () => {
    expect(formatParts('{n} items', { n: 3 })).toEqual([3, ' items']);
    expect(formatParts('x {missing}', {})).toEqual(['x ', '{missing}']);
  });

  it('gives element values a key', () => {
    const parts = formatParts('Hello {name}!', { name: React.createElement('strong', null, 'Ana') });
    expect(React.isValidElement(parts[1]) && parts[1].key).toBeTruthy();
  });
});

describe('readiness guard', () => {
  it('EN has no TODO markers; FR/ES list every key except the ones the copy provides', () => {
    // Phase 5a (spec "Dictionary changes", AC-21): exactly these keys left TODO. The brand is a proper name (O3).
    const phase5a = [
      'common.bookStrategyCall', 'nav.about', 'nav.services', 'nav.packages', 'nav.projects', 'nav.contact',
      'header.scheduleCall', 'home.recentProjects', 'home.projectsIntro', 'footer.copyright', 'footer.linkedin',
      'featuredServices.explore', 'projectDetail.challenges', 'projectDetail.solutions',
      'projectDetail.results', 'projectDetail.viewLiveSite', 'cmsFallback.finalCta.title',
      'cmsFallback.finalCta.subtitle', 'meta.site.fallbackTitle',
    ];
    // Phase 5b (spec §6, E14): the 13 metadata keys per locale + the new case-study keys. meta.project.title stays TODO (Q-D1).
    const phase5b = [
      'meta.site.fallbackDescription',
      ...['home', 'services', 'packages', 'projects', 'about', 'contact'].flatMap((p) => [`meta.${p}.title`, `meta.${p}.description`]),
      ...['dangel', 'trepied', 'shamanicca'].flatMap((c) => [`meta.caseStudies.${c}.title`, `meta.caseStudies.${c}.description`]),
    ];
    // Phase 5d-lite (spec §8): every new Contact form/page key (Part 1) and booking-dialog key (Part 2) is filled in FR and ES.
    const phase5d = Object.keys(flat(en)).filter(
      (k) => k.startsWith('contactForm.') || k.startsWith('contactPage.') || k.startsWith('bookingModal.') || k === 'common.privacyPolicy',
    );
    const doneFr = new Set([...phase5a, ...phase5b, ...phase5d]); // testimonials.title stays [FR TODO] (O2)
    const doneEs = new Set([...phase5a, ...phase5b, ...phase5d, 'testimonials.title']);
    expect(findTodoKeys(en)).toEqual([]);
    expect(findTodoKeys(fr)).toEqual(Object.keys(flat(fr)).filter((k) => !doneFr.has(k)));
    expect(findTodoKeys(es)).toEqual(Object.keys(flat(es)).filter((k) => !doneEs.has(k)));
  });

  it('5d-lite AC-14: FR 58 / ES 57 after the phase; Packages error keys still block a launch build', () => {
    // 5b left FR 83 / ES 82. Part 1 removed the 20 old contactForm leaves → 63 / 62. Part 2 removes the 5 emailModal
    // booking keys → 58 / 57. The new bookingModal keys are all filled.
    for (const [locale, dict, count] of [['fr', fr, 58], ['es', es, 57]] as const) {
      for (const gone of ['bookingTitle', 'calendlyBody', 'defaultBody', 'continueBooking', 'subscribe']) {
        expect(Object.keys(flat(dict))).not.toContain(`emailModal.${gone}`);
      }
      expect(findTodoKeys(dict)).toHaveLength(count);
      for (const key of ['packages.errorTitle', 'packages.errorBody']) {
        expect(findTodoKeys(dict)).toContain(key);
        // Even when every other key is translated, either error key must block a launch build.
        const isolated = { ...en, packages: { ...en.packages, [key.split('.')[1]]: flat(dict)[key] } };
        expect(() => assertLocalesReady([locale], { allowUntranslated: false }, { en, fr: isolated, es: isolated })).toThrow(key);
      }
    }
  });

  it('does not throw for EN only, or with the local override', () => {
    expect(() => assertLocalesReady(['en'])).not.toThrow();
    expect(() => assertLocalesReady(['en'], { allowUntranslated: false })).not.toThrow();
    expect(() => assertLocalesReady(['en', 'fr'], { allowUntranslated: true })).not.toThrow();
  });

  it('throws for an enabled locale with markers and names it with its count', () => {
    const count = findTodoKeys(fr).length;
    expect(() => assertLocalesReady(['en', 'fr'], { allowUntranslated: false })).toThrow(
      new RegExp(`enables fr, but its dictionary has ${count} untranslated keys \\(\\[FR TODO\\]\\): common\\.goHome`),
    );
    expect(() => assertLocalesReady(['en', 'fr', 'es'])).toThrow(/enables fr.*enables es/);
  });

  it('passes for a dictionary without markers', () => {
    const translated = { en, fr: en, es: en };
    expect(() => assertLocalesReady(['en', 'fr', 'es'], {}, translated)).not.toThrow();
  });
});

// 5d-lite §8 / AC-17: every Contact value equals its line of the committed export (637fba7). The export governs.
const EXPORTS = { en: 'magneto-copy-en.md', fr: 'magneto-copy-fr-CA.md', es: 'magneto-copy-es.md' } as const;
const exportLines = Object.fromEntries(
  Object.entries(EXPORTS).map(([locale, file]) => [locale, readFileSync(path.resolve(__dirname, '../../docs/content', file), 'utf8').split('\n')]),
) as Record<keyof typeof EXPORTS, string[]>;

type Pick = { before?: string; after?: string; lastBold?: boolean };
/** Strips Markdown (heading/list markers, a leading **Label:** , **, \$ escapes, an enclosing *…*), as the spec §8.1 rules say. */
function fromExport(locale: keyof typeof EXPORTS, line: number, pick: Pick = {}): string {
  let s = exportLines[locale][line - 1].trim();
  if (pick.lastBold) return /\*\*([^*]+)\*\*\s*$/.exec(s)![1].trim();
  s = s.replace(/^#+\s+/, '').replace(/^-\s+/, '').replace(/^\*\*[^*]*:\*\*\s*/, '');
  if (pick.before) s = s.slice(0, s.lastIndexOf(pick.before));
  s = s.replace(/\*\*/g, '').replace(/\\\$/g, '$');
  if (s.length > 1 && s.startsWith('*') && s.endsWith('*')) s = s.slice(1, -1);
  if (pick.after) s = s.slice(s.indexOf(pick.after) + pick.after.length);
  return s.trim();
}

// key → [EN line, FR line, ES line, options]
const CONTACT_COPY: [string, number, number, number, Pick?][] = [
  ['common.privacyPolicy', 689, 804, 814, { lastBold: true }],
  ['contactPage.preferToTalk', 630, 745, 755, { before: ' **' }],
  ['contactPage.supporting.reply', 683, 798, 808],
  ['contactPage.supporting.languages', 685, 800, 810],
  ['contactPage.supporting.notAQuote', 687, 802, 812],
  ['contactForm.requiredNote', 701, 816, 826],
  ['contactForm.nameLabel', 634, 749, 759],
  ['contactForm.emailLabel', 638, 753, 763],
  ['contactForm.websiteLabel', 642, 757, 767],
  ['contactForm.websiteHelp', 646, 761, 771],
  ['contactForm.needLabel', 648, 763, 773],
  ['contactForm.needOptions.newSite', 654, 769, 779],
  ['contactForm.needOptions.fixImprove', 655, 770, 780],
  ['contactForm.needOptions.care', 656, 771, 781],
  ['contactForm.needOptions.notSure', 657, 772, 782],
  ['contactForm.messageLabel', 659, 774, 784],
  ['contactForm.messageHelp', 663, 778, 788],
  ['contactForm.budgetLabel', 665, 780, 790],
  ['contactForm.budgetOptions.under1000', 671, 786, 796],
  ['contactForm.budgetOptions.from1000to3500', 672, 787, 797],
  ['contactForm.budgetOptions.from3500to8000', 673, 788, 798],
  ['contactForm.budgetOptions.over8000', 674, 789, 799],
  ['contactForm.budgetOptions.notSure', 675, 790, 800],
  ['contactForm.budgetHelp', 677, 792, 802],
  ['contactForm.selectPlaceholder', 699, 814, 824],
  ['contactForm.submit', 679, 794, 804],
  ['contactForm.privacyText', 689, 804, 814, { before: ' **' }],
  ['contactForm.successTitle', 693, 808, 818],
  ['contactForm.successBody', 695, 810, 820],
  ['contactForm.errors.nameRequired', 703, 818, 828],
  ['contactForm.errors.emailInvalid', 705, 820, 830],
  ['contactForm.errors.needRequired', 707, 822, 832],
  ['contactForm.errors.messageRequired', 709, 824, 834],
  ['contactForm.errors.budgetRequired', 711, 826, 836],
  ['contactForm.errors.sendFailed', 713, 828, 838],
  // Part 2: booking dialog (variant B). Heading = common.bookStrategyCall (EN 749 / FR 899 / ES 909, pinned below).
  ['bookingModal.body', 751, 901, 911],
  ['bookingModal.websiteHelp', 756, 907, 917], // EN: the part after "Website URL, " (spec A3)
  ['bookingModal.problemLabel', 762, 918, 928],
  ['bookingModal.problemHelp', 763, 922, 932],
  ['bookingModal.continue', 765, 924, 934],
  ['bookingModal.privacyText', 958, 934, 944, { before: ' **' }],
  ['common.bookStrategyCall', 749, 899, 909],
];
// Line labels that are not bold-with-colon: EN "Helper text: …", FR/ES submit label inside the bold.
const LABEL_AFTER: Record<string, string> = {
  'en:contactForm.messageHelp': 'Helper text: ',
  'en:contactForm.budgetHelp': 'Helper text: ',
  'fr:contactForm.submit': "CTA d'envoi : ",
  'es:contactForm.submit': 'CTA de envío: ',
  'en:bookingModal.problemHelp': 'Helper text: ',
  'en:bookingModal.websiteHelp': 'Website URL, ',
  'fr:bookingModal.continue': 'CTA : ',
  'es:bookingModal.continue': 'CTA: ',
};

describe('5d-lite Contact copy = export 637fba7 (AC-4, AC-17)', () => {
  const dicts = { en, fr, es } as const;
  it.each(['en', 'fr', 'es'] as const)('%s: every Contact key equals its export line', (locale) => {
    const values = flat(dicts[locale]);
    for (const [key, enLine, frLine, esLine, pick = {}] of CONTACT_COPY) {
      const line = { en: enLine, fr: frLine, es: esLine }[locale];
      const after = LABEL_AFTER[`${locale}:${key}`];
      expect(values[key], `${key} (${EXPORTS[locale]}:${line})`).toBe(fromExport(locale, line, after ? { ...pick, after } : pick));
    }
  });

  it.each(['en', 'fr', 'es'] as const)('%s: sendFailedCta is a non-empty, non-TODO substring of sendFailed (A6)', (locale) => {
    const { sendFailed, sendFailedCta } = dicts[locale].contactForm.errors;
    expect(sendFailedCta.trim().length).toBeGreaterThan(0);
    expect(sendFailedCta).not.toContain('TODO]');
    expect(sendFailed.includes(sendFailedCta)).toBe(true);
  });

  it('the required legend keeps its literal * (M9)', () => {
    for (const d of [en, fr, es]) expect(d.contactForm.requiredNote).toContain(' * ');
  });

  it('SLA guard: no dictionary value promises a response time (AC-8)', () => {
    const SLA = /24\s*[–-]\s*48|48\s*(h|hours|heures|horas)/i;
    for (const d of [en, fr, es]) {
      for (const [key, value] of Object.entries(flat(d))) expect(SLA.test(value), key).toBe(false);
    }
  });
});
