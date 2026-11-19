import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import EN from './content/en.json';
import FR from './content/fr.json';
import ES from './content/es.json';

// Verbatim + structure checks of the loader transcription (phase-5c-loader.md rev 3.1, AC-1) against the approved export.
type Row = Record<string, string>;
type Group = Record<string, string | Row[]>;
interface Field { key: string; label: string; src: string; value: string | Row[] | Group; subfields?: Record<string, string> }
interface Post { type: string; slug: string; lang: string; fields: Field[] }
interface Content { source: { file: string; commit: string; sha256: string }; posts: Post[] }
type Lang = 'en' | 'fr' | 'es';

const CONTENT: Record<Lang, Content> = { en: EN as Content, fr: FR as Content, es: ES as Content };
// Notion "Export → Markdown & CSV" of 2026-11-17 (5c-rest D-15). The export and this re-pin land in one commit, so the
// label names the export, not a commit hash; the sha256 is the pin.
const EXPORT_LABEL = 'export 2026-11-17';
const PINS: Record<Lang, { file: string; sha256: string }> = {
  en: { file: 'docs/content/magneto-copy-en.md', sha256: '364f661f14a1913d6f653467d0d0843d98e15ad04d954d818ff67aa0377606f5' },
  fr: { file: 'docs/content/magneto-copy-fr-CA.md', sha256: 'b79f5ff7268d0c7d69ff4c15de35dc51d4b5f1c92e22a6a74d2b490c2d5a516b' },
  es: { file: 'docs/content/magneto-copy-es.md', sha256: '737b0084acce6ad603a2f3108944022485cb5670f22597ed08a45484ba24bdb6' },
};
const MAIN_CTA: Record<Lang, string> = {
  en: 'Book a Free Strategy Call',
  fr: 'Réserver un appel-conseil gratuit',
  es: 'Reservar consulta gratis',
};
const PACKAGES_CTA: Record<Lang, string> = { en: 'Tell me about your project', fr: 'Parlez-moi de votre projet', es: 'Cuéntame sobre tu proyecto' };
const LANGS: Lang[] = ['en', 'fr', 'es'];

const sources = Object.fromEntries(LANGS.map((l) => [l, readFileSync(CONTENT[l].source.file)])) as Record<Lang, Buffer>;
const sourceLines = Object.fromEntries(LANGS.map((l) => [l, sources[l].toString('utf8').split('\n')])) as Record<Lang, string[]>;
// Markdown markers the transcription removes: bold, list bullets, heading markers, links. The Notion export escapes
// nothing (D-15: "C$3,500", "[email]"), so the source text matches the CMS values without an unescape step.
const normalize = (line: string) =>
  line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').replace(/^- /, '').replace(/^#{1,4} /, '');

/** "FR 290-312, 313-340" | "EN 450 + 452" | "ES 27 (note)" → normalized text of those 1-based lines. */
function sourceText(lang: Lang, src: string): string {
  const refs = src.replace(/\(.*?\)/g, '').replace(/^(EN|FR|ES) /, '').split(/[,+]/).map((s) => s.trim()).filter(Boolean);
  expect(src.startsWith(`${lang.toUpperCase()} `), `src "${src}" names the ${lang} export`).toBe(true);
  expect(refs.length, `src "${src}"`).toBeGreaterThan(0);
  return refs.map((ref) => {
    const [a, b = a] = ref.split('-').map(Number);
    expect(Number.isInteger(a) && Number.isInteger(b) && a <= b, `src range "${ref}"`).toBe(true);
    return sourceLines[lang].slice(a - 1, b).map(normalize).join('\n');
  }).join('\n');
}

/** Visible text pieces of a value: one per block element for HTML, one per paragraph for text. */
function pieces(value: string): string[] {
  if (!/<[a-z]/i.test(value)) return value.split('\n\n');
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return [...doc.body.querySelectorAll('p, li, h3')].map((el) => el.textContent ?? '');
}

