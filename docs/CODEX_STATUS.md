# Codex Status

## Current State

The project has a first runnable MVP scaffold.

Completed documentation setup:

- `AGENTS.md` defines AI agent operating rules.
- `docs/AI_USAGE_PORTFOLIO.md` summarizes portfolio-relevant AI usage.
- `docs/PROMPT_DECISION_LOG.md` indexes important prompt and decision records.
- `docs/DEV_LOG.md` indexes task-based development logs.
- `docs/NEXT_TASKS.md` lists upcoming work.
- `docs/ai-collaboration/2026-06-04/01-agent-rules-and-reporting.md` records the first AI collaboration design decision.

Completed MVP scaffold:

- Vite + React + TypeScript frontend.
- Node + Express backend.
- Local project config at `data/projects.json`.
- Read-only Git scanner using `git` commands.
- `GET /api/projects`.
- `POST /api/projects`.
- `DELETE /api/projects/:id`.
- `GET /api/projects/:id/snapshot`.
- `GET /api/snapshots`.
- `POST /api/projects/:id/prompt`.
- `GET /api/activity`.
- Dashboard with summary metrics, project cards, detail panel, risk list, and copyable Codex prompt.

Completed dashboard interaction improvements:

- Project registration form in the dashboard.
- Delete action with confirmation.
- Prompt type selector for diagnose, commit, docs, and review.
- Prompt generation connected to `POST /api/projects/:id/prompt`.

Completed scanner signal improvements:

- Recent files detection with ignored heavy folders.
- TODO/FIXME/BUG comment counting and sample items.
- Large file detection with Git LFS-oriented risk messages.
- Scan limits to avoid blindly scanning very large repositories.
- File signal panel in the dashboard.
- Prompt generation now includes file signal summaries.

Completed orchestration improvements:

- Action categories for `blocked`, `needsCommit`, `needsDocs`, `needsPush`, `needsPull`, `needsReview`, `needsLfs`, `needsTest`, and `needsCleanup`.
- More specific recommended actions based on project state.
- Expanded prompt generation for continue implementation, verification, cleanup, and push preparation.
- Portfolio Mode toggle that hides local paths, file names, TODO text, and project names in the dashboard prompt view.
- `GET /api/report` for compact scan-based reporting.
- Discord snapshot report commands:
  - `npm run report:discord:snapshot:dry`
  - `npm run report:discord:snapshot`
- Expanded `docs/orchestration/*` interface standard with required core documents, recommended evidence extensions, devlog/report separation, and a reusable AGENTS template.
- `npm run orchestration:install` can scaffold the default interface into another local project without overwriting existing files.
- `EXISTING_PROJECT_MIGRATION_PROMPT.md` supports active projects that need AI-assisted migration from legacy docs into the new interface.
- Scanner snapshots now include `files.orchestration` for required core and recommended extension status.
- The dashboard shows an `오케스트레이션 인터페이스` panel with required completion and recommended extension status.
- Scanner snapshots now include `files.orchestrationDashboard` with `STATUS.md`, `CURRENT_TASK.md`, `NEXT_TASKS.md`, `DECISION_LOG.md`, recent devlog, and recent reports.
- The dashboard now prioritizes orchestration document content, document-based commands, and centralized Discord reports instead of risk/prompt/auxiliary scan panels.
- `npm run orchestration:dashboard` generates `docs/orchestration/index.html` as a card-based HTML view of the Markdown orchestration interface.
- The homepage embeds the selected project's generated orchestration HTML dashboard through `GET /api/projects/:id/orchestration-dashboard`.
- The generated HTML dashboard is grouped into decision-oriented sections rather than raw Markdown document cards.
- Generated project HTML now uses an interface set: `index.html` for the project dashboard, `command.html` for the next instruction block, and `runbook.html` for operating procedures.
- The homepage main flow no longer shows risk badges, a report block, or a document browser; interface completion is collapsed.
- `HTML_INTERFACE_TEMPLATE.md` documents the LETHE-derived HTML format for reuse across projects.
- The homepage has a `개발일지` button that lists and previews HTML reports from `docs/orchestration/reports/`.
- The dashboard generator now writes `reports/index.html` in addition to `index.html`, `command.html`, and `runbook.html`.
- The homepage command panel can start a non-interactive Codex CLI run for the selected project.
- Codex run APIs store local prompt/output/status/final-message artifacts under `docs/orchestration/agent_runs/`, which is ignored by Git.
- Orchestration readers now prefer the newer `docs/orchestration/interface/` HTML layout and `docs/orchestration/state/` Markdown layout, with root-level compatibility fallback.
- The development-journal browser now lists date-folder pages such as `docs/orchestration/reports/YYYYMMDD/index.html` as the primary journal surface.
- Unit report HTML under `docs/orchestration/reports/YYYYMMDD/units/` remains usable for explicit Discord attachments and drill-down links.
- Project Discord reports can now be submitted to `POST /api/orchestration/discord-report` by a registered project pipeline, then sent centrally from AI Project Orchestrator using the orchestrator `.env` webhook and shared report format.
- The shared `docs/orchestration/` system is now treated as a reusable personal development-docs plugin.
- The homepage can scaffold the selected project's plugin structure or create only a migration Markdown prompt for active existing projects.

