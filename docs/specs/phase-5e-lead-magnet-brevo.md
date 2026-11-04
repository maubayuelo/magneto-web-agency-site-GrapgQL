# Phase 5e — Lead magnet + Brevo

- **Status: Draft (rev 0.1)** — 2026-11-04.
- **Role:** Architect; for Mauricio + Senior Architect review. No implementation approval is implied.
- **Inspection baseline:** local `master` at `52c9f56` (Phase 5f documentation merged through PR #28).
- **Authority:** [Privacy Route rev 1.2 §8](privacy-route.md#8-brevo-lead-magnet--optional-newsletter--policy-impact-only),
  [ADR 0002 amendment 1](../adr/0002-brevo-replaces-mailchimp.md),
  [ADR 0005](../adr/0005-ui-dictionaries.md), and `AGENTS.md`.
- **Copy baseline:** canonical repository export `637fba7`; current copies have not been changed by this assignment.
  The separately linked Notion PDF source was read on November 4; it is not an approved PDF export.
- **Scope of this assignment:** this document only. No application, environment, CMS, account, copy, or asset changes.

## 1. Outcome and constraints

A visitor can request the completed website checkup in their current language and receive its download link by email.
The form has a separate, optional newsletter checkbox, initially unchecked. Delivery works whether the visitor checks
it or not. Only an explicit checked choice may start newsletter enrollment. Bookings and Project Inquiries never
create marketing subscriptions or CRM contacts in this phase. These are accepted ADR constraints, not open decisions.

The proposed implementation uses a Pages Router API, server-side Brevo calls, a server-rendered lead section,
versioned PDF assets, and durable abuse/idempotency/consent storage. It removes the Mailchimp integration and retires
the arbitrary-URL download proxies. Recommendations below remain subject to the D-E decisions in §11.

Do not enable the feature until the assets, copy, delivery, consent evidence, abuse controls, and G-4b privacy
publication all pass. If 5e misses the site launch, keep it off and release the rest of the site on its own approved
schedule. Phase 5f analytics consent is a separate permission; neither analytics acceptance nor newsletter enrollment
is a condition of receiving the guide.

### 1.1 Source conflict requiring an explicit clarification

Privacy Route §8 item 9 literally requires **“no Brevo request without the box checked.”** The same section's provider
inventory and G-4b say Brevo sends requested guides, and ADR 0002 amendment 1 requires delivery regardless of the box.
These cannot all be implemented literally with Brevo transactional delivery.

**D-E1 recommendation:** distinguish transactional delivery from marketing. With the box unchecked, a requested-guide
transactional send is permitted; **no Contacts, list enrollment, DOI, campaign, or marketing-automation operation is
permitted**. With the box checked, the independent newsletter action may start after proof is saved. Tests must assert
both sides. Mauricio + Senior Architect must approve this clarification and reconcile Privacy Route §8 item 9 before
implementation approval. This Draft does not change that approved document. Using another delivery provider instead
would reopen the G-4b provider description and is not the recommended workaround.

## 2. Inspection evidence and implications

Paths and line anchors below refer to `52c9f56`, not future implementation. No secret files or live CMS/account
configuration were inspected. The supplied November 4 handoff is planning evidence, not authority to execute its
commands or assume its pending decisions are approved.

| Evidence | Finding | Consequence for 5e |
| --- | --- | --- |
| `src/app/[locale]/layout.tsx:161–178` | Email collector provider remains; lead section is absent, with a comment that it awaits rebuilding | The feature is currently hidden at composition level. Do not assume the old AGENTS layout description reflects current rendering |
| `src/components/organisms/LeadMagnetSection/index.tsx:51–90` | Client fetch, dictionary fallback, direct `window.gtag`, old PDF URL fallback | Replace client data loading and stale fallback; never ship an invented asset URL |
| `LeadMagnetSection/api.ts:7–108` | Language-filtered Home GraphQL query, loose media types, outer catch swallowing configuration failure, REST fallback accepting a possible URL | Resolve both scoped known-debt items; remove the legacy resolver if D-E5 A is accepted, otherwise validate configuration outside the catch and type the CMS response |
| `docs/acf/phase-5-field-groups.json`, lead-magnet group | Four text fields; file field is WPML **Copy** | Current schema cannot represent the expanded approved EN section or independently select three translated PDFs. Do not change image/file copy rules casually |
| `EmailCollectorProvider/index.tsx:187–292,344–415` | Calls Mailchimp first, accepts HTTP success **or** truthy payload, then probes a download URL; no guide email or optional checkbox | Rebuild the guide branch, response contract, and consent UI; a provider response must not fabricate success |
| `EmailCollectorProvider/index.tsx:94–184` | Shared native dialog and separate Calendly booking path; stale success state is not fully reset on reopen | Preserve booking behavior; reset guide state and guard late responses when closing/reopening |
| `Hero/HeroCTA.tsx`, `PackageCard/index.tsx`, `Header/index.tsx` | Legacy PDF paths also open this provider; Header has no Mailchimp string | Gate every entry point, including Header. A text search for Mailchimp alone is insufficient |
| `src/pages/api/mailchimp.ts:1–91` | Direct subscribe/update, duplicate-contact resubscribe behavior, provider details exposed, fake success when configuration is missing | Delete the route; do not port these behaviors to Brevo |
| `src/pages/api/download.ts`, `download-check.ts` | Client-supplied URL, permissive host logic, redirects, repeated upstream requests and PDF guessing | Retire in favor of fixed public assets; no open proxy or arbitrary fetch in the new API |
| `src/pages/api/contact.ts` | Nodemailer sends an inquiry to the agency; `DISABLE_SMTP=1` avoids real delivery | Preserve the inquiry contract. It is not an existing guide-delivery implementation |
| `src/components/organisms/FinalCTASection/FinalCTASectionLoader.tsx` | Existing async server-loader/presentation split | Reuse the structural pattern, without copying fallback text into the new lead section |
| `package.json`, `.env.local.example` | Next 15.5.28 / React 19.1.2; native fetch available, Nodemailer 7.0.6; no Brevo SDK or durable rate/consent store dependency; Mailchimp example entries remain | Prefer native fetch and existing test tools. A durable service is a new approved dependency, even without an npm package |
| `EmailCollectorProvider.test.tsx`, `src/pages/api/contact.test.ts`, dictionary tests | Tests cover legacy Mailchimp/download and booking isolation; copy locks refer to `637fba7` | Replace legacy guide assertions; preserve and strengthen booking/inquiry isolation and copy provenance |
| `public/` | No PDF asset found | Source prose is not proof of a deployable guide |

The handoff reports authenticated Brevo domain/sender and removal of Vercel `MAILCHIMP_*` values on November 4 without
a redeploy. Treat those as Mauricio-reported facts requiring configuration verification at release, not as proof of the
effective deployed build. No Brevo list, credential, template, or storage backend was verified in this task.

## 3. Content and PDF release package

### 3.1 Editorial readiness

The EN export contains the new lead section, optional first name, required email, separate newsletter consent,
privacy explanation, sender-identification line, success and error copy (`docs/content/magneto-copy-en.md:107–162`).
The guide title is **Fix, Rebuild or Maintain? The 10-Minute Website Checkup**. FR-CA and ES exports still contain older
lead titles; alignment is a content-owner task, not permission for Dev to translate or rewrite them.

The [canonical PDF source](https://app.notion.com/p/40e702393b5e818aa2b8e7f7bcacdabc), read November 4, identifies itself
as **EN source draft v1.2**, not laid out or time-tested. It proposes ten pages including the cover, 25 questions with
Yes / No / Not sure, a worksheet, and a closing call CTA. It still has a `[booking-path]` placeholder and human checks
for the timing claim, “No obligation,” the FR CTA, and a referenced guidance link. The website's “yes/no” description
also needs editorial reconciliation with the PDF's third answer. Review comments on that page are not final approval.

Before enabling any locale, Mauricio supplies an approved release package with:

1. Final section/form copy and source revision; FR-CA/ES adapted from the final guide, not guessed from EN.
2. Final PDF per enabled guide locale, filename, guide/version ID, checksum, size, title and approval record.
3. Approved subject, preheader, HTML and plain-text guide email; DOI email and confirmation destination copy if D-E2 A.
4. Actual sender name, reply-to and mailing address, replacing the canonical placeholder through the normal copy process.
5. Approved UI copy for pending/unknown delivery, rate limit, temporary unavailability, and optional-newsletter failure.
   Existing “request was not sent” copy cannot describe an accepted guide plus failed newsletter or an ambiguous timeout.
6. Confirmation that all links, timing/page-count claims, PDF language and accessibility checks match the final assets.

Missing text is a **TODO in this specification**, not text to invent in code. Coordinate any canonical re-export and
test re-pinning with 5c-rest; no export during November 9–11. Do not relax ADR 0005 or add TODO dictionary values that
make an otherwise enabled locale unbuildable. ES remains subject to the existing Spanish editorial/launch gates,
including privacy G-8; this Draft does not certify Spanish as launch-ready.

### 3.2 Asset and hosting proposal — D-E3

Use immutable, same-origin public files such as `/assets/guides/website-checkup/<version>/<locale>.pdf`. These names
are proposed technical identifiers, not editorial copy. A server-owned release registry maps a closed `guideId` and
`locale` to that asset, approved source revision and email template configuration. Never accept an asset URL,
template ID, list ID, sender, redirect URL or email body from the client.

Email an absolute HTTPS link constructed from the trusted deployment configuration, not the request Host header.
Production links use the production domain. A controlled Preview test must use links Mauricio can actually open;
Vercel preview protection must not produce an inaccessible emailed PDF. Do not disable protection automatically.

The PDF is public: this form offers email delivery, not access control. No signed-token storage, email address in
the URL, Mailchimp membership gate, or email attachment is proposed. Keep previously emailed versioned files available
when the form is disabled or a new version ships. Remove `/api/download` and `/api/download-check` and all consumers;
their old arbitrary-URL contracts return 404 after removal. No redirect to an untrusted supplied URL.

PDF acceptance includes correct locale, selectable text, document title/language, reading order, contrast, usable
links, print readability and mobile/desktop PDF viewer checks. Use a normal non-fillable PDF unless separately
approved. Verify the closing CTA's real destination and locale. Selecting a new popup-opening route would add scope;
no such route is assumed here. FR-CA should be ready alongside EN as requested by the PDF source; D-E8 confirms rollout.

## 4. UI, server loading and locale behavior

### 4.1 Lead section and content source — D-E5

Recommended A: a small, typed **server-only guide release manifest** holds the complete approved lead-section content
alongside each immutable asset version. The server loader selects it by locale and readiness, then passes presentation
data to the component. UI microcopy remains in the existing typed dictionaries. This is an explicit, scoped exception
to the current Home-ACF content source and requires Senior Architect approval; it is not an established decision.

Rationale: the four existing CMS strings cannot hold the expanded section without losing approved headings/bullets,
and the copied file field cannot select translated PDFs. This option avoids changing the shared Home schema and
5c loader during their reserved windows. Preserve canonical provenance and verbatim tests; do not turn the manifest
into an independently authored copy source. Remove the obsolete lead GraphQL/REST resolver and its configuration-swallow
path rather than leave it callable. This resolves the two scoped lead-loader debts by removing that obsolete path.

Alternative B: retain Home ACF, add the missing typed translatable fields, use a separate PDF registry, and implement
the server loader with explicit missing/configuration/error handling. That requires a schema/loader amendment,
WPML-safe content loading and local/prod verification coordinated after 5c-rest. Do not modify the existing copied
media field or use ad hoc FR/ES admin saves to bypass the approved loader workflow. Estimate separately in §13.

For either option:

- Render the complete section on the server; no `useEffect` content swap, EN fallback in FR/ES, or fake PDF URL.
- Proposed placements are Home, About and Services before their Final CTA, following approved section placement.
  No global layout insertion that also exposes it on Contact, privacy, 404, Packages or case studies.
- Resolve feature readiness on the server. Missing locale content/asset disables the section for that locale and
  raises a sanitized diagnostic; deliberate feature-off returns no section. Invalid enabled configuration fails the
  release validation, rather than quietly passing QA with missing content.
- Preserve the locale routing and App Router / Pages Router split. Use `localizePath` for the privacy link.

### 4.2 Shared modal

Rebuild only the guide branch of `EmailCollectorProvider`; keep the booking path's qualification fields, Calendly
handoff, copy, dialog mechanics and no-marketing behavior. Replace the arbitrary `downloadUrl` guide contract with
an explicit registered guide identifier; update all guide callers within this scope. Preserve booking caller APIs.
Legacy PDF CTAs without a registered guide must not silently open a booking modal or reach the old subscription API.

Guide fields: optional first name, required email, optional unchecked newsletter box with the exact approved locale
wording, privacy link and sender identification. A guide request is not a blanket privacy or marketing consent.
Reset checkbox, errors, success, request token and pending state on each new opening; do not remember consent in browser
storage. A locale change cannot leave mismatched consent wording and template language.

Use semantic labels, associated inline errors and an announced result. Preserve modal focus containment, Escape and
close controls, scroll handling and focus restoration to the triggering control (or a stable page target if gone).
Closing remains possible during a request; abort the browser wait and ignore stale results, without claiming that
server-side delivery was cancelled. Reopening must not display a previous visitor/request's success. A retry of an
uncertain identical request uses the original request ID, subject to §6; closing alone must not trigger a resend.

No automatic second submission, newsletter retry, or new contact created by rendering the page. Email and name never
enter analytics, URL parameters, console messages or error-monitoring payloads. Replace Mailchimp-named guide events
only through the existing analytics abstraction; when 5f is absent/denied, guide completion must still work without
analytics. Do not introduce a Brevo browser tracker or make consent storage depend on GA.

## 5. Pages Router API and Brevo integration

Proposed endpoint: `POST /api/lead-magnet` in `src/pages/api/lead-magnet.ts`. Server modules own validation, release
selection, Brevo access and durable storage; the client imports none of their credentials or account configuration.
Native `fetch` is sufficient; no Brevo SDK or validation package is authorized by this Draft.

### 5.1 Request and validation contract

Accept only JSON with `requestId` (UUID), `guideId`, `locale`, `email`, optional `firstName`, explicit boolean
`newsletterConsent`, displayed `consentVersion`, a closed source-page identifier and a honeypot field. No arbitrary
UTM/referrer strings are needed for consent evidence. Validate unknown fields and types; never coerce a string such
as `"false"` to a checked choice. Verify the server registry/version matches the wording shown before any send.

Proposed bounds: 8 KiB body, email up to 254 characters, first name up to 100 characters, source from the allowed
placement enum. Trim whitespace, reject CR/LF and control characters, validate email structure without provider-specific
dot/plus rewriting, and escape user-supplied text in templates. Deduplication normalization must be consistent without
silently changing the delivery address. Accept only enabled site locales with a complete guide release; never fall back
to EN. Reject unsupported methods with 405 and oversized bodies with 413.

Require a same-origin browser request against a configured allowlist; reject foreign/missing Origin for this public
browser endpoint. Preview origins must be specifically approved, not arbitrary `*.vercel.app`. Check content type and
Fetch Metadata where available; these are additional controls, not substitutes for rate limits. Do not trust a client
IP header except the verified deployment platform's value.

### 5.2 Two independent actions

1. Check server feature/local-send switches, configuration, input, abuse controls and atomic request reservation.
2. Record the request and exact displayed consent-version reference before an external side effect.
3. Deliver the requested guide through Brevo transactional email. Do not create a Brevo “Guide requests” contact list
   entry as a prerequisite. The handoff's proposed list is not an accepted requirement. Guide-only addresses stay out
   of marketing contacts; Brevo delivery logs still contain recipient data and need retention controls.
4. If and only if the box is checked and consent evidence was saved, start the separate newsletter operation. Prefer
   DOI (D-E2). Newsletter failure does not roll back, withhold or repeatedly resend an already accepted guide.
5. Persist separate guide/newsletter results and return a sanitized result. No automatic background retries or campaigns
   are part of this phase. Record incomplete work for the explicit recovery process in §6.

The proposed transactional call uses `POST https://api.brevo.com/v3/smtp/email` with a server-held API key, approved
sender/template and registry-controlled link parameters. [Brevo's idempotency example](https://developers.brevo.com/docs/heterogenous-versions-batch-emails)
documents this endpoint and payload form. A successful API acceptance is not proof of inbox delivery; the real test
must verify receipt. Confirm current response semantics and account limits during implementation.

For DOI, Brevo documents `POST /v3/contacts/doubleOptinConfirmation` with email, list IDs, template ID and redirect URL;
attributes must already exist in the account. The server selects all account IDs and a locale-appropriate, fixed
same-origin confirmation destination. A generic redirect query alone is not proof of confirmed consent.
[Brevo DOI reference](https://developers.brevo.com/reference/create-doi-contact).

Mauricio configures one newsletter audience with a language attribute (`en`, `fr-CA`, `es`) and controlled segments,
plus approved guide/DOI templates for each offered locale. No automatic campaign or welcome promotion fires for guide
requests. Confirm existing-contact, pending-DOI, unsubscribed and blocked-address behavior in Preview. Never clear a
blocklist flag, overwrite suppression or unconditionally resubscribe a duplicate address. A fresh, verified opt-in
may permit re-enrollment only under the approved D-E2 workflow.

### 5.3 Public responses and failure handling

Return a typed response with a request correlation ID and independent, coarse outcomes:

- `guide`: `accepted`, `pending` (outcome unknown), or `failed`.
- `newsletter`: `not_requested`, `confirmation_requested`, `pending`, or `failed`.
- Optional locale error keys; no raw provider text, email echo, API key, list/template IDs or subscriber-existence detail.

Use 200 only for a recorded completed result (including guide accepted with optional newsletter failure); 202 for
an unresolved request; 400/409 for invalid input or request/version conflict; 429 plus `Retry-After` for throttling;
503 for feature unavailability/configuration/storage failure. Replayed identical requests return their saved status,
not another send. The UI reads the typed state, never `res.ok || payload.success || payload.data`.

Set finite provider timeouts within the Vercel function budget, initially an 8-second timeout per call and a bounded
overall deadline verified against the actual plan. If time runs out after guide acceptance, report the newsletter
as pending/failed appropriately. Connection loss after a send is **unknown**, not “not sent.” Never retry the whole
two-action workflow blindly. Do not disclose whether an address already subscribes. Logs contain correlation ID,
stage, duration and sanitized category only; no form body or provider response dump. Responses use `Cache-Control: no-store`.

## 6. Abuse protection, persistence and recovery — D-E4

There is no durable store in the inspected implementation. An in-memory map in a serverless process cannot provide
cross-instance rate limits, consent evidence or concurrency protection. **Proposed prerequisite:** an approved managed
durable store supporting atomic reservations/counters, expiry, restricted access and consent-event retention. Select
the provider, region, cost, DPA, backup/export and deletion process before approval. Native REST access can avoid an
npm dependency; it does not remove the new processor/privacy obligation. No service is provisioned by this Draft.

Proposed initial limits, to confirm in D-E4 and tune using non-PII operational counts:

- Per source IP: 5 attempts / 10 minutes and 20 / day; use short-lived keyed hashes, not raw IP logs.
- Per normalized recipient + guide: one delivery attempt / 10 minutes, 3 / day; one DOI initiation / day.
- Global safety ceiling: 100 new delivery attempts / hour, below the verified Brevo quota; an operator can lower it.
- Honeypot rejection, bounded payload and same-origin checks precede provider calls. Do not rely on the existing unused
  Turnstile key. Adding a third-party challenge would need a separate dependency/privacy decision and accessible fallback.

Atomic reservation binds `requestId` to a server-computed fingerprint of the immutable validated payload, including
recipient, guide/version, locale and consent choice. Same key + different payload returns 409. Store independent guide
and newsletter stage states (`reserved`, `sending`, `accepted`, `failed`, `unknown`) and provider evidence where available.
Concurrent invocations cannot both acquire a send reservation. Client retries cannot bypass recipient/IP limits by
changing request IDs. Exempt a true replay from counting as a new send, while still limiting abusive HTTP traffic.

Use a stable per-action provider idempotency key where supported. Brevo's current batch-email guide describes a
30-minute key lifetime, while its [original announcement](https://developers.brevo.com/changelog/2021/11/10) described
15 minutes. Verify the behavior for the exact single-recipient template call; do not assume the DOI endpoint has the
same guarantee. These provider limits are shorter than application retention and cannot replace the durable ledger.

Persist `sending` before calling the provider. If the process dies or persistence fails after acceptance, keep the
action unknown: do not release its reservation merely because a lock expired. An identical retry may resolve recorded
state; it must not send again outside a verified provider deduplication window. No blind DOI retry after an ambiguous
timeout. Do not promise exactly-once delivery across an external system and a local ledger.

For unresolved states, Mauricio uses the correlation/provider evidence in the account to record reconciliation or an
explicit retry decision. No unauthenticated public status lookup by email; an identical bounded POST replay is enough
for the initial UI. Define an operational review of unknown requests before expiry so they are not silently lost.
No automatic retry queue, webhook receiver or recurring job is assumed. If those become necessary, amend scope and
estimate before implementation.

When the durable backend is unavailable before reservation, fail closed with 503 and make no Brevo request. If a
newsletter evidence write fails after a guide was already accepted, keep the guide success and suppress the newsletter
action. Do not fake a successful subscription to keep the UI simple.

## 7. Consent records, retention and CASL checks

Store guide-request processing and marketing permission separately. Proposed newsletter evidence is append-only per
event, linked to the contact by a protected identifier, and includes:

- Server UTC timestamp and request ID; affirmative checked action; locale; source page/form and guide/version.
- Exact checkbox and disclosure text or an immutable, retained snapshot plus version/hash; canonical source revision.
- Privacy-policy revision/effective date shown at request time; separate guide-delivery result.
- DOI requested/confirmed timestamps and provider evidence, where applicable; withdrawal/suppression events.

Do not infer consent from a guide download, cookie/analytics choice, inquiry, booking, an existing contact, or a missing
boolean. Contact attributes alone are mutable and are not the complete historical proof. Persist the original text
snapshot when wording changes; a hash without its recoverable source is insufficient. Reconcile Brevo confirmation and
unsubscribe evidence with the retained ledger before any marketing campaign. With no webhook in scope, Mauricio owns
this reconciliation/export and campaign eligibility check; if reliable proof cannot be obtained, do not send campaigns.

Proposed operational retention is 24 hours for abuse counters and seven days for guide-delivery/idempotency records,
followed by deletion of recipient/name and operational payloads. Retain a non-identifying aggregate only if useful.
Unconfirmed DOI records, confirmed consent evidence, provider delivery logs/backups and suppression data each need an
explicit owner-approved period in D-E6. There is no invented universal CASL retention period. Minimize durable recipient
data; protect it at rest, restrict access, and define correction/deletion/export and expiry verification. Keyed hashes
remain personal data where linkable. If Brevo retains IP data, document that fact and period; do not collect extra IP
evidence merely because a field exists.

Mauricio verifies the legal/content checklist before any real send:

- Sender identity, a valid mailing address and approved contact method appear where required in the consent request
  and messages. The approved copy's address placeholder must be resolved.
- Marketing messages have a working, simple unsubscribe mechanism; requests are honored without delay and no later
  than ten business days. Required contact/unsubscribe facilities remain usable for the applicable 60-day period.
- Demonstrable express consent and suppression handling are maintained; DOI is a recommended evidence/abuse control,
  not a claim that CASL universally requires DOI.
- Review the actual guide email and PDF/CTA together; do not assume that calling an email “transactional” exempts its
  promotional content. Approve its treatment and wording without forcing newsletter consent for delivery.

These checks follow the [CRTC CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm). The
[CRTC compliance-program guidance](https://crtc.gc.ca/eng/archive/2014/2014-326.htm) supports keeping consent,
unsubscribe and message/template evidence. Mauricio owns the approved retention/legal choices; Dev implements them.

Default proposed tracking configuration is **off** for email opens/click rewriting and all Brevo site scripts. Inspect
delivered HTML and link destinations as evidence. `contactPixelTrackingConsent: false` is not equivalent to tracking
disabled: the [Brevo DOI reference](https://developers.brevo.com/reference/create-doi-contact) describes anonymized
events and account-dependent behavior. If tracking cannot be disabled, stop and resolve policy/consent requirements
before launch; do not silently broaden the existing analytics consent.

## 8. Privacy publication, configuration and feature-off fallback

### 8.1 G-4b is a deployment precondition

Mauricio completes G-4b in canonical EN → FR-CA → ES and publishes the approved additions on the WP privacy pages
**before the deploy that activates 5e**. Cover fields collected, guide and separate marketing purposes, Brevo role/region,
consent evidence, guide-only/subscriber/suppression retention, withdrawal, and any tracking actually enabled. Assess
Brevo's agreement and transfers under G-4; also disclose/assess the new durable-store processor if D-E4 introduces one.
The handoff's EU-company description is not verification of this account's data region or all subprocessors.

Re-run Privacy Route §7, including item 6, against the updated deployed pages in every enabled site locale. Record page
URLs, source/policy revision, effective date, screenshots and results without personal data. Verify FR/ES publication,
not just EN or a ready block still in Notion. G-8 remains the Spanish launch gate. A December 10 site launch requires
verification of the privacy policy's approved effective date; do not mechanically retain December 3 or edit it here.

Do not expose a real Preview lead form publicly against incomplete policy pages. Mocks may test pending work; Mauricio's
real test requires approved disclosures visible in that controlled environment. Production activation additionally
requires the production WP publication and release checks. A feature-off merge does not waive these activation gates.

### 8.2 Proposed server-only configuration

Add documented placeholders to `.env.local.example` during implementation, never credentials. Final names follow D-E4:

| Proposed key/group | Rule |
| --- | --- |
| `LEAD_MAGNET_ENABLED` | Off unless explicitly `1`; server authoritative, with UI readiness passed as safe props |
| `LEAD_MAGNET_LOCALES` | Explicit subset of enabled site locales; each has a complete approved release |
| `DISABLE_BREVO` | Defaults to `1` in local/test examples; only explicit `0` permits real calls in an approved environment |
| `BREVO_API_KEY` | Server secret; never a `NEXT_PUBLIC_` variable or client import |
| Brevo sender, newsletter list and locale template mappings | Validated server configuration; missing mapping disables activation, no cross-language fallback |
| Store endpoint/token and HMAC key | Server-only; provider/region/retention approved first; no values in logs or reports |
| Trusted application origin / Preview test restriction | Server-owned origin; protected Preview with recipient allowlist for Mauricio's test addresses |

Local and automated tests use mock provider/storage adapters and make **zero real Brevo requests**. A disabled sender
must not return production-like “email sent” success. Production must never run a fake-send adapter. Do not change
`DISABLE_SMTP` or contact behavior. Fail configuration validation before any network side effect.

Verify effective Preview and Production configuration after build/deployment, not just saved dashboard values. If a
rendered feature flag is baked into a build, require rebuild/redeploy for UI changes; server POST checks still reject
stale forms when disabled. Record only presence/mode and redacted evidence, never secrets. Mauricio performs all account
and environment operations; no such operations are authorized by this specification-writing assignment.

### 8.3 Fallback and rollback

Feature off means no lead section, no active guide modal entry from Header/Hero/PackageCard, no public request action,
no Brevo script and no API send on a forged request. Already emailed PDF links remain available. In-flight requests
may already have been accepted; never promise recall. Check the switch immediately before each new provider action,
preserve the ledger and suppress any not-yet-started newsletter action during shutdown.

Keep Mailchimp removed; do not roll back to bundled subscription or fake success. Preserve booking, inquiry and the
rest of the site. If 5e is delayed, the site can launch December 3 or its December 10 fallback with the feature hidden.
Reconcile policy wording with actual disabled/live flows through Mauricio's publication process; Dev must not invent
legal text. Phase 5f's November 30 fallback deadline remains unchanged and is not a 5e completion promise.

## 9. Mailchimp removal and permitted implementation surface

The later implementation PR may touch the following only after approval:

- `src/pages/api/lead-magnet.ts` and focused tests; server validation/Brevo/storage/release modules and their tests.
- `LeadMagnetSection/{index.tsx,api.ts,types.ts,LeadMagnetSection.scss}` as needed, a server loader and focused tests.
- `EmailCollectorProvider` guide branch/styles/tests; registered-guide callers in `HeroCTA`, `PackageCard`, `Header`.
- Home/About/Services page composition for approved section placement; dictionary types/EN/FR/ES strings and verbatim
  tests for approved lead UI copy; a server-only guide release manifest if D-E5 A.
- Approved versioned PDFs under `public/assets/guides/`; `.env.local.example` placeholders and operator documentation.
- Delete `src/pages/api/mailchimp.ts`, `download.ts`, `download-check.ts` and obsolete tests/callers; replace legacy
  subscription/download expectations. Add no forwarding compatibility path to Mailchimp.
- Update contact/booking tests only to prove continued isolation; keep their application behavior unchanged.
- Add `docs/reports/phase-5e-lead-magnet-brevo.md` with the release evidence. Any newly approved infrastructure or
  D-E5 B schema/loader paths must first be explicitly added to the approved scope.

Remove live Mailchimp event names and all active Mailchimp environment reads/example entries. Inspect dependencies and
lockfile before claiming a package removal: the current route uses fetch, and no Mailchimp SDK was found. Do not remove
Nodemailer (still used by Contact), the unrelated `gtag` package (separate 5f decision), or other known debt. Historical
fixtures, ADR history and pinned canonical copy mentioning Mailchimp are not runtime integration and must not be
rewritten by a bulk search-and-replace. Mauricio verifies retired environment values/account automations after release;
no list migration, subscriber import, account deletion or campaign send is included.

## 10. Verification and acceptance criteria

Implementation evidence belongs in the report, with exact commit/build, locale, mode and result. Mock tests are not
evidence of real account behavior; a Brevo API acceptance is not proof of receipt or DOI confirmation.

| ID | Required evidence |
| --- | --- |
| E-1 | Unchecked request receives guide email; zero Contacts/list/DOI/campaign calls or marketing automation. Checked request delivers guide independently and starts only the approved newsletter workflow. D-E1 clarification approved |
| E-2 | Contact inquiry and Calendly booking, including repeat/failed submissions, produce no Brevo marketing/CRM calls and preserve approved behavior/copy |
| E-3 | Invalid email, missing/incorrect boolean, unsupported/disabled locale, stale consent version, oversized body, forged origin, unknown guide and supplied URL/list/template data are rejected before provider calls |
| E-4 | Limits work across independent server instances; recipient limits survive changed request IDs; honeypot and global ceiling prevent sends; store outage fails closed |
| E-5 | Concurrent identical POSTs, double-click, browser retry and reload produce no duplicate stage; different payload with same ID returns 409. Crash/timeout before and after provider acceptance leaves recoverable states, not blind resend; DOI retry behavior independently tested |
| E-6 | Guide accepted + newsletter failed remains a guide success. Provider 4xx/429/5xx, missing config, timeout, malformed response and lost persistence return correct sanitized outcomes; no fake success or subscriber enumeration |
| E-7 | First open, close/reopen, guide-to-booking transition, locale change and late response reset/isolate state. Checkbox always starts unchecked. Keyboard and screen-reader labels/errors/status, Escape, focus return and scroll restoration pass |
| E-8 | Server HTML contains the exact approved locale section; no stale fallback flash or client CMS request. Missing guide/copy prevents activation. Home/About/Services show only approved placement; Contact/privacy/404 and unapproved placements remain unaffected |
| E-9 | Each offered locale receives its approved subject/body/link/PDF; no EN fallback. PDF checksum, language, title, text/reading order, links, mobile viewer and print checks pass; old version links survive feature-off |
| E-10 | Local/test/off mode makes no real external send; off API rejects forged requests and stale UI. All legacy Header/Hero/Package guide entry points are covered. No Mailchimp requests, active env reads, events or download-proxy callers remain |
| E-11 | Consent snapshots/version/time/source/language and DOI/withdrawal evidence are retrievable by authorized operator; expiration/deletion and suppression are tested without losing unsubscribe protection |
| E-12 | Existing subscriber, pending DOI, fresh opt-in after withdrawal and blocked recipient cases do not silently resubscribe or reveal membership. Language segments and campaign exclusion are verified in the account by Mauricio |
| E-13 | No email/name in analytics, URLs or diagnostic output; no Brevo browser script, pixel or rewritten tracking link. Delivery works with analytics denied/absent and newsletter unchecked |
| E-14 | G-4b policy published and Privacy Route §7 re-run, including item 6; processor/retention/address/effective-date evidence complete in each enabled locale; G-8 not bypassed |
| E-15 | Effective Preview/Production flags and secrets presence validated without values; controlled Preview real delivery + DOI + unsubscribe round trip by Mauricio only; recorded inbox receipt and working PDF link |
| E-16 | Lint, typecheck, Vitest and build run separately per AGENTS completion gate; report baseline failures honestly. Browser checks at 375/768/1440 in EN and every enabled locale, plus 320 px PDF CTA check requested by canonical copy |

Use existing Vitest/Testing Library tools, fake timers and injected mock adapters; no new test package by default.
External production writes are performed only by Mauricio under the release workflow. Test accounts/addresses and
record IDs are redacted from committed evidence. Re-run affected integration checks after rebasing shared files with
5f or 5c-rest. Release still requires the PR's Vercel Preview check and the existing controlled publication process.

## 11. Open decisions for Mauricio + Senior Architect

All D-E entries below are **proposals**, not inferred approval. Accepted ADR constraints in §1 remain fixed.

| ID | Decision and recommended option | Alternative / effect |
| --- | --- | --- |
| D-E1 | **A — Clarify Privacy §8 item 9 to prohibit unchecked marketing calls, while allowing requested transactional delivery** | A different delivery provider needs revised G-4b; literal current wording cannot coexist with the proposed Brevo flow |
| D-E2 | **A — DOI before newsletter eligibility**, independent guide delivery; suppression always respected | B — single opt-in after explicit checkbox, with approved proof/abuse controls; fewer templates but weaker address-ownership evidence |
| D-E3 | **A — Versioned same-origin public PDFs, link by email; remove both URL proxies** | B — controlled CMS/CDN asset registry requires additional hosting/redirect/security verification; no arbitrary client URL |
| D-E4 | **A — Approve a durable store/provider and proposed limits** for atomic rates, idempotency and consent evidence | Provider, region, pricing and operations still TBD. In-memory-only storage is not an acceptable launch alternative; defer feature if unresolved |
| D-E5 | **A — Server-only versioned guide-content manifest + server loader**, scoped CMS-source exception | B — extend ACF/Home loader after 5c-rest; extra schema/content work and schedule risk. Neither may silently truncate approved copy |
| D-E6 | **A — Approve retention schedule, actual mailing address, sender, CASL review and tracking off** | Specify exact DOI/consent/suppression/provider-log periods before activation; unresolved legal/copy details keep feature off |
| D-E7 | **A — Approve final PDF/email/UI package and resolve closing booking destination without adding a route** | New popup-entry route or different form/success behavior requires separately scoped code and approved copy |
| D-E8 | **A — EN + FR-CA together, ES when fully approved**, each a subset of site-enabled locales | All three together is preferable if ready; no silent EN-only rollout or ES editorial bypass |
| D-E9 | **A — Allow conditional early work under §13; reserve integration after 5c-rest if ownership/capacity is unavailable** | Keep original November 23–24 start, but resize the work; do not squeeze full scope into the old 4–6-hour estimate |

Implementation approval requires D-E1–D-E5 and the concrete storage/content contracts to be settled. Asset, copy,
retention, policy and real-account gates may remain release dependencies only if mock-only development is explicitly
scoped; no claim of a launch-ready feature until all apply and pass.

## 12. Dependencies and checkpoints

| Dependency | November 4 evidence | Owner / checkpoint |
| --- | --- | --- |
| Routing, dictionaries, shared booking/provider foundation | Present on inspected merged `master` | Dev preserves existing behavior |
| ADR 0002 amendment 1 / Privacy spec / 5f spec + ADR 0007 | Merged documents, not implementation evidence | Architect reconciles D-E1 before approval |
| Phase 5c local content load | Scheduled November 9–11; not claimed complete | Mauricio + Dev; protected checkout/export window |
| Privacy route and localized publication | Scheduled November 12; implementation/report not present at inspection | Privacy phase passes before public feature activation; its reserved day is protected |
| FR/ES lead copy alignment and canonical re-export | Handoff defers to 5c-rest, week of November 16 | Mauricio/content owner; coordinated re-pin, no independent competing export |
| PDFs | EN Notion source draft; no deployed PDFs inspected; layout planned November 15 | Mauricio/design/editorial approval, including FR with EN |
| Brevo setup | Account/domain/sender reported ready; lists/templates/key not verified | Mauricio; test and account proof before real sends |
| Durable store and data handling | New dependency, provider not selected | Mauricio + Senior; D-E4/D-E6 and G-4b processor coverage |
| 5c-rest | Planned November 16–20; same checkout and overlapping Home/content work | Exclusive ownership, ordered rebase; no schedule displacement |
| Phase 5f | Approved docs; early implementation permitted, original November 25–26; November 30 fallback | Coordinate dictionaries/provider/analytics changes; 5e is not a hard prerequisite for 5f |

Checkpoints: **C1** Senior/Mauricio decisions and revised Approved spec → **C2** complete content/asset/account/storage
package and merge-base check → **C3** mocked implementation + regression review → **C4** G-4b publication and controlled
real Preview test → **C5** report, release approval and deliberate activation. A failed checkpoint leaves the feature
off; it does not authorize expanding scope or editing legal copy.

## 13. Earliest safe window and effort

The existing merged code supports beginning design and mocks; it does not establish operational readiness. This is a
schedule proposal, not an implementation authorization or a claim that resources have been reserved.

- **November 4–8:** review this Draft, settle architecture and prepare editorial/account decisions. No implementation
  in this assignment. Keep copy export coordination with the planned content work.
- **November 9–11:** Phase 5c owns the checkout/content window. No 5e implementation or canonical re-export that could
  disrupt it. **November 12:** Privacy Route retains its planned slot through its verification checkpoint.
- **Earliest bounded code start: November 13**, only after Privacy Route's checkpoint, C1 approval and confirmed spare
  capacity/exclusive checkout or an independently owned worktree. Limit this to mock-backed server contracts and tests
  if assets/copy are incomplete. The already scheduled design work that day takes precedence; the date is not free by
  default, and creating another worktree alone does not create capacity.
- **Earliest conditional full integration start: November 16**, after the planned November 15 PDF package and an
  approved/re-pinned copy package are actually available, plus D-E4 storage readiness. 5c-rest owns November 16–20;
  use a separate owner/worktree and agreed shared-file boundaries, or defer. Re-export timing may move this date later.
- **Practical shared-checkout baseline: November 23 onward**, after 5c-rest's report/approval and required assets.
  November 23–24 was the old 5e window, not a credible guarantee for this complete scope. Allocate several focused
  development sessions plus Mauricio's account/Preview checks. Coordinate 5f rather than consume its capacity or move
  its November 30 fallback deadline. If these windows cannot fit, ship the site with 5e off and finish afterward.

Estimates assume D-E1–D-E8 resolved, manifest option A, an approved simple durable-store REST integration, existing
tools, no new public confirmation route, no queue/webhook service and no content rewriting by Dev:

| Work | Agent / Dev effort | Mauricio effort |
| --- | --- | --- |
| Approval revisions, contracts, account/storage readiness plan | 2–3 h | 1–2 h |
| API, validation, store, rate controls, idempotency and failure tests | 8–12 h | 0.5–1 h |
| Server section, guide modal, locale release registry, legacy cleanup | 6–9 h | 0.5–1 h |
| Template integration, consent evidence/retention, controlled account checks | 3–5 h | 2–3 h |
| Full gate, browser/PDF checks, regression review and report | 4–6 h | 1–2 h |
| **Implementation/review subtotal** | **23–35 h** | **5–9 h** |
| Contingency for provider behavior, shared-file rebase and QA fixes | 4–7 h | 1–2 h |
| **Planning allowance, excluding content/PDF production** | **27–42 h** | **6–11 h** |

The canonical PDF source separately estimates about **10–12 hours for PDF production**; do not treat that as a verified
three-language delivery budget. FR/ES adaptation, layout proofreading, email/UI approval and policy publication need
their own owner estimates. D-E5 B adds approximately 6–10 agent hours and 2–3 Mauricio hours for schema/loader/content
verification. A webhook/queue, extra confirmation route, procurement delays or new tracking requirements require a
re-estimate. These ranges replace the handoff's provisional 4–6 agent-hour 5e assumption for the complete requested scope.

## 14. Review handoff

Senior Architect should resolve the Privacy §8 test contradiction, content-source exception, durable-storage contract,
DOI/recovery proof, and estimate before returning an implementation verdict. Mauricio confirms assets, copy, account
operations, retention/address and available scheduling capacity. Keep this document **Draft** until explicit approvals
are recorded. Stop here for document review; no implementation, staging, commit, push or deployment follows from this
assignment.