// Structural values (not copy): checked by the allowlists below instead of verbatim. Home service anchor_link has a
// hashed key (field_689a5402d1bcd), so it is listed by key.
const STRUCTURAL = /_(cta_path|anchor_id|service_group)$/;
const STRUCTURAL_KEYS = new Set(['field_p5_herocontent_hero_cta_path', 'field_689a5402d1bcd']);
const isStructural = (key: string) => STRUCTURAL.test(key) || STRUCTURAL_KEYS.has(key);
const SERVICE_PATHS = ['/packages#build', '/packages#fix', '/packages#care'];

/** Every copy value of a post list as { text, src, what } (repeater rows and group sub-fields included). */
function copyValues(posts: Post[]) {
  const out: { text: string; src: string; what: string }[] = [];
  const add = (key: string, v: string, src: string, what: string) => {
    if (!isStructural(key) && v !== '') out.push({ text: v, src, what });
  };
  const rows = (f: Field, list: Row[], what: string) =>
    list.forEach((row, i) => Object.entries(row).forEach(([k, v]) => add(k, v, f.src, `${what}[${i}].${f.subfields?.[k] ?? k}`)));
  for (const post of posts) {
    for (const f of post.fields) {
      const what = `${post.slug} ${f.label}`;
      if (Array.isArray(f.value)) rows(f, f.value, what);
      else if (typeof f.value === 'object') {
        Object.entries(f.value).forEach(([k, v]) => (Array.isArray(v) ? rows(f, v, `${what}.${f.subfields?.[k]}`) : add(k, v, f.src, `${what}.${f.subfields?.[k]}`)));
      } else add(f.key, f.value, f.src, what);
    }
  }
  return out;
}

/** Pieces not found verbatim in their source lines (a final-CTA subtitle joins paragraphs with one space, rev 3.1 §2). */
function missingPieces(lang: Lang, posts: Post[]): string[] {
  const missing: string[] = [];
  for (const v of copyValues(posts)) {
    const haystack = sourceText(lang, v.src);
    const flat = haystack.replace(/\n+/g, ' ');
    for (const piece of pieces(v.text)) {
      if (piece.trim() === '' || !(haystack.includes(piece) || flat.includes(piece))) missing.push(`${v.what}: "${piece}"`);
    }
  }
  return missing;
}

/** Fields of one post, merging entries that share type + slug (en.json appends D-2 entries for existing posts). */
function fieldsOf(lang: Lang, type: string, slug: string): Field[] {
  return CONTENT[lang].posts.filter((p) => p.type === type && p.slug === slug).flatMap((p) => p.fields);
}
const field = (lang: Lang, slug: string, label: string) => {
  const f = CONTENT[lang].posts.find((p) => p.slug === slug && p.fields.some((x) => x.label === label))?.fields.find((x) => x.label === label);
  if (!f) throw new Error(`${lang} ${slug} ${label} missing`);
  return f;
};

/** Structural fingerprint of a field: row counts, row sub-key sets and structural values (anchors, paths). */
function shape(f: Field): unknown {
  const rows = (list: Row[]) => list.map((r) => Object.keys(r).sort().map((k) => (isStructural(k) ? `${k}=${r[k]}` : k)));
  if (Array.isArray(f.value)) return rows(f.value);
  if (typeof f.value === 'object') {
    return Object.fromEntries(Object.entries(f.value).sort().map(([k, v]) => [k, Array.isArray(v) ? rows(v) : 'scalar']));
  }
  return isStructural(f.key) ? `${f.key}=${f.value}` : f.key;
}

