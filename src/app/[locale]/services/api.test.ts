import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import { mapServicesPage, getServicesPageData, SERVICES_PAGE_QUERY } from './api';
import C from '../../../../scripts/phase-5c/fixtures/state-c.json';
import EN from '../../../../scripts/phase-5c/content/en.json';

// State N = state C (local CMS snapshot) + the loader transcription (en.json), repeaters merged by index like
// load-content.php. en.json is the single transcription of the copy (5b §7); heroContent is not part of this query.
type Obj = Record<string, unknown>;
function stateN<T>(base: T, slug: string): T {
  const node = structuredClone(base) as Obj;
  const post = EN.posts.find((p) => p.slug === slug);
  if (!post) throw new Error(`en.json has no ${slug}`);
  for (const f of post.fields as { label: string; value: unknown; subfields?: Record<string, string> }[]) {
    if (f.label.startsWith('heroContent.')) continue;
    const path = f.label.split('.');
    let target = node;
    for (const key of path.slice(0, -1)) target = (target[key] ??= {}) as Obj;
    const last = path[path.length - 1];
    if (!Array.isArray(f.value)) { target[last] = f.value; continue; }
    const old = (target[last] ?? []) as Obj[];
    target[last] = (f.value as Record<string, string>[]).map((row, i) => {
      const merged: Obj = { ...(old[i] ?? {}) };
      for (const [subKey, value] of Object.entries(row)) {
        const name = f.subfields?.[subKey] ?? subKey;
        if (name.endsWith('[]')) merged[name.slice(0, -2)] = value ? [value] : null;
        else merged[name] = value === '' ? null : value;
      }
      return merged;
    });
  }
  return node as T;
}
const N = { services: stateN(C.services, 'services') };

