# Release runbook — production FR/ES posts (Part A), media and rehearsal (Part B), release day (Part C)

- **Status: Draft (rev 0.2.1).** Decisions D-R2, D-R2a, D-R3…D-R5 and D-R7…D-R9 are recorded. D-R6 (rollback table) is open until
  Mauricio reviews it. The production IDs are filled after A0 (rev 0.3).
- Author: Architect · Reviewed by: Mauricio + Senior Architect · **Run by: Mauricio.** Every production action (SSH,
  WP admin, Vercel, GA) is his. Agents never write to production. The Dev has read-only production GraphQL on release
  day only (D-R5).
- Date: 2026-11-19 · Branch: `spec/release-runbook` (from `master` @ `bc8688b`, after PR #46).
- Depends on:
  - [5c loader spec](phase-5c-loader.md) rev 3.1: §5 method, §8 + "Production rule (D-7 B)", release-day notes;
  - [5c-rest spec](phase-5c-rest.md) rev 0.3: §7 (D-9 B), §8 (titles), §10 "What release day needs";
  - [5c-rest report](../reports/phase-5c-rest.md);
  - [5c loader report](../reports/phase-5c-loader.md), AC-12 addendum;
  - [privacy-route spec](privacy-route.md) §6 / §7 and [its report](../reports/privacy-route.md);
  - [5f report](../reports/phase-5f-analytics-consent.md) "What you must set in Vercel";
  - `docs/ai/WORKFLOW.md` "Release process"; the [5a production runbook](phase-5a-production-acf-runbook.md) for the
    SSH pattern.
- Dates (estimates):
  - **Part A by Sun 11-22** (the slip trigger);
  - media Mon 11-23;
  - B0 Mon 11-23 – Tue 11-24;
  - rehearsal Wed 11-25 – Fri 11-27;
  - go/no-go Tue 12-01;
  - **release Thu 12-03**;
  - fallback Thu 12-10.

## Revision
**rev 0.2 (2026-11-19), Mauricio's decisions and corrections:**
- **R-12 is closed (fact, Mauricio).** Production was updated on 2026-11-18, and local was brought to the same plugin
  versions and the same PHP 8.2.35 on 2026-11-19 (F-6). Local and production are now the same environment. D-R1 is
  removed as moot. The loader was re-verified locally under PHP 8.2.35: check-translations 6/6 PASS, EN dry-run
  0 changes.
- **D-R2 approved, with conditions** (§B2):
  - every existing guard stays untouched;
  - only a host allowance is added, and it needs an explicit `target=production`;
  - committed tests prove that a production host without `target=production` aborts.

  The rehearsal needs its own allowance, `target=rehearsal`. This is recorded as D-R2a for confirmation.
- **D-R3 approved.** The rehearsal on a production copy is its own step (§B3). It produces every "Expected" total
  and proves B0 before production. The local numbers are never used as expectations.
- **D-R4 approved:**
  - the hero image and removing the testimonial thumbnails go into the D-9 B save;
  - no reordering, backup first, one Update.
- **D-R5 approved:**
  - Dev read-only access, release day only;
  - the allow rule is scoped to `https://cms.magnetomarketing.co/graphql`.
- **D-R7 approved:** 18 posts.
- **D-R8 approved:** run the ES load even if ES is not enabled at launch.
- **D-R9 decided: three EN admin saves**, not a script (C-5, Appendix C removed). The Architect does not claim the
  script is materially safer. The admin route's known side effects are absorbed by placing the saves before the EN
  load, and a slug check follows each save (see D-R9).
- **Two creation paths (fact, Mauricio, 2026-11-05 local):**
  - case posts were created from the projects list with **"+"**;
  - pages via **Translation Management → Duplicate → Translate independently**.

  §A2 specifies both paths, and §A3 says which one applies to each of the 18 posts.
- **New Part B §B1:** the missing production media, as its own prep step with a checklist.
- **Open questions answered:**
  - production `home` is `http://cms.magnetomarketing.co`;
  - the privacy pages most likely hold the no-analytics text, and A0 checks it;
  - Vercel `ENABLED_LOCALES` = `en`; GA ID set for Preview only.
- Parts renumbered: A = posts, B = prep (media, B0, rehearsal, other prep), C = release day.

**rev 0.2.1 (2026-11-19), Mauricio's corrections before A0:**
- **D-R2a approved.** `target=rehearsal` → `http://magneto-prod-rehearsal.local`. The URL search-replace on the
  restored dump is now explicit, with a check that 0 replacements remain (§B3 RH-2).
- **A0 order:**
  - the canonical frontend host (A0.2g) runs **first** and sets `SITE`;
  - the live routes (A0.2h) and the sitemap (A0.2i) then run against that host, never against a redirecting one;
  - the host is saved in `$RB/canonical-site.txt` for every later session.
- **Content-freeze sequencing:** the rehearsal dump (RH-1) is taken **after** the 18 posts exist and the media is
  uploaded, never before. The new "Order of operations" section states it, and RH-1 verifies it before dumping.
- **A0.2f fallback:** if the `where: { language }` argument errors, an unfiltered query still returns data (EN nodes
  with their FR/ES `translations`), and a core-fields-only query covers the case where the WPML fields fail too.

rev 0.1 (2026-11-19): first draft.

## Goal
**Part A.** Production holds the **18** FR/ES translation posts that the release-day loads write to. Each one:
- is linked to its EN original (same trid);
- has the EN slug, its approved title and status `publish`;
- is detached (no `_icl_lang_duplicate_of`);
- has Copy rows equal to EN.

The posts are invisible, and EN is unchanged.

**Part B.** Before release day:
- production has the 10 new attachments;
- the loader can target production only on an explicit request (B0);
- a rehearsal on a copy of production has run every release-day step and recorded the expected totals.

**Part C.** On release day, Mauricio takes production from the legacy EN content to the approved EN/FR/ES content, sets
the Vercel env and promotes, following one ordered list. Every step has:
- a command or click path;
- an expected output;
- a stop condition;
- a rollback.

## Evidence (read-only, 2026-11-19, `master` @ `bc8688b`; local CMS reachable, HTTP 200)

**F-1. Production content state.** Not measured by the Architect.
- Mauricio (2026-11-19): production holds only the old EN content plus three privacy pages: EN 573, FR 575, ES 578.
- 3b E3 (`phase-3b-production-wpml-runbook.md:38-45`, 2026-10-25), "prod = local":
  - pages 2 home, 32 about-magneto, 34 services, 36 packages, 38 projects, 41 contact, 533 carte;
  - projects 270 / 224 / 498;
  - media IDs 50–528.
- 5a production report `:118` (2026-10-29): no FR/ES posts in production.
- A0 re-measures all of this.

**F-2. 18 posts are needed, not 13.**
- The 13-row checklist (5c `:435-451`) assumed that FR/ES `home`, FR `projects` and FR/ES Trépied existed. They exist
  locally (5c E4 `:86-108`), not in production.
- The content files load 9 posts per language (`python` read of `scripts/phase-5c/content/*.json`): services,
  packages, home, about-magneto, projects, contact and the 3 cases.
- The loader aborts if any target is missing (`load-content.php:186-189`).
- Local target shape, from the A0.3 query on local today:
  - FR: 683 privacy · 635 contact "Contact" · 558 projects "Réalisations" · 636 packages "Forfaits" · 637 services
    "Services" · 634 about-magneto "À propos" · 535 home "Accueil" · projects 550 "Trépied", 606 "Shamanicca",
    598 "Dangel Wellness";
  - ES: 686 privacy · 643 "Contacto" · 644 "Proyectos" · 645 "Paquetes" · 646 "Servicios" · 647 "Sobre Magneto" ·
    536 "Inicio" · projects 541 "Trépied", 625 "Shamanicca", 615 "Dangel Wellness";
  - every node lists `translations` → EN + the other language.

**F-3. The loader is local-only and resolves its files next to itself.**
- `load-content.php:37-41`: `home_url()` must equal `http://magneto-cms-2.local`, and no flag overrides it.
- `:75-76`, `:84-87`: the content JSON and the `docs/content/*.md` it pins by sha256 are read relative to `__DIR__`.
  So it can't run through `wp eval-file -`; it runs from a copy of the release commit.
- `:55-69`: a real run needs a `backup=<.sql>` that exists on the machine running WordPress and is < 3 h old.
- `:186-202`: the target guards (missing, language, slug, status, duplicate).
- `:545`: the restore hint.

**F-4. `check-translations.php` is production-safe.**
- No host guard by design (`:8-9`); it prints `home_url()` first (`:26`); no write call (5c AC-4).
- It checks rows 1-13 plus info rows 14-17 (`:29-50`) and prints `rows (target/EN)` per Copy repeater.
- It does not check FR `projects` (row 18).

**F-5. Production access pattern (worked 2026-10-29).**
- SSH `u3112-w527ltde781s@giowm1219.siteground.biz`, port 18765, key `~/.ssh/siteground_magneto_v2`.
- WordPress root `~/www/cms.magnetomarketing.co/public_html`.
- `wp eval-file -`, `wp db export -`, `wp db import -`.
- Site Tools → Speed → Caching → Flush.
- Source: `phase-5a-production-acf-runbook.md:122-126`, `:169-176`, `:264-270`, `:316-320`, `:351-359`.
- **Production `home`** = `http://cms.magnetomarketing.co` (GraphQL `generalSettings.url`, Mauricio, 2026-11-18).
  The http `siteurl` is pre-existing, deferred to Phase 7.

**F-6. Environment parity (fact, Mauricio, 2026-11-18 / 2026-11-19).** Production and local both run:

| Component | Version |
|---|---|
| WPML (`sitepress-multilingual-cms`) | 5.4.0 |
| ACFML | 5.4.0 |
| WPML GraphQL | 5.4.0 |
| WPML SEO (`wp-seo-multilingual`) | 5.4.0 |
| WPML String Translation | 5.4.0 |
| WPGraphQL | 2.28.0 |
| WPGraphQL for ACF | 3.2.1 |
| ACF PRO | 6.8.11 |
| Yoast (`wordpress-seo`) | 28.9 |
| enable-cors | 3.0.0 |
| PHP | 8.2.35 |

- The local re-verification under PHP 8.2.35: check-translations 6/6 PASS, EN dry-run 0 changes.
- The Copy-sync proof (5c AC-12) ran on WPML 5.4.0 (5c report `:795-800`).
- **Not yet proven on 5.4.0:** the two post-creation paths (Duplicate, "+"). The local posts were created on
  2026-11-05 under 4.7.6. The Part A pilots prove them.
- A0 records the full plugin list (also svg-support, which the SVG uploads need).

**F-7. Release-day media that production can't have yet** (local GraphQL today; production's last media ID is 528,
F-1).