Completed dashboard localization and readability improvements:

- Korean labels for dashboard metrics, forms, buttons, risk badges, action chips, and empty states.
- `blocked` is shown as `확인 필요` in the UI.
- Missing example paths now show a clear explanation that a real local folder path must be registered.
- Risk messages and generated prompt summaries are localized in Korean.
- Dashboard cards, metrics, and action chips received small readability improvements.

Completed project folder picker:

- `GET /api/folders` returns local drive roots and child folders.
- Project add form includes a `찾아보기` button next to the path field.
- The folder picker can navigate roots, parent folders, and child folders.
- Selecting a folder fills the project path input without manually typing the path.

Completed command-centered dashboard update:

- Added a `작업 지휘` panel for each selected project.
- The panel summarizes current work, progress state, and next tasks.
- Users can type their own instruction and generate a combined Codex command prompt.
- Prompt template tabs remain available, but the final prompt can now include the user's direct command.
- File signals were moved into a collapsed supporting section so they do not dominate the workflow.
- Empty project state now explains that a project must be selected before prompt menus appear.

## Product Target

Build a local-first AI Project Orchestrator dashboard with:

- Vite + React + TypeScript frontend
- Node + Express backend
- local JSON config
- Git/project scanner
- rule-based risk scoring
- Codex prompt generator
- no paid AI API requirement for MVP

## Known Constraints

- Destructive Git commands must not be run automatically.
- External AI API calls are not required for MVP.
- Local project paths may be private and should be hidden in future portfolio mode.
- Large repositories should not be scanned blindly.

## Verification Notes

Verified on 2026-06-04:

- `npm install` completed with 0 vulnerabilities.
- `npm run build` passed.
- `http://127.0.0.1:5173` returned Vite HTML.
- `http://127.0.0.1:4317/api/projects` returned project JSON.
- `http://127.0.0.1:4317/api/snapshots` returned project snapshots.
- Project add/delete API flow was verified with a temporary local project entry.
- Review prompt generation was verified through `POST /api/projects/:id/prompt`.

Browser plugin visual verification was attempted, but the browser runtime failed with a Windows sandbox spawn error. HTTP/API verification succeeded.

Verified on 2026-06-05:

- `npm run build` passed.
- Frontend dev server returned HTML from `http://127.0.0.1:5173`.
- `GET /api/snapshots` returned the new file signal fields.
- Temporary scanner test project returned recent files, TODO count, TODO samples, large file count, and scan truncation status.
- Temporary full-flow project test confirmed action categories and generated `push` / `verification` prompts.
- `GET /api/report` returned a compact Korean report object.
- `npm run report:discord:snapshot:dry` produced a valid Discord payload from scan results.
- Dashboard localization build passed.
- `GET /api/snapshots` returned Korean risk messages.
- `POST /api/projects/ue5-soullike/prompt` returned a Korean prompt body.
- `GET /api/folders` returned local drive roots and folders.
- `GET /api/folders?path=<local-path>` returned child folders for a selected path.
- Command-centered dashboard build passed.

