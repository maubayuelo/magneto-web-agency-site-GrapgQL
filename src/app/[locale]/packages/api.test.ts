import { describe, it, expect, vi } from 'vitest';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mapPackagesPage, getPackagesPageData, legacyIntroHtml, PACKAGES_QUERY } from './api';
import PackagesPage from './page';
import { HeroLoader } from '@/components/organisms/Hero';
import FinalCTASectionLoader from '@/components/organisms/FinalCTASection/FinalCTASectionLoader';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getDictionary } from '@/i18n/dictionary';
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
const N = { packages: stateN(C.packages, 'packages') };
vi.mock('@/utils/wp-graphql',()=>({fetchWPGraphQL:vi.fn()}));
vi.mock('@/components/organisms/EmailCollectorProvider',()=>({useEmailModal:()=>({openModal:vi.fn()})}));
(globalThis as { React?: typeof React }).React = React; // classic JSX runtime in Vitest (Known debt)

function localizedC<T>(value: T, locale: string): T {
  const walk = (v: unknown, key = ''): unknown => {
    if (typeof v === 'string') return /^(id|sourceUrl|languageCode)$/.test(key) || v.startsWith('http') ? v : `[${locale}] ${v}`;
    if (Array.isArray(v)) return v.map((x) => walk(x, key));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return walk(structuredClone(value)) as T;
}
const enPieces = (): string[] => EN.posts.flatMap((p) => p.fields.flatMap((f) => {
  const values = Array.isArray(f.value) ? f.value.flatMap((row) => Object.values(row as Record<string, string>)) : [f.value as string];
  return values.flatMap((v) => /<[a-z]/i.test(v) ? [...new DOMParser().parseFromString(v, 'text/html').body.querySelectorAll('p,li,h3')].map((el) => el.textContent ?? '') : [v]);
})).filter((v) => v.length >= 12 && !v.startsWith('/'));

// Renders the page's synchronous parts: async server loaders (Hero, final CTA) are tested on their own.
type El = React.ReactElement<{ children?: React.ReactNode }>;
function strip(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) return node.map(strip);
  if (!React.isValidElement(node)) return node;
  const el = node as El;
  if (el.type === HeroLoader || el.type === FinalCTASectionLoader) return null;
  return el.props.children === undefined ? el : React.cloneElement(el, undefined, strip(el.props.children));
}
async function renderPage(locale: 'en' | 'fr' | 'es', node: unknown) {
  vi.mocked(fetchWPGraphQL).mockReset().mockResolvedValueOnce({ pages: { nodes: [node] } });
  const page = (await PackagesPage({ params: Promise.resolve({ locale }) })) as El;
  const html = renderToStaticMarkup(React.createElement(I18nProvider, { locale, dictionary: getDictionary(locale) }, strip(page)));
  return new DOMParser().parseFromString(html, 'text/html').body;
}

