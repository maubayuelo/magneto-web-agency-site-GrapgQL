#!/usr/bin/env node
// Read-only diff of two ACF JSON exports (ACF → Tools → Export), compared by key.
// Usage: node scripts/phase-5a/acf-json-diff.mjs <before.json> <after.json>
//
// - Compares field groups only (entries whose key starts with `group_`) and their fields, recursively.
// - Other entries (post types, taxonomies, options pages) are listed under "Excluded by design" and not compared:
//   docs/acf/phase-5-field-groups.json holds field groups only, so importing it never re-saves the project CPT.
// - `modified` is ignored.
// - Duplicate meta names (after file): ACF stores a top-level field's value in postmeta under its `name` and reads it
//   back by name, so two top-level fields that apply to the same post share one value (Phase 5a F-1: aboutData.cta_path
//   vs finalCtaSection.cta_path on page 32). Each page ID named in a location rule, "any other page" and every post
//   type named in a rule are checked. Rules on other params are assumed to match (over-reports rather than misses).
// Exit code: 0 = OK, 1 = something was removed or a meta name is duplicated, 2 = bad input.
// Self-test of the duplicate check: node scripts/phase-5a/acf-json-diff.mjs --self-test
import { readFileSync } from 'node:fs';

const isGroup = (entry) => typeof entry?.key === 'string' && entry.key.startsWith('group_');

/** Returns [{ post, name, fields: ['<group>.<name> (<key>)', …] }] for top-level names shared on one post. */
function duplicateMetaNames(groups) {
  const rules = groups.flatMap((g) => (g.location || []).flat());
  const postTypes = new Set(['page', ...rules.filter((r) => r.param === 'post_type').map((r) => r.value)]);
  const pageIds = new Set(rules.filter((r) => r.param === 'page').map((r) => r.value));
  const targets = [
    ...[...pageIds].map((id) => ({ label: `page ${id}`, type: 'page', id })),
    { label: 'any other page', type: 'page', id: null },
    ...[...postTypes].filter((t) => t !== 'page').map((t) => ({ label: `post type ${t}`, type: t, id: null })),
  ];
  const ruleMatches = (r, t) => {
    const eq = r.operator === '==' ? true : r.operator === '!=' ? false : null;
    if (eq === null) return true;
    if (r.param === 'post_type') return (r.value === t.type) === eq;
    if (r.param === 'page') return t.type === 'page' && (r.value === t.id) === eq;
    return true;
  };
  const applies = (g, t) => (g.location || []).some((and) => and.every((r) => ruleMatches(r, t)));
  const out = [];
  for (const t of targets) {
    const byName = new Map();
    for (const g of groups) {
      if (!applies(g, t)) continue;
      for (const f of g.fields || []) {
        if (!f.name) continue;
        if (!byName.has(f.name)) byName.set(f.name, []);
        byName.get(f.name).push(`${g.graphql_field_name || g.title || g.key}.${f.name} (${f.key})`);
      }
    }
    for (const [name, fields] of byName) if (fields.length > 1) out.push({ post: t.label, name, fields });
  }
  return out;
}

if (process.argv[2] === '--self-test') {
  const field = (key, name) => ({ key, name, type: 'text' });
  const group = (key, gql, location, fields) => ({ key, title: gql, graphql_field_name: gql, location, fields });
  const onPage = (id) => [[{ param: 'post_type', operator: '==', value: 'page' }, { param: 'page', operator: '==', value: id }]];
  const allPages = [[{ param: 'post_type', operator: '==', value: 'page' }], [{ param: 'post_type', operator: '==', value: 'project' }]];
  const project = [[{ param: 'post_type', operator: '==', value: 'project' }]];
  const finalCta = group('group_cta', 'finalCtaSection', allPages, [field('field_c1', 'title'), field('field_c2', 'cta_path')]);
  const cases = [
    ['F-1 shape: aboutData.cta_path + finalCtaSection.cta_path on page 32', [finalCta, group('group_about', 'aboutData', onPage('32'), [field('field_a1', 'cta_path')])], ['page 32:cta_path']],
    ['F-3 fix: about_cta_path', [finalCta, group('group_about', 'aboutData', onPage('32'), [field('field_a1', 'about_cta_path')])], []],
    ['same name on two different pages', [group('g_a', 'a', onPage('32'), [field('f1', 'intro')]), group('g_b', 'b', onPage('34'), [field('f2', 'intro')])], []],
    ['project post type collision', [finalCta, group('g_p', 'projectData', project, [field('f3', 'title')])], ['post type project:title']],
    ['"page != 32" excludes page 32', [finalCta, group('g_n', 'notAbout', [[{ param: 'page', operator: '!=', value: '32' }]], [field('f4', 'cta_path')])], ['any other page:cta_path']],
    ['two fields with one name in one group', [group('g_s', 'solo', onPage('2'), [field('f5', 'x'), field('f6', 'x')])], ['page 2:x']],
  ];
  let failed = 0;
  for (const [label, groups, expected] of cases) {
    const got = duplicateMetaNames(groups).map((d) => `${d.post}:${d.name}`).sort();
    const ok = JSON.stringify(got) === JSON.stringify([...expected].sort());
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n     expected ${JSON.stringify(expected)}\n     got      ${JSON.stringify(got)}`}`);
  }
  console.log(failed ? `${failed} self-test case(s) failed` : `all ${cases.length} self-test cases passed`);
  process.exit(failed ? 1 : 0);
}

const [, , beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) {
  console.error('Usage: node scripts/phase-5a/acf-json-diff.mjs <before.json> <after.json>  |  --self-test');
  process.exit(2);
}

const load = (path) => {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(data)) throw new Error(`${path}: expected a JSON array (an ACF export)`);
  return data;
};