describe.each(LANGS)('scripts/phase-5c/content/%s.json', (lang) => {
  const content = CONTENT[lang];

  it(`is pinned to its own export (docs/content, ${EXPORT_LABEL}) and every post has that language`, () => {
    expect(content.source.file).toBe(PINS[lang].file);
    expect(content.source.commit).toBe(EXPORT_LABEL);
    expect(createHash('sha256').update(sources[lang]).digest('hex')).toBe(content.source.sha256);
    expect(content.source.sha256).toBe(PINS[lang].sha256);
    expect(new Set(content.posts.map((p) => p.lang))).toEqual(new Set([lang]));
  });

  it('every copy value appears verbatim (tags stripped, entities decoded) in the source lines named by src', () => {
    expect(missingPieces(lang, content.posts)).toEqual([]);
    // 5c-rest: EN 160 / FR 160 / ES 159 (ES Dangel testimonial has no public note; the original is Spanish).
    expect(copyValues(content.posts).length).toBeGreaterThan(155);
  });

  it('a one-word mutation of a copy value fails the verbatim check', () => {
    const posts = structuredClone(content.posts);
    const hero = posts[0].fields.find((f) => f.label === 'heroContent.subtitleHero') as Field;
    hero.value = (hero.value as string).replace(/\s(\S+)\s/, ' mutated ');
    expect(missingPieces(lang, posts)).toHaveLength(1);
  });

  it('contains no image, url or true_false key, no cta_link_hero and no display_order (rev 3.1 §2)', () => {
    const types = new Map<string, string>();
    const index = (fs: { key: string; type: string; sub_fields?: unknown[] }[]) => fs.forEach((f) => {
      types.set(f.key, f.type);
      if (f.sub_fields) index(f.sub_fields as typeof fs);
    });
    const acf = JSON.parse(readFileSync('docs/acf/phase-5-field-groups.json', 'utf8'));
    (Array.isArray(acf) ? acf : acf.field_groups).forEach((g: { fields: never[] }) => index(g.fields));
    const keys = content.posts.flatMap((p) => p.fields.flatMap((f) => {
      const subs = Array.isArray(f.value) ? f.value.flatMap(Object.keys)
        : typeof f.value === 'object' ? Object.entries(f.value).flatMap(([k, v]) => [k, ...(Array.isArray(v) ? v.flatMap(Object.keys) : [])]) : [];
      return [f.key, ...subs];
    }));
    keys.forEach((k) => expect(types.has(k), `${k} exists in the ACF export`).toBe(true));
    expect(keys.filter((k) => ['image', 'url', 'true_false'].includes(types.get(k) ?? ''))).toEqual([]);
    expect(keys).not.toContain('field_689a2e2960322'); // cta_link_hero is never written
    expect(keys).not.toContain('field_p5_projectsprojectdata_display_order'); // copy-synced by the loader
  });

  it('main CTA label on the four heroes; Packages keeps its own label + /contact; Contact has no CTA', () => {
    for (const slug of ['services', 'home', 'about-magneto', 'projects']) {
      expect(field(lang, slug, 'heroContent.ctaTextHero').value).toBe(MAIN_CTA[lang]);
    }
    expect(field(lang, 'packages', 'heroContent.ctaTextHero').value).toBe(PACKAGES_CTA[lang]);
    expect(field(lang, 'packages', 'heroContent.ctaPath').value).toBe('/contact');
    expect(content.posts.filter((p) => p.slug !== 'packages').flatMap((p) => p.fields.map((f) => f.label))).not.toContain('heroContent.ctaPath');
    expect(fieldsOf(lang, 'page', 'contact').map((f) => f.label)).toEqual(['heroContent.heroTitle', 'heroContent.subtitleHero']);
    expect(field(lang, 'packages', 'heroContent.subtitleHero').value).toMatch(/^[^\n]+\n\n[^\n]+$/);
  });

  it('Services: 3 core rows with build/fix/care anchors and allowlisted CTAs, 4 supporting rows without CTA or anchor', () => {
    const f = field(lang, 'services', 'servicesServiceDetails.services');
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
    const f = field(lang, 'packages', 'packagesPackageFeatures.packagesElements');
    const rows = f.value as Row[];
    const by = (name: string) => Object.keys(f.subfields ?? {}).find((k) => f.subfields?.[k] === name) as string;
    expect(rows.map((r) => r[by('anchorId')])).toEqual(['build', 'fix', 'care']);
    expect(rows.every((r) => r[by('ctaPath')] === '/contact' && r[by('ctaText')] !== '')).toBe(true);
    expect(Object.values(f.subfields ?? {}).sort()).toEqual(['anchorId', 'ctaPath', 'ctaText', 'descriptionHtml', 'heading', 'name']);
    const sections = field(lang, 'packages', 'packagesContentSections.sections').value as Row[];
    expect(sections).toHaveLength(2);
    expect(JSON.stringify(sections)).toContain('450');
  });
});