| Local ID | File (local `uploads/2026/11/`) | Title | Alt text | Used by |
|---:|---|---|---|---|
| 676 | `magneto-hero-phone-1.png` (1000×1000) | magneto-hero-phone | — | EN home hero `image` |
| 702 | `ico-layout-template.svg` | ico-layout-template | — | home featured row 1 icon; Services row 1 icon |
| 708 | `ico-wrench.svg` | ico-wrench | — | home featured row 2 icon; Services row 2 icon |
| 705 | `ico-shield-check.svg` | ico-shield-check | — | home featured row 3 icon; Services row 3 icon |
| 670 | `magneto-build-1.jpg` (1254×1254) | magneto-build | — | Services row 1 image |
| 659 | `magneto-fix.jpg` (1350×1350) | magneto-fix | "Illustration of a website problem being repaired" | Services row 2 image |
| 673 | `magneto-care-1.jpg` (1254×1254) | magneto-care | — | Services row 3 image |
| 699 | `ico-languages.svg` | ico-languages | — | Services row 5 icon |
| 693 | `ico-calendar-check.svg` | ico-calendar-check | — | Services row 6 icon |
| 696 | `ico-chart-no-axes-column.svg` | ico-chart-no-axes-column | — | Services row 7 icon |

- Services row 4 uses 476 `2025/10/icon-target.svg`, which is old and already in production.
- Case galleries (max IDs 525 / 514 / 521) and Packages icons (393 / 390 / 387) use only old media.
- Testimonial `thumb` is empty locally in every language (`local-fixtures.php:121`; 5c-rest report `:347`).
- All 10 files exist in `~/Local Sites/magneto-cms-2/app/public/wp-content/uploads/2026/11/` (listed today). Three
  carry a `-1` suffix from their local upload, so the files must be uploaded from that folder for the names to match.

**F-8. `display_order` is set by nothing in production.**
- The local EN values 10 / 20 / 40 come only from `local-fixtures.php:160-168`.
- A script diff of the fixture field keys against `en.json` finds three keys missing: `display_order`, plus
  `service_icon` and `thumb` (both images, handled by D-9 B).
- The loader refuses `display_order` in content files (`load-content.php:132,138`) and only copies EN → FR/ES.
- Its preference is Copy (5c E13 `:216-219`), so an EN admin save carries it to FR/ES.
- Without it, the grid falls back to "missing values last, GraphQL order" (`projects/api.ts:64`).

**F-9. The ACF schema in production is current.**
- `docs/acf/phase-5-field-groups.json` sha256 `36ca235f…e842cd4` = the file imported on 2026-10-29
  (`WP-SETUP.md:143`).
- No change since 2026-10-28 (`git log -- docs/acf`).

**F-10. Admin-save side effects (local, observed).**
- An EN admin save rewrites the loaded `wysiwyg` `<p>` HTML as plain text, and the next EN dry-run counts it
  (5c report `:831-835`; 5c-rest report `:204-215`, `:342-343`).
- A project admin save creates empty `bgimage` / `prefooter_cta_link` Copy meta on EN and FR/ES (harmless).
- **On 2026-11-18 the Dangel EN slug was found changed** around an admin save. The cause is unknown; it was reverted.

**F-11. Expected appends are not the local ones.**
- In production the FR/ES posts are created from the legacy EN before the EN load. The growth list
  (`load-content.php:209-214`) therefore predicts **11 `+ append` lines per language**:
  - Dangel `results` +3;
  - Shamanicca `solutions` +1 and `results` +3;
  - Trépied `results` +2;
  - Packages `sections` +2.
- Locally the counts were split across runs (7 + 2), and `sections` was already 2. This prediction is a cross-check
  only. **The expected values come from the rehearsal (§B3).**
- This corrects 5c §8 "Production rule" (`phase-5c-loader.md:541-542`).

**F-12. Live-site exposure.**
- `ENABLED_LOCALES` is applied at build time (`config.ts:24-27`; `layout.tsx:132-136`).
- The only unfiltered read is `sitemap.xml/route.ts:9` → `GET_PROJECTS` without a language, relying on WPML's EN
  default (`src/data/projects.ts:28`). Part A checks the live sitemap after each batch.
- From the first EN write on release day, the live frontend shows the changed EN values within 60 s
  (`wp-graphql.ts:39`).

**F-13. Vercel.**
- Promoting a preview deployment rebuilds it with Production env; Instant Rollback does not rebuild (5f spec
  `:347-349`).
- Env changes need a new build (5f report `:231-240`).
- Today (Mauricio, 2026-11-19): `ENABLED_LOCALES` = `en`. `NEXT_PUBLIC_GA_ID` = `G-N2YZ6SG2WM` for **Preview**;
  Production stays unset until the 12-01 go/no-go.
- Release process: `WORKFLOW.md:53-73`.

**F-14. Privacy.**
- GA §5 at EN `:841` / FR `:1032` / ES `:1035`; Version B at EN `:905` / FR `:1102` / ES `:1099` (export 2026-11-17).
- The ES policy is still BORRADOR (`magneto-copy-es.md:973`; G-8).
- Footer labels: "Privacy choices" / "Choix de confidentialité" / "Opciones de privacidad" (`en.ts:49`, `fr.ts:49`,
  `es.ts:50`).
- The production pages were published on 2026-11-10, before 5f, so they most likely hold the no-analytics text
  (Mauricio). A0.4 checks it.
- D-L checklist: `privacy-route.md:361-395`.

**F-15. Stale first render.** After a build, the first one or two requests served pre-load data on 14 of 27 routes
(5c-rest report `:260-265`). Verify on the second pass, ≥ 60 s after Ready.

**F-16. Why D-R5 is safe.**
- WPGraphQL mutations require an authenticated user with the matching capability. An unauthenticated request runs as
  the public user: it can only read published content, and every mutation is rejected.
- The Dev sends no cookie, no `Authorization` header and no application password, so its requests are of that kind.

## Assumptions and open questions
- **A-1.** The production EN IDs are still those of F-1. A0 confirms them; commands resolve by slug or use A0's IDs.
- **A-2.** The two creation paths behave on WPML 5.4.0 as they did on 4.7.6 locally:
  - **Duplicate:** creates the copy with `_icl_lang_duplicate_of`, which *Translate independently* removes.
  - **"+":** creates a linked post with no duplicate flag. On the first save, ACFML copies the Copy fields, including
    the repeater rows.

  Pilots 1 and 2 prove each path on one post before the others.
- **A-3.** Production EN still has the legacy row counts:
  - Services 7, Packages 3, `sections` 0;
  - home: featured 2, testimonials 4;
  - Dangel 3/4/3 with 5 images;
  - Shamanicca 3/3/3 with 7 images;
  - Trépied 3/4/4 with 7 images.

  These come from 5c E5 / E14, not measured. A0 measures them; a different count on a repeater the EN load treats as
  exact is a stop for rev 0.3.
- **A-4.** Uploading the 10 attachments (§B1) has no visible effect until a release-day save references them.
- **A-5.** No content edit happens in production from the rehearsal dump (§B3 RH-1) until C-14 (the content freeze).
  RH-1 is taken only after Part A and §B1 (see "Order of operations"). C-1.3 checks it.
- **O-1.** Frontend domain: `www.magnetomarketing.co` or the apex? A0.2g, which runs first, decides it and sets
  `SITE`.
- **O-2.** The privacy pages' §5 and dates: A0.4.

## Design

### Order of operations
Each step starts only after the previous one passes.
1. **A0** discovery (read-only), then **rev 0.3** (production IDs).
2. **Part A:** the 18 FR/ES posts in production (by Sun 11-22).
3. **§B1:** the 10 media files in production (Mon 11-23).
4. **§B2:** loader guard merged, then the release bundle built.
5. **§B3 RH-1: the production dump for the rehearsal.** It is taken **after** steps 2 and 3, so it contains the 18
   posts and the media.
   - A dump taken earlier would not contain them. The rehearsal would then abort at the first missing translation
     (`load-content.php:186-189`), or would differ from production.
   - **The production content freeze starts at RH-1 and ends at C-14.**
6. **§B3 RH-2 … RH-6:** the rehearsal on the copy; the Expected table; the equality read-back.
7. **GNG-0** (Tue 12-01).
8. **Part C** (Thu 12-03).

Any production content or media edit between RH-1 and C-14 invalidates the rehearsal: RH-1 … RH-6 run again before
Part C.

### Common setup (every new terminal)
```bash
export SG_HOST='u3112-w527ltde781s@giowm1219.siteground.biz' WP_ROOT='~/www/cms.magnetomarketing.co/public_html' RB="$HOME/Documents/projects/magneto/backups/release" REPO="$HOME/Documents/projects/magneto/web-app-GrapgQL" GQL='https://cms.magnetomarketing.co/graphql'; mkdir -p "$RB"
SITE=$(cat "$RB/canonical-site.txt" 2>/dev/null); export SITE; [ -n "$SITE" ] && echo "SITE=$SITE" || echo "SITE not set yet: run A0.2g first"
sg() { ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "cd $WP_ROOT && $*"; }
```
- `WP_ROOT` keeps a literal `~`, which the **server** shell expands (5a pattern).
- `SITE` is the canonical frontend host. A0.2g decides it once and saves it to `$RB/canonical-site.txt`. Every later
  step (A4, C-1, C-14) reads it from there.

**Rules for every production session:**
- Quiet window: nobody edits production content.
- Check that the address bar shows `cms.magnetomarketing.co/wp-admin` before each admin action.
- **Never open an EN original in the editor and click Update**, except in the steps that say so: C-3, C-5 and C-7.
- **Never choose "Translate"** in the Translation Dashboard (it creates an ATE job). "Translate Everything
  Automatically" stays OFF (`WP-SETUP.md:61`).
- Don't edit ACF fields on the new FR/ES posts: the loads fill them.
- **STOP** = no further production action. Keep the output and send the file to the Architect.

### Part A — the 18 production FR/ES posts (by Sun 11-22)

#### A0. Discovery (read-only, ≈ 20-30 min)
**A0.1 Save the read-only inventory script** (laptop only). Paste the Appendix A heredoc once. Its last line must
print `read-only: OK`.

