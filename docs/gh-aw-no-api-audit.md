# gh-aw Without API Audit

This repository keeps the `gh-aw` workflow set checked in for reference, compilation, and a future switch to secret-backed agent execution.

The current operating mode is different:

- work is delivered in local Codex sessions
- GitHub issues and labels remain the source of truth
- no `OPENAI_API_KEY` or `CODEX_API_KEY` is configured for GitHub Actions

## Current status

| Workflow | Purpose | Status without OpenAI/Codex secret | Manual replacement |
| --- | --- | --- | --- |
| `plan` | Break a parent issue into sub-issues from `/plan` comments | Dormant in Actions. The workflow is compiled and stored, but runtime Codex execution will not start without `CODEX_API_KEY` or `OPENAI_API_KEY`. | Ask Codex in-session to decompose the issue, then create or update issues directly with `gh issue ...`. |
| `issue-arborist` | Analyze open issues and link likely parent/child relationships | Dormant in Actions for the same reason: it is `engine: codex` and validates OpenAI/Codex secrets before execution. | Maintain the backlog tree manually and update epic checklists as part of each session close-out. |
| `sub-issue-closer` | Close parent issues when all sub-issues are complete | Dormant in Actions because the workflow still runs Codex and validates the same secrets before its closing logic proceeds. | Close leaf issues manually, then update and close parent epics as part of the session protocol. |
| `issue-monster` | Auto-pick the next issue and assign it to an implementation agent | Unsupported for the current mode. At the pinned `gh-aw` SHA it is still `engine: copilot`, not `engine: codex`, and its upstream assignment flow is Copilot-oriented even if secrets were later added. | Follow the picking rule in [github-session-protocol.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/github-session-protocol.md): `status:ready`, highest priority first, then lowest issue number. |

## Practical meaning

- The checked-in `.md` workflow manifests and generated `.lock.yml` files are still useful as references.
- `gh aw compile --strict` remains useful locally to validate the workflow manifests.
- GitHub Actions should be treated as dormant for agent execution until the repo gets both:
  - `GH_AW_GITHUB_TOKEN`
  - `OPENAI_API_KEY` or `CODEX_API_KEY`

## Recommended operating mode

Use the repository in "manual GitHub control, local Codex execution" mode:

1. Pick the next issue by the rule in [github-session-protocol.md](C:/Users/iwwa/Documents/6_Work/Open_orche/docs/github-session-protocol.md).
2. Move it to `status:doing`.
3. Implement and verify locally.
4. Push to `main`.
5. Comment on the issue with what changed and what was verified.
6. Move the leaf issue to `status:done`.
7. Update the parent epic checklist manually.

That gives predictable progress tracking on GitHub without depending on secret-backed Actions.