describe('Packages C/N/M contracts',()=>{
  it('C preserves the legacy card content and CTA mode',()=>{
    const data=mapPackagesPage(C.packages);
    expect(data.content.packages.map(p=>p.title)).toEqual(['Funnel Launch','Funnel + Website','Growth Stack']);
    expect(data.content.packages[0]).toMatchObject({price:'From $950',currency:'CAD',body:{kind:'text',text:C.packages.packagesPackageFeatures.packagesElements[0].description}});
    expect(data.content.packages.every(p=>p.ctaMode==='legacy')).toBe(true);
    expect(data.content.sections).toEqual([]);
  });
  it('N maps three rich cards, exact prices, two sections and Contact CTAs without legacy contamination',()=>{
    const raw=structuredClone(N.packages);
    const rows=raw.packagesPackageFeatures.packagesElements.map(row=>({...row,price:'WRONG',description:'OLD',features:[{feature:'OLD FEATURE'}],popularChoise:true}));
    const data=mapPackagesPage({...raw,packagesPackageFeatures:{packagesElements:rows}});
    expect(data.content.packages.map(p=>p.anchorId)).toEqual(['build','fix','care']);
    expect(data.content.packages.every(p=>p.ctaMode==='link' && p.cta?.path==='/contact' && p.price==='' && p.currency==='' && p.features.length===0 && p.featuresTitle==='')).toBe(true);
    expect(JSON.stringify(data.content)).not.toMatch(/WRONG|OLD FEATURE/);
    expect(JSON.stringify(data.content)).toContain('C$3,500');
    expect(JSON.stringify(data.content)).toContain('C$450');
    expect(data.content.sections.map(s=>s.heading)).toEqual(['Paid Website Diagnostic','Good to Know Before You Budget']);
  });
  it('M empty HTML falls back and empty section rows are omitted',()=>{
    const data=mapPackagesPage({packagesPackageFeatures:{packagesElements:[null,{name:'Old',description:'Legacy',descriptionHtml:'<p>&nbsp;</p>',features:[null,{feature:'Keep'}]}]},packagesContentSections:{sections:[null,{heading:' ',bodyHtml:'<p><br></p>'},{heading:'Only heading'}]}});
    expect(data.content.packages[0].body).toEqual({kind:'text',text:'Legacy'});
    expect(data.content.packages[0].features).toEqual([{text:'Keep'}]);
    expect(data.content.sections).toEqual([{heading:'Only heading',body:null}]);
  });
  it.each([null,'','//evil.test','javascript:alert(1)','/fr/contact','/contact#bad','/contact\n'])('M rich card with path %s never inherits legacy modal', path=>{
    const data=mapPackagesPage({packagesPackageFeatures:{packagesElements:[{descriptionHtml:'<p>New</p>',ctaText:'Ask',ctaPath:path}]}});
    expect(data.content.packages[0].ctaMode).toBe('none');
    expect(data.issues).toHaveLength(1);
  });
  it('M missing CTA text, duplicate anchors, unsafe sections and null containers',()=>{
    const data=mapPackagesPage({packagesPackageFeatures:{packagesElements:[{anchorId:'fix',ctaPath:'/contact'},{anchorId:'fix'}]},packagesContentSections:{sections:[{bodyHtml:'<p onclick="x()">Safe<script>bad()</script></p>'}]}});
    expect(data.content.packages.map(p=>p.anchorId)).toEqual(['fix',null]);
    expect(data.content.packages[0].ctaMode).toBe('none');
    expect(data.content.sections[0].body).toEqual({kind:'html',html:'<p>Safe</p>'});
    expect(mapPackagesPage({}).content.packages).toEqual([]);
  });
  it('reads verified fields and returns null for a missing locale, without a Hero path query',async()=>{
    vi.mocked(fetchWPGraphQL).mockResolvedValue({pages:{nodes:[]}});
    expect(await getPackagesPageData('es')).toBeNull();
    expect(fetchWPGraphQL).toHaveBeenCalledWith(PACKAGES_QUERY,{language:'es',mediaOriginal:true});
    expect(PACKAGES_QUERY).toContain('packagesContentSections');
    expect(PACKAGES_QUERY).not.toContain('heroContent');
    vi.mocked(fetchWPGraphQL).mockRejectedValue(new Error('CMS unavailable'));
    await expect(getPackagesPageData('en')).rejects.toThrow('CMS unavailable');
  });
  it.each([null,'','<p><br></p>','<p>&nbsp;</p>'])('M editor-empty intro body %s → legacy intro kept, no new intro',html=>{
    const data=mapPackagesPage({pageintrotext:{pageIntroText:'Legacy intro',introBodyHtml:html}});
    expect(data.introText).toBe('Legacy intro');
    expect(data.content.introBody).toBeNull();
  });
  it('M strips <script> and onerror from every new Packages HTML field (intro, card body, section body)',()=>{
    const bad='<p>Safe<img src="x" onerror="alert(1)"><script>alert(2)</script></p>';
    const data=mapPackagesPage({pageintrotext:{introBodyHtml:bad},packagesPackageFeatures:{packagesElements:[{descriptionHtml:bad,ctaText:'Ask',ctaPath:'/contact'}]},packagesContentSections:{sections:[{heading:'H',bodyHtml:bad}]}});
    for(const body of [data.content.introBody,data.content.packages[0].body,data.content.sections[0].body]){
      const html=body?.kind==='html'?body.html:'';
      expect(html).toContain('Safe');
      expect(html).not.toMatch(/script|onerror|alert/i);
    }
  });
  it.each(['fr','es'] as const)('FR/ES state-C-shaped response renders the page without throwing and without en.json strings: %s',async locale=>{
    const out=(await renderPage(locale,localizedC(C.packages,locale))).textContent ?? '';
    expect(out).toContain(`[${locale}] Funnel Launch`);
    const pieces=enPieces();
    expect(pieces.length).toBeGreaterThan(50);
    pieces.forEach(piece=>expect(out).not.toContain(piece));
  });
  it.each(['fr','es'] as const)('missing %s translation → notFound()',async locale=>{
    vi.mocked(fetchWPGraphQL).mockReset().mockResolvedValueOnce({pages:{nodes:[]}});
    await expect(PackagesPage({params:Promise.resolve({locale})})).rejects.toMatchObject({digest:expect.stringContaining('404')});
  });
  it.each([['C',false],['N',true]] as const)('state %s → the page asks the Hero for an internal-only CTA: %s',async(state,expected)=>{
    const node=state==='C'?C.packages:N.packages;
    vi.mocked(fetchWPGraphQL).mockReset().mockResolvedValueOnce({pages:{nodes:[node]}});
    const page=await PackagesPage({params:Promise.resolve({locale:'en'})}) as React.ReactElement<{children:React.ReactElement<{requireInternalCta?:boolean;pageUri?:string}>[]}>;
    const hero=page.props.children[0];
    expect(hero.props.pageUri).toBe('packages');
    expect(hero.props.requireInternalCta).toBe(expected);
  });
});