**A0.2g Canonical frontend host. Run this first: it sets `SITE` for every route check.**
Each host is followed through its redirects to the URL it finally serves.
```bash
APEX=$(curl -s -o /dev/null -L -m 20 -w '%{url_effective}' https://magnetomarketing.co/); WWW=$(curl -s -o /dev/null -L -m 20 -w '%{url_effective}' https://www.magnetomarketing.co/)
{ echo "== A0.2g frontend domain"; for h in https://magnetomarketing.co https://www.magnetomarketing.co; do curl -s -o /dev/null -m 15 -w "%{http_code} $h -> %{redirect_url}\n" "$h/"; done; echo "apex ends at: $APEX · www ends at: $WWW"; } 2>&1 | tee "$RB/A0-domain-$(date +%Y%m%d-%H%M).txt"
if [ -n "$APEX" ] && [ "$APEX" = "$WWW" ]; then SITE="${APEX%/}"; export SITE; echo "$SITE" > "$RB/canonical-site.txt"; echo "canonical SITE=$SITE"; else SITE=; echo "STOP: apex and www end at different URLs (or none). Send the A0-domain file to the Architect."; fi
```
- **Expected:** one host returns 200, the other a 301/308 to it, both end at the same URL, and the last line is
  `canonical SITE=https://…`.
- **On STOP:** run A0.2 anyway. Its route and sitemap checks are skipped.

**A0.2 Run discovery, all into one file** (after A0.2g, in the same terminal).
```bash
OUT="$RB/A0-production-inventory-$(date +%Y%m%d-%H%M).txt"
FIELDS='databaseId slug status title language { code } translations { databaseId language { code } }'
{
echo "== canonical SITE: ${SITE:-(not set)}"
echo "== A0.2a options / versions"; sg "wp option get home; wp option get siteurl; wp core version; php -v | head -1; wp cli version"
echo "== A0.2b plugins"; sg "wp plugin list --fields=name,status,version --format=csv"
echo "== A0.2c WPML post-type sync"; sg "wp eval 'echo wp_json_encode( apply_filters( \"wpml_setting\", null, \"custom_posts_sync_option\" ) ), PHP_EOL;'"
echo "== A0.2d inventory"; sg "wp eval-file -" < "$RB/inventory.php"
echo "== A0.2e check-translations (expected now: every row FAIL, no translation)"; sg "wp eval-file -" < "$REPO/scripts/phase-5c/check-translations.php"
for L in en fr es; do
  echo "== A0.2f GraphQL $L, language filter (public, published only)"
  R=$(curl -s -m 20 "$GQL" -H 'content-type: application/json' -d "{\"query\":\"{ pages(first: 50, where: { language: \\\"$L\\\" }) { nodes { $FIELDS } } projects(first: 50, where: { language: \\\"$L\\\" }) { nodes { $FIELDS } } }\"}"); echo "$R"
  case "$R" in *'"errors"'*) echo "!! A0.2f: language filter returned errors for $L; the fallback below covers it";; esac
done
echo "== A0.2f-fallback1: no language filter (WPML returns EN nodes; their translations list the FR/ES IDs)"
R=$(curl -s -m 20 "$GQL" -H 'content-type: application/json' -d "{\"query\":\"{ pages(first: 100) { nodes { $FIELDS } } projects(first: 100) { nodes { $FIELDS } } }\"}"); echo "$R"
case "$R" in *'"errors"'*)
  echo "== A0.2f-fallback2: core fields only"
  curl -s -m 20 "$GQL" -H 'content-type: application/json' -d '{"query":"{ pages(first: 100) { nodes { databaseId slug status title } } projects(first: 100) { nodes { databaseId slug status title } } }"}'; echo;;
esac
if [ -n "$SITE" ]; then
  echo "== A0.2h live routes on $SITE"; for u in / /services /packages /projects /about-magneto /contact /privacy-policy /projects/fashion-company-ecommerce /projects/shamaniccas-ecommerce /projects/trepied-trepied-ca /fr /es/services /esto-no-existe; do curl -s -o /dev/null -w "%{http_code} $u\n" "$SITE$u"; done
  echo "== A0.2i sitemap on $SITE"; curl -s "$SITE/sitemap.xml" | grep -o '<loc>[^<]*</loc>'
else
  echo "== A0.2h / A0.2i SKIPPED: no canonical SITE (see A0.2g)"
fi
echo "== A0.2j generalSettings"; curl -s -m 20 "$GQL" -H 'content-type: application/json' -d '{"query":"{ generalSettings { url } }"}'; echo
} 2>&1 | tee "$OUT"
```
About A0.2f:
- **Fact (local, 2026-11-19, same WPML GraphQL 5.4.0):**
  - the language filter returns the FR/ES nodes (F-2);
  - fallback 1 returns 8 EN pages and 3 EN projects, each with its `translations`;
  - fallback 2 returns 11 nodes;
  - an invalid argument produces an `errors` key, which the `case` test detects.
- The SQL inventory (A0.2d) remains the authoritative source; GraphQL is the public cross-check.

**A0.3 Expected (anything else → note it; the Architect classifies it in rev 0.3).**

| Item | Expected |
|---|---|
| `home` / `siteurl` | `http://cms.magnetomarketing.co` (F-5) |
| core / PHP | PHP 8.2.35 |
| plugins | F-6 versions, all active; `svg-support` active |
| sync option | `"page":"1"`, `"project":"1"` |
| posts, EN | pages home, about-magneto, services, packages, projects, contact, carte, privacy-policy; 3 projects; IDs per F-1 |
| posts, FR/ES | **only** privacy-policy 575 (fr) / 578 (es), with the trid of 573 |
| `_icl_lang_duplicate_of meta rows` | `0` |
| EN repeater rows | A-3 |
| `display_order` on EN projects | `(empty)` (F-8) |
| `media <10 files>` | `MISSING` (F-7) |
| check-translations | 13 rows `FAIL … no fr|es translation`, `0/13 PASS` |
| domain (A0.2g, run first) | one returns 200, the other redirects to it; both end at the same URL; `canonical-site.txt` written |
| live routes (on the canonical `SITE`) | EN 200; `/fr`, `/es/services`, `/esto-no-existe` 404 (record as the baseline) |
| sitemap | 3 EN project URLs (record as the baseline) |
| generalSettings | `"url":"http://cms.magnetomarketing.co"` |

**A0.4 Privacy pages (save; the Architect reads it).**
```bash
curl -s -m 20 "$GQL" -H 'content-type: application/json' -d '{"query":"{ en: pages(first:1, where:{language:\"en\", name:\"privacy-policy\"}) { nodes { databaseId status modified title content } } fr: pages(first:1, where:{language:\"fr\", name:\"privacy-policy\"}) { nodes { databaseId status modified title content } } es: pages(first:1, where:{language:\"es\", name:\"privacy-policy\"}) { nodes { databaseId status modified title content } } }"}' > "$RB/A0-privacy-$(date +%Y%m%d-%H%M).json"
```

**A0.5 Vercel (read only).** Deployments → the current **Production** deployment. Write its ID, commit and date in
`$RB/notes.md`, together with the Production and Preview values of `ENABLED_LOCALES` and `NEXT_PUBLIC_GA_ID` (names
and whether they are set; GA ID only).

**A0.6** Tell the Architect the file names. rev 0.3 fills in IDs, titles and counts the same day.

**Batch 1 may start before rev 0.3 only if A0 matches A0.3 exactly.**

#### A1. Backups (Part A)
1. Before pilot 1: Site Tools → Security → Backups → **Create Backup** `release-A-before-<yyyymmdd-hhmm>`, then:
   ```bash
   F="$RB/prod-A-before-$(date +%Y%m%d-%H%M).sql"; sg "wp db export -" > "$F" && ls -l "$F" && tail -n 1 "$F" && shasum -a 256 "$F"
   ```
   Expected: a few MB and `-- Dump completed on …`. Otherwise **STOP**.
2. Before batch 5 (the first ES batch): the same with `prod-A-before-es-…`.

**Rollback (any STOP that needs it):**
```bash
sg "wp db import -" < "$RB/prod-A-before-<…>.sql" && sg "wp cache flush"
```
Then Site Tools → Dynamic Cache → Flush. Re-run A0.2: it must equal the A0 file.

#### A2. The two creation paths

**Path P — pages: Translation Management → Duplicate → Translate independently.** Used for rows 1-9, 16, 17 and 18.
1. **WPML → Translation Management** → **Translation Dashboard** tab.
2. Filters: *Type* = **Pages**, source language English → **Filter**.
3. Tick **only** the source page. Check its title and slug in the row.
4. Language options below the list: the **Lang** row → **Duplicate content**; the other language → **Do nothing**.
5. Click the action button (**Duplicate**). Wait for the success notice.
6. **Pages** → admin-bar language switcher → **Lang** → open the new page (**Edit**).
7. WPML **Language** box → **Translate independently** → confirm. The box must no longer say the page is a
   duplicate. If the button is missing, **STOP**.
8. **Title** = the table's Title.
9. **Permalink → Edit**: the slug must be the table's Slug (the EN slug). If you see `-2`, set it back → OK.
10. Publish box: Status **Published**.
11. Touch no ACF field and not the "Synchronise translations" checkbox. **Update** once. Close the tab.

**Path J — case posts: the projects list "+".** Used for rows 10-15.
1. **Projects** → admin-bar language switcher → **English**.
2. In the source project's row, the WPML language columns show the FR / ES flags. Click the **"+"** under **Lang**.
3. The **WordPress editor** opens with an empty **Lang** post linked to the EN original (`WP-SETUP.md:72`: native
   editor). **If the WPML Advanced Translation Editor opens instead, close it without saving and STOP.**
4. **Title** = the table's Title.
5. Don't click "Copy content from English". Touch no ACF field.
6. **Permalink → Edit**: WordPress proposes a slug from the title (e.g. `dangel-wellness`, `trepied`). **Replace it
   with the table's Slug** (the EN slug) → OK.
7. Click **Publish** once. Close the tab.
8. A path-J post never carries `_icl_lang_duplicate_of`. Its Copy rows (challenges, solutions, results, images) must
   equal EN in the batch check (F-4 prints `rows (target/EN)`). If `images` is `-` or below EN:
   1. **STOP** that item;
   2. Trash and delete the post (below);
   3. recreate it with path P (Type = Projects).

   The loader can't grow a repeater that has an image sub-field (amendment 3).

**If an item goes wrong (before any load; the posts are invisible):**
- Wrong title or slug: fix it in the same post and Update. The rule "never save FR/ES after load" doesn't apply yet.
- Wrong language, not linked, can't detach, or rows not equal to EN:
  1. Pages / Projects → that language → **Trash** → Trash tab → **Delete Permanently**;
  2. re-run the batch check;
  3. redo the item.
