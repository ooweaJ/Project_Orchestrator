# Current Task

## Task

Turn the orchestration interface into a reusable personal development-docs plugin.

## Goal

- Treat `docs/orchestration/` as the installable development-docs plugin contract for other projects.
- Let the homepage create the plugin structure for a selected project.
- Let the homepage create a migration Markdown prompt for an existing project without forcing a full scaffold.
- Make the development-journal browser read only date journal pages such as `reports/YYYYMMDD/index.html`.
- Keep explicit unit report paths available for central Discord intake and attachments.
- Update migration/template docs so LETHE and other projects can adopt the same standard.

## Done Criteria

- Homepage has `문서 플러그인` and `마이그레이션 MD` actions for the selected project.
- Install action calls the backend scaffold route and refreshes the embedded project interface.
- Migration action writes only `docs/orchestration/MIGRATION_PROMPT.md` unless it already exists.
- Report browser and generated `reports/index.html` list date folder `index.html` pages first, not every unit report.
- Explicit `reportPath` still works for `POST /api/orchestration/discord-report`.
- Templates describe the plugin, `interface/`, `state/`, date journal pages, optional `units/`, and central Discord intake.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`
- `scripts/build-orchestration-dashboard.mjs`
- `docs/orchestration/STATUS.md`
- `docs/orchestration/devlog/2026-06-08.md`

## Verification

- `npm run build`
- `npm run orchestration:install -- --target . --dry-run`
- `npm run orchestration:dashboard`
- `GET /api/projects/lethe-prototype/orchestration-reports`
- `POST /api/projects/project-orchestrator/dev-doc-plugin/install` with `dryRun: true`
- `POST /api/projects/project-orchestrator/dev-doc-plugin/migration-prompt` with `dryRun: true`
- `POST /api/orchestration/discord-report` with `projectId`, `reportPath`, and `dryRun: true`