vi.mock('@/utils/wp-graphql', () => ({ fetchWPGraphQL: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

describe('Services C/N/M contracts', () => {
  it('C preserves all legacy titles, descriptions, order, media and featured flags', () => {
    const data = mapServicesPage(C.services);
    expect(data.services.map(s => s.title)).toEqual(C.services.servicesServiceDetails.services.map(s => s.title));
    expect(data.services.map(s => s.body)).toEqual(C.services.servicesServiceDetails.services.map(s => ({ kind: 'text', text: s.description })));
    expect(data.services.every(s => s.group === 'unclassified' && s.cta === null && s.anchorId === null)).toBe(true);
    expect(data.services[0].image?.src).toBe(C.services.servicesServiceDetails.services[0].image.node.sourceUrl);
    expect(data.services[0].featured).toBe(true);
    expect(data.issues).toEqual([]);
  });
  it('N maps three core and four supporting rows and approved links', () => {
    const data = mapServicesPage(N.services);
    expect(data.services.map(s => s.group)).toEqual(['core','core','core','supporting','supporting','supporting','supporting']);
    expect(data.services.slice(0,3).map(s => s.anchorId)).toEqual(['build','fix','care']);
    expect(data.services.slice(0,3).map(s => s.cta?.path)).toEqual(['/packages#build','/packages#fix','/packages#care']);
    expect(data.services.slice(3).every(s => s.cta === null)).toBe(true);
    expect(data.services.every(s => s.body?.kind === 'html' && !s.featured)).toBe(true);
    expect(data.issues).toEqual([]);
  });
  it('M sanitizes executable HTML and prevents injected IDs from colliding with anchors', () => {
    const data = mapServicesPage({ servicesServiceDetails: { services: [{ title:'Mixed', description:'old', descriptionHtml:'<p id="build" onclick="alert(1)">New <strong>body</strong><script>bad()</script></p><a href="javascript:alert(1)">link</a>', anchorId:'build' }] } });
    expect(data.services[0].body).toEqual({ kind:'html',html:'<p>New <strong>body</strong></p><a>link</a>' });
  });
  it.each([null, '', '  ', '<p><br></p>', '<p>&nbsp;\u200b</p>', '<script>alert(1)</script>'])('M editor-empty %s falls back to escaped legacy text', html => {
    expect(mapServicesPage({ servicesServiceDetails:{services:[{descriptionHtml:html,description:'<b>legacy text</b>'}]} }).services[0].body).toEqual({kind:'text',text:'<b>legacy text</b>'});
  });
  it('M keeps unknown groups, first list entry, duplicate/invalid anchors and incomplete CTAs explicit', () => {
    const data = mapServicesPage({ servicesServiceDetails:{services:[null,
      {title:'One', serviceGroup:['core','supporting'],anchorId:'build',ctaText:'Go',ctaPath:'/packages#build'},
      {title:'Two', serviceGroup:['unknown'],anchorId:'build',ctaText:'Go',ctaPath:'//evil.test'},
      {title:'Three', serviceGroup:[],anchorId:'bad id',ctaText:'Go'},
      {title:'Four', serviceGroup:['supporting'],ctaText:'Go',ctaPath:'/packages#care'},
    ]} });
    expect(data.services.map(s=>s.group)).toEqual(['core','unclassified','unclassified','supporting']);
    expect(data.services.map(s=>s.anchorId)).toEqual(['build',null,null,null]);
    expect(data.services.slice(1).every(s=>s.cta===null)).toBe(true);
    expect(data.issues.length).toBeGreaterThan(0);
  });
  it.each(['/contact','https://example.com','javascript:alert(1)','/fr/packages#build','/packages#build\n','/packages#other'])('M rejects unexpected target %s', path => {
    expect(mapServicesPage({servicesServiceDetails:{services:[{ctaText:'Go',ctaPath:path}]}}).services[0].cta).toBeNull();
  });
  it.each([null, '', '<p><br></p>', '<p>&nbsp;</p>'])('M editor-empty intro body %s → no intro body, legacy intro heading kept', html => {
    const data = mapServicesPage({ pageintrotext: { pageIntroText: 'Legacy heading', introBodyHtml: html } });
    expect(data.introTitle).toBe('Legacy heading');
    expect(data.introBody).toBeNull();
  });
  it('M strips <script> and onerror from every new Services HTML field (intro + service body)', () => {
    const bad = '<p>Safe<img src="x" onerror="alert(1)"><script>alert(2)</script></p>';
    const data = mapServicesPage({ pageintrotext: { introBodyHtml: bad }, servicesServiceDetails: { services: [{ descriptionHtml: bad }] } });
    for (const body of [data.introBody, data.services[0].body]) {
      expect(body?.kind).toBe('html');
      const html = body?.kind === 'html' ? body.html : '';
      expect(html).toContain('Safe');
      expect(html).not.toMatch(/script|onerror|alert/i);
    }
  });
  it('M keeps translated alt text and EN original media', () => {
    const data=mapServicesPage({servicesServiceDetails:{services:[{image:{node:{sourceUrl:'fr.jpg',altText:'Image française',languageCode:'fr',translations:[{languageCode:'en',sourceUrl:'en.jpg'}]}}}]}});
    expect(data.services[0].image).toEqual({src:'en.jpg',alt:'Image française'});
  });
  it('M null containers/repeaters produce no rows', () => {
    expect(mapServicesPage({}).services).toEqual([]);
    expect(mapServicesPage({servicesServiceDetails:{services:null}}).services).toEqual([]);
  });
  it('uses the locale-filtered connection and verified fields only', async () => {
    vi.mocked(fetchWPGraphQL).mockResolvedValue({pages:{nodes:[N.services]}});
    await getServicesPageData('fr');
    expect(fetchWPGraphQL).toHaveBeenCalledWith(SERVICES_PAGE_QUERY,{language:'fr',mediaOriginal:true});
    expect(SERVICES_PAGE_QUERY).toContain('name: "services"');
    expect(SERVICES_PAGE_QUERY).toContain('introBodyHtml');
    expect(SERVICES_PAGE_QUERY).not.toContain('heroContent');
  });
  it('missing translation returns null while a transport error propagates',async()=>{
    vi.mocked(fetchWPGraphQL).mockResolvedValue({pages:{nodes:[]}});
    expect(await getServicesPageData('es')).toBeNull();
    vi.mocked(fetchWPGraphQL).mockRejectedValue(new Error('CMS unavailable'));
    await expect(getServicesPageData('en')).rejects.toThrow('CMS unavailable');
  });
});