describe('Packages presentation (5b Part 2)', () => {
  it('state C: three legacy cards with price, description, features and the new default CTA label; no badge', async () => {
    const body = await renderPage('en', C.packages);
    const cards = [...body.querySelectorAll('.package-card')];
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => c.querySelector('h3')?.textContent)).toEqual(['Funnel Launch', 'Funnel + Website', 'Growth Stack']);
    expect(cards[0].textContent).toContain('From $950');
    expect(cards[0].querySelectorAll('.package-card__feature-item').length).toBeGreaterThan(0);
    cards.forEach((card) => expect(card.querySelector('button')?.textContent).toBe('Book a Free Strategy Call'));
    expect(body.querySelector('.badge')).toBeNull();
    expect(body.querySelector('.packages-sections')).toBeNull();
    expect(body.querySelector('h3.typo-3xl-bold')?.textContent).toBe(C.packages.pageintrotext.pageIntroText);
  });

  it.each([['en', '/contact'], ['fr', '/fr/contact'], ['es', '/es/contact']] as const)(
    'state N (%s): rich cards, localized Contact CTAs, anchors, intro body and sections after the cards', async (locale, href) => {
      const body = await renderPage(locale, N.packages);
      const cards = [...body.querySelectorAll('article.package-card--rich')];
      expect(cards.map((c) => c.id)).toEqual(['build', 'fix', 'care']);
      expect(cards.map((c) => c.querySelector('a.btn')?.textContent)).toEqual(['Discuss a BUILD project', 'Discuss a FIX project', 'Ask about CARE']);
      cards.forEach((c) => expect(c.querySelector('a.btn')?.getAttribute('href')).toBe(href));
      expect(cards[0].querySelector('.package-card__heading')?.textContent).toMatch(/^For a new website/);
      expect(cards[0].textContent).toContain('C$3,500');
      const out = body.textContent ?? '';
      // No legacy price/description/features/"What's included", no badge, no legacy intro.
      expect(out).not.toMatch(/From \$950|What's included|1 landing page \+ 1 thank-you page|Popular|done-for-you packages/);
      expect(body.querySelector('.package-card__features, .package-card__pricing, .badge, button')).toBeNull();
      expect(body.querySelector('.packages-intro')?.textContent).toContain('All prices are in Canadian dollars');
      const sections = [...body.querySelectorAll('.packages-sections h2')].map((h) => h.textContent);
      expect(sections).toEqual(['Paid Website Diagnostic', 'Good to Know Before You Budget']);
      expect(body.querySelector('.packages-sections')?.textContent).toContain('C$450 fixed fee');
      // Order: cards, then Diagnostic, then budget guidance.
      const grid = body.querySelector('.packages-grid')!;
      expect(grid.compareDocumentPosition(body.querySelector('.packages-sections')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

  it('a rich card without a valid CTA renders no CTA at all (no modal fallback)', async () => {
    const node = structuredClone(N.packages);
    node.packagesPackageFeatures.packagesElements[1].ctaPath = 'https://calendly.com/x';
    const cards = [...(await renderPage('en', node)).querySelectorAll('article.package-card')];
    expect(cards[1].querySelector('a, button')).toBeNull();
    expect(cards[0].querySelector('a.btn')).not.toBeNull();
  });

  it('empty repeaters → no grid, no sections wrapper', async () => {
    const body = await renderPage('en', { pageintrotext: { pageIntroText: '', introBodyHtml: '<p>Tax note</p>' }, packagesPackageFeatures: { packagesElements: [] }, packagesContentSections: { sections: [] } });
    expect(body.querySelector('.packages-grid')).toBeNull();
    expect(body.querySelector('.packages-sections')).toBeNull();
    expect(body.querySelector('.packages-intro')?.textContent).toBe('Tax note');
  });

  it.each(['en', 'fr', 'es'] as const)('CMS error (%s) → dictionary-backed error state, not a 404 or a throw', async (locale) => {
    vi.mocked(fetchWPGraphQL).mockReset().mockRejectedValueOnce(new Error('CMS unavailable'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const page = (await PackagesPage({ params: Promise.resolve({ locale }) })) as El;
    const html = renderToStaticMarkup(React.createElement(I18nProvider, { locale, dictionary: getDictionary(locale) }, strip(page)));
    const status = new DOMParser().parseFromString(html, 'text/html').querySelector('[role="status"]');
    expect(status?.querySelector('h2')?.textContent).toBe(getDictionary(locale).packages.errorTitle);
    expect(status?.textContent).toContain(getDictionary(locale).packages.errorBody);
    expect(html).not.toContain('package-card');
    // The Hero and the final CTA still render around the error state.
    expect((page.props.children as El[])[0].type).toBe(HeroLoader);
    spy.mockRestore();
  });

  it('D-S: the legacy intro is sanitized after the newline transform', () => {
    const out = legacyIntroHtml('Line one<img src="x" onerror="alert(1)">\nLine two<script>alert(2)</script>');
    expect(out).not.toMatch(/onerror|script|alert/);
    expect(out).toContain('Line one');
    // A plain two-line intro gives the same DOM as the unsanitized `<br />` string rendered before 5b.
    const before = new DOMParser().parseFromString('Whether you are starting<br />or scaling up.', 'text/html').body.innerHTML;
    const after = new DOMParser().parseFromString(legacyIntroHtml('Whether you are starting\nor scaling up.'), 'text/html').body.innerHTML;
    expect(after).toBe(before);
  });
});
