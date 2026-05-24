# Russian Version Task Board

Статусы: `todo`, `doing`, `blocked`, `done`.

## 0. Baseline

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-000 | done | Clone English repository into `site` | `git status --short --branch` shows `main...origin/main` |
| RU-001 | done | Install dependencies | `npm install` completes |
| RU-002 | done | Run typecheck | `npm run typecheck` passes |
| RU-003 | done | Run lint | `npm run lint` passes |
| RU-004 | done | Run tests | `npm test` passes |
| RU-005 | done | Validate content | `npm run content:check` passes |
| RU-006 | done | Build production site | `npm run build` passes |
| RU-007 | done | Start local dev server | `http://127.0.0.1:3000` returns 200 |

## 1. Repository Separation

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-010 | done | Confirm Russian repository name | `mlbb-soft-portal-ru` selected |
| RU-011 | done | Create sibling folder `C:\Users\iwwa\Documents\2_MLBB\site-ru` | Folder exists |
| RU-012 | done | Copy or clone English code into `site-ru` | `site-ru` has full project |
| RU-013 | done | Remove or replace remote origin in Russian copy | `git remote -v` shows Russian repo only |
| RU-014 | done | Create GitHub repository | `https://github.com/i4w7w4a/mlbb-soft-portal-ru` exists |
| RU-015 | done | Run baseline checks in Russian copy before edits | `typecheck`, `lint`, `test`, `content:check`, `metadata:check`, and `build` pass |

## 2. Translation Policy

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-020 | todo | Finalize Russian style rules | `glossary.md` updated |
| RU-021 | todo | Confirm whether title is `SOFT Rift` or `SOFT Rift RU` | Decision recorded |
| RU-022 | todo | Decide whether admin UI must be fully translated | Decision recorded |
| RU-023 | todo | Decide if slugs stay English | Decision recorded |
| RU-024 | todo | Define allowed English exceptions | QA checklist updated |

## 3. Site and Taxonomy Content

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-030 | todo | Translate `content/site/settings.json` | Site navigation and description are Russian |
| RU-031 | todo | Translate `content/site/soft.json` | SOFT headline, description, CTA and manifesto are Russian |
| RU-032 | todo | Translate `content/taxonomy/categories.json` | Category labels are Russian |
| RU-033 | todo | Translate `content/taxonomy/tags.json` | Tag labels are Russian, slugs unchanged |
| RU-034 | todo | Translate `content/news/latest-index.json` | Collection titles and excerpts are Russian |
| RU-035 | todo | Run content validation | `npm run content:check` passes |

## 4. Hero Content

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-040 | todo | Translate Aamon hero profile | Hero page reads naturally |
| RU-041 | todo | Translate Angela hero profile | Hero page reads naturally |
| RU-042 | todo | Translate Balmond hero profile | Hero page reads naturally |
| RU-043 | todo | Translate Cecilion hero profile | Hero page reads naturally |
| RU-044 | todo | Translate Chou hero profile | Hero page reads naturally |
| RU-045 | todo | Translate Esmeralda hero profile | Hero page reads naturally |
| RU-046 | todo | Translate Fredrinn hero profile | Hero page reads naturally |
| RU-047 | todo | Translate Kagura hero profile | Hero page reads naturally |
| RU-048 | todo | Translate Lesley hero profile | Hero page reads naturally |
| RU-049 | todo | Translate Miya hero profile | Hero page reads naturally |
| RU-050 | todo | Translate Tigreal hero profile | Hero page reads naturally |
| RU-051 | todo | Translate Xavier hero profile | Hero page reads naturally |
| RU-052 | todo | Run content validation after hero batch | `npm run content:check` passes |

