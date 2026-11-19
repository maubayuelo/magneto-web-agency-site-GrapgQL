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
    // magneto-copy-en.md:19, magneto-copy-fr-CA.md:20, magneto-copy-es.md:22 (export 2026-11-17)
    expect(getDictionary('en').common.bookStrategyCall).toBe('Book a Free Strategy Call');
    expect(getDictionary('fr').common.bookStrategyCall).toBe('Réserver un appel-conseil gratuit');
    expect(getDictionary('es').common.bookStrategyCall).toBe('Reservar consulta gratis');
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

// Q-D1 (2026-11-09): FR/ES are fully translated, so the marker-blocking checks run on small fixtures that still
// carry markers, never on the real dictionaries.
const withMarkers = (dict: Dictionary, marker: '[FR TODO]' | '[ES TODO]'): Dictionary => ({
  ...dict,
  common: { ...dict.common, goHome: `${marker} Go Home`, loading: `${marker} Loading...` },
});

describe('readiness guard', () => {
  it('EN, FR and ES have no TODO markers (Q-D1 fill), so a launch build with every locale passes', () => {
    expect(findTodoKeys(en)).toEqual([]);
    expect(findTodoKeys(fr)).toEqual([]);
    expect(findTodoKeys(es)).toEqual([]);
    expect(() => assertLocalesReady(['en', 'fr', 'es'], { allowUntranslated: false })).not.toThrow();
  });

  it('5d-lite AC-14: the old emailModal booking keys stay gone; a marker in a Packages error key blocks a launch build', () => {
    for (const [locale, dict, marker] of [['fr', fr, '[FR TODO]'], ['es', es, '[ES TODO]']] as const) {
      for (const gone of ['bookingTitle', 'calendlyBody', 'defaultBody', 'continueBooking', 'subscribe']) {
        expect(Object.keys(flat(dict))).not.toContain(`emailModal.${gone}`);
      }
      for (const field of ['errorTitle', 'errorBody'] as const) {
        // Fixture: the real dictionary with only this one key marked.
        const isolated = { ...dict, packages: { ...dict.packages, [field]: `${marker} ${en.packages[field]}` } };
        expect(findTodoKeys(isolated)).toEqual([`packages.${field}`]);
        expect(() => assertLocalesReady([locale], { allowUntranslated: false }, { en, fr: isolated, es: isolated })).toThrow(
          `packages.${field}`,
        );
      }
    }
  });

  it('does not throw for EN only, or with the local override', () => {
    expect(() => assertLocalesReady(['en'])).not.toThrow();
    expect(() => assertLocalesReady(['en'], { allowUntranslated: false })).not.toThrow();
    expect(() => assertLocalesReady(['en', 'fr'], { allowUntranslated: true })).not.toThrow();
  });

  it('throws for an enabled locale with markers and names it with its count', () => {
    const fixture = { en, fr: withMarkers(fr, '[FR TODO]'), es: withMarkers(es, '[ES TODO]') };
    expect(() => assertLocalesReady(['en', 'fr'], { allowUntranslated: false }, fixture)).toThrow(
      /enables fr, but its dictionary has 2 untranslated keys \(\[FR TODO\]\): common\.goHome, common\.loading/,
    );
    expect(() => assertLocalesReady(['en', 'fr', 'es'], {}, fixture)).toThrow(/enables fr.*enables es/);
    expect(() => assertLocalesReady(['en', 'fr', 'es'], { allowUntranslated: true }, fixture)).not.toThrow();
  });

  it('passes for a dictionary without markers', () => {
    const translated = { en, fr: en, es: en };
    expect(() => assertLocalesReady(['en', 'fr', 'es'], {}, translated)).not.toThrow();
  });
});

// 5d-lite §8 / AC-17: every Contact value equals its line of the committed export (export 2026-11-17). The export governs.
const EXPORTS = { en: 'magneto-copy-en.md', fr: 'magneto-copy-fr-CA.md', es: 'magneto-copy-es.md' } as const;
const exportLines = Object.fromEntries(
  Object.entries(EXPORTS).map(([locale, file]) => [locale, readFileSync(path.resolve(__dirname, '../../docs/content', file), 'utf8').split('\n')]),
) as Record<keyof typeof EXPORTS, string[]>;

