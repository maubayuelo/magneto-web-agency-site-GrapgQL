/// <reference types="vitest" />
// 5b §6, AC-10/11/25: every route's generateMetadata returns the approved SEO copy of its locale, mirrored to Open Graph
// and Twitter. Expected values are read from the copy export (docs/content @ 637fba7; 5b spec E6 lines re-pinned after the
// 2026-11-04 re-export: EN +43 from old 120, +45 from old 228, +47 from old 406, +73 from old 865; FR +24 from old 102;
// ES +18 from old 114), not retyped.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { CASE_STUDY_KEYS, caseStudyMeta, pageMetadata } from './page-metadata';

vi.mock('@/app/[locale]/projects/[slug]/api', () => ({ getProjectBySlug: vi.fn() }));
import { getProjectBySlug } from '@/app/[locale]/projects/[slug]/api';
import { generateMetadata as homeMeta } from '@/app/[locale]/page';
import { generateMetadata as aboutMeta } from '@/app/[locale]/about-magneto/page';
import { generateMetadata as servicesMeta } from '@/app/[locale]/services/page';
import { generateMetadata as packagesMeta } from '@/app/[locale]/packages/page';
import { generateMetadata as contactMeta } from '@/app/[locale]/contact/page';
import { generateMetadata as projectsMeta } from '@/app/[locale]/projects/page';
import { generateMetadata as caseMeta } from '@/app/[locale]/projects/[slug]/page';

const FILES: Record<Locale, string> = { en: 'magneto-copy-en.md', fr: 'magneto-copy-fr-CA.md', es: 'magneto-copy-es.md' };
// SEO block heading line; title = +2, description = +4 (E6).
const BLOCKS = {
  en: { home: 182, projects: 199, about: 298, services: 474, packages: 596, contact: 723, dangel: 1070, trepied: 1181, shamanicca: 1316 },
  fr: { home: 143, projects: 149, about: 236, services: 395, packages: 512, contact: 838, dangel: 585, trepied: 657, shamanicca: 729 },
  es: { home: 149, projects: 155, about: 242, services: 401, packages: 516, contact: 848, dangel: 591, trepied: 665, shamanicca: 739 },
} as const;
type Block = keyof (typeof BLOCKS)['en'];

const lines = (locale: Locale) => readFileSync(resolve(process.cwd(), 'docs/content', FILES[locale]), 'utf8').split('\n');
const value = (line: string) => line.replace(/^\*\*[^*]+\*\*\s?/, '').trim().replace(/\\([$&|*_])/g, '$1');
function exported(locale: Locale, block: Block) {
  const all = lines(locale);
  const n = BLOCKS[locale][block];
  expect(all[n - 1], `${locale} ${block} heading`).toMatch(/SEO/);
  return { title: value(all[n + 1]), description: value(all[n + 3]) };
}
function expectMeta(meta: Metadata, expected: { title: string; description: string }) {
  expect(meta.title).toBe(expected.title);
  expect(meta.description).toBe(expected.description);
  expect(meta.openGraph).toMatchObject({ title: expected.title, description: expected.description, siteName: 'Magneto Web Consulting' });
  expect(meta.twitter).toMatchObject({ card: 'summary_large_image', title: expected.title, description: expected.description });
}
const params = (locale: Locale) => ({ params: Promise.resolve({ locale }) });
const LOCALES = ['en', 'fr', 'es'] as const;

describe('page generateMetadata (EN/FR/ES)', () => {
  const routes = [
    ['home', homeMeta], ['about', aboutMeta], ['services', servicesMeta], ['packages', packagesMeta],
    ['contact', contactMeta], ['projects', projectsMeta],
  ] as const;
  for (const locale of LOCALES) {
    it.each(routes)(`${locale} %s = the export's SEO block`, async (block, generate) => {
      expectMeta(await generate(params(locale)), exported(locale, block));
    });
  }

  it.each(LOCALES)('%s fallbackDescription = the Home meta description (EN 186 / FR 147 / ES 153)', (locale) => {
    expect(getDictionary(locale).meta.site.fallbackDescription).toBe(exported(locale, 'home').description);
  });

  it('an unknown locale segment falls back to EN', async () => {
    expectMeta(await servicesMeta({ params: Promise.resolve({ locale: 'de' }) }), exported('en', 'services'));
  });
});

describe('case-study generateMetadata', () => {
  const slugs = Object.entries(CASE_STUDY_KEYS) as [string, Block][];
  for (const locale of LOCALES) {
    it.each(slugs)(`${locale} %s → %s case copy`, async (slug, block) => {
      vi.mocked(getProjectBySlug).mockResolvedValueOnce({ title: 'Some title' } as never);
      expectMeta(await caseMeta({ params: Promise.resolve({ locale, slug }) }), exported(locale, block));
      expect(getProjectBySlug).toHaveBeenLastCalledWith(slug, locale);
    });
  }

  it('Dangel keeps its existing slug (Q9)', () => {
    expect(CASE_STUDY_KEYS['fashion-company-ecommerce']).toBe('dangel');
  });

  it('missing translation → the not-found title, no case copy', async () => {
    vi.mocked(getProjectBySlug).mockResolvedValueOnce(null as never);
    const meta = await caseMeta({ params: Promise.resolve({ locale: 'fr', slug: 'trepied-trepied-ca' }) });
    expect(meta.title).toBe(getDictionary('fr').projectNotFound.metaTitle);
    expect(meta.description).toBeUndefined();
  });

  it('unknown case → generic title + fallback description', async () => {
    vi.mocked(getProjectBySlug).mockResolvedValueOnce({ title: 'New Case' } as never);
    const meta = await caseMeta({ params: Promise.resolve({ locale: 'en', slug: 'new-case' }) });
    expectMeta(meta, { title: 'New Case | Magneto Projects', description: exported('en', 'home').description });
  });

  it('ignores inherited object keys as slugs', () => {
    expect(caseStudyMeta(getDictionary('en'), 'constructor', 'X').title).toBe('X | Magneto Projects');
  });
});

describe('pageMetadata', () => {
  it('repeats the shared site defaults the page objects replace', () => {
    const meta = pageMetadata({ title: 'T', description: 'D' });
    expect(meta.openGraph).toMatchObject({ type: 'website', images: [expect.objectContaining({ url: expect.any(String) })] });
    expect(meta.twitter).toMatchObject({ images: [expect.objectContaining({ url: expect.any(String) })] });
  });
});
