# Existing Project Orchestration Adoption Prompt

Use this prompt when a project is already in progress and should adopt the shared Codex orchestration interface.

The goal is not to blindly move or rename every existing document. The goal is to install `docs/orchestration/` as the ongoing project-management interface so Codex can resume, execute, verify, report, and preserve portfolio-ready records consistently across projects.

Current interface rule:
- Markdown files are the source of truth.
- Generated HTML files are the human-facing project interface.
- `index.html` is the project dashboard.
- `command.html` is the compact next-instruction block shown above the command prompt.
- `runbook.html` is the operating-procedure block shown below the command prompt.
- `reports/` is the user-facing progress record, similar to a report-oriented devlog.

````text
You are working inside an existing local project. Adopt the shared Codex orchestration interface for this project.

Goal:
- Create or update `docs/orchestration/*` so Codex can quickly resume and manage this project later.
- Add an Orchestration Interface section to the root `AGENTS.md` if it exists, without deleting or replacing existing project-specific agent rules.
- Preserve existing project meaning, decisions, verification notes, task state, reports, and development history.
- Keep Markdown files as the source of truth. HTML files may be generated as readable dashboards or reports, but should not replace the Markdown originals.
- Treat generated HTML as an interface contract, not as random documentation output.
- Do not overwrite useful existing files without first checking their contents.

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
  index.html
  command.html
  runbook.html
  devlog/
  reports/

Recommended extension folders:

docs/orchestration/
  review_prompts/
  review_responses/
  evidence/
  templates/

Optional generated views:

docs/orchestration/
  index.html
  command.html
  runbook.html
  reports/index.html
  devlog/index.html

Core concept:
- `AGENTS.md` is the top-level rulebook Codex must follow in this repository.
- `docs/orchestration/` is the ongoing operating interface where project state, current work, next tasks, decisions, devlogs, reports, evidence, and portfolio material are organized.
- The generated HTML files inside `docs/orchestration/` are the human-facing project interface:
  - `index.html`: project dashboard for current status, verification, blockers, decisions, and progress records.
  - `command.html`: small next-instruction view used immediately above the command prompt.
  - `runbook.html`: repeated commands and operating procedures with short explanations.
- `reports/` is the main user-facing progress history. Use it to explain what changed, what was verified, and what should happen next.
- Existing docs should not be deleted. Summarize or link them from orchestration files when they remain useful.
- If old docs and orchestration docs conflict, preserve the old docs and update orchestration files to clearly state the current source of truth.

Before editing:
1. Inspect existing documentation and project files.
2. Look for likely source documents such as:
   - AGENTS.md
   - README.md
   - docs/CODEX_STATUS.md
   - docs/STATUS.md
   - docs/CURRENT_TASK.md
   - docs/NEXT_TASKS.md
   - docs/DEV_LOG.md
   - docs/devlog/
   - docs/reports/
   - docs/PROMPT_DECISION_LOG.md
   - docs/DECISIONS.md
   - docs/adr/
   - docs/review_prompts/
   - docs/review_responses/
   - test logs, QA outputs, screenshots, benchmark results, playtest logs, generated reports
3. Report what you found and how you will map it into the new interface.

AGENTS.md adoption rule:
- Do not replace the existing `AGENTS.md`.
- Add only a concise `## Orchestration Interface` section, unless the file already has an equivalent section.
- That section should tell Codex:
  - this project uses `docs/orchestration/` as the shared management interface,
  - what files to read before meaningful work,
  - which orchestration files to update after meaningful work,
  - that Markdown is the source of truth,
  - that generated HTML is the human-facing project interface generated from Markdown,
  - and that existing project-specific AGENTS rules still take priority.

Suggested `AGENTS.md` section:

