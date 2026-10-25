# Workshop workflow — Magneto trilingual site

How the human and the AI roles work together on this repo.

## Roles

| Role | Where | Sees | Writes | Owns |
|---|---|---|---|---|
| **Mauricio** (lead) | everywhere | everything | approvals, WP admin, commits | final decisions, credentials, production |
| **Senior Architect** | Claude chat (Career & Engineering project) | GitHub repo, Notion, reports pasted or pushed | ADRs, phase scope, reviews | architecture, scope, priorities, integrity |
| **Architect** | Claude Code — `claude --agent architect` | local repo + local CMS | `docs/specs/` only | specs grounded in real code and schema |
| **Dev** | Claude Code — `claude --agent dev` | local repo + local CMS | files listed in the spec, `docs/reports/` | implementation and verification |

The Senior Architect cannot see your local machine. The Architect can. That is why both exist.

## The loop (one phase)

```
1. Scope      Mauricio + Senior Architect agree the phase goal (chat)
2. Spec       Architect → docs/specs/phase-N-*.md              (Status: Draft)
3. Review     Mauricio (+ Senior Architect if non-trivial)     (Status: Approved)
4. Build      Dev implements, runs the gate
5. Report     Dev → docs/reports/phase-N-*.md
6. Review     Mauricio + Senior Architect → accept / fix / re-scope
7. Commit     Mauricio commits (Conventional Commits), updates CLAUDE.md "Current phase"
```

Rules:
- **Only the Dev edits `src/`.** Never run Architect and Dev on the same files at the same time.
- Handoffs are files, so any session can pick up where another stopped.
- A phase that discovers a structural surprise ends with a corrected plan. That counts.

## Phases (trilingual site)

| # | Phase | Notes |
|---|---|---|
| 0 | Baseline | install, lint, typecheck, test, build, run; record failures. No changes. ✅ |
| 0.5a / 0.5b | Security & toolchain / code hygiene | next 15.5.28, CI, prod-fallback removal, project by slug ✅ |
| 1 | WP i18n setup (local) | WPML + ACFML activated and configured per `WP-SETUP.md`; schema evidence of language args ✅ |
| 2 | Locale routing + switcher | EN unprefixed, `/fr`, `/es`; switcher hidden until a locale is ready. Reverted (PR #8): on-demand 404s return 500 on Vercel (HTML sanitizer in the server bundle). Re-land after the fix, verified on the Vercel preview. |
| 3 | Locale-aware data | `locale` threaded through every `api.ts` |
| 4 | UI microcopy dictionaries | extract hardcoded strings; EN values unchanged |
| 5 | Content load FR-CA / ES | WP-CLI script preferred; browser for spot checks; DB backup first |
| 6 | Multilingual QA script | LLM + structured output; flags only, never retranslates |
| 7 | SEO i18n | localized meta, canonical, hreflang, sitemap |
| 8 | Graphics | inventory from the new copy (Phase 5): new Home hero illustration, service images, check whether new icons are needed; design (Design artifact), export, upload to WP media and set in ACF (image fields are "Copy" → one upload serves EN/FR/ES); verify on all routes and viewports |
| Launch | Release | replicate Phase 1 in production WP (ACF JSON import + WPML settings, backup first), privacy/consent EN → FR-CA → ES, enable `ENABLED_LOCALES` in Vercel, release process below |

Later (separate scope): Calendly modal A/B + canonical event, Project Inquiry form, Brevo (ADR 0002),
custom 404 page, lead-magnet guide with new copy, `/carte` route (QR gate), `fashion-company-ecommerce` slug.

## Release process (production deploys are manual)

Merging to `master` does **not** publish. Vercel builds `master` as a preview; production is promoted by hand.

**CMS first, frontend second.** Vercel previews and production build against the **production** WordPress.
- If a PR needs a CMS change (plugin, GraphQL schema, ACF field group, WPML setting), apply it to production
  WordPress **first**, then redeploy the PR's preview.
- The CMS change follows a runbook spec in `docs/specs/`. It covers a backup, a before/after capture proving
  the live site is unaffected, and a rollback.
- A frontend that queries a field production doesn't have fails the preview build. Example: PR #10,
  2026-10-25, runbook `docs/specs/phase-3b-production-wpml-runbook.md`.
- Agents never write to production.

1. **Before merging a PR:** its Vercel preview must be checked and pass: main routes 200, an unknown URL
   (e.g. `/esto-no-existe`) 404 — not 500 —, one project page 200, plus the phase's own checks.
   CI does not build and agents test locally, so the preview is the only test of the real Vercel runtime.
2. Merge → Vercel creates the `master` deployment (preview).
3. Re-check that deployment with the same list.
4. Vercel → Deployments → that deployment → **⋯ → Promote to Production**.
5. Verify production. If anything is wrong: **Instant Rollback** to the previous deployment, then revert the PR.
6. Never assume a merge is live: check production (e.g. a route that changed in the release).


## Canonical copy (Notion)

- EN (source of meaning): https://app.notion.com/p/3fc702393b5e80ab9658cef2f9f46e1f
- FR-CA: https://app.notion.com/p/3fc702393b5e8195a8c1eeede1910b62
- ES: https://app.notion.com/p/3fc702393b5e81abaf9af4c499daab27
- EN wireframes (layout reference): https://app.notion.com/p/3fc702393b5e818fb24ecc67b3e5c161
- Task card: https://app.notion.com/p/3d8702393b5e816cb2e7f6e8196b77e0

## Standards referenced

- `AGENTS.md` open format for agent instructions; `CLAUDE.md` imports it.
- Architecture Decision Records (Michael Nygard format) in `docs/adr/`.
- Conventional Commits 1.0.
- WCAG 2.2 AA for accessibility.
- Spec → implement → verify → report, adapted from the Shamanicca repo workflow.
