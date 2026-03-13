# SOFT Rift

Premium Mobile Legends: Bang Bang editorial portal built with `Next.js App Router`, `TypeScript`, `Tailwind CSS v4`, `Motion`, `Zod`, and a JSON-first content layer with a local/dev-only admin surface.

## What is included

- Public portal routes: `/`, `/heroes`, `/heroes/[slug]`, `/news`, `/news/[slug]`, `/soft`, `/search`
- Admin routes: `/admin`, `/admin/login`, `/admin/news`, `/admin/news/new`, `/admin/heroes`, `/admin/media`
- Typed content repository backed by `/content`
- Zod schemas for heroes, news, taxonomy, site settings, and SOFT config
- Local JSON save/import/export API routes for editorial workflows
- Admin news management supports duplicate, export, and bulk import flows from the UI, including re-importing exported snapshots
- Admin hero management supports editing hero JSON plus tag/category taxonomy vocabularies from the UI
- Hero import pipeline with `mlbb.gg` fetch attempt and local raw fallback seed
- Branded local SVG asset kit for the demo hero set plus SOFT-aligned Open Graph image templates
- `gh-aw` repository bootstrap with planning and issue-maintenance workflows

## Project structure

```text
content/
  heroes/
  news/
  taxonomy/
  site/
docs/specs/
scripts/
src/
  app/
  components/
  lib/
```

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env values:

   ```bash
   copy .env.example .env.local
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Quality checks:

   ```bash
   npm run lint
   npm run typecheck
   npm run content:check
   npm run metadata:check
   npm test
   npm run build
   ```

5. Prepare a self-hosted server bundle when you are ready to upload to a VPS:

   ```bash
   npm run deploy:bundle
   ```

## Content model

- Hero records live in `content/heroes/<slug>/hero.json`
- Hero news lives in `content/heroes/<slug>/news/*.json`
- Global editorial ordering lives in `content/news/latest-index.json`
- Tags and categories live in `content/taxonomy`
- Site settings and SOFT system config live in `content/site`

The repository layer is in [repository.ts](C:/Users/iwwa/Documents/6_Work/Open_orche/src/lib/content/repository.ts) and the schemas are in [schemas.ts](C:/Users/iwwa/Documents/6_Work/Open_orche/src/lib/content/schemas.ts).

## Admin behavior

- `/admin` is intended to run in local/dev-only mode by default.
- `NEXT_PUBLIC_ENABLE_LOCAL_ADMIN_DEMO` defaults to local mode; set it to `false` only when intentionally testing the optional external-auth path.
- The quick editor supports both form mode and JSON mode and saves directly into the JSON content layer through local API routes.
- Use `MLBB_CONTENT_ROOT` on a server when you want admin edits to survive redeploys outside the release directory.
- Supabase auth/storage code remains in the repo only as an optional future integration path.

## Seed and validation scripts

- `npm run content:check` validates the content graph by loading heroes, news, tags, and categories
- `npm run metadata:check` validates route metadata exports, canonical URLs, OG image coverage, and article metadata across hero/news pages
- `npm run seed:heroes` runs [import-heroes.ts](C:/Users/iwwa/Documents/6_Work/Open_orche/scripts/import-heroes.ts)
- The import pipeline first tries `https://mlbb.gg/heroes`, then falls back to [mlbb-gg-heroes.json](C:/Users/iwwa/Documents/6_Work/Open_orche/content/heroes/raw/mlbb-gg-heroes.json)
- Successful remote hero imports also persist [mlbb-gg-heroes.remote.html](C:/Users/iwwa/Documents/6_Work/Open_orche/content/heroes/raw/mlbb-gg-heroes.remote.html) and [mlbb-gg-heroes.remote.json](C:/Users/iwwa/Documents/6_Work/Open_orche/content/heroes/raw/mlbb-gg-heroes.remote.json) for parser audits and future fallback work
- `npm run supabase:check` remains available only if you later decide to enable the optional Supabase path

## gh-aw setup

This repository was initialized with `gh aw init --tokens --engine codex` using `gh-aw` built from commit `2c1f68a721ae7b3b67d0c2d93decf1fa5bcf7ee3`.

Added workflows:

- `.github/workflows/plan.md`
- `.github/workflows/issue-arborist.md`
- `.github/workflows/issue-monster.md`
- `.github/workflows/sub-issue-closer.md`

Notes:

- `plan` and `sub-issue-closer` were switched to `engine: codex`.
- `issue-arborist` is already `engine: codex` upstream at this pinned SHA.
- `issue-monster` is upstream Copilot-oriented at this pinned SHA because its assignment logic targets the Copilot agent path specifically.
- `issue-arborist` requires the imported `shared/jqschema.md` helper file to compile.
- `issue-monster`, `issue-arborist`, and `sub-issue-closer` are intentionally kept manual-only for now; their schedule triggers are disabled so Actions stop producing repeated failed runs.
- The checked-in `.lock.yml` files are still compiled by a dev build of `gh-aw` and keep the local `./actions/setup` reference. That is acceptable in the current manual/reference mode because these workflows are not expected to run on a timer.
- If you want to revive gh-aw automation later, recompile the workflows in release mode so `./actions/setup` becomes a remote `githubnext/gh-aw/actions/setup@...` reference, then restore the required secrets and only then re-enable schedules.
- Without `OPENAI_API_KEY` or `CODEX_API_KEY`, all Codex-backed gh-aw workflows stay dormant in GitHub Actions. The per-workflow audit and manual fallback path live in [gh-aw-no-api-audit.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/gh-aw-no-api-audit.md).

Current missing repo secrets reported by `gh aw init`:

- `GH_AW_GITHUB_TOKEN`
- `OPENAI_API_KEY`
- optional `GH_AW_AGENT_TOKEN`
- optional `GH_AW_GITHUB_MCP_SERVER_TOKEN`

## GitHub planning status

- Remote repository created: `i4w7w4a/mlbb-soft-portal`
- Current `gh` token does **not** include `read:project`, so GitHub Project V2 automation cannot be fully provisioned until the token is refreshed with project scopes.
- Labels and issue/workflow artifacts can still be created with the current token.
- Manual delivery protocol for future long sessions: [github-session-protocol.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/github-session-protocol.md)
- No-API gh-aw workflow audit: [gh-aw-no-api-audit.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/gh-aw-no-api-audit.md)
- Self-host deployment runbook: [deploy-self-hosted.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/deploy-self-hosted.md)

## Spec docs

- [architecture.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/specs/architecture.md)
- [soft-system.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/specs/soft-system.md)
- [definition-of-done.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/specs/definition-of-done.md)
- [supabase-live-verification.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/supabase-live-verification.md) (optional future integration)
