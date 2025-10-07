Local email testing (MailHog)

Purpose

This document explains a fast, safe way to test the site's contact form locally using MailHog. MailHog acts as a local SMTP server and provides a web UI where you can inspect emails without sending them to real recipients.

Install and run MailHog (macOS)

1) Install via Homebrew (recommended):

```bash
brew update
brew install mailhog
```

2) Start MailHog:

```bash
# run in a terminal while you develop
mailhog
```

By default MailHog listens for SMTP on port 1025 and exposes a web UI at http://localhost:8025

Configure the app to use MailHog

Create or edit `.env.local` at the project root and add the following values:

```env
# Use MailHog's SMTP listener
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=   # leave empty (MailHog doesn't require auth)
SMTP_PASS=   # leave empty (MailHog doesn't require auth)
CONTACT_RECIPIENT=you@your-local.test
EMAIL_FROM="Magneto <no-reply@local.test>"
# Optionally disable Mailchimp during local testing
MAILCHIMP_API_KEY=
MAILCHIMP_LIST_ID=
# Ensure dev-mode behavior remains active
NODE_ENV=development
```

Notes

- Because MailHog doesn't require authentication, `SMTP_USER` and `SMTP_PASS` can be left blank. The contact API will detect missing SMTP credentials and, in `development` mode, return a dev-mode success response. To actually have the API attempt to send via SMTP with MailHog, set `SMTP_USER` and `SMTP_PASS` to any non-empty string (MailHog will accept it even if unused).

- Visit http://localhost:8025 to view captured emails.

- If you prefer, you can run MailHog in Docker instead:

```bash
# run MailHog container
docker run -p 8025:8025 -p 1025:1025 mailhog/mailhog
```

- After changing `.env.local`, restart the Next dev server.

Troubleshooting

- If emails still don't appear, check the terminal running MailHog for incoming SMTP connections.
- Make sure your local Next server is restarted after edits to `.env.local`.

If you'd like, I can add a tiny `scripts/local-mail.sh` helper to start MailHog in Docker and open the UI automatically.