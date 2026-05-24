# Russian Version QA Checklist

Этот файл не для красивой отчетности. Он нужен, чтобы поймать то, что компилятор не видит.

## Command Gates

Перед финалом должны пройти:

```bash
npm run typecheck
npm run lint
npm test
npm run content:check
npm run metadata:check
npm run build
```

## Route Review

Проверить вручную:

| Route | Desktop | Mobile 375px | Russian UI | Notes |
| --- | --- | --- | --- | --- |
| `/` | todo | todo | todo |  |
| `/heroes` | todo | todo | todo |  |
| `/heroes/aamon` | todo | todo | todo |  |
| `/news` | todo | todo | todo |  |
| `/news/aamon-burst-route-guide` | todo | todo | todo |  |
| `/soft` | todo | todo | todo |  |
| `/search` | todo | todo | todo |  |
| `/admin` | todo | todo | todo |  |
| `/admin/news` | todo | todo | todo |  |
| `/admin/heroes` | todo | todo | todo |  |
| `/admin/media` | todo | todo | todo |  |

## Visual Checks

- Русский текст не вылезает из кнопок.
- Карточки не ломают сетку из-за длинных слов.
- Фильтры не прыгают при выборе.
- Заголовки не становятся тяжелее, чем позволяет блок.
- Мобильная версия не требует горизонтального скролла.
- Focus rings видны.
- Reduced motion не ломает восприятие.

## SEO Checks

- Root layout uses `lang="ru"`.
- OpenGraph locale is `ru_RU`.
- Page titles are Russian.
- Page descriptions are Russian.
- Default keywords are Russian or intentional brand terms.
- OG image alt text is Russian.
- Canonical URLs are correct for the Russian domain/repo target.

## Content Checks

- Hero names can remain official English names unless there is a known Russian community spelling.
- Hero titles should be translated if they are descriptive.
- Role/lane labels follow `glossary.md`.
- `slug`, `heroSlug`, `tags[].slug`, `categories[].slug` remain stable unless deliberately changed across the graph.
- `contentMarkdown` headings, paragraphs, lists and quotes are translated.
- SEO `title` and `description` are translated.

## English Audit Exceptions

Allowed:

- SOFT
- MLBB
- Mobile Legends: Bang Bang
- EXP
- URLs
- file paths
- npm/package names
- TypeScript identifiers
- JSON slugs and IDs

Blocking:

- English CTAs visible to users.
- English navigation labels.
- English empty states.
- English loading/error states.
- English SEO descriptions.
- English article paragraphs, except official names.

## Final Definition of Done

The Russian version is done only when:

- command gates pass;
- manual route review is complete;
- English audit has no blocking findings;
- Russian repo is separate from English repo;
- final verification is recorded in `decisions.md` or the final delivery note.

