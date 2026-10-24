# ADR 0002 — Brevo replaces Mailchimp for email collection

- Status: Accepted — implementation deferred
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
