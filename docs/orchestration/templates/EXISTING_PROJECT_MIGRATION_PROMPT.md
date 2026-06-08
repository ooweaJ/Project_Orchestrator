# Existing Project Orchestration Migration Prompt

Use this prompt when a project is already in progress and has existing docs, logs, reports, or AI collaboration records. The goal is to migrate meaning into `docs/orchestration/*`, not to blindly copy empty templates.

```text
You are working inside an existing local project. Migrate this project to the shared orchestration interface.

Goal:
- Create or update `docs/orchestration/*` so Codex can quickly resume this project later.
- Preserve existing project meaning, decisions, verification notes, and task state.
- Do not overwrite existing files without first checking their contents.

Required target structure:

docs/orchestration/
  README.md
  PROJECT_BRIEF.md
  STATUS.md
  CURRENT_TASK.md
  NEXT_TASKS.md
  PROMPT_CONTEXT.md
  RUNBOOK.md
  SCOPE_GUARD.md
  DECISION_LOG.md
  devlog/
  reports/

Recommended extension folders:

docs/orchestration/
  review_prompts/
  review_responses/
  evidence/
  templates/

Before editing:
1. Inspect the existing documentation and project files.
2. Look for likely source documents such as:
   - AGENTS.md
   - README.md
   - docs/CODEX_STATUS.md
   - docs/NEXT_TASKS.md
   - docs/DEV_LOG.md
   - docs/PROMPT_DECISION_LOG.md
   - docs/DECISIONS.md
   - docs/adr/
   - docs/reports/
   - test logs, QA outputs, screenshots, benchmark results
3. Report what you found and how you will map it into the new interface.

Migration rules:
- `STATUS.md` is the whole-project current state: latest verification, current result, blockers, and next major step.
- `CURRENT_TASK.md` is one active work unit: goal, done criteria, related files, open questions, and verification commands.
- `NEXT_TASKS.md` should stay short, usually the top five candidates.
- Move history into `devlog/`.
- Move important decisions into `DECISION_LOG.md`.
- Move test output, screenshots, logs, benchmark results, and QA artifacts into `evidence/` only when they are useful and already available.
- Keep user-facing or portfolio-ready summaries in `reports/`.
- Keep project-specific AI operating rules in root `AGENTS.md` and stable Codex context in `PROMPT_CONTEXT.md`.
- Put explicit non-goals and "do not build yet" items in `SCOPE_GUARD.md`.

Safety rules:
- Do not delete old documentation.
- Do not overwrite useful existing files.
- If a target file exists, merge carefully or propose the merge before editing.
- Do not run destructive Git or filesystem commands.
- Keep local/private paths out of portfolio-facing reports unless the project already intentionally includes them.

After editing:
- Summarize changed files.
- Explain what legacy documents were mapped into which orchestration files.
- List anything uncertain or not migrated.
- Verify by reading the new `docs/orchestration/README.md`, `STATUS.md`, `CURRENT_TASK.md`, and `NEXT_TASKS.md`.
- Leave a short devlog entry under `docs/orchestration/devlog/YYYY-MM-DD.md`.
```
