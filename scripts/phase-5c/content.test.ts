import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import EN from './content/en.json';

// Verbatim check of the loader transcription (phase-5c-loader.md rev 2, ACs) against the approved export.
type Row = Record<string, string>;
interface Field { key: string; label: string; src: string; value: string | Row[]; subfields?: Record<string, string> }
interface Post { type: string; slug: string; lang: string; fields: Field[] }
const posts = EN.posts as Post[];

const source = readFileSync(EN.source.file);
const sourceLines = source.toString('utf8').split('\n');
// Markdown markers the transcription removes or converts: bold, escaped dollar, list bullets, h4 markers.
const normalize = (line: string) => line.replace(/\\\$/g, '$').replace(/\*\*/g, '').replace(/^- /, '').replace(/^#{1,4} /, '');

/** "EN 290-312, 313-340" | "EN 450 + 452" | "EN 27 (note)" → normalized text of those 1-based lines. */
function sourceText(src: string): string {
  const refs = src.replace(/\(.*?\)/g, '').replace(/^EN /, '').split(/[,+]/).map((s) => s.trim()).filter(Boolean);
  expect(refs.length, `src "${src}"`).toBeGreaterThan(0);
  return refs.map((ref) => {
    const [a, b = a] = ref.split('-').map(Number);
    expect(Number.isInteger(a) && Number.isInteger(b) && a <= b, `src range "${ref}"`).toBe(true);
    return sourceLines.slice(a - 1, b).map(normalize).join('\n');
  }).join('\n');
}

/** Visible text pieces of a value: one per block element for HTML, one per paragraph for text. */
function pieces(value: string): string[] {
  if (!/<[a-z]/i.test(value)) return value.split('\n\n');
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return [...doc.body.querySelectorAll('p, li, h3')].map((el) => el.textContent ?? '');
}

// Structural values (not copy): checked by the allowlists below instead of verbatim.
const STRUCTURAL = /_(cta_path|anchor_id|service_group)$/;
const SERVICE_PATHS = ['/packages#build', '/packages#fix', '/packages#care'];
const field = (slug: string, label: string) => {
  const f = posts.find((p) => p.slug === slug)?.fields.find((x) => x.label === label);
  if (!f) throw new Error(`${slug} ${label} missing`);
  return f;
};

describe('scripts/phase-5c/content/en.json', () => {
  it('is pinned to the current export (docs/content @ 01ff73f)', () => {
    expect(EN.source.file).toBe('docs/content/magneto-copy-en.md');
    expect(createHash('sha256').update(source).digest('hex')).toBe(EN.source.sha256);
    expect(EN.source.sha256).toBe('870b8573013427b3ba57afc3301d864f30c9ee32fb89363eeb243c265daee16d');
  });

  it('every copy value appears verbatim (tags stripped, entities decoded) in the source lines named by src', () => {
    let checked = 0;
    for (const post of posts) {
      for (const f of post.fields) {
        const values: { text: string; src: string; what: string }[] = [];
        if (Array.isArray(f.value)) {
          f.value.forEach((row, i) => Object.entries(row).forEach(([key, v]) => {
            if (!STRUCTURAL.test(key) && v !== '') values.push({ text: v, src: f.src, what: `${post.slug} ${f.label}[${i}].${f.subfields?.[key]}` });
          }));
        } else if (!STRUCTURAL.test(f.key) && f.key !== 'field_p5_herocontent_hero_cta_path') {
          values.push({ text: f.value, src: f.src, what: `${post.slug} ${f.label}` });
        }
        for (const v of values) {
          const haystack = sourceText(v.src);
          for (const piece of pieces(v.text)) {
            expect(piece.trim(), v.what).not.toBe('');
            expect(haystack, `${v.what}: "${piece}"`).toContain(piece);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(80);
  });

  it('writes only the posts and fields of the loader scope (5b §5.4 override)', () => {
    expect(posts.map((p) => `${p.type}/${p.slug}/${p.lang}`)).toEqual(
      ['page/services/en', 'page/packages/en', 'page/home/en', 'page/about-magneto/en', 'page/projects/en', 'page/contact/en']);
    const keys = posts.flatMap((p) => p.fields.map((f) => f.key));
    expect(keys).not.toContain('field_689a2e2960322'); // cta_link_hero is never written
    // Main CTA label on services/home/about-magneto/projects; Packages keeps its own label + /contact; Contact no CTA.
    for (const slug of ['services', 'home', 'about-magneto', 'projects']) {
      expect(field(slug, 'heroContent.ctaTextHero').value).toBe('Book a Free Strategy Call');
    }
    expect(field('packages', 'heroContent.ctaTextHero').value).toBe('Tell me about your project');
    expect(field('packages', 'heroContent.ctaPath').value).toBe('/contact');
    expect(posts.filter((p) => p.slug !== 'packages').flatMap((p) => p.fields.map((f) => f.label))).not.toContain('heroContent.ctaPath');
    expect(posts.find((p) => p.slug === 'contact')?.fields.map((f) => f.label)).toEqual(['heroContent.heroTitle', 'heroContent.subtitleHero']);
    expect(field('packages', 'heroContent.subtitleHero').value).toMatch(/^[^\n]+\n\n[^\n]+$/);
  });

  it('Services: 3 core rows with build/fix/care anchors and allowlisted CTAs, 4 supporting rows without CTA or anchor', () => {
    const f = field('services', 'servicesServiceDetails.services');
    const rows = f.value as Row[];
    const by = (name: string) => Object.keys(f.subfields ?? {}).find((k) => f.subfields?.[k].replace('[]', '') === name) as string;
    expect(rows.map((r) => r[by('serviceGroup')])).toEqual(['core', 'core', 'core', 'supporting', 'supporting', 'supporting', 'supporting']);
    expect(rows.slice(0, 3).map((r) => r[by('anchorId')])).toEqual(['build', 'fix', 'care']);
    rows.slice(0, 3).forEach((r) => {
      expect(SERVICE_PATHS).toContain(r[by('ctaPath')]);
      expect(r[by('ctaText')]).not.toBe('');
    });
    rows.slice(3).forEach((r) => expect([r[by('ctaText')], r[by('ctaPath')], r[by('anchorId')]]).toEqual(['', '', '']));
  });

  it('Packages: 3 cards build/fix/care → /contact, 2 content sections, no legacy fields written', () => {
    const f = field('packages', 'packagesPackageFeatures.packagesElements');
    const rows = f.value as Row[];
    const by = (name: string) => Object.keys(f.subfields ?? {}).find((k) => f.subfields?.[k] === name) as string;
    expect(rows.map((r) => r[by('anchorId')])).toEqual(['build', 'fix', 'care']);
    expect(rows.every((r) => r[by('ctaPath')] === '/contact' && r[by('ctaText')] !== '')).toBe(true);
    expect(Object.values(f.subfields ?? {}).sort()).toEqual(['anchorId', 'ctaPath', 'ctaText', 'descriptionHtml', 'heading', 'name']);
    const sections = field('packages', 'packagesContentSections.sections').value as Row[];
    expect(sections).toHaveLength(2);
    expect(JSON.stringify(sections)).toContain('C$450');
  });
});
