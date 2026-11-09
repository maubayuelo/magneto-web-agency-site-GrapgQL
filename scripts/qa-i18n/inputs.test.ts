// Input adapters (spec §2, §6.1). Temporary inputs live in the OS temp dir; nothing is written in the repo.
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { checkUnit } from './checks.ts';
import { ConfigError, GlossarySchema, REPO_INPUTS, TOOL_DIR, contentJsonAdapter, dictionaryAdapter, exportAdapter, flatten, readJsonConfig, sliceSection } from './inputs.ts';
import type { Lang } from './schema.ts';

beforeEach(() => {
  delete process.env.MAGNETO_QA_ANTHROPIC_API_KEY;
});

const glossary = readJsonConfig(path.join(TOOL_DIR, 'config/glossary.json'), GlossarySchema);
const ctx = { glossary, ctaLabels: {}, langs: ['fr', 'es'] as ('fr' | 'es')[] };

function tmpFiles(ext: string, contents: Record<Lang, string>): Record<Lang, string> {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'qa-i18n-test-'));
  return Object.fromEntries((['en', 'fr', 'es'] as Lang[]).map((l) => {
    const file = path.join(dir, `${l}${ext}`);
    writeFileSync(file, contents[l]);
    return [l, file];
  })) as Record<Lang, string>;
}

const SUB = { k_title: 'title', k_path: 'ctaPath', k_group: 'serviceGroup[]' };
const rows = (titles: string[]) => titles.map((t) => ({ k_title: t, field_x_cta_path: '/p', field_x_service_group: 'core' }));
const post = (slug: string, fields: unknown[]) => ({ type: 'page', slug, lang: 'x', fields });
const repeater = (titles: string[]) => ({ key: 'field_rep', label: 'svc.services', src: '', value: rows(titles), subfields: { ...SUB, field_x_cta_path: 'ctaPath', field_x_service_group: 'serviceGroup[]' } });

describe('content-json adapter', () => {
  it('aligns rows by index: a missing row → missing, an extra row → a unit without EN', async () => {
    const files = tmpFiles('.json', {
      en: JSON.stringify({ posts: [post('services', [repeater(['A', 'B'])])] }),
      fr: JSON.stringify({ posts: [post('services', [repeater(['A-fr'])])] }),
      es: JSON.stringify({ posts: [post('services', [repeater(['A-es', 'B-es', 'C-es'])])] }),
    });
    const { units } = await contentJsonAdapter(files).load();
    const b = units.find((u) => u.id === 'content:services/svc.services[1].title');
    expect(b?.values).toEqual({ en: 'B', es: 'B-es' });
    expect(checkUnit(b!, ctx).map((f) => `${f.check}:${f.lang}`)).toEqual(['missing:fr']);
    const extra = units.find((u) => u.id === 'content:services/svc.services[2].title');
    expect(extra?.values).toEqual({ es: 'C-es' });
    expect(checkUnit(extra!, ctx)).toEqual([]); // meaning checks run EN → target only
    expect(units.find((u) => u.id === 'content:services/svc.services[0].ctaPath')?.kind).toBe('structural');
    expect(units.find((u) => u.id === 'content:services/svc.services[0].serviceGroup')?.kind).toBe('structural');
  });

  it('merges EN entries that share a slug (about-magneto twice), as the loader does', async () => {
    const f = (key: string, label: string, value: string) => ({ key, label, src: '', value });
    const files = tmpFiles('.json', {
      en: JSON.stringify({ posts: [post('about-magneto', [f('k1', 'hero.title', 'About')]), post('about-magneto', [f('k2', 'about.ctaText', 'Book')])] }),
      fr: JSON.stringify({ posts: [post('about-magneto', [f('k1', 'hero.title', 'À propos'), f('k2', 'about.ctaText', 'Réserver')])] }),
      es: JSON.stringify({ posts: [post('about-magneto', [f('k1', 'hero.title', 'Sobre'), f('k2', 'about.ctaText', 'Reservar')])] }),
    });
    const { units } = await contentJsonAdapter(files).load();
    expect(units.map((u) => u.id)).toEqual(['content:about-magneto/hero.title', 'content:about-magneto/about.ctaText']);
    expect(units.map((u) => u.kind)).toEqual(['text', 'label']);
    expect(units.every((u) => checkUnit(u, ctx).length === 0)).toBe(true);
  });

  it('reads the repo content files: every EN unit is aligned, no unit is missing in FR/ES', async () => {
    const { units, pins } = await contentJsonAdapter(REPO_INPUTS.content).load();
    expect(units.length).toBeGreaterThan(150);
    expect(pins.map((p) => p.lang)).toEqual(['en', 'fr', 'es']);
    const missing = units.flatMap((u) => checkUnit(u, ctx)).filter((f) => f.check === 'missing');
    expect(missing).toEqual([]);
  });
});