- An EN `modified` time changed, or the live site changed: **STOP** → restore the batch's backup (§A1).
- You clicked **Translate** by mistake: WPML → Translation Management → **Translation Jobs** → cancel the job. No post
  exists until a job completes.

#### A3. The checklist (18 items, 6 batches)
Row numbers keep 5c (1-13) and 5c-rest (14-17). Row 18 is new (F-2).

Rules behind the values:
- **Slug = the EN slug.**
- Titles:
  - pages = the dictionary nav labels (D-6 (a));
  - cases = the export's hero heading (D-6 (a), 5c-rest §8 T5 / T6);
  - home and FR projects = D-8 A.
- EN IDs are F-1's; rev 0.3 confirms them.

| # | Batch | Path | Type | Source EN slug (ID) | Lang | Title | Slug |
|---:|---:|---|---|---|---|---|---|
| 1 | 1 (pilot P) | P | page | `services` (34) | fr | Services | `services` |
| 10 | 2 (pilot J) | J | project | `fashion-company-ecommerce` (270) | fr | Dangel Wellness | `fashion-company-ecommerce` |
| 2 | 3 | P | page | `packages` (36) | fr | Forfaits | `packages` |
| 3 | 3 | P | page | `about-magneto` (32) | fr | À propos | `about-magneto` |
| 4 | 3 | P | page | `contact` (41) | fr | Contact | `contact` |
| 16 | 3 | P | page | `home` (2) | fr | Accueil | `home` |
| 18 | 3 | P | page | `projects` (38) | fr | Réalisations | `projects` |
| 11 | 4 | J | project | `shamaniccas-ecommerce` (224) | fr | Shamanicca | `shamaniccas-ecommerce` |
| 14 | 4 | J | project | `trepied-trepied-ca` (498) | fr | Trépied | `trepied-trepied-ca` |
| 5 | 5 | P | page | `services` (34) | es | Servicios | `services` |
| 6 | 5 | P | page | `packages` (36) | es | Paquetes | `packages` |
| 7 | 5 | P | page | `about-magneto` (32) | es | Sobre Magneto | `about-magneto` |
| 8 | 5 | P | page | `contact` (41) | es | Contacto | `contact` |
| 9 | 5 | P | page | `projects` (38) | es | Proyectos | `projects` |
| 17 | 5 | P | page | `home` (2) | es | Inicio | `home` |
| 12 | 6 | J | project | `fashion-company-ecommerce` (270) | es | Dangel Wellness | `fashion-company-ecommerce` |
| 13 | 6 | J | project | `shamaniccas-ecommerce` (224) | es | Shamanicca | `shamaniccas-ecommerce` |
| 15 | 6 | J | project | `trepied-trepied-ca` (498) | es | Trépied | `trepied-trepied-ca` |

**Numbered sequence:**
1. A1 backup.
2. Batch 1, then check.
3. **Pilot gate P:** item 1 `PASS`, `dup_of none`, EN `modified` unchanged.
4. Batch 2, then check.
5. **Pilot gate J:** item 10 `PASS`, rows equal to EN including `images`, `dup_of none`.
6. Batch 3, then check.
7. Batch 4, then check. **FR is complete** (Plan B never depends on ES).
8. ES backup.
9. Batch 5, then check.
10. Batch 6, then check. Send the final file to the Architect.

Each post takes about 6-8 min.

#### A4. Check after each batch (read-only, ≈ 3 min)
```bash
N=1; L=fr   # per batch: N=1..6; L=fr for batches 1-4, es for 5-6
{
  sg "wp eval-file - lang=$L" < "$REPO/scripts/phase-5c/check-translations.php"
  sg "wp eval-file -" < "$RB/inventory.php"
  for u in / /services /projects /projects/trepied-trepied-ca /fr /es/services /esto-no-existe; do curl -s -o /dev/null -w "%{http_code} $u\n" "$SITE$u"; done
  curl -s "$SITE/sitemap.xml" | grep -c '<loc>'
} 2>&1 | tee "$RB/A-batch$N-$L-$(date +%Y%m%d-%H%M).txt"
```

| After | check-translations | inventory | Live |
|---|---|---|---|
| Batch 1 | `#1 PASS … "Services" … dup_of none`; `1/6 PASS` | item 1: fr, EN 34's trid, `publish`, `dup_of=none`; every EN `modified` = A0 | = A0 |
| Batch 2 | `#10 PASS … "Dangel Wellness"`; rows `project_data_* 3/3 4/4 3/3 · images 5/5`; `2/6 PASS` | item 10 as above | = A0 |
| Batch 3 | rows 1-4 PASS; `#16 PASS (info) … "Accueil"`; `5/6 PASS` | + items 2-4, 16, 18. Row 18 is checked **only** here: `projects` fr, EN 38's trid, "Réalisations" | = A0 |
| Batch 4 | `6/6 PASS`; `#14 PASS (info) … "Trépied"`; `media WARN rows: 0 (info rows 14-17: 0)` | 9 FR posts; dup rows `0` | = A0 |
| Batch 5 | rows 5-9 PASS; `#17 PASS (info) … "Inicio"`; `5/7 PASS` | + 6 ES posts | = A0 |
| Batch 6 | `7/7 PASS`; `#15 PASS (info)`; `media WARN rows: 0` | **18** FR/ES content posts + 2 privacy; dup rows `0`; EN unchanged | = A0 |

Also required on every row:
- no `(checklist title: …)` suffix;
- `rows (target/EN)` equal on every Copy repeater.

**STOP** on any of:
- a FAIL on an item of the batch;
- `dup_of` ≠ none;
- a title or slug difference;
- rows ≠ EN;
- an EN `modified` change;
- a live status or sitemap count ≠ A0.

**Part A done** = batch 6 matches. The Architect records "Part A PASS" in rev 0.3.

### Part B — preparation before release day

#### B1. Production media (Mon 11-23; Mauricio, ≈ 30-40 min; after Part A, before the rehearsal dump)
Its own backup: `F="$RB/prod-media-before-$(date +%Y%m%d-%H%M).sql"; sg "wp db export -" > "$F" && tail -n 1 "$F"`.

**Rules:**
- Admin-bar language = **English** throughout. An attachment uploaded under FR / ES belongs to that language.
- Upload the files **from** `~/Local Sites/magneto-cms-2/app/public/wp-content/uploads/2026/11/`, so the names match
  F-7.
- Upload only; **don't attach the files to any post or field** (that happens on release day).

| ☐ | File | Then set in Media → the attachment | Used on release day by |
|---|---|---|---|
| ☐ M-1 | `magneto-hero-phone-1.png` | Title `magneto-hero-phone`; Alt empty | C-3 home hero |
| ☐ M-2 | `ico-layout-template.svg` | Title `ico-layout-template`; Alt empty | C-3 featured row 1; C-7 Services row 1 icon |
| ☐ M-3 | `ico-wrench.svg` | Title `ico-wrench`; Alt empty | C-3 featured row 2; C-7 Services row 2 icon |
| ☐ M-4 | `ico-shield-check.svg` | Title `ico-shield-check`; Alt empty | C-3 featured row 3; C-7 Services row 3 icon |
| ☐ M-5 | `magneto-build-1.jpg` | Title `magneto-build`; Alt empty | C-7 Services row 1 image |
| ☐ M-6 | `magneto-fix.jpg` | Title `magneto-fix`; Alt **`Illustration of a website problem being repaired`** | C-7 Services row 2 image |
| ☐ M-7 | `magneto-care-1.jpg` | Title `magneto-care`; Alt empty | C-7 Services row 3 image |
| ☐ M-8 | `ico-languages.svg` | Title `ico-languages`; Alt empty | C-7 Services row 5 icon |
| ☐ M-9 | `ico-calendar-check.svg` | Title `ico-calendar-check`; Alt empty | C-7 Services row 6 icon |
| ☐ M-10 | `ico-chart-no-axes-column.svg` | Title `ico-chart-no-axes-column`; Alt empty | C-7 Services row 7 icon |

Steps:
1. **Media → Add New** (English).
2. Drop the 10 files.
3. Open each attachment and set Title and Alt per the table. Click **Update** if you changed anything.

**Check (read-only):**
```bash
sg "wp eval-file -" < "$RB/inventory.php" | grep '^media ' | tee "$RB/B1-media-$(date +%Y%m%d-%H%M).txt"
```
- Expected: 10 lines `media <file>: <id>:en[,<id>:fr,<id>:es]`. The EN ID is required. WPML may add FR / ES copies
  (it did locally: 703 / 704 for 702).
- **Write the 10 EN IDs in `notes.md`.**
- Also open `$SITE` → unchanged, since nothing references the files yet.

**STOP and roll back** if:
- a file is renamed (`-2`, `-scaled`): delete it and re-upload, or tell the Architect;
- an SVG is refused: check that svg-support is active; don't change any setting without telling the Architect;
- an attachment shows language fr / es: delete it and re-upload in English.

Rollback: Media → delete the uploaded attachments **permanently**, or restore `prod-media-before-…`.

#### B2. Loader production mode (Dev; D-R2 approved with conditions)
Change only the host guard of `scripts/phase-5c/load-content.php` (`:37-41` and the header comment `:1-17`).
**Every other guard is untouched and runs exactly as today:**
- backup required, `.sql`, < 3 h (`:55-69`);
- source sha (`:84-87`);
- targets (`:186-202`);
- row rules, read-back, probe.

The runbook's second 0-change dry-run stays a required step.

1. The guard logic moves into a pure function in a new file, `scripts/phase-5c/target-guard.php`:
   `p5c_target_guard( ?string $target, string $home_url ): ?string`. It returns `null` (allowed) or the abort message.
   The loader requires it and calls it first, before any other guard. The allowed pairs are exact, after
   `untrailingslashit`:

   | `target=` | `home_url()` must equal |
   |---|---|
   | absent | `http://magneto-cms-2.local` (unchanged default) |
   | `production` | `http://cms.magnetomarketing.co` (F-5) |
   | `rehearsal` | `http://magneto-prod-rehearsal.local` (§B3; D-R2a) |

   Anything else aborts: an unknown or empty `target`, case variants, or a host / target mismatch. **A production host
   with no `target` aborts.** No flag or env var overrides this.
