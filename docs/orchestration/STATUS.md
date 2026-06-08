# Status

## Current State

- MVP app exists with a React dashboard and Express backend.
- Project registration, local Git scanning, scanner signals, risk scoring, prompt generation, portfolio mode, and Discord report prototype are implemented.
- The orchestration interface standard is being expanded from the original six-role document set.
- `npm run orchestration:install` now scaffolds the default orchestration interface into another local project without overwriting existing files.
- The scanner now detects `docs/orchestration/*` required core and recommended extension paths.
- The dashboard now shows an `오케스트레이션 인터페이스` panel for the selected project.
- The dashboard now prioritizes orchestration document contents over risk, prompt, and auxiliary scan panels.
- Project Discord reports are sent from AI Project Orchestrator's central `.env`, not from each registered project.
- `npm run orchestration:dashboard` now generates `docs/orchestration/index.html` as a card-based HTML view of the Markdown interface.
- The homepage now embeds each selected project's generated `docs/orchestration/index.html` in an `HTML 대시보드` panel.
- The generated HTML dashboard is now grouped by decision flow: next instruction, current state, verification/blockers, records, reports, and operational commands.
- Project HTML output is being split into interface pages: `index.html` for the project dashboard, `command.html` for the next instruction block, and `runbook.html` for operating procedures.
- The homepage now orders the selected project view as project dashboard, next-instruction block, command prompt, runbook, then collapsed interface checklist.
- Visible risk badges, the report send block, and the document browser were removed from the main operating flow.
- `HTML_INTERFACE_TEMPLATE.md` now captures the LETHE-derived human-facing HTML format for reuse across projects.
- The homepage now has a `개발일지` button that lists HTML files from `docs/orchestration/reports/` and opens the selected report as an HTML card.
- `npm run orchestration:dashboard` now also generates `docs/orchestration/reports/index.html` in the LETHE-style report-list format.

## Latest Verification

- `npm run build` passed after the orchestration dashboard update.
- Current documentation and install-command updates have been checked by file review.
- `npm run orchestration:install -- --target . --dry-run` passed.
- `GET /api/snapshots` returned `requiredPresent: 11`, `requiredTotal: 11`, and `complete: true` for LETHE_Prototype and Project_Orchestrator.
- `GET /api/snapshots` returned orchestration document content summaries for `STATUS.md`, `CURRENT_TASK.md`, `NEXT_TASKS.md`, and `DECISION_LOG.md`.
- `POST /api/projects/lethe-prototype/discord-report` with `dryRun: true` returned a Discord payload without sending.
- `npm run orchestration:dashboard` generated this project's `docs/orchestration/index.html`.
- `npm run orchestration:dashboard -- --all` generated dashboards for LETHE_Prototype and Project_Orchestrator.
- `npm run build` passed after embedding generated HTML dashboards in the homepage.
- `GET /api/projects/lethe-prototype/orchestration-dashboard` returned LETHE_Prototype's generated HTML with `200 OK`.
- `GET http://127.0.0.1:5173` returned the homepage Vite HTML with `200 OK`.
- `npm run orchestration:dashboard -- --all` regenerated the classified HTML dashboards for LETHE_Prototype and Project_Orchestrator.
- `GET /api/projects/lethe-prototype/orchestration-files` returned LETHE_Prototype's `docs/orchestration` document list with `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-file?path=STATUS.md` returned LETHE_Prototype's `STATUS.md` content with `200 OK`.
- `npm run orchestration:dashboard -- --all` generated `index.html`, `command.html`, and `runbook.html` for LETHE_Prototype and Project_Orchestrator.
- `GET /api/projects/lethe-prototype/orchestration-command` returned LETHE_Prototype's next-instruction HTML with `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-runbook` returned LETHE_Prototype's runbook HTML with `200 OK`.
- `npm run orchestration:dashboard` generated this project's `index.html`, `command.html`, `runbook.html`, and `reports/index.html`.
- `npm run build` passed after adding the development-journal button and reports preview.
- `GET /api/projects/lethe-prototype/orchestration-reports` returned LETHE_Prototype's HTML report list with `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-report?path=2026-06-08-08-plugin-oriented-migration-prompt-update.html` returned the selected HTML report with `200 OK`.

## Blockers

- Browser plugin visual QA is still blocked by a Windows sandbox browser-runtime error.
- SoulLike real project path validation is still pending.

## Next Major Step

Use the LETHE-derived HTML template on another active project and add a homepage action to regenerate the selected project's orchestration HTML before viewing it.
