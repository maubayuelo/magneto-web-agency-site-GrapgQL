import { describe, it, expect, vi } from 'vitest';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mapPackagesPage, getPackagesPageData, PACKAGES_QUERY } from './api';
import PackagesPage from './page';
import PackagesGrid from '@/components/organisms/PackagesGrid';
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
const text = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
const enPieces = (): string[] => EN.posts.flatMap((p) => p.fields.flatMap((f) => {
  const values = Array.isArray(f.value) ? f.value.flatMap((row) => Object.values(row as Record<string, string>)) : [f.value as string];
  return values.flatMap((v) => /<[a-z]/i.test(v) ? [...new DOMParser().parseFromString(v, 'text/html').body.querySelectorAll('p,li,h3')].map((el) => el.textContent ?? '') : [v]);
})).filter((v) => v.length >= 12 && !v.startsWith('/'));

describe('Packages C/N/M contracts; presentation deferred',()=>{
  it('C preserves the old consumer shape and legacy CTA mode',()=>{
    const data=mapPackagesPage(C.packages);
    expect(data.packages.map(p=>p.title)).toEqual(['Funnel Launch','Funnel + Website','Growth Stack']);
    expect(data.packages[0]).toMatchObject({price:'From $950',currency:'CAD',description:C.packages.packagesPackageFeatures.packagesElements[0].description});
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
    // Current page still receives the legacy adapter; no Packages UI switch in Part 1.
    expect(data.packages[0].price).toBe('WRONG');
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
    expect(mapPackagesPage({}).packages).toEqual([]);
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
  it.each(['fr','es'] as const)('FR/ES state-C-shaped response renders the grid without throwing and without en.json strings: %s',locale=>{
    const data=mapPackagesPage(localizedC(C.packages,locale));
    const html=renderToStaticMarkup(React.createElement(I18nProvider,{locale,dictionary:getDictionary(locale)},React.createElement(PackagesGrid,{packages:data.packages})));
    const out=text(html);
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
