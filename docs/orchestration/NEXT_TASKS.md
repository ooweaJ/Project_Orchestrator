# Next Tasks

Keep this list to the top upcoming candidates. Move history to `devlog/`, decisions to `DECISION_LOG.md`, and evidence to `evidence/`.

## Top Candidates

1. Formalize `reports/` as the user-facing progress record.
   - Verify: a daily or commit-based report file can be generated and linked from `index.html`.

2. Add a homepage action to regenerate a selected project's orchestration HTML.
   - Verify: clicking the action runs the generator and refreshes the embedded dashboard.

3. Add generated list pages for `reports/` and `evidence/`.
   - Verify: each folder has an index page linked from the generated dashboard.

4. Add a scaffold action for missing orchestration files.
   - Verify: selected project receives missing files without overwriting existing documentation.

5. Validate real project paths.
   - Verify: snapshots succeed for real LETHE and SoulLike paths while portfolio mode hides sensitive details.
