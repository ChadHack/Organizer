# Organizer

Internal tool to plan and track purchases: articles are prioritized, grouped
into actions, followed on a kanban board and laid out on a calendar.

- **Frontend**: React 19 + TypeScript + Vite, Tailwind v4, shadcn/ui
  (`src/components/ui`) and shadcn-space blocks (`src/components/shadcn-space`).
- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth + Storage +
  Realtime) — schema, RLS policies and triggers in `supabase/schema.sql`
  (server-side business logic — action cost/status sync — lives in a
  Postgres trigger there; its pure reference implementation is in
  `src/lib/article-action-sync.ts`).
- **State**: zustand stores per collection in `src/api/stores`.

## Paniers (tracking des achats en ligne)

L'écran **Paniers** (`/paniers`) regroupe les paniers d'achat en ligne par
marchand : ajout par collage d'un lien produit (métadonnées récupérées par
l'Edge Function `scrape-product`), ou depuis le menu « Partager » d'une app
mobile via le Web Share Target de la PWA. L'historique de prix est tenu
automatiquement par un trigger Postgres (`supabase/cart-tracking.sql`).

Mise en place :

1. Exécuter `supabase/cart-tracking.sql` dans le SQL Editor (après
   `schema.sql`).
2. Déployer la fonction de scraping :
   `supabase functions deploy scrape-product`.
3. Pour le partage mobile : déployer en HTTPS puis « Ajouter à l'écran
   d'accueil » — l'entrée « Organizer » apparaît alors dans le menu
   Partager d'Android/iOS (le service worker `public/sw.js` rend l'app
   installable).

## Getting started

```bash
pnpm install
pnpm dev                    # frontend, http://localhost:5173
```

Run `supabase/schema.sql` once in your project's SQL Editor, then copy
`.env.example` to `.env.local` and fill in your project's URL and
publishable key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Scripts

- `pnpm dev` — start the Vite dev server
- `pnpm build` — typecheck + production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm format` — Prettier
- `pnpm test` — Vitest (currently covers the action/article status sync
  rules in `src/lib/article-action-sync.ts`)

## Adding shadcn/ui components

```bash
npx shadcn@latest add button
```

Components land in `src/components/ui`; import them via the `@/components/ui/*`
alias (see `components.json`).
