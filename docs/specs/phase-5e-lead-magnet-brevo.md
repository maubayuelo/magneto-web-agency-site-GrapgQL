# Phase 5e — Lead magnet + Brevo MVP

- **Status: Draft (rev 0.3)** — 2026-11-05; Mauricio acceptance of §6.3 residual risks + Senior Architect review pending.
- **Branch:** `spec/phase-5e-lead-magnet-brevo`; inspected HEAD `c25b4e1` (rev 0.2). Application code evidence in §2 is
  unchanged since `e04dae3`.
- **Review provenance:** Senior Architect verdict on rev 0.1: **CHANGES REQUIRED**. Mauricio supplied the product
  decisions in §1 on November 4. On November 5, the Senior Architect directed a **proportionate "lean Option A"** for
  D-E4: a low-traffic solo-consultancy lead magnet with documented accepted residual risks, not demonstrated
  exactly-once or recipient-level guarantees. Neither of these is technical approval of this revision.
- **Authority:** `AGENTS.md`, [Privacy Route rev 1.2 §8](privacy-route.md#8-brevo-lead-magnet--optional-newsletter--policy-impact-only),
  [ADR 0002 amendment 1](../adr/0002-brevo-replaces-mailchimp.md), [ADR 0005](../adr/0005-ui-dictionaries.md).
- **Copy authority for implementation:** the **upcoming 5c-rest canonical re-export**, with its actual commit and
  affected tests re-pinned together. `637fba7` is historical inspection evidence, not the 5e implementation copy lock.
- **This revision changes documents only.** No implementation, CMS/account/environment/WAF operations, provisioning,
  canonical-copy edits/re-export, staging, commits or pushes.

## Revision history

- **rev 0.3 (2026-11-05)** — D-E4 feasibility pass against official Brevo and Vercel documentation (§5). D-E4 resolved
  as **lean A** (§6) with an explicit residual-risk list (§6.3) for Mauricio to accept. Removed demonstration
  requirements that only a shared counter/reservation store (old option B) could satisfy: cross-instance recipient
  bounds, hourly aggregate counter, parallel multi-instance proofs and retrievable full consent history. Option B and its
  estimate are withdrawn. Consent evidence reduced to a concrete five-link chain (§7). E-4, E-5, E-11, E-12 rewritten;
  all 16 acceptance IDs kept. Estimate re-run (§13).
- rev 0.2 (2026-11-04) — D-E1 resolved; D-E2 A / D-E3 A recorded; custom store/ledger withdrawn; D-E4 left open.
- rev 0.1 (2026-11-04) — first Draft.

## 1. Accepted product scope

Mauricio confirmed these constraints on November 4, 2026:

1. Brevo has exactly one marketing list: **Newsletter**. No standalone Guide requests list, staging list or per-language
   marketing lists. Language is an attribute/segment within Newsletter.
2. Every valid guide requester is offered transactional Brevo delivery of the PDF regardless of the optional checkbox.
   Invalid requests, abuse limits, provider outages, quota exhaustion or suppression may prevent delivery; never claim
   guaranteed receipt.
3. Only an explicitly checked, optional, initially unchecked box may initiate **Brevo native double opt-in (DOI)** and
   eventual Newsletter enrollment. Guide delivery never waits for DOI confirmation. No direct list-add/upsert bypass.
4. Reuse hidden `LeadMagnetSection` and the existing guide branch of `EmailCollectorProvider`. Preserve booking and
   Project Inquiry behavior; neither creates a marketing subscription or a new CRM flow in this phase.
5. Use immutable static same-origin PDFs per language. FR-CA and ES PDF editorial approval is still pending.
6. Lead copy follows 5c-rest's later export. Mailing-address copy is updated in Notion. Brevo DPA/EFVP research has
   advanced, but **Mauricio's EFVP sign-off remains pending**. No retention periods or legal approval are inferred.
7. **The December 3 website launch does not depend on 5e.** Keep 5e off by default and activate it only after its own gates.

### D-E1 — resolved A

Privacy Route §8 item 9 is amended with this assignment's authorization: **transactional guide delivery is permitted
without newsletter consent; unchecked submissions must not initiate DOI, marketing contact/list enrollment or campaigns**.
Tests must distinguish the transactional and marketing operations. The checkbox grants no analytics permission.
No additional marketing list is permitted. ADR 0002 amendment 1 remains unchanged.

## 2. Current-code inspection

Inspection of application code at `e04dae3` (unchanged at `c25b4e1`). No secrets or live account/CMS settings were read.

| Evidence | Finding and MVP implication |
| --- | --- |
| `src/app/[locale]/layout.tsx:161–178` | Provider remains; lead section is absent. Preserve hidden default rather than assume the older AGENTS layout description is current |
| `LeadMagnetSection/index.tsx:51–90`, `api.ts`, `types.ts` | Existing component, four CMS text fields, client fetch/fallback and legacy PDF resolver. Add a server loader; retain the component and valid locale-filtered text query. Remove media/REST guessing and stale copy fallback |
| `docs/acf/phase-5-field-groups.json` | Four lead text fields are WPML Translate; PDF file field is Copy. Static locale asset mapping avoids changing this file field or ACF schema |
| `EmailCollectorProvider/index.tsx:187–292,344–415` | Existing guide branch subscribes to Mailchimp then probes a URL; no email delivery or checkbox. Adapt this branch, not a second modal |
| `EmailCollectorProvider/index.tsx:94–184` | Booking branch and native dialog already exist; guide success/download state is not fully reset on reopen. Preserve booking and fix guide state isolation |
| `Hero/HeroCTA.tsx`, `molecules/PackageCard/index.tsx`, `Header/index.tsx` | Other legacy PDF callers exist, including Header without a Mailchimp string. Remove or gate every legacy guide path |
| `src/pages/api/mailchimp.ts` | Direct subscribe/resubscribe, provider-detail errors and fake success when unconfigured. Delete; do not reproduce these behaviors |
| `src/pages/api/download.ts`, `download-check.ts` | Arbitrary URL parameters, loose hosts, upstream redirects and PDF guessing. Remove both routes/callers; static files need neither |
| `src/pages/api/contact.ts` | Nodemailer inquiry delivery and `DISABLE_SMTP=1`; no guide-email implementation. Preserve application behavior and strengthen isolation tests only |
| `FinalCTASection/FinalCTASectionLoader.tsx` | Existing server-loader pattern can be reused without its fallback-copy behavior |
| `package.json` | Next 15.5.28 / React 19.1.2 / native fetch; no Brevo SDK, no `@vercel/firewall`, no shared persistence/rate service. Lean A needs none of them. Nodemailer remains needed by Contact |
| Guide/provider/contact tests and dictionary locks | Replace old Mailchimp/download assertions; preserve booking/inquiry regressions; re-pin lead copy only with 5c-rest's approved export |
| `public/` | No finished PDF found in the inspected checkout. Source prose does not establish a deployable asset |

The old export has more EN lead content than the four current strings (guide name, bullets and format line).
This is a documented **content-mapping incompatibility to assess against the future export**, not automatic permission
to create ACF fields or a new content system.

## 3. Minimal user flow and architecture

Reuse the section and guide dialog with optional first name, required email, the separate unchecked newsletter box,
localized privacy link, approved sender/address line and submit/result copy. Do not add a newsletter box to booking
or Contact. Receiving a guide requires neither newsletter enrollment nor analytics consent.

A Pages Router `POST /api/lead-magnet` validates the request, applies the §6 lean-A controls, sends the guide through
Brevo's transactional API, and — only when the box is checked — calls Brevo native DOI. A failed DOI request cannot
withhold or roll back an accepted guide; a failed guide send does not block an otherwise eligible DOI. Neither action is
retried, automatically or as a side effect of the other. Shared validation/abuse/configuration failure rejects the whole
request before any send. There is no delivery queue, webhook receiver, account store, shared counter, custom unsubscribe
endpoint, campaign automation or polling/status service.

### 3.1 Reuse the section and CMS text contract

Add a server loader around `LeadMagnetSection`, using the existing locale + Home query for its supported text fields.
Pass data into the existing presentation component; remove the client fetch and obsolete EN/dictionary fallback flash.
Static asset selection replaces `ctaLinkLeadMagnetSection` media/REST resolution, removing its missing-env-swallow path.
For the retained CMS query, missing configuration must fail explicitly; an absent required translation/content blocks
that locale's readiness. Feature-off intentionally renders nothing and need not fetch lead content.

Before implementation, map the **5c-rest export** field-by-field to the four CMS text fields and existing dictionary
structure. Approved form UI belongs in dictionaries. If additional approved lead-section strings remain, propose a
small typed dictionary extension with verbatim provenance (D-E5). Do not create a separate copy manifest by default,
concatenate/truncate copy, rewrite translations, or treat an old field's capacity as permission to omit approved
content. ACF changes require a specific remaining incompatibility and explicit scope amendment.

A small **asset/configuration map only** selects guide version, locale, static path and template references; it is not
a new editorial source. Place the section only where the later canonical copy approves it (currently proposed:
Home/About/Services before Final CTA). No blanket layout insertion on Contact/privacy/404 or other routes.

### 3.2 Reuse the modal and isolate state

Retain the native dialog, labels, scroll lock and booking contract. Adapt its guide branch to a registered guide ID;
clients cannot supply an arbitrary PDF URL, template/list ID or sender. Update all guide callers in scope.
Reset checkbox, errors, result and pending state on each new opening and locale change. Keep inputs/error messages
associated and results announced. Close/Escape remain usable during a guide request; ignore late results after close
or a new opening. Closing a browser wait cannot recall an already accepted server send.

Restore keyboard focus to the trigger or a stable page target if the trigger is gone. Test guide-to-booking transitions
and reopening; no previous email or success state may leak. Disable repeated submission while pending (a UI guard only).
No automatic retry, including after timeout/reload. Approved copy must cover: guide accepted, guide recently sent
(duplicate), failed optional DOI, unknown outcome, throttled, temporarily unavailable. Existing "request was not sent"
wording cannot describe partial success. Missing text is a specification TODO, not invented UI.

## 4. Copy, PDFs and email readiness by language

The upcoming **5c-rest canonical re-export supersedes `637fba7` for lead-magnet implementation**. Record its actual SHA,
source sections and approvals in the implementation report; update affected verbatim tests in that same authorized
copy-integration PR. Do not re-export now or during Phase 5c's November 9–11 window. Do not bypass ADR 0005 or insert
translation placeholders that break builds for otherwise enabled site locales.

| Gate | EN | FR-CA | ES |
| --- | --- | --- | --- |
| Final PDF | Final binary/checksum and editorial acceptance still required; old EN source draft is not release evidence | **Editorial approval pending** | **Editorial approval pending** |
| Lead/form copy | Must match later 5c-rest export | Must match approved later FR-CA export | Must match approved later ES export |
| Transactional email | Approved subject, preheader, HTML/plain text, guide link and sender/address | Separate approved FR-CA template; no EN fallback | Separate approved ES template; no EN fallback |
| Native DOI email | Approved wording/version, DOI link, disclosure/address and fixed destination | Separate approved FR-CA template | Separate approved ES template |
| Release verification | PDF/link/receipt/consent/policy checks pass | Independently pass equivalent checks | Independently pass equivalent checks, including privacy G-8 |

Each locale passes its own gate; enabling the site language does not enable its guide. D-E8 selects the initial offered
locales only after these results and any applicable French-language publication obligations are confirmed by Mauricio.
A locale that is not offered hides its guide entry points and rejects forged guide requests.

**D-E3 A confirmed:** immutable static same-origin PDFs, e.g. `/assets/guides/website-checkup/<version>/<locale>.pdf`,
with approved title, version, checksum, size and language. Email an absolute HTTPS link from trusted server configuration,
not request Host or user input. The files are public; email delivery is a service, not PDF access control. Keep old
emailed links working through feature-off/version changes. Remove `/api/download` and `/api/download-check`.

PDF checks include selectable text, title/language, reading order, contrast, mobile/desktop viewer, print readability
and closing CTA destination. No fillable PDF, new booking route or attachment generation is included. Resolve final
booking destination, timing/page-count claims and template wording with content owners, not Dev-authored copy.
Mauricio reports the CASL mailing address already updated in Notion: synchronize that approved text through 5c-rest and
email-template approval; the old export's placeholder is stale evidence.

## 5. D-E4 feasibility findings (official documentation, 2026-11-05)

Read-only research; no account, dashboard or API calls. Developer docs fetched as Markdown from the vendors' own sites.
`help.brevo.com` articles return HTTP 403 to non-browser clients, so **[B2], [B4]–[B7] were not re-read today**; their
claims are carried from the rev 0.2 check (November 4) and are marked "rev 0.2". Documentation is not proof of how
Mauricio's account is configured — items marked **Verify** are checked once in the account or the controlled Preview test.

| # | Question | Finding (fact unless marked) | Source | Consequence for lean A |
| --- | --- | --- | --- | --- |
| F-1 | Transactional idempotency | `POST /v3/smtp/email` accepts `headers.idempotencyKey`; **must be a UUID**; processed once per key; **TTL 30 min**; reuse within TTL returns `duplicate_parameter` and the email is not sent. Documented on the "Idempotency for batch emails" page, whose example is a single-recipient `/v3/smtp/email` call. The send reference's generic `headers` example shows `"IdempotencyKey":"abc-123"` (not a UUID, Title-Case) — **inconsistent docs**. | [B8], [B9] | Use it, with a server-derived UUID per recipient + guide + 30-min bucket. **Verify** once in Preview (second call → `duplicate_parameter`, one email). If it does not work, drop it and accept R-1; not a blocker |
| F-2 | DOI idempotency | DOI endpoint documents no idempotency key. Error enum includes `duplicate_request` / `duplicate_parameter`, with no stated semantics | [B1] | No DOI de-duplication; accept repeated DOI emails (R-2) |
| F-3 | DOI request contract | `POST /v3/contacts/doubleOptinConfirmation`: required `email`, `includeListIds`, `templateId`, `redirectionUrl`; optional `attributes` (**must already exist in the account**), `excludeListIds`, `contactPixelTrackingConsent`. Success `201 {}` | [B1] | Mauricio creates 4 attributes (§7) before activation. `201` means "DOI email requested", never "subscribed" |
| F-4 | DOI for existing / unsubscribed / blocklisted contacts | **Not documented** in the API reference. Rev 0.2 help-centre notes [B2] describe DOI logs but not these transitions | [B1], [B2] rev 0.2 | Our code calls only the DOI endpoint — never create/update contact, list-add or unblock endpoints — so the app cannot force a resubscribe. Observe Brevo's native behavior once for 3 states (E-12); two outcomes are blockers (§6.2) |
| F-5 | Consent evidence retained by Brevo | Contact API exposes `createdAt`, `attributes`, `listIds`, `emailBlacklisted` and campaign `statistics.unsubscriptions` (90-day default window in that response). Contacts export (`/v3/contacts/export`, UI export) can filter by list and include chosen attributes. Rev 0.2: Brevo documents DOI event logs and recommends exporting them [B2]; log/preview retention is configurable and logs can be deleted [B6]. Pricing FAQ markets "unlimited log retention" for transactional on all plans [B11]. Whether the DOI confirmation **IP** is stored, and for how long DOI logs live, is **not established** | [B3], [B10], [B2]/[B6] rev 0.2, [B11] | Do not depend on Brevo for IP or full history. The minimal chain (§7) uses only server-set attributes + list membership/blocklist + repo wording; Brevo logs are a bonus, recorded as seen in the Preview test |
| F-6 | Free-plan sending quota | "Once we approve your account for sending, you can start sending up to **300 emails per day**" (pricing FAQ). Whether DOI emails count toward it and the exact error when exceeded are **not documented** in the pages reachable today. Both endpoints list `not_enough_credits` / `Insufficient credits` among 400 codes | [B11], [B1], [B9] | Aggregate cap = Brevo's daily quota (**Verify** the figure in the account's plan page). Server maps any credit/limit/429/5xx response to `failed`, HTTP 503, no retry. Mapping tested with mocks; do not exhaust the real quota to test it |
| F-7 | Brevo API rate limits | General tier (all plans incl. Free): `POST /v3/smtp/email` 1,000 RPS; `/v3/contacts/*` 10 RPS / 36,000 RPH; `429` + `x-sib-ratelimit-*` headers when exceeded | [B12], [B13] | Irrelevant at this traffic; `429` handled like F-6 |
| F-8 | Vercel WAF rate limiting on Hobby | Available on **Hobby**: **1 rate-limit rule per project** (within 3 custom rules); keys **IP or JA4 digest**; **fixed window 10 s – 10 min**; 1,000,000 included allowed requests; action 429 (default), Log, Deny or Challenge. Counters are **per region**. Rule changes are "published to your production deployment"; Preview coverage is not stated | [V1] | One rule: `POST` + path `/api/lead-magnet`, IP key, **5 per 10 min**, 429. **Verify** on Production with the feature still off (the route answers 503 before any send, so the check has no side effects). Preview coverage is not required |
| F-9 | Recipient/global keys without a new store | `@vercel/firewall` `checkRateLimit` with a custom `rateLimitKey` could key on recipient or a constant (global) — but it is a **new dependency** and Hobby allows only **one** rate-limit rule, already used for IP | [V2] | Not in lean A (Hard rule 6). Listed in §14 as a possible later upgrade only |

