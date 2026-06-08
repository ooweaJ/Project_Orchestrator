# Next Tasks

Keep this list to the top upcoming candidates. Move history to `devlog/`, decisions to `DECISION_LOG.md`, and evidence to `evidence/`.

## Top Candidates

1. Add Codex run controls for cancel/retry/open artifact folder.
   - Verify: a running job can be stopped, a failed job can be retried, and artifacts remain local under `agent_runs/`.

2. Add a LETHE-side report dispatch script or npm command.
   - Verify: LETHE can call `POST /api/orchestration/discord-report` after report generation and receive dry-run or sent status.

3. Apply the `interface/` + `state/` orchestration layout to one more active project.
   - Verify: the project has dashboard, command, runbook, state Markdown, nested reports, and central Discord dry-run.

4. Decide the report cadence for `reports/`.
   - Verify: daily, commit-based, or work-unit report naming is documented and generated consistently.

5. Add a scaffold action for missing orchestration files.
   - Verify: selected project receives missing files without overwriting existing documentation.
