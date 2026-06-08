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
- The homepage command panel can now start a non-interactive Codex CLI run for the selected project and show run status, exit code, output, and the final Codex message.
- Codex run artifacts are written under `docs/orchestration/agent_runs/` and ignored by Git.
- The dashboard now reads the newer orchestration layout first: human HTML from `docs/orchestration/interface/` and AI state Markdown from `docs/orchestration/state/`.
- The development-journal browser now reads date journal pages such as `docs/orchestration/reports/YYYYMMDD/index.html`.
- Unit reports under `docs/orchestration/reports/YYYYMMDD/units/*.html` remain valid explicit report paths for Discord attachments and deep links, but they are not the main homepage journal list.
- Project Discord reports can now be sent centrally from AI Project Orchestrator using the selected or latest orchestration HTML report as the embed source and HTML attachment.
- `POST /api/orchestration/discord-report` now acts as a local intake endpoint for registered projects such as LETHE to request central Discord delivery after a work unit finishes.
- The shared `docs/orchestration/` standard is now described as a reusable personal development-docs plugin rather than only an interface.
- The homepage now has selected-project actions for `문서 플러그인` scaffold creation and `마이그레이션 MD` creation.
- `npm run orchestration:install` now scaffolds the split plugin layout: `interface/` for HTML, `state/` for Markdown, and copied templates including `HTML_INTERFACE_TEMPLATE.md`.
- Migration and HTML templates now document date-folder report journals, optional `units/` pages, and central Project Orchestrator Discord intake.

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
- `npm run build` passed after adding homepage Codex CLI execution.
- `POST /api/projects/project-orchestrator/codex-run` returned `202 Accepted` and created run `20260608-095709-1hluj`.
- `GET /api/projects/project-orchestrator/codex-runs/20260608-095709-1hluj` returned `status: complete`, `exitCode: 0`, and `lastMessage: codex runner ok`.
- `npm run build` passed after adding `interface/` and `state/` layout support.
- `npm run orchestration:dashboard` generated this project's `docs/orchestration/interface/index.html`, `command.html`, and `runbook.html`.
- `GET /api/projects/lethe-prototype/orchestration-dashboard` returned LETHE's `interface/index.html` with `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-reports` returned nested LETHE unit reports, including `20260608/units/2026-06-08-10-오케스트레이션-리포트와-개발로그-실제-마이그레이션.html`.
- `POST /api/projects/lethe-prototype/discord-report` with `dryRun: true` returned a Discord embed payload and HTML attachment metadata for LETHE's latest unit report.
- `GET /api/projects/lethe-prototype/snapshot` returned document paths under `docs/orchestration/state/*.md` with `hasContent: true`.
- `POST /api/orchestration/discord-report` with `projectId: lethe-prototype`, a LETHE unit `reportPath`, and `dryRun: true` returned the expected Discord embed payload and attachment metadata.
- `npm run build` passed after adding the homepage plugin install and migration prompt actions.
- `npm run orchestration:install -- --target . --dry-run` passed and showed the split `state/` files that would be created for a target missing them.
- `npm run orchestration:dashboard` regenerated interface pages and `docs/orchestration/reports/index.html`.
- `GET /api/projects/lethe-prototype/orchestration-reports` returned only LETHE date journal pages such as `20260608/index.html`.
- `GET /api/projects/project-orchestrator/orchestration-reports` returned this project's `20260608/index.html` date journal.
- `POST /api/projects/project-orchestrator/dev-doc-plugin/install` with `dryRun: true` returned scaffold output without writing files.
- `POST /api/projects/project-orchestrator/dev-doc-plugin/migration-prompt` with `dryRun: true` returned `docs/orchestration/MIGRATION_PROMPT.md` as the would-be output path.
- `POST /api/orchestration/discord-report` with LETHE `projectId`, explicit unit `reportPath`, and `dryRun: true` still returned embed payload and HTML attachment metadata.
- Generated `docs/orchestration/reports/index.html` contains the `20260608/index.html` daily journal link.

## Blockers

- Browser plugin visual QA is still blocked by a Windows sandbox browser-runtime error.
- SoulLike real project path validation is still pending.

## Next Major Step

Add a LETHE-side report dispatch script or npm command that calls Project Orchestrator's central Discord intake after report generation.
