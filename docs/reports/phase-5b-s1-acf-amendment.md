# Phase 5b S1 report — ACF amendment `heroContent.hero_cta_path`

- Spec: `docs/specs/phase-5b-services-packages-seo.md` rev 4, §S1 · ADR 0006 Amendment 1
- Author: Dev · Date: 2026-10-28
- Branch: `feat/phase-5a` · Commits (by Mauricio): `58a9df1` (S1 JSON), `8d2d313` (ADR amendment) · Draft PR #22

## Result
Done. The field is in the Phase 5 export, imported locally, and the local re-export matches the amended JSON except for
2 known ACF export-order differences. Local introspection shows `HeroContent.ctaPath: String` (A1).

## Changes
- `docs/acf/phase-5-field-groups.json`: one field appended at the end of `heroContent.fields` (`group_689a2d99bc46f`),
  key `field_p5_herocontent_hero_cta_path`, label "CTA Path", name `hero_cta_path`, type `text`,
  `wpml_cf_preferences: 2`, `default_value: ""`, `show_in_graphql: 1`, `graphql_field_name: "ctaPath"`, instructions as
  in the spec. It uses the same shape as `field_p5_finalctasection_cta_path`. The text was inserted by hand (the file
  uses ACF's `\/` escaping and doesn't round-trip through `JSON.stringify`): +26 lines, 0 deleted, no existing key moved.
- Not touched: `docs/specs/*`, ADR 0006 (amended by the Architect), `src/`. The 5a frontend doesn't select `ctaPath`.

## Gate
| Check | Result | Notes |
|---|---|---|
| lint | not run | No code changed (one JSON file under `docs/acf/`) |
| typecheck | not run | Same |
| tests | not run | Same |
| build | not run | Same. The PR #22 Vercel preview fails as expected (see Issues) |
| visual (routes · viewports · locales) | not run | No change users can see |
| S1: `acf-json-diff.mjs` before → amended | passed | 13 → 14 groups, Added 36, Removed 0, Changed 10, reordered 0, duplicates 0, exit 0 |
| S1: `--self-test` | passed | 6/6 |
| S1: re-export 10-29 → amended | passed (with 2 accepted known reorders) | Added 0, Removed 0, Changed 0, duplicates 0, exit 0 |
| A1: local introspection | passed | `HeroContent.ctaPath` is `SCALAR String` |

## Evidence
sha256:
- `phase-5-field-groups.json` before S1: `4847b1eb687806127555c2ae28c0f972e59a4d384c1902cd608669b183a803f3`
- after S1 (= `58a9df1`): `36ca235f3d0c919fc53781400a5f4dca6e28e44e91edf83c731ba9163e842cd4`
- local re-export `~/Downloads/acf-export-2026-10-29.json`: `8f9f16520bec5280f51369eb9e01da97e0d8cf4eadc13a2448cb1dca6802babe`

Local DB backup taken before the import (by Mauricio):
`../backups/phase-5a/magneto-cms-2_pre-s1_20261028-2126.sql` (3,172,731 bytes, 2026-10-28 21:26), outside the repo.

```
$ node scripts/phase-5a/acf-json-diff.mjs docs/acf/phase-5-before.json docs/acf/phase-5-field-groups.json
groups: 13 → 14
== Added (36) ==   … + field field_p5_herocontent_hero_cta_path  heroContent > hero_cta_path  [text] gql=ctaPath pref=2
== Removed (0) ==
== Changed settings (10 keys) ==   (the 10 from 5a, unchanged)
== Existing keys reordered (0) ==
== Duplicate meta names per post, after file (0) ==
exit=0

$ node scripts/phase-5a/acf-json-diff.mjs ~/Downloads/acf-export-2026-10-29.json docs/acf/phase-5-field-groups.json
groups: 14 → 14
== Added (0) ==  == Removed (0) ==  == Changed settings (0 keys) ==
== Existing keys reordered (2) ==
  ! under (top level)
  ! under field_689a37f1b1fb8
== Duplicate meta names per post, after file (0) ==
exit=0
```

The re-export has the field as `hero_cta_path text ctaPath pref=2 default "" show_in_graphql=1`, last in `heroContent`
(`hero_title, subtitle_hero, cta_text_hero, cta_link_hero, image, background_image, hero_cta_path`).

Local introspection (`http://magneto-cms-2.local/graphql`, read-only):
```
__type(name: "HeroContent") → … { name: "ctaPath", type: { kind: SCALAR, name: String } } …
pages(first: 1, where: { language: "en", name: "packages" }) { nodes { heroContent { ctaPath ctaLinkHero } } }
→ ctaPath: null, ctaLinkHero: "https://calendly.com/mauriciobayuelo/free-discovery-call"
```
`ctaPath: null` on Packages is expected: there is no content yet. 5b fills it.

## Deviations from the spec
- AC-2 says "local re-export = amended JSON (0 changes)". The diff shows 0 additions, removals and setting changes, but
  2 "reordered" entries. Mauricio accepted them on 2026-10-28 as ACF export ordering, not schema differences:
  1. **Top level:** ACF exports `group_p5_packagescontentsections` last (after `group_689a2d99bc46f`). The file has it
     before `group_689a30edd36b7`.
  2. **`testimonials` sub-fields (`field_689a37f1b1fb8`):** ACF exports `author, testimonial, thumb, role, company, city,
     note`. The file has `thumb` last.
  The 10-27 re-export already showed both against the pre-S1 file, so S1 didn't cause them. The file was not re-ordered.
- I staged the JSON after S1 (`git add`). Mauricio asked that files stay unstaged next time. He committed it himself.

## Issues found (not fixed)
- **PR #22 Vercel preview fails as expected:** `Cannot query field "cardDescription" / "displayOrder" on type
  "ProjectsProjectData"`. The preview reads the production CMS, which doesn't have the Phase 5 fields until the
  production ACF runbook (rev 4) is run (AC-22). The preview check is a merge precondition, so #22 can't merge before
  that import.
- The spec header still says "Status: Draft (rev 4). Not approved". S1 went ahead on Mauricio's statement that the
  rev 4 review authorized it, plus ADR 0006 Amendment 1. The status line is for the Architect or Mauricio to update.
- The 2 known reorders will appear in every later re-export diff unless the file is rebased on ACF's export order in a
  separate commit. That is optional and not proposed here.

## Proposed commits
- Done by Mauricio: `58a9df1 feat(acf): add heroContent.hero_cta_path (ctaPath) to the Phase 5 export (ADR 0006 amendment 1)`
- This report (left unstaged): `docs(phase-5b): S1 ACF amendment report`

## Time
Agent time about 15 min (estimated). Human time for the re-import, commits and PR: unknown. Waiting: unknown.
