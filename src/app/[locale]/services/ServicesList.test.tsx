import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { fetchWPGraphQL } from '@/utils/wp-graphql';
import ServicesList from './ServicesList';
import ServicesPage from './page';
import { mapServicesPage } from './api';
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
const doc=(html:string)=>new DOMParser().parseFromString(html,'text/html');
vi.mock('@/utils/wp-graphql',()=>({fetchWPGraphQL:vi.fn()}));
(globalThis as { React?: typeof React }).React = React; // classic JSX runtime in Vitest (Known debt)

/** A FR/ES state-C-shaped response: the legacy fields only, every copy string marked with the locale. */
function localizedC<T>(value: T, locale: string): T {
  const walk = (v: unknown, key = ''): unknown => {
    if (typeof v === 'string') return /^(id|sourceUrl|languageCode)$/.test(key) || v.startsWith('http') ? v : `[${locale}] ${v}`;
    if (Array.isArray(v)) return v.map((x) => walk(x, key));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return walk(structuredClone(value)) as T;
}
/** Every copy piece of en.json (titles, headings, paragraphs, list items) — must never leak into FR/ES output. */
const enPieces = (): string[] => EN.posts.flatMap((p) => p.fields.flatMap((f) => {
  const values = Array.isArray(f.value) ? f.value.flatMap((row) => Object.values(row as Record<string, string>)) : [f.value as string];
  return values.flatMap((v) => /<[a-z]/i.test(v) ? [...doc(v).body.querySelectorAll('p,li,h3')].map((el) => el.textContent ?? '') : [v]);
})).filter((v) => v.length >= 12 && !v.startsWith('/'));

describe('Services server presentation',()=>{
 it('state N data (en.json) is pinned to the current export',()=>{
  expect(createHash('sha256').update(readFileSync(EN.source.file)).digest('hex')).toBe(EN.source.sha256);
 });
 it('C retains all seven legacy rows without invented group headings or CTAs',()=>{
  const d=doc(renderToStaticMarkup(<ServicesList data={mapServicesPage(C.services)} locale="en"/>));
  expect(d.querySelectorAll('.service-item')).toHaveLength(7);
  expect(d.querySelectorAll('.services-group__heading,.service-cta')).toHaveLength(0);
  C.services.servicesServiceDetails.services.forEach(row=>expect(d.body.textContent).toContain(row.description));
 });
 it.each(['en','fr','es'] as const)('N renders all copy in stable groups, localized links and unique anchors: %s',locale=>{
  const d=doc(renderToStaticMarkup(<ServicesList data={mapServicesPage(N.services)} locale={locale}/>));
  expect(d.querySelectorAll('.services-group--core .service-item')).toHaveLength(3);
  expect(d.querySelectorAll('.services-group--supporting .service-item')).toHaveLength(4);
  expect([...d.querySelectorAll('[id]')].map(el=>el.id)).toEqual(['build','fix','care']);
  expect([...d.querySelectorAll('.service-cta')].map(el=>el.getAttribute('href'))).toEqual(['build','fix','care'].map(id=>`${locale==='en'?'':'/'+locale}/packages#${id}`));
  expect(d.querySelectorAll('.services-group--supporting a,.badge')).toHaveLength(0);
  N.services.servicesServiceDetails.services.forEach(row=>{
    expect(d.body.textContent).toContain(row.title);
    expect(d.body.textContent).toContain(row.heading);
    const body=doc(row.descriptionHtml);
    [...body.querySelectorAll('p,li')].forEach(el=>expect(d.body.textContent).toContain(el.textContent));
  });
 });
 it('M orders core, unclassified, supporting without losing legacy rows and escapes plain text',()=>{
  const data=mapServicesPage({servicesServiceDetails:{services:[{title:'Support',serviceGroup:['supporting']},{title:'Old',description:'<script>legacy</script>'},{title:'Core',serviceGroup:['core']}]}});
  const d=doc(renderToStaticMarkup(<ServicesList data={data} locale="en"/>));
  expect([...d.querySelectorAll('.service-item h2')].map(el=>el.textContent)).toEqual(['Core','Old','Support']);
  expect(d.querySelector('script')).toBeNull();expect(d.body.textContent).toContain('<script>legacy</script>');
 });
 it('empty repeaters never render orphan group headings',()=>{
  expect(renderToStaticMarkup(<ServicesList data={mapServicesPage({servicesServiceDetails:{coreHeading:'Core',supportingHeading:'Support'}})} locale="en"/>)).toBe('');
 });
 it.each(['fr','es'] as const)('FR/ES state-C-shaped response renders without throwing and without en.json strings: %s',locale=>{
  const data=mapServicesPage(localizedC(C.services,locale));
  const text=doc(renderToStaticMarkup(<ServicesList data={data} locale={locale}/>)).body.textContent ?? '';
  expect(text).toContain(`[${locale}] ${C.services.servicesServiceDetails.services[0].title}`);
  const pieces=enPieces();
  expect(pieces.length).toBeGreaterThan(50);
  pieces.forEach(piece=>expect(text).not.toContain(piece));
 });
 it.each(['fr','es'] as const)('missing %s translation → notFound(); CMS error → error state, not 404',async locale=>{
  vi.mocked(fetchWPGraphQL).mockResolvedValueOnce({pages:{nodes:[]}});
  await expect(ServicesPage({params:Promise.resolve({locale})})).rejects.toMatchObject({digest:expect.stringContaining('404')});
  vi.mocked(fetchWPGraphQL).mockRejectedValueOnce(new Error('CMS unavailable'));
  const error=vi.spyOn(console,'error').mockImplementation(()=>{});
  const page=await ServicesPage({params:Promise.resolve({locale})});
  expect(page).toBeTruthy();
  expect(error).toHaveBeenCalledWith('Failed to load services page data:',expect.any(Error));
  error.mockRestore();
 });
});
