# Current Task

## Task

Generate an HTML dashboard from orchestration documents.

## Goal

- Add a script that reads `docs/orchestration/*` Markdown.
- Generate `docs/orchestration/index.html` as a card-based view.
- Support current project, one target project, and all registered projects.
- Keep Markdown as the source of truth and HTML as a generated view.

## Done Criteria

- `npm run orchestration:dashboard` creates `docs/orchestration/index.html`.
- `npm run orchestration:dashboard -- --target "C:\path\to\project"` works for one project.
- `npm run orchestration:dashboard -- --all` works for registered projects.
- Generated HTML includes current state, current task, next tasks, decisions, devlog, reports, commands, and document links.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`

## Verification

- Run `npm run orchestration:dashboard`.
- Run `npm run orchestration:dashboard -- --all`.
- Inspect generated HTML for the main card sections.