const IGNORED = new Set(['modified']);
const CHILD_KEYS = ['fields', 'sub_fields', 'layouts'];

/** Flattens a group into Map<key, { path, kind, settings, parent, index }>. */
function flatten(groups) {
  const out = new Map();
  const visit = (node, path, kind, parent, index) => {
    if (out.has(node.key)) throw new Error(`duplicate key ${node.key} (${path})`);
    const settings = {};
    for (const [k, v] of Object.entries(node)) {
      if (!CHILD_KEYS.includes(k) && !IGNORED.has(k)) settings[k] = v;
    }
    out.set(node.key, { path, kind, settings, parent, index });
    for (const childKey of CHILD_KEYS) {
      const children = node[childKey];
      if (!children) continue;
      const list = Array.isArray(children) ? children : Object.values(children);
      list.forEach((child, i) => visit(child, `${path} > ${child.name || child.key}`, childKey === 'layouts' ? 'layout' : 'field', node.key, i));
    }
  };
  groups.forEach((g, i) => visit(g, g.title || g.key, 'group', null, i));
  return out;
}

const show = (v) => (typeof v === 'string' && v.length > 120 ? JSON.stringify(`${v.slice(0, 117)}...`) : JSON.stringify(v));

let beforeAll;
let afterAll;
try {
  beforeAll = load(beforePath);
  afterAll = load(afterPath);
} catch (error) {
  console.error(String(error.message || error));
  process.exit(2);
}

const lines = [];
const print = (s = '') => lines.push(s);

print(`before: ${beforePath}`);
print(`after:  ${afterPath}`);
print(`groups: ${beforeAll.filter(isGroup).length} → ${afterAll.filter(isGroup).length}`);
print();

print('== Excluded by design (non-group entries, not compared) ==');
const excluded = [
  ...beforeAll.filter((e) => !isGroup(e)).map((e) => ['before', e]),
  ...afterAll.filter((e) => !isGroup(e)).map((e) => ['after', e]),
];
if (excluded.length === 0) print('  (none)');
for (const [side, e] of excluded) {
  const kind = String(e.key || '').replace(/_[0-9a-f]+$/, '') || 'unknown';
  print(`  ${side}: ${e.key} [${kind}] ${e.title || e.post_type || e.taxonomy || ''}`.trimEnd());
}
print();

let before;
let after;
try {
  before = flatten(beforeAll.filter(isGroup));
  after = flatten(afterAll.filter(isGroup));
} catch (error) {
  console.error(String(error.message || error));
  process.exit(2);
}

const added = [...after.keys()].filter((k) => !before.has(k));
const removed = [...before.keys()].filter((k) => !after.has(k));
const common = [...before.keys()].filter((k) => after.has(k));

print(`== Added (${added.length}) ==`);
for (const k of added) {
  const a = after.get(k);
  const s = a.settings;
  const pref = s.wpml_cf_preferences ?? (s.acfml_field_group_mode ? `mode=${s.acfml_field_group_mode}` : '-');
  const gql = s.graphql_field_name ?? '-';
  print(`  + ${a.kind} ${k}  ${a.path}  [${s.type || 'group'}] gql=${gql} pref=${pref}`);
}
print();

print(`== Removed (${removed.length}) ==`);
for (const k of removed) print(`  - ${before.get(k).kind} ${k}  ${before.get(k).path}`);
if (removed.length === 0) print('  (none)');
print();

const changed = [];
for (const k of common) {
  const b = before.get(k);
  const a = after.get(k);
  const keys = new Set([...Object.keys(b.settings), ...Object.keys(a.settings)]);
  const diffs = [];
  for (const s of keys) {
    const bv = JSON.stringify(b.settings[s]);
    const av = JSON.stringify(a.settings[s]);
    if (bv !== av) diffs.push(`      ${s}: ${b.settings[s] === undefined ? '(absent)' : show(b.settings[s])} → ${a.settings[s] === undefined ? '(absent)' : show(a.settings[s])}`);
  }
  if (b.parent !== a.parent) diffs.push(`      (parent): ${b.parent} → ${a.parent}`);
  if (diffs.length) changed.push([k, a, diffs]);
}
print(`== Changed settings (${changed.length} keys) ==`);
for (const [k, a, diffs] of changed) {
  print(`  ~ ${a.kind} ${k}  ${a.path}`);
  diffs.forEach((d) => print(d));
}
if (changed.length === 0) print('  (none)');
print();

// Relative order of existing keys under each parent (inserting new siblings is allowed).
const reordered = [];
const siblings = (map, parent) =>
  [...map.entries()].filter(([, v]) => v.parent === parent).sort((x, y) => x[1].index - y[1].index).map(([k]) => k);
for (const parent of new Set([...common.map((k) => before.get(k).parent)])) {
  const b = siblings(before, parent).filter((k) => after.has(k));
  const a = siblings(after, parent).filter((k) => before.has(k));
  if (JSON.stringify(a) !== JSON.stringify(b)) reordered.push(parent ?? '(top level)');
}
print(`== Existing keys reordered (${reordered.length}) ==`);
reordered.forEach((p) => print(`  ! under ${p}`));
if (reordered.length === 0) print('  (none)');
print();

const duplicates = duplicateMetaNames(afterAll.filter(isGroup));
print(`== Duplicate meta names per post, after file (${duplicates.length}) ==`);
for (const d of duplicates) print(`  ✗ ${d.post}: "${d.name}" ← ${d.fields.join(', ')}`);
if (duplicates.length === 0) print('  (none)');

console.log(lines.join('\n'));
process.exit(removed.length > 0 || duplicates.length > 0 ? 1 : 0);
