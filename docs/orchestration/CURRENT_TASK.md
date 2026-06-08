# Current Task

## Task

Reclassify the orchestration HTML dashboard and add project document browsing.

## Goal

- Remove duplicated Markdown summary cards from the homepage.
- Combine the user-facing next instruction summary with the command panel.
- Rebuild generated HTML around decision categories instead of raw document blocks.
- Let the homepage browse individual files under each selected project's `docs/orchestration/` folder.

## Done Criteria

- The homepage no longer shows the old top Markdown document card row.
- The command panel shows current task and next instruction summaries.
- Generated `docs/orchestration/index.html` uses classified sections for instruction, state, verification, records, reports, and operations.
- `개발 문서` shows a project-specific file list and selected document preview.
- Document preview endpoints only read inside `docs/orchestration/`.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`
- `scripts/build-orchestration-dashboard.mjs`

## Verification

- `npm run build`
- `npm run orchestration:dashboard -- --all`
- `GET /api/projects/lethe-prototype/orchestration-dashboard`
- `GET /api/projects/lethe-prototype/orchestration-files`
- `GET /api/projects/lethe-prototype/orchestration-file?path=STATUS.md`
