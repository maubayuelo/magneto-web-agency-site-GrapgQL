# ADR 0007 — Consent-gated analytics

- Status: Accepted
- Date: 2026-11-04
- Decider: Mauricio — D-F1…D-F10 confirmed before the finalization assignment.
- Spec: [Phase 5f](../specs/phase-5f-analytics-consent.md), rev 1.1.
- Review provenance: Senior Architect requested minor corrections; final joint approval of the revised spec remains
  pending document verification. Accepted records Mauricio's architecture decisions, not an invented review approval.

## Context

Magneto plans GA4 at launch, with a no-analytics fallback if Phase 5f is not ready. Existing analytics/GTM utilities
have no callers but contain preconnects and an asynchronous loader that are unsafe to activate without consent control.
The canonical policy export at `637fba7` provides GA-on and Version B text. Published policy and actual browser behavior
must agree in every enabled locale. UI text follows [ADR 0005](0005-ui-dictionaries.md); marketing-email consent stays
separate under [ADR 0002 amendment 1](0002-brevo-replaces-mailchimp.md).

## Decision

1. **Consent before load.** With GA configured, load no analytics script, resource hint, Consent Mode default or
   cookieless ping before an explicit valid grant (a still-valid stored grant may restore it). Reject is as prominent
   and easy as Accept. After granting, deny `ad_storage`, `ad_user_data` and `ad_personalization`; disable Google signals
   and ad-personalization signals. Existing events do nothing without active consent. Google Fonts remains disclosed
   and outside this analytics-host rule; self-hosting is deferred.
2. **Versioned storage.** Store `{v:1, analytics:'granted'|'denied', at:'<ISO date>'}` in first-party `localStorage` under
   `magneto-consent`, client-only, shared by EN/FR/ES on the same origin. Both choices expire after 365 days; restoration
   does not renew the timestamp. Increment the consent version for material purpose/policy changes or new non-essential
   tools, and ask again. Missing, malformed, wrong-version, invalid-date/future-date or expired records fail closed.
   Blocked storage permits an explicit in-memory choice only for the current page; no crash or implied grant.
3. **Withdrawal and cross-tab safety.** The footer reopens the non-modal banner without new current-choice copy.
   Reject invalidates active authorization, sets GA opt-out, removes the event wrapper, drops pending application
   analytics commands and deletes reachable GA cookies while preserving unrelated cookies. Cross-tab denial revokes;
   deletion, invalidity, expiry or storage clear revoke and ask again without autofocus or write-back. A stale grant
   event cannot override a newer stored withdrawal. Expiry and visibility return revalidate the choice.
   Every asynchronous loader continuation checks the current grant and generation; a delayed script load cannot
   re-enable withdrawn consent or replay stale events. Already-started requests cannot be recalled. Re-Accept uses
   one script and reapplies all ad-denial settings. Regression tests and real-browser network checks are required.
4. **No GTM.** Delete unused `src/utils/gtm.ts` and `warmAnalytics`; no container may bypass consent review. The unrelated
   `gtag` npm dependency is a Git-tag utility; remove it in a separate PR, not this phase.
5. **Environment-based fallback.** A valid build-time `NEXT_PUBLIC_GA_ID` enables the feature; absent/invalid means no
   analytics, banner, footer choices control or consent-storage/cookie access. Version B deliberately uses an absent
   ID. Changing settings requires a new build; existing artifacts/open pages are not updated by that edit. Verify the
   effective ID, target and debug behavior on Preview and Production, including any promotion rebuild or rollback.
   Preview uses GA with verified developer-traffic filtering; Production must not inherit preview debug behavior.
   Prove Version B with a previously stored grant as well as a clean browser. Implementation is planned for November
   25–26; November 30 is the fallback gate if the GA-on acceptance/Preview checks have not passed.
6. **Privacy publication dependency.** Publish the matching GA policy in every enabled locale before activating GA.
   For fallback, publish Version B with its §2/§3/§4 edits and verify a genuinely disabled build before launch. If turning
   off an already-live GA build, verify the disabled replacement before changing the policy to Version B. Rollbacks
   must match policy state too. G-8 remains mandatory for ES, whose policy/banner copy is draft; passing dictionary
   tests cannot approve it. Without G-8, launch EN + FR. A December 10 launch requires Mauricio to verify the approved
   effective date (the export says December 3), approve any required canonical change, and check published dates.

## Consequences

- No new dependency, server consent cookie or dynamic rendering requirement; one choice covers all enabled locales.
- Banner remains non-modal. Reliable focus restoration, equal buttons and unobscured keyboard navigation are release
  requirements, with unit and real-browser checks including iPhone Safari.
- Storage loss/expiry asks again. Consent is per origin, so Preview and Production do not share a choice.
- No analytics before acceptance reduces measurable visits by design. Blocking or failed script loads must fail safely.
- Environment screenshots, mocks and absent GA reports alone cannot establish network/privacy behavior; the spec's
  deployment and browser evidence is a release gate, not evidence already collected by this ADR.
- This decision does not change canonical copy, authorize production writes, or couple analytics consent to booking,
  inquiries, guide delivery or the optional newsletter checkbox.
