# Working Prompt for Russian Version Development

Ты работаешь над русской версией сайта `SOFT Rift`.

Активная рабочая папка:

```text
C:\Users\iwwa\Documents\2_MLBB\site-ru
```

Активный GitHub-репозиторий:

```text
https://github.com/i4w7w4a/mlbb-soft-portal-ru
```

Английская версия находится здесь:

```text
C:\Users\iwwa\Documents\2_MLBB\site
```

Ее нельзя редактировать без прямого запроса. Она служит эталоном структуры и поведения.

## Mission

Сделать полную русскую версию сайта:

- русский публичный интерфейс;
- русская админка;
- русский JSON-контент;
- русские SEO-метаданные;
- русские состояния загрузки, ошибок, пустых результатов;
- отдельный репозиторий и чистая история работы;
- сохраненная английская версия без смешивания.

## Current Operating State

- English dev server on `3000`: stopped.
- Russian dev server: `http://127.0.0.1:3001`.
- Russian repository baseline checks passed before translation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run content:check`
  - `npm run metadata:check`
  - `npm run build`

## Immediate Work Sequence

1. Work only inside `C:\Users\iwwa\Documents\2_MLBB\site-ru`.
2. Keep `docs/ru-localization/tasks.md` updated before and after each meaningful batch.
3. Follow `docs/ru-localization/glossary.md` for terms.
4. Follow `docs/ru-localization/operating-rules.md` for process discipline.
5. Start translation with low-risk content:
   - `content/site/settings.json`
   - `content/site/soft.json`
   - `content/taxonomy/categories.json`
   - `content/taxonomy/tags.json`
   - `content/news/latest-index.json`
6. Run `npm run content:check` after the first content batch.
7. Commit the batch only after validation passes.
8. Move to hero profiles.
9. Move to news articles.
10. Move to public UI.
11. Move to admin UI.
12. Move to SEO and metadata.
13. Run full QA gates.
14. Push stable checkpoints to GitHub.

## Non-Negotiable Rules

- Do not translate slugs or IDs unless the whole content graph is updated deliberately.
- Do not hide English text by ignoring it. Classify it as allowed or fix it.
- Do not run `npm audit fix --force` during localization unless explicitly approved.
- Do not change the English repository.
- Do not mix ports. Russian site uses `3001`.
- Do not make broad refactors while translating unless they directly reduce translation risk.
- Do not commit a broken state.
- Do not call work complete until command gates and manual route checks pass.

## Translation Style

Russian text must be:

- clear;
- dense;
- editorial;
- natural for MLBB players;
- free from machine-translation stiffness;
- restrained, not theatrical.

The goal is not to convert words. The goal is to make the Russian site feel born in Russian.

## Quality Gates

Run these before final delivery and after risky batches:

```bash
npm run typecheck
npm run lint
npm test
npm run content:check
npm run metadata:check
npm run build
```

Manual route review must cover:

- `/`
- `/heroes`
- `/heroes/aamon`
- `/news`
- `/news/aamon-burst-route-guide`
- `/soft`
- `/search`
- `/admin`
- `/admin/news`
- `/admin/heroes`
- `/admin/media`

## Reporting

Every status report should say:

- what changed;
- what was verified;
- what remains;
- where the risk is.

No vague victory language. The task is finished only when the evidence is visible.

