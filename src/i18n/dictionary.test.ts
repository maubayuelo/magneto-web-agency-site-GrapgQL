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

  it('uses the approved short ES header CTA without changing other booking labels', () => {
    expect(getDictionary('es').header.scheduleCall).toBe('Reservar consulta');
    expect(getDictionary('es').common.bookStrategyCall).toBe('Agendar una llamada de orientación');
    expect(getDictionary('en').header.scheduleCall).toBe('Book a Strategy Call');
    expect(getDictionary('fr').header.scheduleCall).toBe('Réserver un appel-conseil');
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
      'footer.email', 'featuredServices.explore', 'projectDetail.challenges', 'projectDetail.solutions',
      'projectDetail.results', 'projectDetail.viewLiveSite', 'cmsFallback.finalCta.title',
      'cmsFallback.finalCta.subtitle', 'meta.site.fallbackTitle',
    ];
    const doneFr = new Set(phase5a); // testimonials.title stays [FR TODO] (O2)
    const doneEs = new Set([...phase5a, 'testimonials.title']);
    expect(findTodoKeys(en)).toEqual([]);
    expect(findTodoKeys(fr)).toEqual(Object.keys(flat(fr)).filter((k) => !doneFr.has(k)));
    expect(findTodoKeys(es)).toEqual(Object.keys(flat(es)).filter((k) => !doneEs.has(k)));
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
