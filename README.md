# Organizer

Internal tool to plan and track purchases: articles are prioritized, grouped
into actions, followed on a kanban board and laid out on a calendar.

- **Frontend**: React 19 + TypeScript + Vite, Tailwind v4, shadcn/ui
  (`src/components/ui`) and shadcn-space blocks (`src/components/shadcn-space`).
- **Backend**: [PocketBase](https://pocketbase.io) — schema in
  `pb_migrations/`, server-side business logic (action cost/status sync) in
  `pb_hooks/`.
- **State**: zustand stores per collection in `src/api/stores`.

## Getting started

```bash
pocketbase serve            # backend, http://127.0.0.1:8090
pnpm install
pnpm dev                    # frontend, http://localhost:5173
```

Copy `.env.example` to `.env` to point the frontend at a different
PocketBase URL (`VITE_POCKETBASE_URL`).

## Scripts

- `pnpm dev` — start the Vite dev server
- `pnpm build` — typecheck + production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm format` — Prettier
- `pnpm test` — Vitest (currently covers the action/article status sync
  rules in `pb_hooks/lib/article-action-sync.cjs`)

## Adding shadcn/ui components

```bash
npx shadcn@latest add button
```

Components land in `src/components/ui`; import them via the `@/components/ui/*`
alias (see `components.json`).
