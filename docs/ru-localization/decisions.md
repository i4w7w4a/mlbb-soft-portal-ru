# Russian Version Decisions

Журнал нужен для одной простой вещи: не решать один и тот же вопрос пять раз.

## Decisions

| Date | ID | Decision | Reason |
| --- | --- | --- | --- |
| 2026-05-24 | D-001 | Keep English repository as source baseline | User wants to preserve English version |
| 2026-05-24 | D-002 | Build Russian version as a separate repository, not as `/ru` inside one app | Lower complexity and cleaner ownership |
| 2026-05-24 | D-003 | Keep slugs and internal IDs stable by default | Prevent broken content graph and links |
| 2026-05-24 | D-004 | Do not install optional plugin without exact GitHub URL | Ambiguous plugin name can waste time or add wrong tooling |
| 2026-05-24 | D-005 | Use repository control files for the process | The task needs traceability more than extra tooling |
| 2026-05-24 | D-006 | Use `mlbb-soft-portal-ru` as the Russian repository name | User approved proceeding with the default |
| 2026-05-24 | D-007 | Create the Russian repository as public | It mirrors the currently public English source repository |
| 2026-05-24 | D-008 | Baseline Russian copy before translating any text | Translation work should start from a known-good build |

## Open Questions

| ID | Question | Needed Before |
| --- | --- | --- |
| Q-002 | Should the public site title be `SOFT Rift` or `SOFT Rift RU`? | SEO and settings translation |
| Q-003 | Should admin UI be fully translated or only public site first? | Admin translation phase |
| Q-004 | Should hero names stay official English spellings? | Hero content phase |
| Q-005 | What domain/site URL will Russian version use? | Canonical URLs and metadata |

## Process Notes

- Optional plugin `GW-HW` was not installed because no exact GitHub URL was provided.
- If a plugin is later required, install only after confirming the repository URL and purpose.
- Until then, progress is controlled through `docs/ru-localization/*`.
