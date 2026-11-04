# Phase 5e — Lead magnet + Brevo MVP

- **Status: Draft (rev 0.2)** — 2026-11-04; Senior Architect review pending.
- **Branch:** `spec/phase-5e-lead-magnet-brevo`; inspected HEAD `e04dae3` (rev 0.1).
- **Review provenance:** Senior Architect verdict on rev 0.1: **CHANGES REQUIRED**. Mauricio's product decisions
  below were explicitly supplied on November 4. They do not imply technical approval of this revision.
- **Authority:** `AGENTS.md`, [Privacy Route rev 1.2 §8](privacy-route.md#8-brevo-lead-magnet--optional-newsletter--policy-impact-only),
  [ADR 0002 amendment 1](../adr/0002-brevo-replaces-mailchimp.md), [ADR 0005](../adr/0005-ui-dictionaries.md).
- **Copy authority for implementation:** the **upcoming 5c-rest canonical re-export**, with its actual commit and
  affected tests re-pinned together. `637fba7` is historical inspection evidence, not the 5e implementation copy lock.
- **This revision changes documents only.** No implementation, CMS/account/environment operations, provisioning,
  canonical-copy edits/re-export, staging, commits or pushes.

## 1. Accepted product scope and revision changes

Mauricio confirmed these constraints on November 4, 2026:

1. Brevo has exactly one marketing list: **Newsletter**. No standalone Guide requests list, staging list or per-language
   marketing lists. Language is an attribute/segment within Newsletter.
2. Every valid guide requester is offered transactional Brevo delivery of the PDF regardless of the optional checkbox.
   Invalid requests, abuse limits, provider outages or suppression may prevent delivery; never claim guaranteed receipt.
3. Only an explicitly checked, optional, initially unchecked box may initiate **Brevo native double opt-in (DOI)** and
   eventual Newsletter enrollment. Guide delivery never waits for DOI confirmation. No direct list-add/upsert bypass.
4. Reuse hidden `LeadMagnetSection` and the existing guide branch of `EmailCollectorProvider`. Preserve booking and
   Project Inquiry behavior; neither creates a marketing subscription or a new CRM flow in this phase.
5. Use immutable static same-origin PDFs per language. FR-CA and ES PDF editorial approval is still pending.
6. Lead copy follows 5c-rest's later export. Mailing-address copy is updated in Notion. Brevo DPA/EFVP research has
   advanced, but **Mauricio's EFVP sign-off remains pending**. No retention periods or legal approval are inferred.
7. **The December 3 website launch does not depend on 5e.** Keep 5e off by default and activate it only after its own gates.

Rev 0.2 resolves D-E1 and records D-E2 A / D-E3 A. It removes the mandatory custom durable-store/consent-ledger design,
replaces it with a minimal-options assessment and measurable launch criteria, retains all 16 acceptance IDs, and defers
optional operations/infrastructure to §14. D-E4 remains open until demonstrated, not merely until an option is chosen.

### D-E1 — resolved A

Privacy Route §8 item 9 is amended with this assignment's authorization: **transactional guide delivery is permitted
without newsletter consent; unchecked submissions must not initiate DOI, marketing contact/list enrollment or campaigns**.
Tests must distinguish the transactional and marketing operations. The checkbox grants no analytics permission.
No additional marketing list is permitted. ADR 0002 amendment 1 remains unchanged.

## 2. Current-code inspection

Inspection of application code at `e04dae3` confirms the following. No secrets or live account/CMS settings were read.

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
| `package.json` | Next 15.5.28 / React 19.1.2 / native fetch; no Brevo SDK or shared persistence/rate service in the application. Nodemailer remains needed by Contact |
| Guide/provider/contact tests and dictionary locks | Replace old Mailchimp/download assertions; preserve booking/inquiry regressions; re-pin lead copy only with 5c-rest's approved export |
| `public/` | No finished PDF found in the inspected checkout. Source prose does not establish a deployable asset |

The old export has more EN lead content than the four current strings (guide name, bullets and format line).
This is a documented **content-mapping incompatibility to assess against the future export**, not automatic permission
to create ACF fields or a new content system. The historical handoff is planning evidence, not authority to execute it.

## 3. Minimal user flow and architecture

Reuse the section and guide dialog with optional first name, required email, the separate unchecked newsletter box,
localized privacy link, approved sender/address line and submit/result copy. Do not add a newsletter box to booking
or Contact. Receiving a guide requires neither newsletter enrollment nor analytics consent.

A Pages Router `POST /api/lead-magnet` validates the request, applies the approved D-E4 controls, sends the guide through
Brevo's transactional API, and handles the checked newsletter action separately. A failed DOI request cannot withhold
or roll back an accepted guide. Treat each action's failure independently, including attempting an otherwise eligible
DOI when guide delivery fails; never use a retry of one to resend the other. Shared validation/abuse/configuration
failure may reject the whole request before any send. There is no delivery queue, webhook receiver, new account store,
custom unsubscribe endpoint, campaign automation or public polling/status service in the MVP.

### 3.1 Reuse the section and CMS text contract

Add a server loader around `LeadMagnetSection`, using the existing locale + Home query for its supported text fields.
Pass data into the existing presentation component; remove the client fetch and obsolete EN/dictionary fallback flash.
Static asset selection replaces `ctaLinkLeadMagnetSection` media/REST resolution, removing its missing-env-swallow path.
For the retained CMS query, missing configuration must fail explicitly; an absent required translation/content blocks
that locale's readiness. Feature-off intentionally renders nothing and need not fetch lead content.

Before implementation, map the **5c-rest export** field-by-field to the four CMS text fields and existing dictionary
structure. Approved form UI belongs in dictionaries. If additional approved lead-section strings remain, propose a
small typed dictionary extension with verbatim provenance, reusing the section's markup as needed; this scoped content
mapping is D-E5, still subject to review. Do not create a separate copy manifest by default, concatenate/truncate copy,
rewrite translations, or treat an old field's capacity as permission to omit approved content. ACF changes require a
specific remaining incompatibility and explicit scope amendment; they are excluded from the MVP estimate.

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
and reopening; no previous email or success state may leak. Disable repeated submission while pending, but recognize
that this is only a UI guard, not cross-tab/server abuse protection. No automatic retry, including after timeout/reload.
Approved copy must cover accepted guide, failed optional DOI, unknown outcome, throttling and unavailability. Existing
“request was not sent” wording cannot describe partial success. Missing text is a specification TODO, not invented UI.

## 4. Copy, PDFs and email readiness by language

The upcoming **5c-rest canonical re-export supersedes `637fba7` for lead-magnet implementation**. Record its actual SHA,
source sections and approvals in the implementation report; update affected verbatim tests in that same authorized
copy-integration PR. Do not re-export now or during Phase 5c's November 9–11 window. Do not bypass ADR 0005 or insert
translation placeholders that break builds for otherwise enabled site locales.

| Gate | EN | FR-CA | ES |
| --- | --- | --- | --- |
| Final PDF | Final binary/checksum and editorial acceptance still required; old EN source draft is not release evidence | **Editorial approval pending**; no readiness claim | **Editorial approval pending**; no readiness claim |
| Lead/form copy | Must match later 5c-rest export | Must match approved later FR-CA export | Must match approved later ES export |
| Transactional email | Approved subject, preheader, HTML/plain text, guide link and sender/address | Separate approved FR-CA template; no EN fallback | Separate approved ES template; no EN fallback |
| Native DOI email | Approved wording/version, DOI link, disclosure/address and fixed destination | Separate approved FR-CA template | Separate approved ES template |
| Release verification | PDF/link/receipt/consent/policy checks pass | Independently pass equivalent checks | Independently pass equivalent checks, including privacy G-8 |

Each locale passes its own gate; enabling the site language does not enable its guide. D-E8 selects the initial offered
locales only after these results and any applicable French-language publication obligations are confirmed by Mauricio.
There is no automatic EN-only launch or automatic certification of FR/ES. A missing locale hides that locale's guide
entry points and rejects forged guide requests in it. Other approved locales need not inherit its technical readiness.

**D-E3 A confirmed:** immutable static same-origin PDFs, e.g. `/assets/guides/website-checkup/<version>/<locale>.pdf`,
with approved title, version, checksum, size and language. Email an absolute HTTPS link from trusted server configuration,
not request Host or user input. The files are public; email delivery is a service, not PDF access control. Keep old
emailed links working through feature-off/version changes. Remove `/api/download` and `/api/download-check`; no arbitrary
URL redirects or WordPress-hosted file dependency. Verify links are accessible from a controlled Preview test inbox.

PDF checks include selectable text, title/language, reading order, contrast, mobile/desktop viewer, print readability
and closing CTA destination. No fillable PDF, new booking route or attachment generation is included. Resolve final
booking destination, timing/page-count claims and template wording with content owners, not Dev-authored copy.
Mauricio reports the CASL mailing address already updated in Notion: synchronize that approved text through 5c-rest and
email-template approval; the old export's placeholder is stale evidence, not a request for a newly invented address.

## 5. Brevo native capabilities and evidence limits

Public documentation checked November 4; no account API calls or credentials used. These capabilities are not proof
that the account is configured correctly. Test the **native API flow**, rather than assume hosted-form guarantees apply.

| Capability | Documented support | MVP requirement / remaining uncertainty |
| --- | --- | --- |
| Native DOI | `/v3/contacts/doubleOptinConfirmation` takes email, `includeListIds`, template and redirect; custom attributes must exist [B1] | Only checked submissions call it, with exactly the Newsletter ID. No preliminary direct subscription. Prove no enrollment before confirmation and no extra list |
| Consent evidence | Brevo describes DOI event logs plus transactional logs/previews and recommends exporting both [B2] | Demonstrate the API flow records request/source/version/locale, confirmation and withdrawal evidence. Hosted-form “Form submitted” logs are not assumed for our API form |
| Attributes/current membership | Contact API exposes attributes, list IDs and marketing blocklist state [B3]; `OPT_IN`/`DOUBLE_OPT-IN` attributes do not themselves control subscription [B4] | Language/version attributes help locate evidence, but can be overwritten. Neither membership nor a boolean proves the historical checkbox text/action |
| Message wording/history | Brevo recommends consent wording in DOI templates [B5]; log/preview retention is configurable and logs can be deleted [B6] | Preserve versioned exact text and retrievable event evidence under an approved retention/export procedure. Do not call Brevo logs immutable or an indefinite archive |
| Suppression/unsubscribe | Brevo documents distinct campaign and transactional blocklisting, including sender-specific transactional blocks [B7] | Keep Newsletter unsubscribe effective; never clear blocks or change sender to evade them. Marketing withdrawal alone must not cause the application to deny a requested guide |
| Existing contacts | Current contact state can be read [B3]; native DOI reference does not specify every duplicate/blocked-contact transition [B1] | Run the matrix below. No silent upsert, forced resubscribe, overwritten proof or account-automation assumption |
| Duplicate transactional sends | Brevo documents UUID `headers.idempotencyKey`, 30-minute TTL and duplicate rejection for batch email [B8] | Verify the exact single-recipient template call. No documented DOI idempotency guarantee established; do not apply the transactional guarantee to DOI |

Sources (claims above are scoped to these documents):

- [B1 — Native DOI API](https://developers.brevo.com/reference/create-doi-contact).
- [B2 — DOI tracking and evidence](https://help.brevo.com/hc/en-us/articles/208733449-Double-opt-in-DOI-What-it-is-and-how-to-track-user-sign-ups).
- [B3 — Contact details API](https://developers.brevo.com/reference/get-contact-info).
- [B4 — Contact permission and opt-in attributes](https://help.brevo.com/hc/en-us/articles/213405965-Build-a-legitimate-contacts-database-for-optimal-deliverability-and-compliance).
- [B5 — Consent text in DOI templates](https://help.brevo.com/hc/en-us/articles/360019540880-Create-a-custom-double-opt-in-DOI-email-template-for-a-sign-up-form-created-in-Brevo).
- [B6 — Transactional log/preview retention](https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews).
- [B7 — Marketing and transactional suppression](https://help.brevo.com/hc/en-us/articles/209458705-FAQs-What-are-the-different-types-of-blocklisted-contacts).
- [B8 — Transactional idempotency](https://developers.brevo.com/docs/heterogenous-versions-batch-emails).

### 5.1 Existing-contact and unsubscribe contract

Unchecked requests perform only transactional delivery, with no contact/list/DOI mutation or marketing lookup needed.
They neither enroll a new contact nor change a previous subscriber's language or permission. Brevo may retain
transactional recipient/log data; that is not a Guide requests marketing list and must be disclosed/retained correctly.

For checked submissions, verify with Mauricio-controlled test addresses:

| Initial condition | Required behavior |
| --- | --- |
| New address | Native DOI starts; Newsletter eligibility only after confirmation; guide sent independently |
| DOI pending / repeated request | No premature list enrollment; duplicate DOI bounded by §6; no overwrite of earlier proof |
| Confirmed Newsletter subscriber | No needless re-enrollment or replacement of historical consent; keep current eligibility. Any native repeated-DOI behavior must satisfy §6 |
| Existing contact outside Newsletter or missing proof | Current contact existence is not consent; require native DOI before new Newsletter eligibility |
| Previously unsubscribed / marketing-blocklisted | Never explicitly clear suppression. A fresh checked request may resume enrollment only after verified native re-consent; otherwise leave suppressed and report the limitation |
| Transactionally blocked, complaint or hard bounce | Respect provider suppression; no sender switching or success fabrication. Record failure category without exposing membership to the caller |
| Newsletter unsubscribe after confirmation | Brevo's unsubscribe works and prevents subsequent marketing; guide requests do not undo it |

If native behavior cannot meet one of these cases, disable that unsupported enrollment path safely and obtain Senior
review of the user-visible limitation; do not replace native DOI with direct subscription. Unresolved eligibility,
suppression or evidence safety is a 5e launch blocker. No campaigns are sent as part of implementation.

## 6. Minimal options, abuse and duplicates — D-E4 OPEN

Rev 0.1's mandatory custom database, append-only ledger, multi-stage recovery service and fixed data-retention estimates
are withdrawn. Choose the smallest demonstrated contract below. In-memory maps, button disabling, CORS or a client's
request UUID alone are insufficient across serverless instances. Brevo contact reads/writes are not atomic locks.

| Option | What it could cover | Limits / decision |
| --- | --- | --- |
| **A — Existing Brevo + Vercel controls; approved manual evidence preservation** | Native DOI/logs/templates/suppression, proven transactional idempotency, existing-host WAF throttling; export evidence into an already approved restricted location when needed | **Assess first**, no new provider. Must prove API consent evidence, recipient-level DOI limits and aggregate budget. IP-only WAF and Brevo send quotas do not by themselves prove all of these |
| **B — A plus minimal shared TTL counters/reservations** | Only missing atomic recipient/action suppression and aggregate counters; Brevo remains DOI/marketing system and approved evidence source | Use only if A leaves a demonstrated gap. Identify an existing approved service first; any new provider needs separate approval/DPA/EFVP and re-estimate. No automatic custom consent ledger or queue |
| **C — Defer 5e** | Feature stays off; website ships on its own schedule | Required when neither A nor an approved B meets the minimum; no “best effort” public launch |

Vercel documents fixed-window rate limiting on all plans, with IP/JA4 counting and plan-dependent limits. This supports
an IP throttle; it does **not** establish an email/body-key limiter or a global counter for this account. Verify the
actual plan, rules, coverage of Preview/Production, aliases and bypasses. No WAF changes are made in this assignment.
[Vercel rate-limit documentation](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

### 6.1 Proposed bounded contract to demonstrate before activation

Numbers below are proposed **operational limits**, not personal-data retention decisions. D-E4 approval must record
the chosen mechanism, exact bounds, account limits and observed results. Stronger restrictions are acceptable.

- Validated POSTs only; 8 KiB maximum JSON; email up to 254 characters, first name up to 100; reject controls/CRLF,
  unknown guide/locale/configuration, invalid types and stale wording versions. Consent must be boolean, not coercion.
- Honeypot, configured same-origin/Fetch Metadata checks and an IP throttle of **5 attempts per fixed 10-minute window**.
  Document the adjacent-window burst (up to 10); origin headers are forgeable outside browsers and are not bot protection.
- Across instances/IPs/tabs, **at most one new guide send and one DOI initiation per normalized recipient per fixed
  10-minute window**. Changing name, locale, guide version or client request ID must not bypass the recipient/action key.
  At a window boundary, up to two sends of each kind in a short interval are possible; this is explicitly bounded,
  not a rolling-window guarantee. Subsequent deliberate requests after the window may send again.
- A verified aggregate ceiling, proposed **100 combined guide/DOI attempts per fixed hour**, also bounded by the actual
  account quota. No automatic retry of rate-limited/provider-failed requests. Alerts/manual monitoring are not a hard cap.
- If a required shared control is unavailable, reject before sends. If only the newsletter evidence/control step fails
  after guide acceptance, preserve that success and skip DOI. A failed control is not simulated success.

For guide delivery, a candidate implementation uses a server-derived, secret-keyed UUID-format idempotency value from
recipient + action + server time bucket, stable across concurrent requests; do not expose email or a reversible key.
Verify Brevo accepts that format for the actual send and suppresses repeats in the tested window. A client-generated
UUID per click does not meet the recipient bound. The first accepted request's language/content wins within the window;
use approved UI copy for a changed request during cooldown. A native duplicate response alone cannot prove inbox delivery
or reconstruct the prior result, so return a neutral duplicate/unknown state rather than fabricated success.

No equivalent native DOI key guarantee has been established. A contact-exists check followed by DOI has a race and
cannot prove the bound. Demonstrate native suppression, or use approved B's atomic recipient/action reservation before
calling DOI. Hold a reservation through the window even on timeout/crash; allow possible non-delivery rather than an
unbounded retry. Release/retry policy must not weaken the bound. Consent proof is separate from these temporary keys.

**No exactly-once promise.** A crash can lose an action; a timeout can leave acceptance unknown. Neither the browser nor
the server automatically replays either action. Tell the visitor the approved unknown/cooldown result; operator-assisted
recovery can inspect Brevo evidence. A later deliberate submission is a new bounded attempt and may duplicate an earlier
accepted email. No cross-system transaction, persistent result replay, polling or guaranteed recovery is promised.

D-E4 demonstration must cover parallel requests on independent instances, different IPs/IDs for the same recipient,
window boundaries, malformed input, provider rejection, acceptance followed by lost response/process death, control
outage and separate DOI behavior. Record outbound counts and timing, not only HTTP status. An unsupported assumption
keeps **5e off**, without affecting the December 3 website release.

## 7. Consent evidence, retention, CASL and EFVP

For a checked request, the demonstrable evidence chain must associate recipient, server timestamp, source form/page,
language, exact checkbox/disclosure wording version, policy revision, affirmative request, DOI confirmation and subsequent
withdrawal. Preserve the exact versioned wording/template, not just a hash or mutable current contact attribute.
Use server-controlled source/version identifiers and the approved locale attribute (`en`, `fr-CA`, `es`). Never infer
consent from guide delivery, inquiry/booking, cookies, contact membership, or an unchecked request.

**MVP preference:** Brevo native evidence plus versioned approved copy/templates, with restricted manual export/archive
only where needed. Before activation, demonstrate that an API-originated opt-in can be traced end to end and remains
retrievable after template edits, repeat requests and unsubscribe. Determine whether API attributes actually appear in
retained event evidence; a current `CONSENT_VERSION` value alone is insufficient. Preserve the export before native
expiry/deletion under an approved schedule, with named owner, access controls and retrieval test. Do not place recipient
logs in this public repository or default to an unapproved storage service. If native proof/approved preservation is
insufficient, D-E4 remains blocked; custom archival infrastructure is not automatically authorized.

**No retention periods are set by this Draft.** Mauricio must approve treatment/periods for guide-only delivery data,
unconfirmed DOI, confirmed consent evidence, transactional previews/events, suppression, any temporary security keys
and archives/backups. Document actual Brevo settings and available deletion/export controls. Security windows in §6
are not legal retention approvals. Do not delete suppression merely to minimize contacts and thereby permit re-enrollment.

**CASL status:** Mauricio reports mailing-address copy updated in Notion on November 4; synchronize the approved text
through 5c-rest and template review. No address is reproduced or invented here. Verify sender identity/contact details,
unsubscribe links and the actual guide email/PDF's treatment; “transactional” is not a blanket legal exemption.
Unsubscribe handling must be without delay and no later than ten business days; required facilities must remain valid
for the applicable 60-day period. These checks follow the [CRTC CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm).
Native DOI is the chosen product mechanism, not a claim of universal legal obligation or legal sign-off.

**EFVP status:** Brevo DPA and related research have advanced per Mauricio; do not list them as wholly unstarted or
completed. Mauricio's EFVP sign-off remains an activation gate, including actual providers/transfers and retention.
A newly proposed persistence provider would reopen the relevant assessment; no provider is provisioned here.

Keep optional email open/click tracking and Brevo browser scripts off. Verify delivered markup/link destinations;
`contactPixelTrackingConsent: false` only describes anonymization under certain account settings, not disabling tracking
[B1]. Native DOI confirmation processing is necessary to enrollment and must be distinguished from optional engagement
tracking. If the account cannot meet the approved no-tracking/disclosure contract, resolve it before activation.

## 8. Server integration, configuration and fallback

Use native server fetch, `POST /v3/smtp/email` for requested guide delivery and the native DOI API only for checked
submissions. Do not create a Guide requests contact list or pre-subscribe anyone. Account IDs, templates, sender,
Newsletter ID, trusted origin, PDF mapping and DOI destination are server controlled; use an approved existing locale
page as the fixed destination, not a new confirmation route. A redirect hit is not DOI evidence. Keep API routes under
`src/pages/api/`; no SDK/dependency addition without approval.

Return typed, independent guide (`accepted`, `unknown`, `failed`) and newsletter (`not_requested`, `processed`, `unknown`,
`failed`) outcomes. `processed` must not disclose whether someone was already subscribed or assert confirmed enrollment.
Use approved neutral wording for duplicates. 200 means a known handled response, not both actions succeeded; 202 means
unknown acceptance **without promising a queue or polling**; 400/409 validation/version conflict; 429 throttle; 503 off,
missing configuration or unavailable safety control. Return no raw provider errors or account/member details. Do not
use the old `res.ok || payload.success || payload.data` success logic.

Use finite timeouts within the actual function budget, sanitized correlation IDs and no-store responses. No email,
name, consent payload, provider response body or secret in logs/analytics/URLs. Guide delivery works with GA absent or
denied; use the existing analytics abstraction only, remove direct Mailchimp-named events. Do not implement 5f here.

Document server-only placeholders during implementation: `LEAD_MAGNET_ENABLED` defaults off, an explicit offered-locale
subset, `DISABLE_BREVO=1` locally, `BREVO_API_KEY`, Newsletter/template/sender mappings and trusted origin. Only add
security-control settings required by the approved D-E4 choice. No unconditional store-token requirement. No new public
secret or client-importable server module. Local/tests use mocks and make zero real Brevo calls; no fake production success.

**G-4b:** before the deploy that activates 5e, Mauricio publishes approved privacy additions in all enabled site languages,
covering actual guide/marketing flows, fields/evidence, Brevo, any approved additional processor, retention and withdrawal.
A Notion ready block alone is insufficient. Re-run Privacy Route §7 including item 6. Preserve G-8 for Spanish and
verification of the approved effective date for a December 10 website fallback. No legal copy is edited by Dev.
Controlled real Preview tests require approved visible disclosures; Production additionally requires production publication.

Verify effective deployed flags, readiness and secret presence without values, including stale UI/API requests.
Feature off hides every guide entry point and rejects sends before network side effects. Recheck before each new action;
already accepted sends cannot be recalled. Static emailed PDFs remain available. Keep Mailchimp removed and booking/
Contact unaffected. Rebuild/redeploy when build-time UI configuration changes. Production promotion remains manual.
A missing gate delays **5e only**: December 3 proceeds under the site's own gates, with the lead magnet hidden.

## 9. Implementation surface and cleanup

After technical approval, the MVP may touch:

- `LeadMagnetSection` existing component/API/types/styles and a small server loader; guide modal/provider and tests.
- Existing guide callers in Header/Hero/PackageCard and approved page placements; no booking public-API redesign.
- `src/pages/api/lead-magnet.ts`, focused server validation/Brevo helpers/tests and only the selected D-E4 control adapter.
- Existing typed dictionaries and verbatim tests for later approved copy; metadata-only PDF/template mapping and approved
  static files under `public/assets/guides/`. D-E5 mapping must be agreed before adding section keys.
- Delete `src/pages/api/mailchimp.ts`, `download.ts`, `download-check.ts`; remove consumers, obsolete download probes,
  active Mailchimp events/environment reads/example entries and replace affected tests. Preserve historical docs/fixtures.
- `.env.local.example` placeholders, focused booking/Contact isolation tests, and `docs/reports/phase-5e-lead-magnet-brevo.md`.

No ACF schema/WordPress loader change, framework migration, new npm package or unrelated known-debt cleanup is assumed.
No Mailchimp SDK was found; do not invent a package removal. Retain Nodemailer for Contact and leave unrelated `gtag`
package removal to its separate PR. Mauricio verifies retired account/environment configuration separately; no subscriber
migration, account deletion, campaign send or new provider provisioning is authorized here.

## 10. Acceptance criteria (E-1–E-16 retained)

| ID | MVP evidence required |
| --- | --- |
| E-1 | Unchecked requests receive transactional guide delivery in the successful case, with zero contact/list mutation, DOI or marketing calls. Checked requests use native DOI targeting only Newsletter; no guide wait for confirmation |
| E-2 | Contact and Calendly booking, including repeat/failure paths, produce no marketing/CRM calls and preserve approved behavior/copy |
| E-3 | Input/type/boolean/version/locale/body/origin validation rejects invalid requests before sends; no client URL/list/template/sender control |
| E-4 | Demonstrated D-E4 IP, recipient/action and aggregate bounds across instances/changed IDs; documented fixed-window bursts; honeypot and control-outage behavior. No assertion that IP-only throttling covers recipient abuse |
| E-5 | Concurrent clicks/POSTs, tabs, reloads, boundaries and post-acceptance timeouts obey the bounded send contract for guide and DOI independently. No exactly-once or durable replay claim; unknown outcome never triggers automatic resend |
| E-6 | Partial success remains accurate; failure of either action does not falsely fail/succeed the other. Provider errors/timeouts/duplicates and unavailable controls produce sanitized typed outcomes, no fake success/member enumeration |
| E-7 | Reopen/locale/guide-to-booking transitions isolate state; checkbox starts unchecked; no stale-result leak. Labels/errors/announcements, Escape/close, keyboard focus return and scroll restoration pass |
| E-8 | Reused section server-renders exact later-export copy with no stale fallback/client CMS swap. Required missing content blocks its locale; approved placements only; no automatic ACF change |
| E-9 | Independently approved EN/FR-CA/ES asset/template gates for each offered locale; correct received language/PDF/link/checksum and viewer checks; no translation fallback; old static links survive feature-off |
| E-10 | Local/test/off modes make no real sends; forged/stale requests and every legacy caller respect off. No runtime Mailchimp integration, old events/env reads or URL-proxy callers remain |
| E-11 | Retrieve an API-originated consent chain including exact historical wording, source/time/language, DOI and withdrawal after edits/repeat requests; demonstrate approved retention/export/deletion without losing suppression. Attributes alone do not pass |
| E-12 | §5.1 new/pending/existing/unknown-proof/unsubscribed/blocked matrix passes with no forced resubscribe, premature enrollment or suppression bypass; exactly one marketing list; account evidence by Mauricio |
| E-13 | No PII in analytics/logs/URLs and no optional Brevo tracker/pixel/link tracking; distinguish native confirmation processing. Guide works with newsletter unchecked and analytics denied/absent |
| E-14 | G-4b publication + Privacy §7 item 6 and other checks; current approved address propagated, retention decisions and Mauricio EFVP sign-off recorded; G-8 and effective-date gates preserved |
| E-15 | Effective Preview/Production configuration checked without values; Mauricio-only controlled real receipt/PDF/DOI/Newsletter-enrollment/unsubscribe test; no new list or provider created by agent |
| E-16 | Lint, typecheck, Vitest and build per AGENTS; baseline failures reported honestly. Browser 375/768/1440 in EN and enabled locales, plus canonical 320 px PDF CTA check; all off-mode/booking regressions covered |

Use existing Vitest/Testing Library and mocks; real provider receipt/evidence and limits require the controlled Preview
checkpoint. Report exact commit/build, locale, offered/off state, copy revision and observed counts; redact test PII.
Rebase and recheck shared files after 5c-rest/5f. No acceptance criterion is satisfied by a promised future enhancement.

## 11. Decision register

| ID | Status at rev 0.2 | Remaining action |
| --- | --- | --- |
| D-E1 | **Resolved A — Mauricio, November 4**; transactional delivery allowed unchecked, marketing/DOI enrollment prohibited unchecked | Privacy §8 item 9 amended in this revision; test both operations |
| D-E2 | **Confirmed A — Mauricio, November 4**; native DOI, only Newsletter | Demonstrate existing-contact/suppression/confirmation behavior; no single-opt-in alternative |
| D-E3 | **Confirmed A — Mauricio, November 4**; immutable static same-origin PDFs; no Guide requests list | Supply and approve each language asset/template; retire proxies |
| D-E4 | **OPEN — minimal persistence/security contract not demonstrated** | Assess A first, prove §6 bounds and §7 evidence; approve minimal B only for documented gaps, otherwise defer 5e |
| D-E5 | **Reuse section/modal confirmed; final content mapping OPEN** | Map later 5c-rest copy to existing ACF/dictionaries; no default content manifest/schema expansion |
| D-E6 | **PARTIAL — address updated in Notion; DPA/EFVP research advanced** | Synchronize approved address; approve retention/evidence procedure and obtain Mauricio EFVP sign-off; no invented legal approval |
| D-E7 | **OPEN — final release package** | Approve PDF binaries, guide/DOI/error templates and existing-page booking/confirmation destinations |
| D-E8 | **OPEN — initial offered locales** | Independent readiness gates; FR-CA/ES editorial approval pending; Mauricio confirms permissible publication order |
| D-E9 | **OPEN — capacity/window** | Protect 5c/Privacy/5c-rest; agree exclusive checkout or independent worktree ownership and actual capacity |

D-E1–3 are product approvals, not Senior Architect approval of the overall Draft. Mock-only implementation can be
considered after the revised spec is approved; unresolved D-E4 is never permission to enable real public sends.

## 12. Remaining 5e launch blockers and checkpoints

| Blocker | Owner / evidence required |
| --- | --- |
| B-1 Technical approval and D-E4 | Senior Architect + Mauricio: chosen minimal mechanism, concurrency/abuse/duplicate counts and native API proof retrieval; unresolved safety keeps 5e off |
| B-2 Later canonical export and mapping | Content owner/Dev: 5c-rest export SHA, approved locale text, synchronized address, D-E5 mapping and re-pinned tests; no old-export implementation |
| B-3 Per-language assets/templates | Mauricio/editorial: final PDF, guide/DOI/partial-error copy, destinations and independent gate results; FR-CA/ES are pending, EN also needs binary/receipt evidence |
| B-4 Brevo operational configuration | Mauricio: only Newsletter, correct native DOI templates/attributes, sender and no unintended automation/tracking; existing-contact and suppression matrix |
| B-5 Data handling approval | Mauricio: EFVP sign-off, retention/archival/access/deletion procedure and evidence availability; DPA research progress is not sign-off |
| B-6 Privacy publication | Mauricio: G-4b deployed in enabled site locales, §7 recheck, G-8/effective date where applicable |
| B-7 Implementation verification | Dev + Mauricio: gates/browser regressions, real controlled Preview delivery/DOI/unsubscribe, effective configuration and report |
| B-8 Rollout authorization | Mauricio + Senior: initial locale selection, checkout/capacity and deliberate activation after review; website launch remains independent |

Sequence: review rev 0.2 → scoped D-E4 demonstration → approve the chosen contract and copy mapping → implement with
feature off → approve each offered locale/account/data package → publish G-4b → controlled Preview and report → deliberate
activation. A failed gate delays 5e, not the website. No account changes or real sends are part of this document revision.

## 13. Schedule and revised effort (excluding PDF production)

Preserve Phase 5c November 9–11 and Privacy Route November 12. The earliest conditional mock/security-contract work is
November 13 after Privacy's checkpoint, revised-spec approval and spare capacity; that day already has design work.
Integrated copy work waits for the actual 5c-rest export, not merely November 16 on a calendar. During November 16–20,
5c-rest owns the shared checkout; advance only with an independently owned worktree and spare capacity. Do not create
one or delegate work as part of this assignment.

Practical shared-checkout baseline remains **November 23 onward**, after 5c-rest. November 23–24 is a planning window,
not a completion promise. Coordinate overlapping dictionaries/provider work with 5f; preserve its November 30 fallback.
If capacity or any 5e gate is missing, launch the website December 3 with 5e hidden and implement/activate it later.

Conditional estimate assumes existing section/modal, native fetch/DOI, static assets, no ACF schema change, supplied
approved copy/templates and successful minimal option A. It includes verification across offered languages, not writing
translations/PDFs or waiting for approvals. D-E4 assessment can stop early if a blocker is found.

| Work | Agent effort | Mauricio active effort |
| --- | --- | --- |
| D-E4 evidence/abuse demonstration and contract refinement | 2–3 h | 1–2 h |
| Pages API, native Brevo calls, validation and failure tests | 3–5 h | 0–0.5 h |
| Reuse section/modal, server loader, copy wiring and legacy cleanup | 3–5 h | 0.5 h |
| Template/consent/policy/configuration verification | 2–3 h | 1–1.5 h |
| Full gate, browser checks, controlled Preview and report | 3–4 h | 1–1.5 h |
| **Subtotal** | **13–20 h** | **3.5–6 h** |
| Focused contingency / shared-file rebase | 2–3 h | 0.5–1 h |
| **MVP planning allowance** | **15–23 h** | **4–7 h** |

If option B is necessary, allow an initial **additional 3–6 agent hours / 1–2 Mauricio hours** for a simple approved
TTL-counter adapter and verification; confirm after service selection. This is not authorization to provision it.
Unproven native consent evidence, a new processor, ACF changes or revised copy architecture require a fresh estimate;
do not bury them in the MVP range. PDF production, translation/editorial writing and procurement/review waiting time
are excluded. Mauricio's active allowance covers integration review/testing, not drafting all missing legal/editorial copy.

## 14. Post-launch enhancements — excluded from MVP

- Custom append-only consent ledger, automated archives/reconciliation and richer operational dashboards.
- Delivery queues, webhooks, scheduled retry workers, persistent outcome replay and self-service recovery/status pages.
- New consent groups/preferences center, CRM imports, additional campaigns or list architecture (would need new product approval).
- CAPTCHA/third-party challenges, richer adaptive abuse detection and additional providers beyond a demonstrated MVP need.
- ACF/schema redesign, new copy management system, signed/private downloads, generated attachments or fillable PDFs.

Deferring these enhancements does **not** defer minimum consent evidence, suppression, bounded abuse controls or privacy
publication. If any is necessary to meet the MVP safety contract, stop for scope/estimate approval or keep 5e off.

## 15. Review stop

Return this **Draft rev 0.2** and the targeted Privacy §8 clarification for Senior Architect review. Product choices are
recorded; unresolved technical/legal/editorial gates remain explicit. No implementation, account/CMS/environment work,
provisioning, re-export, staging, commit or push follows this assignment.
