# Current Task

## Task

Promote the LETHE HTML format into a reusable template and add report browsing.

## Goal

- Treat the current LETHE HTML pages as the source format for reusable project dashboard templates.
- Add `HTML_INTERFACE_TEMPLATE.md` so other projects can follow the same visual and structural rules.
- Update the migration prompt so it references the LETHE-derived HTML template.
- Generate `reports/index.html` from `docs/orchestration/reports/`.
- Add a homepage `개발일지` button that lists report HTML files and previews the selected report as a card.

## Done Criteria

- The template explains `index.html`, `command.html`, `runbook.html`, and `reports/index.html`.
- The migration prompt references the template and explains the root-layout compatibility with current LETHE.
- The homepage can list `docs/orchestration/reports/*.html` for the selected project.
- Clicking a report opens it inside the dashboard as an HTML card.
- The generator creates a LETHE-style project dashboard and report index for the current project.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`
- `scripts/build-orchestration-dashboard.mjs`
- `docs/orchestration/templates/HTML_INTERFACE_TEMPLATE.md`
- `docs/orchestration/templates/EXISTING_PROJECT_MIGRATION_PROMPT.md`

## Verification

- `npm run build`
- `npm run orchestration:dashboard`
- `GET /api/projects/lethe-prototype/orchestration-reports`
- `GET /api/projects/lethe-prototype/orchestration-report?path=2026-06-08-08-plugin-oriented-migration-prompt-update.html`
