# ADR 0002 — Brevo replaces Mailchimp for email collection

- Status: Accepted — implementation deferred · Amended 2026-11-04 (amendment 1)
- Date: 2026-10-24
- Deciders: Mauricio

## Context

Email collection (popup, lead magnet, package CTAs) uses Mailchimp through
`src/pages/api/mailchimp.ts` and 5 consumer components. Mauricio is moving to Brevo and
wants Calendly bookings to feed the same Brevo list. No Brevo account exists yet.

## Decision

- Brevo will replace Mailchimp. The Brevo account is created and configured when the
  popup / email-collection phase starts.
- Until then: **do not extend or refactor the Mailchimp code**; leave it working as is.
  The trilingual phases do not depend on it.
- Locally, Mailchimp env vars may stay empty so no real subscriptions happen.

## Consequences

- The replacement is its own phase: server route for Brevo, env vars in
  `.env.local.example`, consent copy EN/FR-CA/ES, privacy policy update.
- Mailchimp code and env vars are removed in that phase, not before.

## Amendment 1 — 2026-11-04 (D-P7, `docs/specs/privacy-route.md` rev 1.1)

- Deciders: Mauricio + Senior Architect.
- Reason: the approved copy says booking a call or sending an inquiry does not subscribe anyone to marketing emails
  (B2, policy §6), and consent must not be bundled. Approved copy wins (AGENTS.md Hard rule 4).
- **Calendly bookings and Project Inquiries are never added to a marketing list.** This replaces the Context wish
  that "Calendly bookings feed the same Brevo list".
- **The only path into the Brevo marketing list is the optional checkbox, unchecked by default.**
- **The lead-magnet guide is delivered regardless of the checkbox.** Delivery alone does not subscribe.
- Context update: Mauricio now has a Brevo account (2026-11-04). The rest of this ADR stands.
