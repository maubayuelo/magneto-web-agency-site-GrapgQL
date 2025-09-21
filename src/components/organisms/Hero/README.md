Unified Hero component

This folder previously contained separate files for:
- `Hero` (visual component)
- `HeroWithData` (client-side data fetcher)
- `HeroLoader` (server-side loader)

They've been consolidated into `index.tsx` to reduce file count and centralize behavior.

Exports:
- default export: (none) — import the `Hero` component by name
- Named exports:
  - `Hero` — main visual component (props described in `index.tsx`)
  - `loadHomeHero` — server-side helper that returns props for `Hero` (use in server components)
  - `HeroLoader` — small async/server-compatible component that fetches page-specific hero data and renders `Hero` (keeps prior usage)

Migration notes:
- Replace imports from `.../Hero/HeroLoader` with `.../Hero` (e.g. `import { HeroLoader } from '@/components/organisms/Hero'`).
- If you relied on the client-only `HeroWithData`, use the `loadHomeHero` server helper or the `HeroLoader` as appropriate.

If you want this split again (client vs server), we can reintroduce smaller wrappers, but the single-file approach keeps related logic together.