# Next Tasks

Keep this list to the top upcoming candidates. Move history to `devlog/`, decisions to `DECISION_LOG.md`, and evidence to `evidence/`.

## Top Candidates

1. Add a homepage action to regenerate a selected project's orchestration HTML.
   - Verify: clicking the action runs the generator and refreshes the embedded dashboard.

2. Apply the LETHE-derived HTML template to one more active project.
   - Verify: the project has dashboard, command, runbook, and report-list pages with project-specific content.

3. Add Codex run controls for cancel/retry/open artifact folder.
   - Verify: a running job can be stopped, a failed job can be retried, and artifacts remain local under `agent_runs/`.

4. Decide the report cadence for `reports/`.
   - Verify: daily, commit-based, or work-unit report naming is documented and generated consistently.

5. Add a scaffold action for missing orchestration files.
   - Verify: selected project receives missing files without overwriting existing documentation.
