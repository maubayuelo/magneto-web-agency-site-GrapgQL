# Magneto — Project Commentary for Beginners

This document explains the Magneto project (a Next.js-based marketing site) for beginner developers. It covers the folder structure, key files, data flow, how the app is built and runs, and tips for contributing.

## Quick overview

- Tech stack: Next.js (app directory), TypeScript, SCSS, GraphQL/WordPress integration, and some custom hooks/utilities.
- Purpose: a marketing website that fetches content (like projects, about, services) from a WordPress backend via GraphQL and renders pages using the Next.js app router.
- Main places to look: `src/app/`, `src/components/`, `src/data/`, `src/hooks/`, `src/utils/`, `src/styles/`.

## How the project is organized

Top-level (important files):

- `next.config.ts` — Next.js configuration. Controls build-time options, image domains, i18n, etc.
- `package.json` — scripts and dependencies. Use `npm run dev` to start the dev server.
- `tsconfig.json` — TypeScript configuration.
- `.env.local` — local environment variables (not committed). Contains API endpoints and keys.

Source (`src/`) — where the application logic lives:

- `src/app/` — Next.js app router pages and layout. Key files:
  - `layout.tsx` — top-level layout component used by all pages. Sets up global providers, header/footer, and meta tags.
  - `page.tsx` — the home page renderer.
  - subfolders like `about-magneto/`, `contact/`, `projects/` contain page-level routes.

- `src/components/` — UI building blocks, split into `atoms/`, `molecules/`, and `organisms/`.
  - Atoms: smallest building blocks (buttons, icons, headings).
  - Molecules: small composed components (cards, input groups).
  - Organisms: larger, page-level pieces (hero sections, project lists).

- `src/data/` — static site data used for pages (e.g., `about.ts`, `projects.ts`, `site.ts`). This can be used as a fallback or for static content.

- `src/hooks/` — custom React hooks. Notable ones:
  - `useCalendly.ts` — handles Calendly widget integration and state.
  - `useDevice.ts` — detects device type (mobile/desktop) and returns useful flags.

- `src/utils/` — utilities for analytics, SEO, WordPress/GraphQL communication, and Calendly helpers.
  - `wp-graphql.ts` — helper functions for building/consuming GraphQL queries against WordPress.
  - `wordpress.ts` — high-level functions to fetch and normalize WordPress data.
  - `seo.ts` — functions to build meta tags and Open Graph data.

- `src/styles/` — SCSS files and component/page-level styles. Main entry is `main.scss` and `globals.scss`.

## Data flow (high level)

1. Next.js page components (in `src/app/` or `src/components/`) request data. For dynamic data, the app uses GraphQL calls to WordPress through utilities in `src/utils/`.
2. `src/utils/wp-graphql.ts` contains the common GraphQL client functions. It sends POST requests to the WordPress GraphQL endpoint (URL stored in environment variables).
3. Fetched data is normalized by helper functions in `src/utils/wordpress.ts` and passed into React components.
4. Components render UI and use hooks for client-only behaviors (e.g., Calendly popups, device detection).
5. Analytics helpers in `src/utils/analytics.ts` track page views and user interactions.

## Key files explained (short)

- `src/app/layout.tsx`
  - Acts as the root layout for all pages. Wraps children with global providers and includes site header and footer. Useful place to put global meta tags and CSS imports.

- `src/app/page.tsx`
  - Renders the home page. Typically imports hero/sections from `src/components/organisms` and pulls content from `src/data` or WordPress.

- `src/components/organisms/Hero.tsx` (example)
  - Large hero section, takes props for title, subtitle, background image, and call-to-action.

- `src/hooks/useCalendly.ts`
  - Encapsulates logic for loading Calendly scripts, opening the scheduler modal, and cleaning up.

- `src/utils/wp-graphql.ts`
  - Contains a function to run GraphQL queries and handle errors. Central place to set headers and endpoint.

- `src/utils/seo.ts`
  - Helpers to build structured meta tags for each page, Open Graph tags, and JSON-LD where applicable.

## How to run the project locally

1. Install dependencies

   npm install

2. Create local env file

   - Copy `.env.local.example` or create `.env.local` with the required variables: typically `NEXT_PUBLIC_WORDPRESS_URL` and any analytics keys.

3. Start the dev server

   npm run dev

4. Open `http://localhost:3000` in your browser.

Notes: This project uses the Next.js app router and server components in places; some hooks and client-only components must be marked with "use client".

## Where to add new content

- For static/marketing copy: update `src/data/*.ts` and components that render that data.
- For dynamic content stored in WordPress: add GraphQL queries in `src/utils` and call them from page components' server-side code (Server Components or Next.js data fetching methods).
- For styling: add component SCSS under `src/styles/components` or page SCSS under `src/styles/pages` and import into `main.scss` or the related component.

## Common beginner tasks and tips

- Adding a new page: create `src/app/<page>/page.tsx` and optionally `layout.tsx` inside the same folder for page-specific layout.
- Using images: Prefer Next.js `next/image` for optimization. Check `next.config.ts` for allowed image domains.
- Client code: Add `"use client"` at the top of files using hooks or browser-only APIs.
- Types: The project uses TypeScript — add types to props and utility return values for better DX.

## Useful commands

- npm run dev — start dev server
- npm run build — build for production
- npm run start — start production server after build
- npm run lint — run linter (if configured)

## Troubleshooting

- If GraphQL requests fail: check `.env.local` and ensure the WordPress endpoint is reachable and CORS is configured.
- If styles don't apply: ensure SCSS is imported in `layout.tsx` or `main.scss`.
- If a component using hooks crashes at server render: make sure it's a client component by adding `"use client"` and importing it only in client contexts.

## Next steps (optional improvements)

- Add inline comments to critical source files explaining the specific code paths.
- Add a CONTRIBUTORS guide for how to fetch content from WordPress and add new pages.
- Add a docs folder for component usage with examples.

---

Requirements coverage:
- Created `PROJECT_COMMENTARY.md` explaining the whole project for beginner devs. (Done)
- Left follow-ups for optional inline commenting and smoke run. (Not started)

If you'd like, I can now add inline comments to specific files (e.g., `src/app/layout.tsx`, `src/app/page.tsx`, `src/utils/wp-graphql.ts`) — tell me which files you prefer or I can pick the most important ones.