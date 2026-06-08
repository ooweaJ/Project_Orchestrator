# Current Task

## Task

Adopt the expanded orchestration document interface.

## Goal

- Document the required core and recommended extensions.
- Add this repository's initial `docs/orchestration/` scaffold.
- Clarify how AGENTS.md templates relate to reusable Codex skills.

## Done Criteria

- `docs/ORCHESTRATION_INTERFACE.md` reflects the expanded standard.
- `AGENTS.md` points agents to the standard interface.
- `docs/orchestration/` contains the required core files and folders.
- A reusable AGENTS template exists under `docs/orchestration/templates/`.
- `npm run orchestration:install` can scaffold the default interface into another project without overwriting existing files.

## Related Files

- `docs/ORCHESTRATION_INTERFACE.md`
- `AGENTS.md`
- `docs/NEXT_TASKS.md`
- `docs/orchestration/*`

## Verification

- Review changed Markdown files.
- Run `git diff --stat`.
- Run `npm run orchestration:install -- --target . --dry-run`.