## 5. News Content

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-060 | todo | Translate Aamon articles | 2 articles translated |
| RU-061 | todo | Translate Angela articles | 3 articles translated |
| RU-062 | todo | Translate Balmond articles | 3 articles translated |
| RU-063 | todo | Translate Cecilion articles | 3 articles translated |
| RU-064 | todo | Translate Chou articles | 3 articles translated |
| RU-065 | todo | Translate Esmeralda articles | 2 articles translated |
| RU-066 | todo | Translate Fredrinn articles | 2 articles translated |
| RU-067 | todo | Translate Kagura articles | 2 articles translated |
| RU-068 | todo | Translate Lesley articles | 2 articles translated |
| RU-069 | todo | Translate Miya articles | 3 articles translated |
| RU-070 | todo | Translate Tigreal articles | 3 articles translated |
| RU-071 | todo | Translate Xavier articles | 2 articles translated |
| RU-072 | todo | Run content validation after news batch | `npm run content:check` passes |

## 6. Public UI Translation

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-080 | todo | Translate global header and footer | Navigation is Russian |
| RU-081 | todo | Translate home page UI | Home page has no unapproved English UI strings |
| RU-082 | todo | Translate hero explorer UI | Filters, sorting, empty states are Russian |
| RU-083 | todo | Translate hero detail UI | Labels, related content, CTAs are Russian |
| RU-084 | todo | Translate news feed UI | Filters and feed controls are Russian |
| RU-085 | todo | Translate article detail UI | Reading labels and related content are Russian |
| RU-086 | todo | Translate SOFT page UI | SOFT hub reads naturally |
| RU-087 | todo | Translate search UI | Search input, suggestions and results are Russian |
| RU-088 | todo | Translate loading and error states | Route loading/error pages are Russian |

## 7. Admin UI Translation

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-090 | todo | Translate admin shell | Sidebar and top actions are Russian |
| RU-091 | todo | Translate news manager | Lists, buttons and messages are Russian |
| RU-092 | todo | Translate news editor | Fields, validation hints and actions are Russian |
| RU-093 | todo | Translate heroes manager | Forms and taxonomy controls are Russian |
| RU-094 | todo | Translate media manager | Upload/delete/status text is Russian |
| RU-095 | todo | Translate admin login/local mode messages | Login page is Russian |

## 8. SEO, Metadata, and HTML

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-100 | todo | Set document language to Russian | Root layout uses `lang="ru"` |
| RU-101 | todo | Change OpenGraph locale | `src/lib/seo.ts` uses `ru_RU` |
| RU-102 | todo | Translate default keywords | Metadata keywords are Russian where useful |
| RU-103 | todo | Translate image alt text | OG and page alt strings are Russian |
| RU-104 | todo | Run metadata validation | `npm run metadata:check` passes |

## 9. English String Audit

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-110 | todo | Create or run English text scan | Report lists remaining English candidates |
| RU-111 | todo | Classify allowed exceptions | Exceptions documented in `qa-checklist.md` |
| RU-112 | todo | Remove unapproved English UI text | Scan has no blocking findings |
| RU-113 | todo | Remove stale README absolute paths | README references current repo paths |

## 10. Final QA

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-120 | todo | Run `npm run typecheck` | Pass |
| RU-121 | todo | Run `npm run lint` | Pass |
| RU-122 | todo | Run `npm test` | Pass |
| RU-123 | todo | Run `npm run content:check` | Pass |
| RU-124 | todo | Run `npm run metadata:check` | Pass |
| RU-125 | todo | Run `npm run build` | Pass |
| RU-126 | todo | Review desktop pages in browser | Key pages visually pass |
| RU-127 | todo | Review mobile width 375px | No broken layout from longer Russian text |
| RU-128 | todo | Verify reduced motion still works | No forced premium motion |

## 11. Release

| ID | Status | Task | Check |
| --- | --- | --- | --- |
| RU-130 | todo | Update Russian README | Setup and project description are Russian |
| RU-131 | todo | Commit Russian version | Commit exists |
| RU-132 | todo | Push to GitHub | GitHub repo contains Russian version |
| RU-133 | todo | Record final verification output | Final command results documented |