```md
## Orchestration Interface

This project uses `docs/orchestration/` as the shared Codex project-management interface.

Before meaningful work, read:

1. `docs/orchestration/README.md`
2. `docs/orchestration/STATUS.md`
3. `docs/orchestration/CURRENT_TASK.md`
4. `docs/orchestration/NEXT_TASKS.md`
5. `docs/orchestration/PROMPT_CONTEXT.md`
6. `docs/orchestration/RUNBOOK.md`
7. `docs/orchestration/SCOPE_GUARD.md`

Use orchestration files as follows:

- `PROJECT_BRIEF.md`: project identity, goals, tech stack, and portfolio framing.
- `STATUS.md`: whole-project current state, latest verification, blockers, and next major step.
- `CURRENT_TASK.md`: one active work unit, done criteria, related files, open questions, and verification commands.
- `NEXT_TASKS.md`: top five next work candidates only.
- `PROMPT_CONTEXT.md`: stable context Codex should keep in mind each session.
- `RUNBOOK.md`: commands and procedures for test, build, report, package, deploy, and recovery.
- `SCOPE_GUARD.md`: explicit non-goals and things not to build yet.
- `DECISION_LOG.md`: index of important technical, product, and AI-direction decisions.
- `devlog/`: internal daily work log.
- `reports/`: user-facing progress record and portfolio-facing work-unit reports.
- `review_prompts/`: prompts prepared for Claude/GPT/Codex review.
- `review_responses/`: saved AI review responses.
- `evidence/`: useful test outputs, screenshots, logs, benchmark summaries, or links.
- `templates/`: reusable document, report, review, and task templates.
- `index.html`: generated project dashboard for people.
- `command.html`: generated next-instruction block for the command area.
- `runbook.html`: generated operating-procedure block.

After meaningful work:

- Update `STATUS.md`, `CURRENT_TASK.md`, or `NEXT_TASKS.md` as needed.
- Record internal process details in `devlog/YYYY-MM-DD.md`.
- Record user-facing progress in `reports/YYYY-MM-DD.md` or in a dated report file with task/commit sections.
- Record durable decisions in `DECISION_LOG.md`.
- Keep `NEXT_TASKS.md` short, usually no more than five active candidates.
- Keep Markdown as the source of truth; regenerate HTML interface files after meaningful Markdown updates.
- Do not delete legacy docs during adoption; summarize or link them from orchestration files.
```

Migration and adoption rules:
- `README.md` explains the orchestration interface and the reading/writing order.
- `PROJECT_BRIEF.md` captures project identity, goals, tech stack, target users, current phase, and portfolio angle.
- `STATUS.md` is the whole-project current state: current version/build, latest verification, current result, blockers, and next major step.
- `CURRENT_TASK.md` is one active work unit: goal, why now, done criteria, related files, open questions, verification commands, and do-not-touch notes.
- `NEXT_TASKS.md` should stay short, usually the top five candidates. Move old history into `devlog/`, decisions into `DECISION_LOG.md`, and evidence into `evidence/`.
- `PROMPT_CONTEXT.md` summarizes stable Codex context and project-specific workflow expectations. It does not replace `AGENTS.md`.
- `RUNBOOK.md` contains the practical commands and recovery procedures Codex or the user should run.
- `SCOPE_GUARD.md` contains explicit non-goals, forbidden expansions, and scope boundaries.
- `DECISION_LOG.md` is an index of durable decisions. Link to ADRs, reports, reviews, or evidence instead of duplicating everything.
- `devlog/` is the internal black box. Use date-based files such as `devlog/YYYY-MM-DD.md` when the project needs private process detail.
- `reports/` is the user-facing progress record. It can work like a report-oriented devlog: daily files, commit/task sections, or both. Keep reports clear enough for the user to understand what happened, what was verified, and what should happen next.
- `review_prompts/` and `review_responses/` store AI handoff prompts and saved responses.
- `evidence/` stores or links useful test outputs, screenshots, logs, benchmark summaries, playtest outputs, generated QA summaries, or other proof.
- `templates/` stores reusable document/report/review/task templates.

Generated HTML interface rule:
- Markdown is the source of truth.
- Generate `docs/orchestration/index.html` as the main project dashboard.
- Generate `docs/orchestration/command.html` as the compact next-instruction block.
- Generate `docs/orchestration/runbook.html` as the operating-procedure block.
- The project dashboard should not be a raw Markdown dump. Prefer sections such as:
  - current state
  - latest verification
  - blockers
  - current task
  - recent decisions
  - recent progress reports from `reports/`
- `command.html` should be short and readable. It should answer: what should the user tell Codex to do next?
- `runbook.html` should explain repeated commands briefly, then show the command snippets from `RUNBOOK.md`.
- Do not show risk badges, scanner warnings, report-send controls, or interface file checklists in the main project dashboard unless the project explicitly asks for them.
- Interface completion checks can exist, but they should be collapsed or secondary.
- Do not hand-edit generated HTML unless the project explicitly uses HTML as the source.
- If a generator script exists, use it. If no generator exists, create or update the Markdown sources first, then describe the intended generated HTML files.

Safety rules:
- Do not delete old documentation.
- Do not overwrite useful existing files.
- If a target orchestration file exists, read it first and merge carefully.
- Do not run destructive Git or filesystem commands.
- Keep local/private paths out of portfolio-facing reports unless the project already intentionally includes them.
- If unsure whether to copy a large artifact into `evidence/`, prefer a short summary file that links to the original location.

After editing:
- Summarize changed files.
- Explain what legacy documents were mapped into which orchestration files.
- List anything uncertain or not migrated.
- Verify by reading the new `docs/orchestration/README.md`, `STATUS.md`, `CURRENT_TASK.md`, and `NEXT_TASKS.md`.
- Leave a short devlog entry under `docs/orchestration/devlog/YYYY-MM-DD.md`.
- If the project has report generation or dashboard scripts, run the relevant check/generation commands. Otherwise, clearly state that no generator exists yet.
````