describe('content files across languages (rev 3.1 AC-1, 5c-rest §4)', () => {
  const list = (lang: Lang) => CONTENT[lang].posts.map((p) => `${p.type}/${p.slug}/${p.lang}`);
  const posts9 = (lang: Lang) => ['page/services', 'page/packages', 'page/home', 'page/about-magneto', 'page/projects', 'page/contact',
    'project/fashion-company-ecommerce', 'project/shamaniccas-ecommerce', 'project/trepied-trepied-ca'].map((p) => `${p}/${lang}`);

  it('post lists: EN = rev 2’s 6 + the 5c D-2 entries + the 5c-rest same-slug entries in order; FR and ES = 9 posts each', () => {
    expect(list('en')).toEqual(['page/services/en', 'page/packages/en', 'page/home/en', 'page/about-magneto/en', 'page/projects/en', 'page/contact/en',
      'page/about-magneto/en', 'project/fashion-company-ecommerce/en', 'project/shamaniccas-ecommerce/en',
      'page/home/en', 'page/services/en', 'page/packages/en', 'page/about-magneto/en',
      'project/fashion-company-ecommerce/en', 'project/shamaniccas-ecommerce/en', 'project/trepied-trepied-ca/en']);
    expect(list('fr')).toEqual(posts9('fr'));
    expect(list('es')).toEqual(posts9('es'));
  });

  it('EN same-slug entries set no key twice, and every post has the same key set in EN, FR and ES (D-2)', () => {
    for (const p of CONTENT.fr.posts) {
      const en = fieldsOf('en', p.type, p.slug).map((f) => f.key);
      expect(new Set(en).size, `${p.slug}: duplicate key across EN entries`).toBe(en.length);
      for (const lang of ['fr', 'es'] as const) {
        const other = fieldsOf(lang, p.type, p.slug).map((f) => f.key);
        expect(new Set(other).size, `${lang} ${p.slug}: duplicate key`).toBe(other.length);
        expect([...other].sort(), `${lang} ${p.slug}: key set = EN`).toEqual([...en].sort());
      }
    }
  });

  it('FR and ES have identical fields, row counts, sub-key sets, anchors and paths', () => {
    for (const p of CONTENT.fr.posts) {
      const fr = fieldsOf('fr', p.type, p.slug);
      const es = fieldsOf('es', p.type, p.slug);
      expect(es.map((f) => f.key), p.slug).toEqual(fr.map((f) => f.key));
      expect(es.map(shape), p.slug).toEqual(fr.map(shape));
    }
  });

  it('every EN field has the same shape in FR/ES (rows, sub-keys, anchors, paths)', () => {
    for (const p of CONTENT.fr.posts) {
      for (const f of fieldsOf('en', p.type, p.slug)) {
        for (const lang of ['fr', 'es'] as const) {
          const other = fieldsOf(lang, p.type, p.slug).find((x) => x.key === f.key);
          expect(other, `${lang} ${p.slug} ${f.label}`).toBeDefined();
          expect(shape(other as Field), `${lang} ${p.slug} ${f.label}`).toEqual(shape(f));
        }
      }
    }
  });
});