Verified on 2026-06-08:

- Expanded orchestration interface Markdown files were reviewed.
- `docs/orchestration/*` required core files and folders were scaffolded for this repository.
- `AGENTS.md`, `docs/ORCHESTRATION_INTERFACE.md`, `docs/NEXT_TASKS.md`, decision logs, and user-facing reports were updated for the new standard.
- `npm run orchestration:install -- --target . --dry-run` passed.
- Existing-project migration prompt template was reviewed.
- `npm run build` passed after adding scanner and dashboard support for orchestration interface status.
- `GET /api/snapshots` returned `requiredPresent: 11`, `requiredTotal: 11`, and `complete: true` for LETHE_Prototype and Project_Orchestrator.
- Browser plugin visual QA was attempted, but the browser runtime failed with a Windows sandbox spawn error.
- `GET /api/snapshots` returned `phase: 진행 중` and document content flags for LETHE_Prototype and Project_Orchestrator.
- `POST /api/projects/lethe-prototype/discord-report` with `dryRun: true` returned a Discord payload and did not send.
- `npm run orchestration:dashboard` generated Project_Orchestrator's orchestration HTML dashboard.
- `npm run orchestration:dashboard -- --all` generated dashboards for LETHE_Prototype and Project_Orchestrator.
- `npm run build` passed after adding the homepage embedded HTML dashboard panel.
- `GET /api/projects/lethe-prototype/orchestration-dashboard` returned LETHE_Prototype's generated HTML with `200 OK`.
- `GET http://127.0.0.1:5173` returned the homepage Vite HTML with `200 OK`.
- `npm run orchestration:dashboard -- --all` regenerated classified dashboards for LETHE_Prototype and Project_Orchestrator.
- `GET /api/projects/lethe-prototype/orchestration-files` returned LETHE_Prototype's document list with `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-file?path=STATUS.md` returned LETHE_Prototype's document content with `200 OK`.
- `npm run orchestration:dashboard -- --all` generated `index.html`, `command.html`, and `runbook.html` for LETHE_Prototype and Project_Orchestrator.
- `GET /api/projects/lethe-prototype/orchestration-command` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-runbook` returned `200 OK`.
- `npm run orchestration:dashboard` generated this project's four HTML interface outputs including `reports/index.html`.
- `npm run build` passed after adding the development-journal report browser.
- `GET /api/projects/lethe-prototype/orchestration-reports` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-report?path=2026-06-08-08-plugin-oriented-migration-prompt-update.html` returned `200 OK`.
- `npm run build` passed after adding homepage Codex CLI execution.
- `POST /api/projects/project-orchestrator/codex-run` returned `202 Accepted`.
- `GET /api/projects/project-orchestrator/codex-runs/20260608-095709-1hluj` returned `complete`, `exitCode: 0`, and `lastMessage: codex runner ok`.
- `npm run build` passed after adding `interface/` and `state/` layout support.
- `npm run orchestration:dashboard` generated HTML under `docs/orchestration/interface/`.
- `GET /api/projects/lethe-prototype/orchestration-dashboard` returned LETHE's `interface/index.html` with `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-command` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-reports` returned nested LETHE unit report paths.
- `POST /api/projects/lethe-prototype/discord-report` with `dryRun: true` returned a Discord embed payload and HTML attachment metadata for the latest LETHE unit report.
- `POST /api/orchestration/discord-report` with LETHE `projectId`, unit `reportPath`, and `dryRun: true` returned a Discord embed payload and HTML attachment metadata.
- `GET /api/projects/lethe-prototype/snapshot` resolved document paths under `docs/orchestration/state/*.md`.
