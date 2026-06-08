# Development Docs Plugin Install Flow

## Goal

Turn the orchestration interface into a reusable personal development-docs plugin that can be installed or migrated from the Project Orchestrator homepage.

## Work Performed

- Reframed the shared standard as a development-docs plugin while keeping `docs/orchestration/` as the stable folder name.
- Added selected-project homepage actions:
  - `문서 플러그인`: scaffold the default `docs/orchestration/` structure.
  - `마이그레이션 MD`: create only `docs/orchestration/MIGRATION_PROMPT.md` for an existing project.
- Added backend routes for plugin installation and migration-prompt generation.
- Updated the installer to scaffold the split layout:
  - human HTML under `docs/orchestration/interface/`
  - AI Markdown under `docs/orchestration/state/`
  - report/devlog/evidence/review/template folders
- Copied `HTML_INTERFACE_TEMPLATE.md` into installed template sets.
- Changed development-journal listing to date-folder pages such as `docs/orchestration/reports/20260608/index.html`.
- Preserved explicit `reports/YYYYMMDD/units/*.html` paths for Discord attachments and deep links.
- Updated migration, AGENTS, and HTML interface templates to describe the plugin, daily report indexes, optional units, and central Discord intake.

## Problem Encountered

The previous implementation still presented the feature as an interface and treated every unit report as a top-level journal item. That made the homepage noisier than the user's intended "daily development journal" view.

## Resolution

Keep daily `index.html` pages as the human journal surface and reserve unit reports for drill-down pages or Discord attachments.

## Verification

- `npm run build`
- `npm run orchestration:install -- --target . --dry-run`
- `npm run orchestration:dashboard`
- `POST /api/projects/project-orchestrator/dev-doc-plugin/install` with `dryRun: true`
- `POST /api/projects/project-orchestrator/dev-doc-plugin/migration-prompt` with `dryRun: true`
- `GET /api/projects/lethe-prototype/orchestration-reports`
- `GET /api/projects/project-orchestrator/orchestration-reports`
- `POST /api/orchestration/discord-report` with LETHE `projectId`, explicit unit `reportPath`, and `dryRun: true`
- Generated `docs/orchestration/reports/index.html` contains the `20260608/index.html` daily journal link.

## Result

Project Orchestrator now has the pieces needed to install the user's default development-docs plugin into registered projects and to migrate active projects without replacing their existing documentation blindly.

## Next Task

Add the LETHE-side command that submits a completed report to `POST /api/orchestration/discord-report`.