2. The first log line is `TARGET <local|production|rehearsal> · home_url <…> · lang <…> · DRY-RUN|REAL RUN`.
3. **Committed tests:** `scripts/phase-5c/target-guard.test.php`, a plain PHP script (no WordPress). Run it with
   Local's PHP 8.2.35 (`php scripts/phase-5c/target-guard.test.php`) and record the binary path, as in the 5c-rest
   report `:327`. It exits non-zero on any failure and covers at least:
   1. no target + local host → allowed;
   2. **no target + production host → abort**;
   3. no target + rehearsal host → abort;
   4. `production` + production host → allowed (also with a trailing `/`);
   5. `production` + local host → abort;
   6. `production` + `https://cms.magnetomarketing.co` → abort (exact match);
   7. `rehearsal` + rehearsal host → allowed;
   8. `rehearsal` + production host → abort;
   9. `PRODUCTION`, `prod` and `` (empty) → abort.
4. **Integration proof (scratchpad stub harness, as 5c AC-3):** with the guard aborting, the write log is empty, and
   no other guard's output changes.
5. Gate: `php -l` on the three PHP files; the completion gate; lint ≤ 65 / 76.
6. Mauricio runs a local `lang=en|fr|es dry-run` → `0 changes (0 appended rows)` each (no regression).
7. B2 is proven on real WordPress by the rehearsal (§B3 RH-4).

**The release bundle** (after B2 is merged; Mauricio):
```bash
SHA=$(git -C "$REPO" rev-parse --short=12 origin/master); echo "$SHA" >> "$RB/notes.md"
git -C "$REPO" archive --format=tar.gz -o "$RB/bundle-$SHA.tar.gz" "$SHA" scripts/phase-5c docs/content
for f in docs/content/magneto-copy-en.md docs/content/magneto-copy-fr-CA.md docs/content/magneto-copy-es.md scripts/phase-5c/load-content.php scripts/phase-5c/target-guard.php scripts/phase-5c/check-translations.php scripts/phase-5c/content/en.json scripts/phase-5c/content/fr.json scripts/phase-5c/content/es.json; do printf '%s  %s\n' "$(git -C "$REPO" show "$SHA:$f" | shasum -a 256 | cut -d' ' -f1)" "$f"; done | tee "$RB/bundle-$SHA.sha256"
```
- The `.md` hashes must equal the pins: en `364f661f…`, fr-CA `b79f5ff7…`, es `737b0084…`.
- The same bundle is used by the rehearsal (§B3) and by production (C-0).
- **Any later change to `scripts/phase-5c` or `docs/content` means a new bundle and a new rehearsal.**

#### B3. Rehearsal on a copy of production (D-R3; Wed 11-25 – Fri 11-27)
This rehearsal replaces every expectation drawn from local numbers. It runs the whole of Part C (C-1 … C-9) on a
restored production dump, with the same plugins and the same PHP (F-6). It also proves B2 before B2 ever targets
production.

**RH-0 Preconditions (sequencing, see "Order of operations"):**
- **Part A PASS: all 18 FR/ES posts exist in production.**
- **§B1 done: the 10 media files exist in production.**
- B2 merged; the bundle built.

**The dump must be taken after the 18 posts and the media exist, never before.** A dump without them gives a rehearsal
that aborts at the first missing translation (`load-content.php:186-189`) or that doesn't match production.

**Content freeze: from RH-1 until C-14.** No production content or media edit at all. Any edit means RH-1 … RH-6 run
again.

**RH-1 Verify, then dump (read-only on production):**
```bash
RHC="$RB/RH1-predump-check-$(date +%Y%m%d-%H%M).txt"
{ sg "wp eval-file - lang=fr" < "$REPO/scripts/phase-5c/check-translations.php"; sg "wp eval-file - lang=es" < "$REPO/scripts/phase-5c/check-translations.php"; sg "wp eval-file -" < "$RB/inventory.php"; } 2>&1 | tee "$RHC"
```
- **Expected:** `6/6 PASS` and `7/7 PASS`; info rows 14-17 PASS; row 18 present; dup rows `0`; 10 `media … : <id>:en`
  lines (none `MISSING`). Otherwise **STOP**: the dump would not contain the release state.
- Then dump:
  ```bash
  RHF="$RB/prod-rehearsal-source-$(date +%Y%m%d-%H%M).sql"; sg "wp db export -" > "$RHF" && tail -n 1 "$RHF" && shasum -a 256 "$RHF" | tee -a "$RB/notes.md"
  ```
- Write the dump time in `notes.md`: **the freeze starts now.**

**RH-2 The rehearsal site (Local; it never touches production):**
1. Local → **+** → create a site named **"Magneto Prod Rehearsal"**, domain **`magneto-prod-rehearsal.local`**,
   PHP **8.2.35**, with the same web server and MySQL as "Magneto CMS 2".
2. Plugins = the F-6 set. Copy `wp-content/plugins/` from "Magneto CMS 2" (same versions since 2026-11-19), then
   `wp plugin list` in the new site's shell = A0.2b.
3. In the new site's **Open site shell**: import, then **replace every production CMS URL with the rehearsal URL
   (D-R2a)**.
   - The rehearsal site must never hold a link, redirect or `home` / `siteurl` that points at
     `cms.magnetomarketing.co`. If it did, its admin would send the browser to the real production admin.
   - `wp search-replace` handles PHP-serialized values (`--precise`).
   - `guid` is skipped (the WordPress convention; it is never used as a link).
   - The `.sql` file itself is not modified.
   ```bash
   wp db import "<RHF path>"
   wp search-replace 'https://cms.magnetomarketing.co' 'http://magneto-prod-rehearsal.local' --all-tables --precise --skip-columns=guid --report-changed-only
   wp search-replace 'http://cms.magnetomarketing.co' 'http://magneto-prod-rehearsal.local' --all-tables --precise --skip-columns=guid --report-changed-only
   wp search-replace 'cms.magnetomarketing.co' 'magneto-prod-rehearsal.local' --all-tables --precise --skip-columns=guid --report-changed-only
   wp search-replace 'cms.magnetomarketing.co' 'magneto-prod-rehearsal.local' --all-tables --precise --skip-columns=guid --dry-run
   wp option get home; wp option get siteurl
   wp cache flush
   ```
   - The three passes, in order:
     1. full https URLs;
     2. full http URLs (the stored `home` / `siteurl`, F-5);
     3. any remaining bare host (protocol-relative `//cms…` or JSON-escaped `https:\/\/cms…` values).
   - **Expected:** the dry-run (line 5) ends with `Success: 0 replacements to be made.` and both options print
     `http://magneto-prod-rehearsal.local`. Otherwise **STOP**: don't open the rehearsal admin.
   - Contact email addresses (`…@magnetomarketing.co`) and frontend links (`www.magnetomarketing.co`) don't contain
     `cms.magnetomarketing.co` and stay as they are.
   - Before every rehearsal admin action, the address bar must show `magneto-prod-rehearsal.local/wp-admin`.
4. If WPML asks whether the site **moved** or is a **copy**, answer **copy / development site**. **Never** "moved",
   and never register or unregister a key on this site. If the prompt is unclear: **STOP**.
5. Media files are not needed: the attachment IDs exist in the dump, and the admin picks them by name.

**RH-3 The bundle on the laptop:**
```bash
mkdir -p "$RB/rehearsal/$SHA" && tar -xzf "$RB/bundle-$SHA.tar.gz" -C "$RB/rehearsal/$SHA"
```
In the rehearsal shell, the loader is `wp eval-file "$RB/rehearsal/$SHA/scripts/phase-5c/load-content.php" target=rehearsal …`
(the same files as production).

**RH-4 B2 proofs on real WordPress (rehearsal shell):**
- `… load-content.php lang=en dry-run` (no target) → aborts with the host message.
- `… target=production lang=en dry-run` → aborts (host ≠ production).
- `… target=rehearsal lang=en dry-run` → runs. Before C-3 it is expected to abort at `home/en … service`
  ("content has 3 rows, EN has 2") (see C-1.5).

**RH-5 Part C on the rehearsal:**
- Run C-1 … C-9 in order, with the admin steps in `http://magneto-prod-rehearsal.local/wp-admin` (check the address
  bar).
- Backups: `wp db export ~/Documents/projects/magneto/backups/release/rehearsal/<step>.sql`.
- `target=rehearsal` everywhere.
- Each output goes to `$RB/rehearsal/RH-C<n>-<what>.txt`.
- C-10 … C-14 (privacy, Vercel, promote) are not rehearsed.

**RH-6 Dev (read-only, local hosts only):**
1. **Expected table:** every C-step dry-run line (`<post>/<lang>: N changes (M appended rows), K unchanged`, the run
   total, the `+ append` and `↺ copy-sync` lines, the media report) is copied into the Dev report as the release-day
   "Expected". Cross-check against F-11 (11 appends per language); explain any difference.
2. **Equality with the approved local state:** a GraphQL read-back of the rehearsal site against the local CMS, on
   all 27 posts × languages of the content files, by `language` + `name`. This is the same comparison as 5c-rest AC-7
   (render-filter normalization only). Expected: 0 mismatches. Also:
   - FR/ES home rows 3 / 2;
   - Trépied 3/4/6;
   - `display_order` 10 / 20 / 40 on all 9 projects;
   - titles;
   - Services and home media by EN-original **file name** (IDs differ from local).
3. Any difference means **no-go** until it is explained.

**RH-7** Keep the rehearsal site until 12-10, then delete it (it holds production user data).

#### B4. Other preparation (go/no-go inputs)

| # | Item | Who | By | Done when |
|---|---|---|---|---|
| P-1 | rev 0.3 Approved (D-R6 reviewed, IDs filled) | Mauricio + Senior Architect | Mon 11-23 | Status Approved |
| P-2 | 5f launch ACs on the Preview with `G-N2YZ6SG2WM`; GA Developer-traffic filter **Active** ≥ 36 h before (5f D-F4) | Mauricio | Sun 11-29 | 5f AC-L1/L2/L3 Preview recorded |
| P-3 | Privacy: final Notion text ready for every locale to enable (G-1…G-7; G-8 for ES), GA §5 included (published at C-10) | Mauricio | Mon 11-30 | texts ready |
| P-4 | 5c-rest AC-10 (FR-CA / ES approval) closed | Mauricio | Mon 11-30 | recorded in the 5c-rest report |
| P-5 | Release deployment: every launch PR merged with its preview checked (WORKFLOW); the `master` deployment ID noted | Mauricio | Mon 11-30 | ID in `notes.md` |
| P-6 | Dev access for release day (D-R5): a Claude Code allow rule limited to `curl` **POST/GET to `https://cms.magnetomarketing.co/graphql`**, with no cookie, no `Authorization` header and no other production URL. It is added on release day and removed after C-14 | Mauricio | Wed 12-02 | rule text in `notes.md` |