type Pick = { before?: string; after?: string; lastBold?: boolean };
/** Strips Markdown (heading/list markers, a leading **Label:** , **, an enclosing *…*), as the spec §8.1 rules say. The
 *  Notion export escapes nothing (5c-rest D-15), so there is no unescape step. */
function fromExport(locale: keyof typeof EXPORTS, line: number, pick: Pick = {}): string {
  let s = exportLines[locale][line - 1].trim();
  if (pick.lastBold) return /\*\*([^*]+)\*\*\s*$/.exec(s)![1].trim();
  s = s.replace(/^#+\s+/, '').replace(/^-\s+/, '').replace(/^\*\*[^*]*:\*\*\s*/, '');
  if (pick.before) s = s.slice(0, s.lastIndexOf(pick.before));
  s = s.replace(/\*\*/g, '');
  if (s.length > 1 && s.startsWith('*') && s.endsWith('*')) s = s.slice(1, -1);
  if (pick.after) s = s.slice(s.indexOf(pick.after) + pick.after.length);
  return s.trim();
}

// key → [EN line, FR line, ES line, options]
const CONTACT_COPY: [string, number, number, number, Pick?][] = [
  ['common.privacyPolicy', 681, 837, 839, { lastBold: true }],
  ['contactPage.preferToTalk', 622, 778, 780, { before: ' **' }],
  ['contactPage.supporting.reply', 675, 831, 833],
  ['contactPage.supporting.languages', 677, 833, 835],
  ['contactPage.supporting.notAQuote', 679, 835, 837],
  ['contactForm.requiredNote', 693, 849, 851],
  ['contactForm.nameLabel', 626, 782, 784],
  ['contactForm.emailLabel', 630, 786, 788],
  ['contactForm.websiteLabel', 634, 790, 792],
  ['contactForm.websiteHelp', 638, 794, 796],
  ['contactForm.needLabel', 640, 796, 798],
  ['contactForm.needOptions.newSite', 646, 802, 804],
  ['contactForm.needOptions.fixImprove', 647, 803, 805],
  ['contactForm.needOptions.care', 648, 804, 806],
  ['contactForm.needOptions.notSure', 649, 805, 807],
  ['contactForm.messageLabel', 651, 807, 809],
  ['contactForm.messageHelp', 655, 811, 813],
  ['contactForm.budgetLabel', 657, 813, 815],
  ['contactForm.budgetOptions.under1000', 663, 819, 821],
  ['contactForm.budgetOptions.from1000to3500', 664, 820, 822],
  ['contactForm.budgetOptions.from3500to8000', 665, 821, 823],
  ['contactForm.budgetOptions.over8000', 666, 822, 824],
  ['contactForm.budgetOptions.notSure', 667, 823, 825],
  ['contactForm.budgetHelp', 669, 825, 827],
  ['contactForm.selectPlaceholder', 691, 847, 849],
  ['contactForm.submit', 671, 827, 829],
  ['contactForm.privacyText', 681, 837, 839, { before: ' **' }],
  ['contactForm.successTitle', 685, 841, 843],
  ['contactForm.successBody', 687, 843, 845],
  ['contactForm.errors.nameRequired', 695, 851, 853],
  ['contactForm.errors.emailInvalid', 697, 853, 855],
  ['contactForm.errors.needRequired', 699, 855, 857],
  ['contactForm.errors.messageRequired', 701, 857, 859],
  ['contactForm.errors.budgetRequired', 703, 859, 861],
  ['contactForm.errors.sendFailed', 705, 861, 863],
  // Part 2: booking dialog (variant B). Heading = common.bookStrategyCall (EN 741 / FR 932 / ES 934, pinned below).
  ['bookingModal.body', 743, 934, 936],
  ['bookingModal.websiteHelp', 748, 940, 942], // EN: the part after "Website URL, " (spec A3)
  ['bookingModal.problemLabel', 754, 951, 953],
  ['bookingModal.problemHelp', 755, 955, 957],
  ['bookingModal.continue', 757, 957, 959],
  ['bookingModal.privacyText', 946, 967, 969, { before: ' **' }],
  ['common.bookStrategyCall', 741, 932, 934],
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

describe('5d-lite Contact copy = export 2026-11-17 (AC-4, AC-17)', () => {
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

// Phase 5f §7 / AC-5: consent banner + footer control = the committed export (2026-11-17, D-15; the spec's 637fba7 lines
// are superseded). ES lines sit under "Textos de interfaz — privacidad (BORRADOR)": guard-safe, not launch-approved (G-8).
// A later authorized re-export must re-pin these lines in the same PR.
const CONSENT_COPY: Record<
  keyof typeof EXPORTS,
  { heading: number; body: number; buttons: number; footer: number; footerItem: number; label?: string }
> = {
  // EN has no separate "permanent footer link" line: the footer copy line is "Privacy Policy · Privacy choices".
  en: { heading: 930, body: 932, buttons: 934, footer: 170, footerItem: 1 },
  // FR lines are fully bold (**Titre : …**), so the label isn't stripped by fromExport: take the part after " : ".
  fr: { heading: 1127, body: 1129, buttons: 1131, footer: 1133, footerItem: 0, label: ' : ' },
  es: { heading: 1124, body: 1126, buttons: 1128, footer: 1130, footerItem: 0 },
};

describe('Phase 5f consent copy = export 2026-11-17 (AC-5)', () => {
  const dicts = { en, fr, es } as const;
  const line = (locale: keyof typeof EXPORTS, n: number, label?: string) =>
    fromExport(locale, n, label ? { after: label } : {});

  it.each(['en', 'fr', 'es'] as const)('%s: heading, body, Accept and Reject equal their export lines', (locale) => {
    const l = CONSENT_COPY[locale];
    const c = dicts[locale].consent;
    expect(c.privacyChoices, `${EXPORTS[locale]}:${l.heading}`).toBe(line(locale, l.heading, l.label));
    expect(c.body, `${EXPORTS[locale]}:${l.body}`).toBe(line(locale, l.body));
    const buttons = line(locale, l.buttons, l.label).split(' · ');
    expect(buttons, `${EXPORTS[locale]}:${l.buttons}`).toHaveLength(3);
    expect(c.accept).toBe(buttons[0]);
    expect(c.reject).toBe(buttons[1]);
    // The third "button" is the Privacy Policy link: the existing common.privacyPolicy value.
    expect(dicts[locale].common.privacyPolicy).toBe(buttons[2]);
  });

  it.each(['en', 'fr', 'es'] as const)('%s: banner heading = footer "Privacy choices" label', (locale) => {
    const l = CONSENT_COPY[locale];
    const footerLabel = line(locale, l.footer, l.label).split(' · ')[l.footerItem];
    expect(dicts[locale].consent.privacyChoices, `${EXPORTS[locale]}:${l.footer}`).toBe(footerLabel);
  });

  it.each([
    ['en', 170],
    ['fr', 172],
    ['es', 170],
  ] as const)('%s: the page footer line (:%i) ends with the same label', (locale, n) => {
    const items = line(locale, n).split(' · ');
    expect(items[items.length - 1]).toBe(dicts[locale].consent.privacyChoices);
  });
});

// Privacy route spec §4 / AC-3: meta.privacy = the SEO lines of the committed export (export 2026-11-17), verbatim.
// A later authorized re-export must re-pin these lines in the same PR.
const PRIVACY_META: Record<keyof typeof EXPORTS, { title: number; description: number }> = {
  en: { title: 897, description: 899 },
  fr: { title: 1094, description: 1096 },
  es: { title: 1091, description: 1093 },
};

describe('Privacy route meta.privacy = export 2026-11-17 (spec §4, AC-3)', () => {
  const dicts = { en, fr, es } as const;
  it.each(['en', 'fr', 'es'] as const)('%s: title and description equal their export lines', (locale) => {
    const lines = PRIVACY_META[locale];
    expect(dicts[locale].meta.privacy.title, `${EXPORTS[locale]}:${lines.title}`).toBe(fromExport(locale, lines.title));
    expect(dicts[locale].meta.privacy.description, `${EXPORTS[locale]}:${lines.description}`).toBe(fromExport(locale, lines.description));
  });

  it('the three titles end with the brand and differ per locale', () => {
    const titles = [en, fr, es].map((d) => d.meta.privacy.title);
    for (const title of titles) expect(title.endsWith(' | Magneto Web Consulting')).toBe(true);
    expect(new Set(titles).size).toBe(3);
  });
});
