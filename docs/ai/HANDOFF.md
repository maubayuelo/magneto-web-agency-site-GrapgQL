# HANDOFF — Magneto trilingual site (state as of 2026-10-26 19:50 EDT)

Purpose: let any assistant pick up this project mid-phase.
- **GPT (chat) takes the "Senior Architect" role** (reviews, decisions, step-by-step guidance for Mauricio).
- **Codex in VS Code takes the "Dev" role** (implements approved specs). It may also take the "Architect" role (writes specs).
- Read this file first, then `AGENTS.md` (single source of truth for code rules; Codex reads it natively; `CLAUDE.md` imports it).

---

## 1. Project in one paragraph
Mauricio (Montreal, front-end dev / UX-UI, works full time, ~15–20 h/week for this) is rebuilding his agency site
**Magneto** as a trilingual site (EN / FR-CA / ES) with a new 2026 positioning ("web builder": BUILD / FIX / CARE).
Frontend: Next.js 15.5 App Router on Vercel. CMS: headless WordPress on SiteGround with ACF PRO + WPML + WPGraphQL.
The work is also **career evidence** (agent harness, release engineering, schema-as-code, content loader, LLM QA),
so every claim must stay honest and verifiable.

## 2. Where things are
| Thing | Location |
|---|---|
| Repo | `github.com/maubayuelo/magneto-web-agency-site-GrapgQL` (default branch `master`) |
| Local checkout | `/Users/maubayuelo/Documents/projects/magneto/web-app-GrapgQL` |
| Spec worktree (temporary) | `/Users/maubayuelo/Documents/projects/magneto/web-app-GrapgQL-spec-runbook` (branch `spec/phase-5a-runbook`) |
| Local CMS | Local app site "Magneto CMS 2" → `http://magneto-cms-2.local` (WP-CLI only inside Local's "Open site shell") |
| Production CMS | `https://cms.magnetomarketing.co` (SiteGround) |
| Production frontend | Vercel project `magneto-web-agency-site` (live domain magnetomarketing.co) |
| SSH (prod) | `ssh -o IdentitiesOnly=yes -i ~/.ssh/siteground_magneto_v2 -p 18765 u3112-w527ltde781s@giowm1219.siteground.biz` then `cd ~/www/cms.magnetomarketing.co/public_html` (old key `magneto-mac` was rotated and deleted 2026-10-26) |
| Backups | `~/Documents/projects/magneto/backups/` (subfolders `phase-3b/`, `phase-5a/`) |
| Canonical copy | Notion: Magneto → 6. Brand & Website → "Magneto Website Copy — 2026 Builder Positioning" → pages "Magneto's Page Copy / EN", "/ FR-CA", "/ ES". Exported unedited to `docs/content/magneto-copy-{en,fr-CA,es}.md` (Notion stays canonical; edit Notion, then re-export) |
| Docs | `AGENTS.md`, `CLAUDE.md`, `docs/ai/WORKFLOW.md`, `docs/ai/WP-SETUP.md`, `docs/adr/0001–0006`, `docs/specs/`, `docs/reports/`, `docs/acf/` |
| Session log | Notion database "📥 Session Updates" (history only, never current truth) |

Versions: Next 15.5.28 · WPGraphQL 2.25.0 · WPGraphQL for ACF 3.0.0 · ACF PRO 6.8.10 · WPML 4.7.6 · ACFML 2.1.5 · WPML GraphQL 1.1.3.

## 3. How we work (the harness) — keep this
Roles:
- **Senior Architect** (chat): scope, ADR decisions, reviews of specs/reports, release decisions, guides Mauricio step by step.
- **Architect** (agent): read-only on code/CMS; writes specs in `docs/specs/` (and ADRs when asked). Never implements.
- **Dev** (agent): implements an **Approved** spec, runs the gate, writes the report in `docs/reports/`. Never commits.
- **Mauricio**: every WP-admin action, every production/SSH command, every commit/merge/promote.

Loop per phase: scope → spec (Draft) → review → Approved → build (with a mid-phase checkpoint) → report → review → commit.

Hard rules:
- Agents **never** write to production, never commit/push, never edit `.env.local`, leave everything **unstaged**.
- Agents use port 3100+ and stop only the PIDs they started.
- Mauricio pastes **one command at a time**. Never `git add -A`: add explicit paths.
- Release process: CMS changes first (runbook), then frontend. Check the **Vercel PR preview before merge**. Merge does not deploy production. Promote manually in Vercel and wait for "Ready" before verifying. Instant Rollback if broken.
- Wait for **all 3 PR checks green** before merging (it was merged early several times).
- Never paste secrets (WPML key, SSH passphrase, tokens) in chat, notes or repo.
- Permission prompts: allow reads inside the project/backups once ("Yes, but ask again"); refuse anything touching `~/.ssh`, other personal folders, production, `git commit/push`, `rm -rf`, `.env.local`.

Communication with Mauricio: replies in **Spanish**, step by step ("con cucharita"), exact copy-paste commands
(one file per line, commit messages on one line), time estimates, say when a task is long so he can work in parallel.
Agent prompts in **English**. Plain language, no buzzwords, flag overcommitment.

## 4. Status
Phases 0–4: **done and in production** (EN byte-identical; FR/ES routes exist but are disabled: `ENABLED_LOCALES` unset in Vercel).
- 0 baseline · 1 WPML local · 2 locale routing · 3 locale-aware data · 3b WPML in production (runbook) · 4 UI dictionaries + build guard (fails `next build` if an enabled locale has `[FR TODO]/[ES TODO]`; `ALLOW_UNTRANSLATED_LOCALES=1` local only, never in Vercel).

**Phase 5 = 2026 content (in progress).** Gap analysis: `docs/specs/phase-5-gap-analysis.md` (scenario B: structure changes needed).
Release plan (decided 2026-10-26):
- **R1 = EN 2026**: 5a + 5b + 5c loader + 5d-lite + EN Privacy route. FR/ES content loaded but disabled. Target **2026-11-20**, at risk; re-evaluate after 5a.
- **R2 = FR**: Phase 6 QA FR + ~25 FR UI strings (Mauricio writes) + 6-field Contact form.
- **R3 = ES**: after the ES Privacy Policy copy exists.
- Then a **Cleanup/Contract** phase (remove legacy ACF fields + fallbacks), then Phase 7 SEO i18n, Phase 8 graphics.

Sub-phases: 5a structure shared/Home/About/case studies (**in progress**) · 5b Services + Packages + per-page meta · 5c WP-CLI content loader (local + production release day: dry-run, db export before/after, read-back) · 5d-lite modal variant B + remove "24–48 h" SLA · Privacy route.

## 5. Key decisions (do not reopen without Mauricio)
- **ADR 0006 (Accepted)**: expand/contract. Never change type/meaning of an existing ACF field before release (text→wysiwyg would print literal `<p>` live within 60 s: `revalidate: 60`). Add new fields (e.g. `descriptionHtml`). New frontend reads new || old. One ACF JSON export for all Phase 5 (`docs/acf/phase-5-field-groups.json`, field groups only, the `project` post type excluded by design). Per-page final CTA (location widened to page OR project, 3 old defaults removed). Content that rewrites existing values or rows is loaded in production **on release day only**. Projects ordered by `displayOrder`. Testimonials render only rows with `role` (so the 4 fake placeholders Elena M./Marcus T./Sarah K./David R. can never render).
- D1: EN changes on purpose. New acceptance = matches `docs/content/magneto-copy-en.md` + Mauricio's visual approval.
- Project order: **Dangel 10 → Shamanicca 20 → Trépied 40**. 30 is reserved for KineLibelula (not published until complete).
- Testimonials approved: Dangel Manik (holistic therapist, Montreal; Spanish original, email 2026-08-20; FR translation validated) and Israel Valencia Vázquez (founder & video producer, TRÉPIED; approved EN/FR/ES on WhatsApp 2026-10-26). **Dangel is male** (FR/ES copy corrected).
- Defaults Q1–Q8: lead magnet hidden; package CTAs → `/contact`; Services CTAs → `/packages#build|fix|care`; drop "Check All Services", "Check All Projects" and the "Featured Services" title; keep "← Back to Projects"; no testimonial avatars; `/projects` index reuses Home section 4 heading+intro (dictionary); Contact supporting copy as paragraphs; all "Book a Strategy Call" → same modal → Calendly; italic copy lines are notes except "Translated from Spanish".
- 5d-lite: modal **variant B** (Calendly collects the email; no `/api/mailchimp`). Mailchimp env vars **do not exist** in Vercel (verified), and booking currently works (Calendly opens).
- Privacy: route `/privacy-policy` in R1 (EN). **No consent banner** while no analytics loads; Mauricio removes "Privacy choices" from the copy until analytics exists. Mauricio must complete the privacy verification gates (providers, retention, effective date, "Magneto MKTNG" name).
- Brand: "Magneto Web Consulting" in code in 5a (`seo.ts`, `meta.site.fallbackTitle`, footer). Per-page meta.* in 5b (after Mauricio finalizes the EN SEO drafts in Notion). WP `generalSettings.title` changes on release day.
- 5a checkpoint decisions: field list + JSON approved for production as is; rollback point = `backups/phase-5a/magneto-cms-2_phase5a-acf-before_20261026-1842.sql`; AC-18 amended (FR/ES only need to render; FR/ES order verified in 5c); 5c loader must always write finalCtaSection title + subtitle together (orphan meta finding).

## 6. Exact current state (2026-10-26 19:50)
Git:
- `master` = `5d4c90f` (spec 5a + ADR 0006 merged, PR #20).
- `feat/phase-5a` in the main checkout: **Dev's Part 1 + Part 2 work, uncommitted/unstaged** (data layer, components, dictionaries, tests, `docs/acf/phase-5-before.json` + `phase-5-field-groups.json`, `scripts/phase-5a/acf-json-diff.mjs`, `scripts/phase-5a/local-fixtures.php`, report sections). Gate after Part 2: lint 113/104 (master 115/110), no-explicit-any 96 (≤98), typecheck OK, 292 tests OK, builds OK, guard intact.
- `spec/phase-5a-runbook` (worktree): commit `6829e94` = runbook rev 1, pushed. **Rev 2 is unstaged in the worktree** (placeholders filled, measured step 4.2 diff: 35 added / 0 removed, new step 0.4b). Not yet reviewed by the Senior Architect.
- Open PR #2 (old Calendly opt-in): **to close without merge** with the comment drafted earlier (requirements carried to 5d/Brevo).

Local CMS: Phase 5 ACF JSON **imported** (14 groups, no duplicates; "Packages – Content Sections" = post 583). Post-import re-export matched. Fixtures **not yet run**.

## 7. Next steps, in order
1. **Mauricio runs the 5a fixtures** in Local's site shell, one command at a time:
   ```bash
   wp db export ~/Documents/projects/magneto/backups/phase-5a/magneto-cms-2_phase5a-fixtures-before_$(date +%Y%m%d-%H%M).sql
   wp eval-file /Users/maubayuelo/Documents/projects/magneto/web-app-GrapgQL/scripts/phase-5a/local-fixtures.php dry-run
   wp eval-file /Users/maubayuelo/Documents/projects/magneto/web-app-GrapgQL/scripts/phase-5a/local-fixtures.php
   wp cache flush
   ```
   Send the Dev the end of the real run's output + the backup file name.
2. Dev: state N verification at 375/768/1440, FR/ES smoke, screenshots, finish the report. Mauricio: visual approval (AC-24), confirm the 14 EN microcopy keys (AC-20).
3. Senior Architect: review runbook rev 2 → commit it from the worktree → merge → `git worktree remove ../web-app-GrapgQL-spec-runbook`.
4. Commit the 5a work in logical commits (explicit paths; get the plan from the Dev) → PR.
5. **Production ACF runbook** (Mauricio, ~45–70 min, daytime): step 0 stops on any difference. **ACF import deletes production fields that aren't in the file.**
6. Vercel PR preview check (AC-23, state C against production) → merge → **no promote needed for content**, but promote the frontend only when R1 is ready (decide with the Senior Architect whether 5a can go live alone: it is designed to render old content in the new layout).
7. Then the 5b spec, 5c, 5d-lite, Privacy, release-day runbook (R1).

## 8. Open items / backlog
- Mauricio: Privacy Policy EN/FR verification gates (blocks R1); finalize the EN SEO drafts (blocks 5b meta); ~25 FR UI strings (R2); `/projects` FR/ES not needed until 5c; remove "Privacy choices" from the copy.
- Copy fixes: "Real State" → "Real Estate" (old form, replaced in R2 anyway); 404 copy improvement (later).
- WPML: switch to a Production site key + SiteGround outbound access to wpml.org (O-1/O-2), before launch.
- Known issues: I-9 lead magnet not server-rendered (moot while hidden); per-page SEO titles still "Magneto Marketing" (→ 5b); Calendly labels passed only for FR/ES (minor debt); 404 raw HTML has no `lang` (Next 15.5 limit, ADR 0005).
- Phase 8 design notes: Packages at 768 px is cramped; Services at 1440 px has empty space above the icon; BUILD/FIX/CARE icons; Home hero illustration; retake case-study screenshots.
- Process: wait for all PR checks before merging.

## 9. Career evidence (keep honest: AI implemented, Mauricio designed, decided and verified)
Agent harness and spec/report loop · fingerprint verification (SHA-256 of 25 GraphQL queries, byte-identical HTML) · build guard for untranslated locales · Notion → repo copy pipeline with provenance · ACF schema-as-code + expand/contract migration (5a) · WP-CLI loader with dry-run/backup/read-back (5c) · LLM multilingual QA with structured output (Phase 6). Turn it into a portfolio case study at the end.

## 10. Prompt templates
- Dev start: "Implement Phase N per docs/specs/<spec>.md (Status: Approved). Branch feat/<name> from master. Stop at the checkpoint and write that report section. Port 3100+, stop only PIDs you started, never edit .env.local, never write to production, never commit, leave everything unstaged."
- Architect spec: "Write docs/specs/<name>.md (Status: Draft) on a fresh branch from master. Read-only on code and CMS. Include evidence with file:line, decisions as options with a recommendation, acceptance criteria, a mid-phase checkpoint, files the Dev may touch, out of scope, risks, estimates (agent vs Mauricio). Leave unstaged."
- Role definitions used so far: `.claude/agents/*.md` in the repo (reuse their text as Codex/GPT instructions).