**GNG-0, Tue 12-01:**
- Part A PASS, §B1 done, B2 merged;
- **RH-6 0 mismatches**;
- P-1 … P-5 done;
- G-8 decided (`ENABLED_LOCALES` = `en,fr,es` or `en,fr`);
- 5e in or out (G-4b if in);
- the effective date holds.

Any "no": release moves to Thu 12-10. **No Part C write happens before GNG-0.**

### Part C — release day (Thu 12-03)
- Quiet window, at a low-traffic hour.
- Outputs: `| tee "$RB/C<n>-<what>.txt"`.
- **"Expected" = the RH-6 table.**
- **⚠** marks irreversible effects.

Helpers (every new terminal, after the common setup):
```bash
REL='$HOME/magneto-release/<SHA>'; BK='$HOME/magneto-release/backups'   # single quotes: the server expands $HOME
load() { sg "wp eval-file $REL/scripts/phase-5c/load-content.php target=production $*"; }
dump() { sg "wp db export $BK/$1 && ls -l $BK/$1" && scp -i ~/.ssh/siteground_magneto_v2 -P 18765 "$SG_HOST:magneto-release/backups/$1" "$RB/" && shasum -a 256 "$RB/$1"; }
```

**Restore (every rollback):**
```bash
sg "wp db import $BK/<name>.sql && wp cache flush"
```
Then Site Tools → Dynamic Cache → **Flush**. Fallback: `sg "wp db import -" < "$RB/<name>.sql"`.

**C-0 Window open (≈ 15 min).**
1. Upload the bundle:
   ```bash
   scp -i ~/.ssh/siteground_magneto_v2 -P 18765 "$RB/bundle-$SHA.tar.gz" "$SG_HOST:"
   ssh -i ~/.ssh/siteground_magneto_v2 -p 18765 "$SG_HOST" "mkdir -p magneto-release/$SHA magneto-release/backups && tar -xzf bundle-$SHA.tar.gz -C magneto-release/$SHA && rm bundle-$SHA.tar.gz && cd magneto-release/$SHA && sha256sum docs/content/*.md scripts/phase-5c/*.php scripts/phase-5c/content/*.json"
   ```
2. In `notes.md`, record:
   - the start time;
   - the current Production deployment ID (the Instant Rollback target);
   - `SHA`;
   - the media IDs (§B1).
3. Stop if a server hash differs from `bundle-$SHA.sha256`.

**C-1 Preflight (read-only, ≈ 20 min). Gate G-1.**
1. `sg "wp option get home; wp plugin list --fields=name,status,version --format=csv; php -v | head -1"`.
   Expected: `http://cms.magnetomarketing.co`, the F-6 versions, PHP 8.2.35.
2. Schema: run the query below. Expected: no `errors`; `a` has `service`, `b` has `testimonials`, `c` has
   `displayOrder` and `images`.
   ```bash
   curl -s -m 20 "$GQL" -H 'content-type: application/json' -d '{"query":"{ a: __type(name:\"HomeFeaturedServices\") { fields { name } } b: __type(name:\"HomeTestimonialsSection\") { fields { name } } c: __type(name:\"ProjectsProjectData\") { fields { name } } }"}'
   ```
3. Run check-translations `lang=fr` / `lang=es` and the inventory. Expected:
   - `6/6` and `7/7` PASS; info rows 14-17 PASS; row 18 OK;
   - dup rows `0`;
   - the media lines = `notes.md`;
   - **every `modified` time ≤ the RH-1 dump time (content freeze, A-5).**
4. `load lang=en dry-run` → the same abort as RH-4: `home/en … service`, content 3 vs EN 2.
5. Live baseline: the A0.2h + A0.2i lines.

| | |
|---|---|
| Stop if | anything differs. |
| Rollback | none (nothing written). |

**G-1:** all as expected → enter the write window.

**C-2 Master backup B0 (≈ 10 min).**
1. Site Tools → Backups → `release-before-<yyyymmdd-hhmm>`.
2. `dump prod-release-before-$(date +%Y%m%d-%H%M).sql`.

Stop if either is missing. **Keep B0 ≥ 30 days.**

**C-3 D-9 B on the EN home (admin, ≈ 15 min). ⚠ Live EN changes start here (F-12).** Rules: one Update, no
reordering, backup C-2 first (D-R4).

Pages → English → **Home** → Edit:
1. *Hero* → **Image** = `magneto-hero-phone-1.png` (M-1).
2. *Featured services*:
   - row 1 *Service icon* = `ico-layout-template.svg`;
   - row 2 = `ico-wrench.svg`;
   - **Add Row** at the end → row 3 icon = `ico-shield-check.svg`.
   
   Row 3 text stays empty (the EN load fills it).
3. *Testimonials*: remove **row 4**, then **row 3** ("−"). **Never drag.** Rows 1-2: remove the *Thumb* image (×).
4. Touch nothing else, and not "Synchronise translations". **Update** once. Close.

| | |
|---|---|
| Expected | "Page updated". |
| Stop if | an error, or a reorder. |
| Rollback | Restore B0. |

**C-4 §7 follow-up (≈ 10 min).**
1. `sg "wp cache flush"` + Dynamic Cache flush.
2. check-translations fr / es: rows 16 / 17 show `service 3/3 · testimonials 2/2` and
   `media ok service.service_icon (3 rows)`.
3. `load lang=en dry-run` = Expected C-4.

| | |
|---|---|
| Stop if | the counts ≠ 3 / 2, any abort, or the totals ≠ Expected. |
| Rollback | Restore B0. |

**C-5 Titles, then display order by EN admin saves (D-R9; ≈ 20 min). ⚠ Live case titles change.**
1. `dump prod-release-titles-$(date +%Y%m%d-%H%M).sql`.
2. Slugs (expected `fashion-company-ecommerce`, `shamaniccas-ecommerce`, `trepied-trepied-ca`):
   ```bash
   sg "wp post get <EN270> --field=post_name; wp post get <EN224> --field=post_name; wp post get <EN498> --field=post_name"
   ```
3. Titles (5c-rest §8 T1-T3):
   ```bash
   sg 'wp post update <EN270> --post_title="Dangel Wellness"'
   sg 'wp post update <EN224> --post_title="Shamanicca"'
   sg 'wp post update <EN498> --post_title="Trépied"'
   ```
4. **Display order, one admin save per EN project, in this order: Dangel 10, Shamanicca 20, Trépied 40.**
   Projects → English → the project → Edit:
   1. *Display order* = the value;
   2. touch nothing else: not the title, not the permalink, no row, no image;
   3. **Update** once and close;
   4. right after each save, run `sg "wp post get <ID> --field=post_name"`. **It must still be the EN slug** (F-10
      slug episode).
   
   WPML Copy carries the value to FR/ES (F-8).
5. `sg "wp post list --post_type=project --post__in=<EN270>,<EN224>,<EN498> --fields=ID,post_title,post_name,post_status"`
   and the inventory. Expected:
   - the new titles, unchanged slugs, `publish`;
   - `display_order=10/20/40` on the EN projects **and on their FR/ES translations**.
6. check-translations fr / es still PASS.

| | |
|---|---|
| Stop if | a slug or status changed, a FR/ES `display_order` ≠ EN, or a FAIL appears. |
| Rollback | Restore `prod-release-titles-…`, or B0. |
| Why before C-6 | The admin saves re-format the EN `project_description` and add empty Copy meta (F-10). The EN load right after restores the HTML, and that re-format is already in the rehearsal's C-6 Expected. |

**C-6 EN load (≈ 20 min). ⚠ The live EN body copy changes.**
1. `B=prod-release-en-$(date +%Y%m%d-%H%M).sql; dump $B`
2. `load lang=en dry-run` = Expected C-6. Cross-check: 11 `+ append` lines, no `media WARN`.
3. `load lang=en backup=$BK/$B`. Expected: `all read back ok`, `(appended)` marks, the probe unchanged.
4. Flush both caches.
5. `load lang=en dry-run` → `0 changes (0 appended rows)`.

| | |
|---|---|
| Stop if | totals ≠ Expected, an abort, a read-back failure (`:545`), a probe change, or the second dry-run ≠ 0. |
| Rollback | Restore `$B`, or B0. |

**C-7 Services images and icons (D-7 B; admin, ≈ 25 min).**
1. `dump prod-release-svcmedia-$(date +%Y%m%d-%H%M).sql`.
2. Pages → English → **Services** → Edit. No row added, deleted or reordered; no text.

   | Row | *Image* | *Icon* |
   |---|---|---|
   | 1 | `magneto-build-1.jpg` | `ico-layout-template.svg` |
   | 2 | `magneto-fix.jpg` | `ico-wrench.svg` |
   | 3 | `magneto-care-1.jpg` | `ico-shield-check.svg` |
   | 4 | empty | `icon-target.svg` |
   | 5 | empty | `ico-languages.svg` |
   | 6 | empty | `ico-calendar-check.svg` |
   | 7 | empty | `ico-chart-no-axes-column.svg` |

   **Update** once. Close.
3. Flush both caches.
4. check-translations fr / es: rows 1 and 5 show `media ok services.Image (7 rows)` and
   `media ok services.icon (7 rows)`.
5. `load lang=en dry-run` = Expected C-7: the re-format on `services` only (`intro_body_html` + 7
   `description_html`). Then:
   - `load lang=en backup=$BK/prod-release-svcmedia-….sql`;
   - flush;
   - dry-run → 0 / 0.

| | |
|---|---|
| Stop if | a `media WARN`, or any change ≠ Expected. |
| Rollback | Restore `prod-release-svcmedia-…`. |

**G-2 (EN complete).** The Dev's read-only GraphQL read-back (D-R5) of EN against the content files, and the live EN
routes 200. **Go** → FR. **No-go** → restore B0, end the day (12-10 fallback).

**C-8 FR load (≈ 20 min; invisible).** The C-6 sequence with `lang=fr`:
1. dump `prod-release-fr-…`;
2. dry-run = Expected C-8 (11 `+ append`, `↺ copy-sync`, no `media WARN`);
3. run, flush;
4. dry-run 0 / 0;
5. check-translations fr 6/6.

Rollback: restore `prod-release-fr-…`. EN is unaffected (the probe shows it).

