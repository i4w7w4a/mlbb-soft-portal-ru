# MLBB Portal Architecture

## Runtime Shape

- `Next.js App Router` renders all public routes and the admin shell from a single repository.
- `JSON-first content` lives in `/content` and is loaded through a typed repository layer under `src/lib/content`.
- `Supabase Auth` is the authentication boundary for `/admin`; the UI falls back to setup guidance when env vars are missing.
- `SOFT` is implemented as both content metadata (`isSoft`, `isSoftFeatured`) and UI state (global mode, ranking bias, visual atmosphere).

## Route Map

- `/` editorial hub with SOFT as the compositional center
- `/heroes` global character explorer
- `/heroes/[slug]` hero universe pages
- `/news` editorial news stream
- `/news/[slug]` rich article pages
- `/soft` curated SOFT hub
- `/search` global search
- `/admin`, `/admin/login`, `/admin/news`, `/admin/news/new`, `/admin/heroes`, `/admin/media`

## Repository Boundaries

- `src/lib/content/schemas.ts` owns data validation and normalization.
- `src/lib/content/repository.ts` owns read models, cross-entity joins, ranking, and search.
- `src/lib/content/admin.ts` owns server-side write/import/export utilities for JSON content.
- `scripts/import-heroes.ts` owns bootstrap imports from `mlbb.gg` with local raw fallback.

## Quality Gates

- TypeScript strict mode, schema validation, and a content validation script are required.
- Public pages prefer server components; client code is only used for interactivity, filtering, motion, and admin authoring.
- Motion respects `prefers-reduced-motion`.
- All critical navigation and filtering affordances stay keyboard accessible.

