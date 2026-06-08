# Next Tasks

Keep this list to the top upcoming candidates. Move history to `devlog/`, decisions to `DECISION_LOG.md`, and evidence to `evidence/`.

## Top Candidates

1. Add a LETHE-side report dispatch script or npm command.
   - Verify: LETHE can call `POST /api/orchestration/discord-report` after report generation and receive dry-run or sent status.

2. Add Codex run controls for cancel/retry/open artifact folder.
   - Verify: a running job can be stopped, a failed job can be retried, and artifacts remain local under `agent_runs/`.

3. Apply the `interface/` + `state/` orchestration layout to one more active project.
   - Verify: the project has dashboard, command, runbook, state Markdown, nested reports, and central Discord dry-run.

4. Add a daily report index generator for `reports/YYYYMMDD/index.html`.
   - Verify: a day's unit reports can be collected into one readable date journal page and the homepage lists that date page.

5. Add safer UI options for plugin installation.
   - Verify: the homepage can preview a dry-run, choose whether to update `AGENTS.md`, and avoid overwriting existing project docs.
