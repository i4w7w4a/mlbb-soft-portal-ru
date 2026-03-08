# GitHub Session Protocol

This repository uses GitHub issues and labels as the source of truth for long Codex-assisted delivery sessions without API-based agent execution.

## Backlog model

- Root issue: [#1](https://github.com/i4w7w4a/mlbb-soft-portal/issues/1)
- Epics: `#2` to `#6`
- Leaf work: `#7+`

## Labels

- `status:backlog` means valid work, but not next.
- `status:ready` means the issue can be picked in the next implementation session.
- `status:doing` means the issue is actively being worked.
- `status:blocked` means work is paused by an external dependency.
- `status:done` means implemented and verified.

- `priority:p0` is the default queue head.
- `priority:p1` is important follow-up work.
- `priority:p2` is later work.

- `size:s`, `size:m`, `size:l` estimate expected scope for a single session or multi-session run.

## Session picking rule

When the user does not specify a target issue:

1. Pick the open issue with `status:ready`.
2. Prefer `priority:p0`, then `priority:p1`, then `priority:p2`.
3. Within the same priority, prefer the lowest issue number.
4. If the chosen issue is too blocked or too dependent on unfinished work, move it to `status:blocked` or `status:backlog`, explain why, and pick the next `status:ready` issue.

## Session workflow

At the start of work:

1. Move the chosen issue to `status:doing`.
2. Add a short issue comment with the implementation target and any assumptions.

During work:

1. Keep the issue number referenced in commit messages or close-out comments.
2. Push code to `main` only after validation succeeds.
3. If the issue grows beyond safe session scope, split follow-up work into new leaf issues instead of silently expanding scope.

At the end of work:

1. Comment on the issue with what changed, what was verified, and any residual risk.
2. Move the issue to `status:done` if complete.
3. Move it to `status:blocked` or `status:backlog` if more work is still required.
4. Update the parent epic checklist if the leaf issue is fully done.

## Constraint

The assistant cannot self-trigger a future session without a new user message. In practice, the user can simply say `continue`, and the assistant should pick the next issue by the rule above without asking for a new plan unless something is blocked or ambiguous.