describe('dictionary adapter', () => {
  it('flattens nested keys', () => {
    expect(flatten({ a: { b: 'x', c: { d: 'y' } }, e: 'z' })).toEqual({ 'a.b': 'x', 'a.c.d': 'y', e: 'z' });
  });

  it('a key in EN only → missing in FR and ES', async () => {
    const modules: Record<Lang, Record<string, unknown>> = {
      en: { en: { common: { close: 'Close', onlyEn: 'Only EN' } } },
      fr: { fr: { common: { close: 'Fermer' } } },
      es: { es: { common: { close: 'Cerrar' } } },
    };
    const files = tmpFiles('.ts', { en: '', fr: '', es: '' });
    const byFile = Object.fromEntries((['en', 'fr', 'es'] as Lang[]).map((l) => [files[l], modules[l]]));
    const { units } = await dictionaryAdapter(files, async (file) => byFile[file]).load();
    const only = units.find((u) => u.id === 'dict:common.onlyEn');
    expect(only?.kind).toBe('label');
    expect(checkUnit(only!, ctx).map((f) => `${f.check}:${f.lang}`)).toEqual(['missing:fr', 'missing:es']);
  });
});

describe('export adapter and section map (§2.3)', () => {
  const md = (h2: string) => ['# Page', '', '## Other', 'x', '', `## ${h2}`, '', 'Body line with [a link](https://a.example).', '- item', '*Editor note: do not publish.*', '### Sub heading', 'sub text', '', '## Next section', 'not included', '# Top'].join('\n');
  const map = (anchors: Record<Lang, string>, coveredBy: 'content-json' | null = null) => {
    const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'qa-i18n-map-')), 'map.json');
    writeFileSync(file, JSON.stringify({ version: 1, reviewed: { by: null, on: null }, sections: [{ id: 'page.s1', anchors, coveredBy }] }));
    return file;
  };
  const files = tmpFiles('.md', { en: md('Section'), fr: md('Rubrique'), es: md('Sección') });
  const anchors = { en: '## Section', fr: '## Rubrique', es: '## Sección' };

  it('a section runs to the next heading of the same level (deeper headings stay inside); editor notes are stripped', async () => {
    const { units } = await exportAdapter(files, map(anchors)).load();
    expect(units).toHaveLength(1);
    const u = units[0];
    expect([u.id, u.source, u.llm, u.location.section]).toEqual(['export:page.s1', 'export', true, 'page.s1']);
    expect(u.values.en).toBe('Section\n\nBody line with [a link](https://a.example).\n- item\n### Sub heading\nsub text');
    expect(u.location.lines?.fr).toEqual([6, 12]);
    expect(u.values.fr).not.toMatch(/Next section|Editor note/);
  });
  it('coveredBy content-json → deterministic only (llm: false)', async () => {
    const { units } = await exportAdapter(files, map(anchors, 'content-json')).load();
    expect(units[0].llm).toBe(false);
  });
  it('an anchor not found, a duplicate anchor or a heading without its level → ConfigError (exit 2)', async () => {
    await expect(exportAdapter(files, map({ ...anchors, es: '## Seccion' })).load()).rejects.toThrow(/found 0 times/);
    const dup = tmpFiles('.md', { en: `${md('Section')}\n## Section\n`, fr: md('Rubrique'), es: md('Sección') });
    await expect(exportAdapter(dup, map(anchors)).load()).rejects.toThrow(/found 2 times/);
    expect(() => sliceSection(['## A'], '### A', 'x')).toThrow(ConfigError);
    expect(() => sliceSection(['## A'], 'A', 'x')).toThrow(/not a Markdown heading/);
  });
  it('the repo section map resolves every anchor exactly once in the three current exports', async () => {
    const { units } = await exportAdapter(REPO_INPUTS.exports!, REPO_INPUTS.exportSections!).load();
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) for (const l of ['en', 'fr', 'es'] as Lang[]) expect(u.values[l]?.length, `${u.id} ${l}`).toBeGreaterThan(0);
  });
});