Sources:

- [B1 — Create contact via DOI](https://developers.brevo.com/reference/create-doi-contact) (Markdown: append `.md`).
- [B2 — DOI tracking and evidence](https://help.brevo.com/hc/en-us/articles/208733449-Double-opt-in-DOI-What-it-is-and-how-to-track-user-sign-ups) (rev 0.2).
- [B3 — Get a contact's details](https://developers.brevo.com/reference/get-contact-info).
- [B4 — Contact permission and opt-in attributes](https://help.brevo.com/hc/en-us/articles/213405965-Build-a-legitimate-contacts-database-for-optimal-deliverability-and-compliance) (rev 0.2).
- [B5 — Consent text in DOI templates](https://help.brevo.com/hc/en-us/articles/360019540880-Create-a-custom-double-opt-in-DOI-email-template-for-a-sign-up-form-created-in-Brevo) (rev 0.2).
- [B6 — Transactional log/preview retention](https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews) (rev 0.2).
- [B7 — Marketing and transactional suppression](https://help.brevo.com/hc/en-us/articles/209458705-FAQs-What-are-the-different-types-of-blocklisted-contacts) (rev 0.2).
- [B8 — Idempotency for batch emails](https://developers.brevo.com/docs/heterogenous-versions-batch-emails).
- [B9 — Send a transactional email](https://developers.brevo.com/reference/send-transac-email).
- [B10 — Export contacts](https://developers.brevo.com/reference/request-contact-export).
- [B11 — Brevo pricing FAQ](https://www.brevo.com/pricing/) (FAQ "Can I try Brevo before purchasing a plan?" and "Can I send transactional emails on my plan?").
- [B12 — API rate limits](https://developers.brevo.com/docs/api-limits) · [B13 — Rate limit headers](https://developers.brevo.com/docs/limit-headers).
- [V1 — Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) (page dated 2026-08-28).
- [V2 — Vercel rate limiting SDK](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk).

Still valid from rev 0.2: marketing and transactional blocklists are distinct, including sender-specific transactional
blocks [B7]; `OPT_IN`/`DOUBLE_OPT-IN` attributes do not control subscription [B4]; consent wording belongs in the DOI
template [B5]; `contactPixelTrackingConsent: false` anonymizes tracking only when a per-contact feature is enabled — it
does not disable tracking [B1].

### 5.1 Existing-contact and unsubscribe contract

Unchecked requests perform only transactional delivery: no contact read, create, update, list or DOI call.
Brevo retains transactional log data; that is not a marketing list and is disclosed in the policy (G-4b).

For checked requests the application calls **only** the DOI endpoint with `includeListIds: [Newsletter]`. It never
calls create/update contact, add-to-list, or any unblock/resubscribe endpoint, and never clears suppression.
Whatever happens to an existing contact therefore results from Brevo's native DOI and the person's own confirmation
click. E-12 records the observed native behavior for three states; §6.2 lists the two outcomes that block activation.

## 6. D-E4 — resolved: lean Option A

**Resolution (Senior Architect direction, 2026-11-05):** lean A. Existing Brevo + Vercel features only; no new provider,
store, dependency or queue. Rev 0.2's options B (shared TTL counters/reservations) and C (defer as the default) are
withdrawn as D-E4 outcomes; deferral remains the outcome only if a §6.2 blocker is observed.
**Pending:** Mauricio's written acceptance of §6.3 residual risks R-1…R-8 (recorded in §11 when given).

### 6.1 Controls

| Control | Mechanism | Verified by |
| --- | --- | --- |
| Input validation | `POST` + JSON only; body ≤ 8 KiB; email ≤ 254 chars, syntactically valid, no control chars/CRLF; first name optional ≤ 100, no control chars; `consent` strictly boolean; `guideId`, `locale`, `placement` and `consentTextVersion` must match server allow-lists (stale version → 409) | Unit tests |
| Honeypot | Hidden, `aria-hidden`, `tabIndex=-1`, no autocomplete field. Filled → respond with the same neutral `200` shape as success, **no sends** | Unit tests |
| Same-origin | `Origin` must equal the configured trusted origin; if present, `Sec-Fetch-Site` must be `same-origin`. Failure → 403, no sends. A convenience filter, not bot protection (forgeable outside browsers) | Unit tests |
| Per-IP rate limit | Vercel WAF, Hobby: one rule, `POST` `/api/lead-magnet`, IP key, fixed window **10 min**, **5 requests**, action 429. Counters per region | Mauricio configures; 6th `POST` → 429 on Production with feature off (E-4) |
| Aggregate cap | Brevo daily sending quota (300/day on Free per [B11], **Verify** in account). Provider credit/limit/`429`/5xx response → `failed`, HTTP 503, approved "temporarily unavailable" copy. **No automatic retry**, ever | Unit tests with mocked provider responses; quota figure recorded by Mauricio |
| Guide duplicates | `headers.idempotencyKey` = UUID derived server-side: HMAC-SHA-256(`LEAD_MAGNET_KEY_SECRET`, normalized email + guide ID + UTC 30-min bucket), formatted as RFC 4122 v4 bits. Key never logged or returned. Brevo `duplicate_parameter` → guide outcome `duplicate`, approved neutral copy | Unit test (deterministic, differs across bucket/guide/email); one live check in Preview (E-5) |
| DOI duplicates | None (F-2). Accepted as R-2 | — |
| Kill switches | `LEAD_MAGNET_ENABLED` unset/`0` → UI hidden and API 503 before sends (env changes need a redeploy — **assumption, verify**). Immediate switch: Mauricio disables/rotates the Brevo API key → sends fail → 503 | E-10 + one manual check |

Removed from rev 0.2 because only a shared store could satisfy them: "at most one send per recipient across
instances/IPs per window", the 100-per-hour combined counter, parallel multi-instance demonstrations, reservation
holding after crash, and control-outage behavior for a shared store that no longer exists.

### 6.2 Activation blockers (not residual risks)

- Brevo adds a contact to Newsletter **before** the DOI confirmation click.
- A previously unsubscribed/blocklisted contact becomes Newsletter-eligible **without** a fresh confirmation click.
- Any unchecked request causes a contact/list/DOI call.

If one is observed, 5e stays off (website unaffected) and the spec returns for review. Do not work around it with
direct subscription or suppression changes.

### 6.3 Accepted residual risks — for Mauricio's approval

| ID | Residual risk | Why accepted / bound | Mitigation that remains |
| --- | --- | --- | --- |
| R-1 | A requester may receive the **guide twice** (window boundary, request after 30 min, or idempotency key not honored) | Low traffic; a duplicate guide email is a nuisance, not harm | Idempotency key within 30-min bucket; per-IP WAF; neutral duplicate copy |
| R-2 | A checked requester may receive **more than one DOI email** | No DOI idempotency exists (F-2); repeated DOI does not enroll without a click | Per-IP WAF; Brevo daily quota |
| R-3 | **Adjacent-window burst**: up to 10 requests from one IP within a short interval spanning two 10-min windows; per-region counters can add more if one IP hits several regions | Fixed window is the only Hobby algorithm (F-8) | Daily quota caps total damage |
| R-4 | **Distributed abuse** (many IPs, one or many recipients) is not recipient-bounded: a third-party address can receive several unsolicited guide/DOI emails, and an attacker can **exhaust the daily quota**, making the guide unavailable until reset | No recipient or global counter without a new store/dependency (F-9) | Quota stops further sends; honeypot/origin cut naive bots; Brevo complaint/transactional blocklists; Mauricio's kill switch (API key) |
| R-5 | **No exactly-once**: a timeout or crash can leave a send's outcome unknown; neither browser nor server replays it. A deliberate re-submission may duplicate (R-1) or be suppressed as `duplicate` even if the first attempt was never delivered | Proportionate for a free guide | Approved "unknown" copy tells the visitor to check inbox / try later |
| R-6 | Consent attributes are **overwritten** by a later checked request; Brevo keeps only the latest request's source/date/version per contact. DOI confirmation IP and DOI-log lifetime depend on Brevo and are not guaranteed (F-5) | The minimal chain (§7) still proves the latest consent and its exact wording | Manual export on demand (§7); Brevo logs recorded as available in E-11 |
| R-7 | The Vercel WAF rule protects **Production only**; Preview relies on validation, honeypot, origin and quota | Preview URLs are not publicised; Preview real sends are limited to Mauricio's controlled test | Feature off in Preview except during the controlled test |
| R-8 | **Partial outcomes** (guide sent, DOI failed, or the reverse) are shown as such; the visitor may re-submit to retry DOI, which re-sends nothing for the guide within 30 min (`duplicate`) but may send a second DOI | Independent actions by design (§3) | Approved partial-outcome copy |

## 7. Consent evidence, retention, CASL and EFVP

### 7.1 Minimal evidence chain (checked requests only)

1. **Wording (repo).** Each locale's checkbox + disclosure text lives in the dictionaries with a single exported
   `CONSENT_TEXT_VERSION` (e.g. `2026-11-a`). A unit test pins a hash of every locale's wording per version, so a wording
   change without a version bump fails the gate. Git history is the archive of the exact text for each version.
2. **Request (Brevo attributes, server-set).** The DOI call sends: `CONSENT_DATE` (server UTC ISO-8601 timestamp, text),
   `CONSENT_SOURCE` (server allow-listed placement, e.g. `home`, `about`, `services`), `LOCALE` (`en` | `fr-CA` | `es`),
   `CONSENT_TEXT_VERSION`. Mauricio creates these four text attributes in Brevo before activation (F-3). Values are never
   taken verbatim from the client. Whether Brevo stores them at request time or at confirmation is recorded in E-11.
3. **Confirmation (Brevo).** Newsletter membership exists only after the person clicks the DOI link (verified once, E-11).
   Any Brevo DOI log/date/IP shown in the contact record is noted as available evidence, not relied on (R-6).
4. **Withdrawal (Brevo).** Unsubscribe via Brevo's native link sets the contact's marketing blocklist/unsubscription
   state; the app never clears it.
5. **On-demand export (manual).** When evidence is needed (complaint, access request, audit), Mauricio exports the
   contact from Brevo (UI contact export or contact record with attributes, list membership, blocklist state and any DOI
   log), notes the git SHA of `CONSENT_TEXT_VERSION`'s wording, and stores both in his existing private business storage
   — never in this repository. No scheduled archive. The procedure is written once in the 5e report and tried once (E-11).

Never infer consent from guide delivery, inquiry/booking, cookies, contact existence or an unchecked request. No IP
address is collected or stored by the application. This matches Privacy Route §8's consent-record row (date/time,
form/page, wording and language, IP only if Brevo stores it).

### 7.2 Retention, CASL, EFVP, tracking

**No retention periods are set by this Draft.** Mauricio decides, as part of EFVP sign-off, the treatment of guide-only
transactional logs, unconfirmed DOI contacts, confirmed consent attributes and exports, and records Brevo's actual log
retention setting. Do not delete suppression records to minimize data if that would permit re-enrollment.

**CASL:** synchronize the approved mailing address through 5c-rest and template review; verify sender identity, contact
details and unsubscribe links in both templates. "Transactional" is not a blanket legal exemption. Unsubscribe must take
effect without delay and within ten business days; facilities must remain valid for 60 days
([CRTC CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm)). Native DOI is the product mechanism, not a legal sign-off.

**EFVP:** Mauricio's sign-off remains an activation gate (providers, transfers, retention). Lean A adds no processor
beyond Brevo and Vercel.

**Tracking:** keep Brevo open/click tracking and browser scripts off for both templates where the account allows; verify
delivered markup and link destinations in the controlled test. Native DOI link processing is necessary for enrollment
and is distinguished from optional engagement tracking. If the account cannot disable tracking, disclose it in G-4b or
resolve before activation.

## 8. Server integration, configuration and fallback

Native `fetch` to `POST /v3/smtp/email` (guide) and `POST /v3/contacts/doubleOptinConfirmation` (checked only). No
contact/list endpoints. Templates, sender, Newsletter ID, trusted origin, PDF mapping and DOI redirect (an approved
existing locale page, not a new route) are server-controlled. A redirect hit is not DOI evidence. Keep the route under
`src/pages/api/`; no SDK or dependency.

Typed, independent outcomes: guide `accepted` | `duplicate` | `unknown` | `failed`; newsletter `not_requested` |
`requested` | `unknown` | `failed`. `requested` never discloses prior subscription state nor asserts enrollment.
HTTP: 200 known handled response (not "both succeeded"); 202 at least one outcome `unknown` (no queue/polling promised);
400 validation; 403 origin; 409 stale consent/guide version; 429 throttle (WAF); 503 off, missing configuration, or
provider credit/limit/unavailable. No raw provider errors or account/member details in responses. Do not reuse the old
`res.ok || payload.success || payload.data` logic.

Finite timeouts within the function budget (timeout → `unknown`); sanitized correlation IDs; `Cache-Control: no-store`.
No email, name, consent payload, idempotency key, provider body or secret in logs/analytics/URLs. Guide delivery works
with GA absent or denied; use the existing analytics abstraction only; remove Mailchimp-named events. Do not implement 5f.

Server-only placeholders in `.env.local.example`: `LEAD_MAGNET_ENABLED` (default off), `LEAD_MAGNET_LOCALES` (offered
subset), `DISABLE_BREVO=1` locally, `BREVO_API_KEY`, `BREVO_NEWSLETTER_LIST_ID`, per-locale guide and DOI template IDs,
sender, `LEAD_MAGNET_TRUSTED_ORIGIN`, `LEAD_MAGNET_KEY_SECRET`. No `NEXT_PUBLIC_` secret, no client-importable server
module. Local/tests use mocks and make zero real Brevo calls; no fake production success.

**G-4b:** before the deploy that activates 5e, Mauricio publishes the approved privacy additions in every enabled site
language (guide and marketing flows, fields, consent record, Brevo, retention, withdrawal). A Notion ready block alone is
insufficient. Re-run Privacy Route §7 including item 6; preserve G-8 for Spanish and the effective-date check.
Controlled Preview real sends require the approved disclosures visible; Production additionally requires publication.

Verify effective deployed flags and secret presence without values. Feature off hides every guide entry point and
rejects sends before network side effects. Static emailed PDFs remain available. Keep Mailchimp removed and booking/
Contact unaffected. Production promotion remains manual. A missing gate delays **5e only**.

## 9. Implementation surface and cleanup

After technical approval, the MVP may touch:

- `LeadMagnetSection` existing component/API/types/styles and a small server loader; guide modal/provider and tests.
- Existing guide callers in Header/Hero/PackageCard and approved page placements; no booking public-API redesign.
- `src/pages/api/lead-magnet.ts` and focused server helpers/tests (validation, origin, honeypot, idempotency key,
  Brevo client, outcome mapping). No rate-limit adapter in code; the WAF rule is account configuration by Mauricio.
- Existing typed dictionaries (form UI, outcome copy, consent wording + `CONSENT_TEXT_VERSION`) and verbatim tests for
  later approved copy; metadata-only PDF/template mapping and approved static files under `public/assets/guides/`.
  D-E5 mapping must be agreed before adding section keys.
- Delete `src/pages/api/mailchimp.ts`, `download.ts`, `download-check.ts`; remove consumers, obsolete download probes,
  active Mailchimp events/environment reads/example entries and replace affected tests. Preserve historical docs/fixtures.
- `.env.local.example` placeholders, focused booking/Contact isolation tests, and `docs/reports/phase-5e-lead-magnet-brevo.md`
  (includes the §7.1 export procedure and the observed Brevo/WAF results).

No ACF schema/WordPress loader change, framework migration, new npm package or unrelated known-debt cleanup. Retain
Nodemailer for Contact. Mauricio verifies retired account/environment configuration separately; no subscriber migration,
account deletion, campaign send or provider provisioning is authorized here.

## 10. Acceptance criteria (E-1–E-16)

| ID | MVP evidence required |
| --- | --- |
| E-1 | Unit: unchecked request → exactly one `/v3/smtp/email` call, zero contact/list/DOI calls. Checked → one guide call + one DOI call with `includeListIds` = `[Newsletter]` only; guide never waits on DOI |
| E-2 | Contact and Calendly booking, including repeat/failure paths, make no Brevo/marketing calls and keep approved behavior/copy |
| E-3 | Unit: §6.1 validation, honeypot (neutral 200, zero sends) and origin (403, zero sends) rules; stale version → 409; no client-controlled URL/list/template/sender |
| E-4 | WAF rule exists as specified (Mauricio screenshot/record); on Production with feature off, the 6th `POST /api/lead-magnet` from one IP inside 10 min returns 429. Unit: provider credit/limit/`429`/5xx → `failed` + 503, exactly one provider call (no retry). Brevo daily quota figure recorded |
| E-5 | Unit: idempotency key deterministic per email+guide+30-min bucket, differs across each, valid UUID format, absent from logs/responses; `duplicate_parameter` → `duplicate`. Preview: two guide requests for one test address within the bucket → one email received, second shows duplicate copy (or, if Brevo ignores the key, R-1 noted and the header kept/removed by decision). Timeout → `unknown`, no retry |
| E-6 | Unit: each guide × newsletter outcome combination maps to the correct HTTP status and approved copy; partial success stays accurate; no raw provider error or member enumeration |
| E-7 | Reopen/locale/guide-to-booking transitions isolate state; checkbox starts unchecked; no stale-result leak. Labels/errors/announcements, Escape/close, keyboard focus return and scroll restoration pass |
| E-8 | Reused section server-renders exact later-export copy with no stale fallback/client CMS swap. Missing required content blocks its locale; approved placements only; no ACF change |
| E-9 | Per offered locale: approved PDF/templates; received email in the right language with the right link/PDF/checksum; viewer checks; no translation fallback; old static links survive feature-off |
| E-10 | Local/test/off modes make no real sends; forged requests while off → 503 with zero provider calls; every legacy caller respects off. No runtime Mailchimp integration, old events/env reads or URL-proxy callers remain |
| E-11 | Preview, one checked request with a Mauricio test address: before click, contact not in Newsletter; after click, in Newsletter with the four attributes holding the expected values; record which Brevo DOI log/date/IP is visible. Unsubscribe via the email link → blocklisted/unsubscribed state visible. Export procedure (§7.1 step 5) performed once; consent-wording version test exists and fails on an unversioned wording change |
| E-12 | Preview, checked request for three Mauricio test states — (a) new address, (b) confirmed Newsletter subscriber, (c) previously unsubscribed — record observed native behavior; none of the §6.2 blockers occurs; exactly one marketing list exists |
| E-13 | No PII in analytics/logs/URLs; Brevo tracking off or disclosed per §7.2; guide works with newsletter unchecked and analytics denied/absent |
| E-14 | G-4b publication + Privacy §7 item 6; approved address in templates; retention decisions and Mauricio EFVP sign-off recorded; §6.3 risks accepted in writing; G-8 and effective-date gates preserved |
| E-15 | Effective Preview/Production configuration checked without values; real sends only in Mauricio's controlled Preview test; no new list, attribute beyond §7.1, or provider created by an agent |
| E-16 | Lint, typecheck, Vitest and build per AGENTS; baseline failures reported honestly. Browser 375/768/1440 in EN and enabled locales, plus 320 px PDF CTA check; all off-mode/booking regressions covered |

Use existing Vitest/Testing Library and mocks. Report exact commit/build, locale, offered/off state, copy revision and
observed counts; redact test PII. Rebase and recheck shared files after 5c-rest/5f.

## 11. Decision register

| ID | Status at rev 0.3 | Remaining action |
| --- | --- | --- |
| D-E1 | **Resolved A — Mauricio, November 4** | Test both operations (E-1) |
| D-E2 | **Confirmed A — Mauricio, November 4**; native DOI, only Newsletter | E-11/E-12 observations; no single-opt-in alternative |
| D-E3 | **Confirmed A — Mauricio, November 4**; immutable static same-origin PDFs | Supply and approve each language asset/template; retire proxies |
| D-E4 | **Resolved lean A — Senior Architect direction, November 5** (§6). Option B withdrawn | **Mauricio accepts R-1…R-8 in writing** (date here); Senior review of rev 0.3 |
| D-E5 | **Reuse section/modal confirmed; final content mapping OPEN** | Map later 5c-rest copy to existing ACF/dictionaries |
| D-E6 | **PARTIAL — address updated in Notion; DPA/EFVP research advanced** | Retention decisions + EFVP sign-off; §7.1 export procedure accepted |
| D-E7 | **OPEN — final release package** | Approve PDFs, guide/DOI templates, outcome copy (6 states, §3.2) and DOI redirect page |
| D-E8 | **OPEN — initial offered locales** | Independent readiness gates; FR-CA/ES editorial approval pending |
| D-E9 | **OPEN — capacity/window** | Agree checkout ownership and capacity (§13) |

No ADR needed: lean A adds no dependency, routing change or data model. (`@vercel/firewall` would need one — §14.)

## 12. Remaining 5e launch blockers and checkpoints

| Blocker | Owner / evidence required |
| --- | --- |
| B-1 Technical approval | Senior Architect: rev 0.3. Mauricio: R-1…R-8 accepted |
| B-2 Later canonical export and mapping | Content owner/Dev: 5c-rest export SHA, approved locale text, synchronized address, D-E5 mapping and re-pinned tests |
| B-3 Per-language assets/templates | Mauricio/editorial: final PDF, guide/DOI/outcome copy, destinations; FR-CA/ES pending |
| B-4 Brevo/Vercel configuration | Mauricio: Newsletter only, DOI templates, 4 attributes, sender, tracking off, quota figure; WAF rule on Production |
| B-5 Data handling approval | Mauricio: EFVP sign-off, retention decisions, §7.1 export procedure |
| B-6 Privacy publication | Mauricio: G-4b deployed in enabled site locales, §7 recheck, G-8/effective date |
| B-7 Implementation verification | Dev + Mauricio: gate, browser regressions, controlled Preview (E-5, E-9, E-11, E-12), WAF check (E-4), report |
| B-8 Rollout authorization | Mauricio + Senior: offered locales and deliberate activation; website launch independent |

Sequence: review rev 0.3 + risk acceptance → copy mapping → implement with feature off → Brevo/WAF configuration →
G-4b → controlled Preview and report → deliberate activation. A failed gate delays 5e, not the website.

## 13. Schedule and revised effort (excluding PDF production)

Preserve Phase 5c November 9–11 and Privacy Route November 12. Mock-level implementation (API route, validation,
outcome mapping, modal state) can start after rev 0.3 approval and Privacy's checkpoint, with spare capacity, in an
independently owned checkout. Copy integration waits for the actual 5c-rest export. Practical shared-checkout baseline
remains **November 23 onward**; coordinate dictionary/provider overlap with 5f (November 30 fallback). If any 5e gate is
missing, the website launches December 3 with 5e hidden.

Assumes existing section/modal, native fetch, static assets, no ACF change, supplied approved copy/templates. Includes
verification across offered locales; excludes writing translations/PDFs/legal copy and approval waiting time.

| Work | Agent | Mauricio active |
| --- | --- | --- |
| Abuse/duplicate controls (validation, honeypot, origin, idempotency key, provider-error mapping) + unit tests | 1.5–2.5 h | — |
| `/api/lead-magnet`, Brevo guide + DOI calls, outcome typing, failure tests | 3–4 h | 0–0.5 h |
| Reuse section/modal, server loader, copy wiring, consent-version test, legacy Mailchimp/download cleanup | 3–5 h | 0.5 h |
| Brevo/Vercel configuration (Newsletter, DOI + guide templates, 4 attributes, tracking off, quota check, WAF rule) — agent writes the checklist | 0.5 h | 1–1.5 h |
| Gate, browser checks, controlled Preview (E-5/E-9/E-11/E-12), WAF 429 check, export trial, report | 3–4 h | 1–1.5 h |
| **Subtotal** | **11–16 h** | **2.5–4 h** |
| Contingency / shared-file rebase after 5c-rest and 5f | 1.5–2 h | 0.5 h |
| **MVP planning allowance** | **12.5–18 h** | **3–4.5 h** |

Compared with rev 0.2 (15–23 h agent / 4–7 h Mauricio, plus 3–6 h / 1–2 h if option B): the D-E4 demonstration line
(2–3 h / 1–2 h) is replaced by unit tests and two short live checks, and the option B allowance is gone. A §6.2 blocker,
a new processor, ACF changes or revised copy architecture require a fresh estimate.

## 14. Post-launch enhancements — excluded from MVP

- Recipient-level or global rate limits (e.g. `@vercel/firewall` with a custom `rateLimitKey` — new dependency + ADR;
  on Hobby it competes for the single rate-limit rule), or a shared TTL store. Revisit only if R-4 is observed in practice.
- Custom consent ledger, scheduled evidence archives, reconciliation, dashboards.
- Delivery queues, webhooks, retry workers, persistent outcome replay, status pages.
- CAPTCHA/third-party challenges (Vercel WAF "Challenge" action included), adaptive abuse detection.
- New consent groups/preference centre, CRM imports, campaigns or list architecture.
- ACF/schema redesign, new copy system, signed/private downloads, generated attachments or fillable PDFs.

## 15. Review stop

Return **Draft rev 0.3** for Senior Architect review and Mauricio's acceptance of R-1…R-8. No implementation,
account/CMS/environment/WAF work, provisioning, re-export, staging, commit or push follows this assignment.
