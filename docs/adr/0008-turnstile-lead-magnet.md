# ADR 0008 — Cloudflare Turnstile on the lead-magnet form

- Status: Accepted
- Date: 2026-11-05
- Decider: Senior Architect (D-E10 = yes) and Mauricio (Turnstile, decision 1 of 2026-11-05; widget mode D-E11 = A;
  residual risks R-1…R-11 accepted in writing on 2026-11-05).
- Spec: [Phase 5e](../specs/phase-5e-lead-magnet-brevo.md), Approved rev 0.5 (§5 F-10…F-15, §6.1, §8.1).

## Context

The 5e lead-magnet form sends a guide email and, when checked, a Brevo double opt-in email. Lean Option A has no shared
store, so it has no recipient or global rate limit. Turnstile makes automated mass submission more expensive. It adds a
third-party runtime script and a new data processor, Cloudflare. The 5d-lite spec §7 says Turnstile needs an ADR, a
Privacy Policy provider entry and a consent review.

## Decision

1. **Scope: the lead-magnet form only** (guide send and DOI call). Not used on Contact, booking or any other form.
2. **Server-verified, fail closed.** `/api/lead-magnet` calls siteverify once, with a timeout of 5 s or less, before any
   send. A request is accepted only when `success` is true, `hostname` is a trusted host and `action` is `lead_magnet`.
   A bad token returns 403 and sends nothing. If siteverify is unavailable, or the secret or configuration is wrong, the
   route returns 503 and sends nothing. No retry, no bypass. The token, secret and raw response are never logged.
3. **Not consent-gated.** Turnstile serves a security purpose and is necessary for this form, so the analytics consent
   banner ([ADR 0007](0007-consent-gated-analytics.md)) does not gate it. The privacy policy discloses it (G-4b, all
   enabled locales), and the EFVP has a Cloudflare row.
4. **No npm wrapper.** The script loads on demand from the exact Cloudflare URL with the existing
   `thirdParty.loadScript`. It renders explicitly in the guide dialog and is never proxied, cached or loaded on page
   load. The minimal `window.turnstile` surface is typed locally.
5. **Hostnames: Production plus the exact Preview host** in the widget, never `vercel.app`.
6. **Mode: Managed + `appearance: interaction-only`** (D-E11 = A).
7. **Reuse needs a new decision.** Adding Turnstile to Contact or any other form needs its own spec decision, and this
   ADR must be amended or replaced.

## Consequences

- Visitors who cannot get a token cannot request the guide (R-10). A Cloudflare outage or a misconfiguration makes the
  guide unavailable (R-11). Both risks were accepted. The rest of the site, booking and Contact do not depend on it.
- New server-only env var `TURNSTILE_SECRET_KEY` and public `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Local runs use only
  Cloudflare's dummy keys.
- Hosting stays on Vercel. This ADR does not imply a hosting migration.