**C-9 ES load (≈ 20 min; invisible; D-R8: also run if ES isn't enabled).** The same with `lang=es`. Rollback:
restore `prod-release-es-…`.

**C-10 Privacy §5 (≈ 15 min).**
1. Re-run A0.4. Expected for each locale to enable: `publish`; the GA §5, i.e. the content contains "Privacy choices"
   / "Choix de confidentialité" / "Opciones de privacidad"; no Version B text; dates = G-3.
2. Where it is not the GA §5 (likely, F-14): in admin, open that locale's privacy page, replace §5 with the **final
   Notion** GA §5, and Update once. FR/ES admin edits are allowed here (privacy §6).
3. Re-check with step 1.

| | |
|---|---|
| Stop if | the text can't be made right. Then launch as Version B: no GA ID in C-11 (5f §9). |
| Rollback | WP revisions. |

**C-11 Vercel env (≈ 10 min).** Settings → Environment Variables.
1. **Production:**
   - `ENABLED_LOCALES` `en` → `en,fr,es` (Plan B: `en,fr`);
   - `NEXT_PUBLIC_GA_ID` unset → `G-N2YZ6SG2WM` (GA-on only).
2. Preview: the same `ENABLED_LOCALES`; the GA ID is already set (F-13).
3. `ALLOW_UNTRANSLATED_LOCALES` is absent in every scope.
4. "Automatically expose System Environment Variables" is on.

Rollback: restore the previous values (nothing is built yet).

**C-12 Release preview check (≈ 30 min). Gate G-3.**
1. The release `master` deployment (P-5) → **Redeploy** in Preview → Ready. Record the ID.
2. Build log: no TODO error; prerendered `/en|fr|es/projects/{3 slugs}` and `/…/privacy-policy` per enabled locale.
3. On the preview URL, second pass ≥ 60 s: V-2 … V-6 and 5f AC-L2 Preview.

**G-3:** pass → promote. Fail → fix, or §C-R. **No promote on a failed preview.**

**C-13 Promote (≈ 15 min). ⚠ The release is public.**
1. That deployment → **⋯ → Promote to Production**. Vercel rebuilds it with Production env (F-13).
2. Ready → record the **new** ID, the commit and the time.

⚠ Public FR/ES and new EN pages; GA collects after Accept.

**C-14 Post-promote verification (≈ 45-60 min). Gate G-4.** On `$SITE`, second pass ≥ 60 s after Ready.
- [ ] **V-1** Production build of the release commit; per-locale prerendered paths in the log; ID recorded (5f AC-L1).
- [ ] **V-2** **200** for `/`, `/fr`, `/es` and, under each prefix, `services`, `packages`, `projects`,
  `about-magneto`, `contact`, `privacy-policy` and the 3 cases (30 URLs; under Plan B the 10 `/es` URLs return 404 instead). **404** for
  `/esto-no-existe`, `/fr/esto-no-existe`, `/en/services`.
  ```bash
  for p in "" /fr /es; do for r in "" /services /packages /projects /about-magneto /contact /privacy-policy /projects/fashion-company-ecommerce /projects/shamaniccas-ecommerce /projects/trepied-trepied-ca; do u="$p$r"; [ -z "$u" ] && u=/; curl -s -o /dev/null -w "%{http_code} $u\n" "$SITE$u"; done; done; for u in /esto-no-existe /fr/esto-no-existe /en/services; do curl -s -o /dev/null -w "%{http_code} $u\n" "$SITE$u"; done
  ```
- [ ] **V-3** `<html lang>` = `en` / `fr-CA` / `es`; one `h1` per page.
- [ ] **V-4** 0 hits on the V-2 200 pages for:
  - `[FR TEST]`, `[ES TEST]`;
  - `Serving clients worldwide`, `Ready to stop guessing`, `Get Your Free Strategy Call`;
  - `Sales Funnel Development`;
  - `llamada de orientación`;
  - `Book a Strategy Call` outside `<header>`.
- [ ] **V-5** Mauricio, visual check of `/`, `/services` and one case in EN / FR / ES at 375 / 768 / 1440. Check:
  - the hero image;
  - 3 titled cards with distinct icons;
  - 2 testimonials without photos;
  - the Services images and icons;
  - the grid order Dangel → Shamanicca → Trépied;
  - no horizontal scroll.
- [ ] **V-6** D-L: privacy §7 items 1-5 (6 if 5e) per enabled locale.
- [ ] **V-7** 5f AC-L1 / AC-L2 Production (no analytics host before Accept; no debug marker; the visit in Realtime;
  Reject → no collection); AC-L3 iPhone.
- [ ] **V-8** `/sitemap.xml` lists `/privacy-policy` + 3 project URLs; `/robots.txt` unchanged.
- [ ] **V-9** The booking modal opens and closes on `/contact` per locale. **No submission.**
- [ ] **V-10** `dump prod-release-after-$(date +%Y%m%d-%H%M).sql` + a SiteGround backup `release-after-…`.
- [ ] **V-11** After V-10 is downloaded and hashed: `sg "rm -f $BK/*.sql"`. Delete the bundle on 12-10. Remove the
  P-6 allow rule.

**G-4:** every box ticked → done.

#### C-R. Rollback matrix (D-R6: open, pending Mauricio's review)

| When | Symptom | Action | Effect |
|---|---|---|---|
| Before C-3 | anything | stop | nothing changed |
| C-3 … C-9 | a stop condition | restore that step's dump, or B0 | live EN back to the dump's state. ⚠ visitors already saw the intermediate EN |
| C-10 … C-12 | privacy, env or preview fails | fix, or restore env values; no promote | the live old frontend shows the new EN CMS values. Acceptable ≤ 1 day; otherwise restore B0 |
| After C-13 | FR or ES only broken | Plan B: `ENABLED_LOCALES` without that locale → redeploy → promote (minutes) | ⚠ already-crawled FR/ES URLs return 404 |
| After C-13 | frontend broken | **Instant Rollback** to the C-0 deployment (no rebuild) | old frontend + new EN CMS values |
| After C-13 | GA wrong | 5f §9 reverse order: unset the ID → redeploy → verify → §5 to Version B | ⚠ hits already collected stay in GA |
| After C-13 | content broken in EN | Instant Rollback **and** restore B0 | the full pre-release state; every release-day CMS change is lost |

#### C-S. Irreversible effects and gates
**Irreversible:**
1. **C-3 onward:** visitors see changed EN content. A restore undoes the data, not what was seen.
2. **Every restore** discards later production changes (hence the freeze and the quiet window).
3. **C-13:** public FR/ES and new EN pages (caches, crawlers).
4. **C-13:** GA collection after Accept, and GA cookies on visitors' devices.
5. **V-11:** deleting the server dumps (the laptop copies and the SiteGround backups remain).

**Gates:**

| Gate | When | Criterion |
|---|---|---|
| GNG-0 | Tue 12-01 | inputs listed under §B4 |
| G-1 | C-1 | read-only preflight |
| G-2 | after C-7 | EN complete |
| G-3 | C-12 | preview check |
| G-4 | C-14 | post-promote verification |

## Files the Dev may touch
- `scripts/phase-5c/load-content.php`: the host-guard block and the header comment only (§B2). Every other guard is
  unchanged.
- `scripts/phase-5c/target-guard.php` (new): the pure guard function.
- `scripts/phase-5c/target-guard.test.php` (new): the committed guard tests.
- `docs/reports/release-runbook.md` (new). It contains:
  - the B2 proofs and the gate;
  - the RH-6 Expected table and the equality read-back;
  - the read-back of the Part A batch files;
  - the release-day evidence (G-2, V-1 … V-11).

Anything else is out of scope:
- `check-translations.php`, content files, `content.test.ts`, `src/`;
- `.env*`, ADRs, `AGENTS.md`, `CLAUDE.md`;
- any production action.

## Out of scope
- Any production write by an agent. Agent production access outside release day, or beyond read-only unauthenticated
  GraphQL (D-R5).
- Plugin changes (R-12 is closed).
- Brevo / 5e production steps beyond the D-L item 6 check; Phase 7 (hreflang, per-locale sitemap, the http
  `siteurl`); Phase 8 graphics beyond the approved local media.
- The post-launch Dangel slug change; the contract / cleanup phase; orphan testimonial meta (5c-rest R-8).

## Acceptance criteria
**Part A:**
- [ ] AC-A0: the A0 file and the A0.4 JSON are in `$RB`; rev 0.3 records IDs, plugins and EN row counts.
- [ ] AC-A1: `prod-A-before-*.sql` and `prod-A-before-es-*.sql` end with `-- Dump completed` and have their sha256
  recorded. A SiteGround backup exists before batch 1.
- [ ] AC-A2: batch 4 shows `lang=fr` `6/6 PASS` and batch 6 shows `lang=es` `7/7 PASS`; info rows 14-17 PASS with the
  §A3 titles; `media WARN rows: 0`; every `rows (target/EN)` is equal.
- [ ] AC-A3: the batch 6 inventory lists exactly **18** FR/ES page/project posts outside privacy. Each has the EN
  trid, the EN slug, `publish`, `dup_of=none` and the §A3 title. Row 18 is FR `projects` "Réalisations". Dup meta
  rows `0`.
- [ ] AC-A4: EN `modified` times, live statuses and the sitemap count are equal to A0.

**Part B:**
- [ ] AC-B1: 10 EN attachments, with the names, titles and alt texts of F-7, IDs in `notes.md`; live site unchanged.
- [ ] AC-B2-1: `git diff master -- scripts/phase-5c/load-content.php` touches only the header and the host-guard
  call.
- [ ] AC-B2-2: `target-guard.test.php` passes all cases of §B2 step 3, including **production host + no target →
  abort**.
- [ ] AC-B2-3: the stub-harness integration proof (`writes=0` on a guard abort); `php -l` clean; the completion gate
  passes with lint ≤ 65 / 76.
- [ ] AC-B2-4: Mauricio's local dry-runs `lang=en|fr|es` → `0 changes (0 appended rows)`.
- [ ] AC-B3-1: RH-4's three real-WordPress proofs, as expected.
- [ ] AC-B3-2: RH-5 C-1 … C-9 pass on the rehearsal site, every loader step ending in `0 changes (0 appended rows)`.
- [ ] AC-B3-3: RH-6 Expected table complete; the read-back against local has 0 mismatches.

**Part C:**
- [ ] AC-C1: G-1 … G-4 recorded with times.
- [ ] AC-C2: every loader step = Expected; `all read back ok`; probe unchanged; second dry-run 0 / 0.
- [ ] AC-C3: C-4 home `3/3 · 2/2`; C-5 `display_order` 10 / 20 / 40 in EN, FR and ES with slugs unchanged; C-7
  `media ok` rows 1 and 5.
- [ ] AC-C4: V-1 … V-11 ticked; the C-0 and C-13 deployment IDs recorded.

## Decisions

**Decided (Mauricio, 2026-11-19):**
- D-R1: removed (moot; R-12 closed, F-6).
- **D-R2: approved, inside this spec**, with the conditions of §B2.
- **D-R3: approved.** §B3 is its own step, and its totals are the only Expected values.
- **D-R4: approved.** Hero image + thumbnails removed in the D-9 B save (C-3).
- **D-R5: approved.** Read-only, release day only, allow rule scoped to the production GraphQL URL (P-6, F-16).
- **D-R7: approved.** 18 posts.
- **D-R8: approved.** Run the ES load even if ES is disabled at launch.
- **D-R9: three EN admin saves** (C-5 step 4), before the FR/ES loads, under the §8 rules.

  The Architect's view, as asked: a script is not materially safer here. Its advantages are real but small:
  - it fires no `save_post`, so no re-format and no empty Copy meta;
  - it removes the slug risk.

  Those effects are absorbed or caught:
  - the re-format is restored by the C-6 EN load that follows and is part of the rehearsal's Expected;
  - the empty Copy meta is harmless;
  - the slug is checked after every save.

  The admin route also proves the WPML Copy sync of `display_order` to FR/ES before their loads. The rehearsal runs
  the same saves first.

- **D-R2a: approved (Mauricio, 2026-11-19).** `target=rehearsal` → `http://magneto-prod-rehearsal.local`, exact and
  explicit, sharing every other line with `production`. The restored dump has every production CMS URL replaced and
  verified at 0 remaining (RH-2 step 3). Keeping the production URL in the copy was rejected: its admin links and
  redirects would open the real production admin.

**Open:**
- **D-R6.** Rollback matrix (§C-R): open until Mauricio reviews it from GitHub.

No ADR is needed:
- no new dependency, routing or data-model change;
- B2 is a guard change inside the release-day mechanism of ADR 0006 decision 4.

## Risks

| # | Risk | Mitigation |
|---|---|---|
| R-1 | A creation path behaves differently on WPML 5.4.0 (A-2) | Pilots P and J; per-batch check; Trash + delete; dump per language |
| R-2 | A post is left un-detached (path P), or path J leaves the rows empty | `dup_of` and `rows (target/EN)` in every check; the loader refuses a duplicate (`:201-202`); the path-J fallback to P |
| R-3 | Production content changes after the rehearsal dump, or the dump is taken before Part A / §B1 | Order of operations; RH-1 pre-dump check (18 posts + media); freeze RH-1 → C-14; the C-1.3 `modified` ≤ dump-time check; re-run RH on any change |
| R-4 | Production EN counts differ from A-3 | A0 now; rev 0.3; the rehearsal shows it anyway |
| R-5 | Visible mixed EN state on the old frontend during C-3 … C-13 (≈ 3 h) | Low-traffic hour; §B1 and P-3 done before; the G-2 restore option |
| R-6 | Stale first requests after a build | Second pass ≥ 60 s (F-15) |
| R-7 | Server disk quota for the dumps | A few MB each (5a: 3.5 MB); V-11 cleanup |
| R-8 | An admin save changes a slug (F-10) | Slug check after every C-5 save; stop condition |
| R-9 | Media uploaded under the wrong language or renamed | §B1 rules and check; `media ok` at C-4 / C-7 |
| R-10 | The WPML "moved / copy" prompt on the clone touches the production registration | RH-2 step 4: always "copy"; never register or unregister; STOP if unclear |
| R-11 | Part A slips past Sun 11-22 | FR first; small batches; re-check the 12-10 trigger |
| R-12 | B2 or the rehearsal compete with 5e (Mon 11-23 – Tue 11-24) for time | B2 ≈ 2 h; order agreed at P-1 |
| R-13 | ES privacy or labels not final (G-8) | Plan B at GNG-0 |

## Estimate

| Work | Agent | Mauricio |
|---|---:|---:|
| This spec (rev 0.1 + 0.2) | 4.5-5.5 h (done) | 45-60 min review |
| A0 + rev 0.3 | 0.75-1 h | 20-30 min |
| Part A: 18 posts, 6 checks, 2 backups | 0.5 h (read the files) | 2.5-3.5 h |
| §B1 media | 0.25 h (read the check) | 30-40 min |
| §B2 guard + tests + proofs + gate | 2-3 h | 10 min (3 local dry-runs) |
| §B3 rehearsal | 2-3 h (Expected table, equality read-back, report) | 2-3 h |
| §B4 P-2 … P-6 | — | 1.5-2.5 h |
| Release day C-0 … C-14 | 1.5-2.5 h (G-2 read-back, V-checks) | 4-5 h window |
| Report | 1 h | 15 min |
| **Total** | **≈ 12.5-17 h** | **≈ 12.5-17 h** |

## Appendix A — `inventory.php` (read-only; paste once in the laptop terminal)
SELECTs and `get_*` calls only. It prints:
- every page / project post with language, trid, source language, `dup_of` and `modified`;
- the Copy repeater counts and `display_order`;
- the media fields the release-day saves touch;
- the 10 new files with each attachment's language.

```bash
cat > "$RB/inventory.php" <<'PHP'
<?php
// Release runbook inventory (docs/specs/release-runbook.md: A0, A4, B1, C-1, C-5). READ-ONLY: SELECTs and get_* only.
global $wpdb;
$t = $wpdb->prefix;
echo 'home_url ' . home_url() . ' · prefix ' . $t . ' · PHP ' . PHP_VERSION . ' · ' . gmdate( 'Y-m-d H:i:s' ) . " UTC\n";
$rows = $wpdb->get_results(
	"SELECT p.ID, p.post_type, p.post_name, p.post_status, p.post_modified_gmt, p.post_title,
	        t.language_code, t.trid, t.source_language_code
	   FROM {$t}posts p
	   LEFT JOIN {$t}icl_translations t ON t.element_id = p.ID AND t.element_type = CONCAT( 'post_', p.post_type )
	  WHERE p.post_type IN ( 'page', 'project' ) AND p.post_status NOT IN ( 'auto-draft', 'inherit' )
	  ORDER BY t.trid, FIELD( t.language_code, 'en', 'fr', 'es' ), p.ID",
	ARRAY_A
);
echo "== posts: ID type slug status lang trid src dup_of modified_gmt title\n";
foreach ( $rows as $r ) {
	$dup = (string) get_post_meta( (int) $r['ID'], '_icl_lang_duplicate_of', true );
	echo implode( "\t", array( $r['ID'], $r['post_type'], $r['post_name'], $r['post_status'], $r['language_code'] ?: '-', $r['trid'] ?: '-', $r['source_language_code'] ?: '-', 'dup_of=' . ( '' === $dup ? 'none' : $dup ), $r['post_modified_gmt'], $r['post_title'] ) ) . "\n";
}
echo "== repeater rows and display_order (published posts)\n";
$reps = array( 'services', 'packages_elements', 'sections', 'service', 'testimonials', 'project_data_challenges', 'project_data_solutions', 'project_data_results', 'images' );
foreach ( $rows as $r ) {
	if ( 'publish' !== $r['post_status'] ) {
		continue;
	}
	$c = array();
	foreach ( $reps as $m ) {
		$v = get_post_meta( (int) $r['ID'], $m, true );
		if ( '' !== $v && null !== $v && ! is_array( $v ) ) {
			$c[] = $m . '=' . (int) $v;
		}
	}
	if ( 'project' === $r['post_type'] ) {
		$o   = (string) get_post_meta( (int) $r['ID'], 'display_order', true );
		$c[] = 'display_order=' . ( '' === $o ? '(empty)' : $o );
	}
	echo $r['ID'] . ' ' . ( $r['language_code'] ?: '-' ) . ' ' . $r['post_type'] . '/' . $r['post_name'] . ': ' . ( $c ? implode( ' ', $c ) : '—' ) . "\n";
}
echo "== media fields touched on release day (EN home + services; attachment IDs)\n";
foreach ( $rows as $r ) {
	if ( 'en' !== $r['language_code'] || 'page' !== $r['post_type'] || ! in_array( $r['post_name'], array( 'home', 'services' ), true ) ) {
		continue;
	}
	$keys = array( 'image' );
	for ( $i = 0; $i < 7; $i++ ) {
		$keys[] = "services_{$i}_Image";
		$keys[] = "services_{$i}_icon";
		$keys[] = "service_{$i}_service_icon";
		$keys[] = "testimonials_{$i}_thumb";
	}
	$out = array();
	foreach ( $keys as $k ) {
		$v = get_post_meta( (int) $r['ID'], $k, true );
		if ( '' !== $v && null !== $v ) {
			$out[] = $k . '=' . ( is_array( $v ) ? 'array' : $v );
		}
	}
	echo $r['ID'] . ' ' . $r['post_name'] . ': ' . ( $out ? implode( ' ', $out ) : '—' ) . "\n";
}
echo '== _icl_lang_duplicate_of meta rows: ' . $wpdb->get_var( "SELECT COUNT(*) FROM {$t}postmeta WHERE meta_key = '_icl_lang_duplicate_of'" ) . "\n";
echo '== attachments: ' . $wpdb->get_var( "SELECT COUNT(*) FROM {$t}posts WHERE post_type = 'attachment'" ) . ' · max ID ' . $wpdb->get_var( "SELECT MAX(ID) FROM {$t}posts WHERE post_type = 'attachment'" ) . "\n";
foreach ( array( 'magneto-hero-phone-1.png', 'magneto-build-1.jpg', 'magneto-fix.jpg', 'magneto-care-1.jpg', 'ico-layout-template.svg', 'ico-wrench.svg', 'ico-shield-check.svg', 'ico-languages.svg', 'ico-calendar-check.svg', 'ico-chart-no-axes-column.svg' ) as $f ) {
	$hits = $wpdb->get_results( $wpdb->prepare( "SELECT pm.post_id, t.language_code FROM {$t}postmeta pm LEFT JOIN {$t}icl_translations t ON t.element_id = pm.post_id AND t.element_type = 'post_attachment' WHERE pm.meta_key = '_wp_attached_file' AND pm.meta_value LIKE %s ORDER BY pm.post_id", '%/' . $wpdb->esc_like( $f ) ), ARRAY_A );
	$list = array();
	foreach ( $hits as $h ) {
		$list[] = $h['post_id'] . ':' . ( $h['language_code'] ?: '-' );
	}
	echo "media {$f}: " . ( $list ? implode( ',', $list ) : 'MISSING' ) . "\n";
}
PHP
grep -nE "update_|delete_|add_(post_)?meta|wp_(insert|update|delete)_|->query\(|->(insert|update|delete|replace)\(" "$RB/inventory.php" || echo "read-only: OK"
```
Expected last line: `read-only: OK`. Any match: **STOP**, because the paste is damaged.
