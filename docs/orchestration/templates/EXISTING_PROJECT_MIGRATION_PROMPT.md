# Existing Project Development Docs Plugin Adoption Prompt

Use this prompt when an existing project should adopt the shared personal development-docs plugin.

The goal is not to scatter more documentation across the project. The goal is to install one consistent `docs/orchestration/` development-docs plugin so the user and Codex can resume, manage, verify, report, and preserve portfolio-ready records across many projects.

This should feel like a local personal AI plugin:

- People open HTML.
- AI reads Markdown.
- Existing project-management docs are migrated or summarized into orchestration.
- Legacy docs should eventually stop being required as source-of-truth files.
- Old files are not deleted blindly; after migration, they should be archived, linked, or replaced by short pointers only when safe.

## Current Plugin Rule

- `docs/orchestration/interface/` contains the required human-facing HTML interface.
- `docs/orchestration/state/` contains the AI-facing Markdown source of truth.
- `docs/orchestration/reports/` contains user-facing HTML progress reports. The normal development-journal surface is a date folder `index.html`, for example `reports/20260608/index.html`.
- `docs/orchestration/reports/YYYYMMDD/units/` may contain detailed unit reports or attachable HTML, but the project dashboard should list the date `index.html` pages first.
- `docs/orchestration/reports/index.html` is the blog-like report index. It lists date report pages newest-first, links to `reports/YYYYMMDD/index.html`, and should not list every unit report as the main navigation.
- `docs/orchestration/devlog/` contains AI/internal Markdown process logs, usually appended by date.
- `docs/orchestration/templates/HTML_INTERFACE_TEMPLATE.md` describes the LETHE-derived HTML format that other projects should follow.
- Existing docs outside orchestration should be migrated, summarized, or archived so future work can start from `docs/orchestration/`.
- Discord delivery should be delegated to Project Orchestrator when available. Projects prepare or submit a short Korean summary plus a report path; Project Orchestrator owns the shared `.env` webhook and sends the Discord embed first, then the HTML report attachment.
- The central Discord submission function is Project Orchestrator's `POST /api/orchestration/discord-report`. Migrated projects should call or document that endpoint instead of sending Discord webhooks directly.
- Migrated projects should record the exact Discord handoff in their own runbook: keep `DISCORD_WEBHOOK_URL` only in Project Orchestrator, keep the report HTML under `docs/orchestration/reports/`, then submit `projectId`, report path, and attachment preference to the Orchestrator endpoint.

````text
You are working inside an existing local project. Adopt the shared personal development-docs plugin for this project.

Goal:
- Create or update `docs/orchestration/` so the project has a reusable local development-docs plugin.
- Add a Development Docs Plugin section to the root `AGENTS.md` if it exists, without deleting or replacing existing project-specific agent rules.
- Migrate useful existing project-management documents into the orchestration structure.
- Preserve existing project meaning, decisions, verification notes, task state, reports, and development history.
- Make legacy docs outside orchestration no longer necessary for normal project resume.
- Keep AI-facing Markdown concise and structured.
- Keep human-facing views in HTML.
- Use `docs/orchestration/templates/HTML_INTERFACE_TEMPLATE.md` as the format reference for project dashboard, next instruction, runbook, and report-list pages.
- Do not overwrite or delete useful existing files without first checking their contents.

Required target structure:

docs/orchestration/
  README.md
  interface/
    index.html
    command.html
    runbook.html
  state/
    PROJECT_BRIEF.md
    STATUS.md
    CURRENT_TASK.md
    NEXT_TASKS.md
    PROMPT_CONTEXT.md
    RUNBOOK.md
    SCOPE_GUARD.md
    DECISION_LOG.md
  devlog/
    YYYY-MM-DD.md
  reports/
    index.html
    YYYYMMDD/
      index.html
      units/
        YYYY-MM-DD-NN-slug.html

Recommended extension folders:

docs/orchestration/
  evidence/
  review_prompts/
  review_responses/
  templates/
    HTML_INTERFACE_TEMPLATE.md
  legacy/

Optional folders:

docs/orchestration/
  reports/source/
  reports/assets/
  devlog/archive/

Core concept:
- `AGENTS.md` is still the repository-level rulebook Codex must follow.
- `docs/orchestration/` is the local development-docs plugin.
- `interface/` is for people:
  - `interface/index.html`: project status dashboard. It should be short and should not explain the interface.
  - `interface/command.html`: compact next-instruction block. It answers what the user should tell Codex next.
  - `interface/runbook.html`: operating-procedure block. It shows repeated commands and recovery steps.
- `state/` is for AI:
  - short current-state Markdown files,
  - stable workflow context,
  - decisions,
  - scope guard,
  - active task and next task candidates.
- `reports/` is for people:
  - a date-folder `index.html` journal that reads like a blog page for that day,
  - a root `reports/index.html` page that lists date journals newest-first like a blog archive,
  - detailed user-facing HTML work-unit reports under `YYYYMMDD/units/` when useful,
  - portfolio-ready summaries,
  - unit pages linked from the relevant date page, not treated as the primary report list,
  - date pages that show their own unit entries so people can drill down from date -> work unit.
- `templates/HTML_INTERFACE_TEMPLATE.md` is the shared human-facing format contract. Use it to make other projects look and behave like the LETHE HTML interface without copying LETHE-specific content.
- `devlog/` is for AI/internal continuity:
  - date-based Markdown logs,
  - append new entries in chronological order,
  - keep enough detail for AI to resume without reading every HTML report.
- Existing docs should be migrated into `state/`, `devlog/`, `reports/`, `evidence/`, or `legacy/`.
- After migration, old docs outside orchestration should not be needed for normal Codex resume.
- When the project needs Discord notification, do not store per-project Discord webhook secrets by default. Submit the finished Korean summary and report path to Project Orchestrator's central intake API or documented CLI/script, then let Project Orchestrator send the Discord message and attach the HTML report.
- The preferred central intake call is:

```powershell
$body = @{
  projectId = "<registered-project-id>"
  reportPath = "YYYYMMDD/index.html"
  attachHtml = $true
  dryRun = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:4317/api/orchestration/discord-report" `
  -Method POST `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

Use `dryRun = $true` first to confirm the selected project, Discord embed payload, and HTML attachment path. For the real send, remove `dryRun` or set it to `$false`.

`reportPath` is relative to `docs/orchestration/reports/`, so a daily report usually looks like `20260609/index.html`. A unit report attachment can use a path like `20260609/units/2026-06-09-02-short-slug.html`.

If Project Orchestrator is calling from its own UI for a known project, the project-scoped equivalent is:

```text
POST /api/projects/<registered-project-id>/discord-report
```

Before editing:
1. Inspect existing documentation and project files.
2. Look for likely source documents such as:
   - `AGENTS.md`
   - `README.md`
   - `docs/CODEX_STATUS.md`
   - `docs/STATUS.md`
   - `docs/CURRENT_TASK.md`
   - `docs/NEXT_TASKS.md`
   - `docs/DEV_LOG.md`
   - `docs/devlog/`
   - `docs/reports/`
   - `docs/PROMPT_DECISION_LOG.md`
   - `docs/DECISIONS.md`
   - `docs/adr/`
   - `docs/review_prompts/`
   - `docs/review_responses/`
   - test logs, QA outputs, screenshots, benchmark results, playtest logs, generated reports
3. Report what you found and how it maps into the new structure.
4. Identify which legacy docs can become archived/pointer-only after migration.

AGENTS.md adoption rule:
- Do not replace the existing `AGENTS.md`.
- Add only a concise `## Development Docs Plugin` section, unless the file already has an equivalent section.
- Existing project-specific AGENTS rules still take priority.
- That section should tell Codex:
  - this project uses `docs/orchestration/` as the shared management interface,
  - what AI-facing state files to read before meaningful work,
  - which files to update after meaningful work,
  - that people-facing HTML lives under `docs/orchestration/interface/` and `docs/orchestration/reports/`,
  - that AI-facing Markdown lives under `docs/orchestration/state/` and `docs/orchestration/devlog/`,
  - that legacy docs outside orchestration should not be treated as the normal source of truth after migration.

Suggested `AGENTS.md` section:

```md
## Development Docs Plugin

This project uses `docs/orchestration/` as the shared personal development-docs plugin. Existing project-specific rules in this `AGENTS.md` remain the top-level rules.

Before meaningful work, read:

1. `docs/orchestration/README.md`
2. `docs/orchestration/state/STATUS.md`
3. `docs/orchestration/state/CURRENT_TASK.md`
4. `docs/orchestration/state/NEXT_TASKS.md`
5. `docs/orchestration/state/PROMPT_CONTEXT.md`
6. `docs/orchestration/state/RUNBOOK.md`
7. `docs/orchestration/state/SCOPE_GUARD.md`

Use orchestration files as follows:

- `interface/index.html`: human-facing status dashboard.
- `interface/command.html`: human-facing next-instruction block.
- `interface/runbook.html`: human-facing operating-procedure block.
- `state/PROJECT_BRIEF.md`: project identity, goals, tech stack, and portfolio framing.
- `state/STATUS.md`: whole-project current state, latest verification, blockers, and next major step.
- `state/CURRENT_TASK.md`: one active work unit, done criteria, related files, open questions, and verification commands.
- `state/NEXT_TASKS.md`: top five next work candidates only.
- `state/PROMPT_CONTEXT.md`: stable context Codex should keep in mind each session.
- `state/RUNBOOK.md`: commands and procedures for test, build, report, package, deploy, and recovery.
- `state/SCOPE_GUARD.md`: explicit non-goals and things not to build yet.
- `state/DECISION_LOG.md`: index of important technical, product, and AI-direction decisions.
- `devlog/`: AI/internal daily work log.
- `reports/`: user-facing HTML progress reports. Keep the readable development journal in date folders such as `reports/20260608/index.html`; keep `reports/index.html` as a blog-like newest-first date archive; place detailed unit reports under that date's `units/` folder when useful.
- `evidence/`: useful test outputs, screenshots, logs, benchmark summaries, or links.
- `review_prompts/`: prompts prepared for Claude/GPT/Codex review.
- `review_responses/`: saved AI review responses.
- `templates/`: reusable document, report, review, and task templates.
- `legacy/`: archived or pointer-only legacy docs after migration.

After meaningful work:

- Update the relevant files under `docs/orchestration/state/`.
- Append AI/internal process detail to `docs/orchestration/devlog/YYYY-MM-DD.md`.
- Add or regenerate the user-facing date journal under `docs/orchestration/reports/YYYYMMDD/index.html`.
- Add or regenerate `docs/orchestration/reports/index.html` so it lists date journal pages newest-first like a compact blog archive.
- In each `reports/YYYYMMDD/index.html`, list that date's unit reports from `reports/YYYYMMDD/units/*.html` as clickable work-unit entries.
- Add detailed unit HTML under `docs/orchestration/reports/YYYYMMDD/units/` only when a separate attachable or portfolio work-unit page is useful.
- Record durable decisions in `docs/orchestration/state/DECISION_LOG.md`.
- Keep `state/NEXT_TASKS.md` short, usually no more than five active candidates.
- Regenerate or update `interface/` HTML when state changes.
- If Discord notification is needed, submit the report payload/path to Project Orchestrator's central Discord intake instead of sending directly from this project.
- Do not depend on legacy docs outside orchestration unless they are explicitly referenced as archived evidence.
```

Migration and adoption rules:
- `README.md` explains the orchestration interface and reading/writing order.
- `state/PROJECT_BRIEF.md` captures project identity, goals, tech stack, target users, current phase, and portfolio angle.
- `state/STATUS.md` is the whole-project current state: current version/build, latest verification, current result, blockers, and next major step.
- `state/CURRENT_TASK.md` is one active work unit: goal, why now, done criteria, related files, open questions, verification commands, and do-not-touch notes.
- `state/NEXT_TASKS.md` should stay short, usually the top five candidates.
- `state/PROMPT_CONTEXT.md` summarizes stable Codex context and workflow expectations. It does not replace `AGENTS.md`.
- `state/RUNBOOK.md` contains practical commands and recovery procedures.
- `state/SCOPE_GUARD.md` contains explicit non-goals, forbidden expansions, and scope boundaries.
- `state/DECISION_LOG.md` is an index of durable decisions. Link to reports, reviews, evidence, or legacy archive entries instead of duplicating everything.
- `devlog/` is AI/internal continuity. Date-based files can be appended in order, but do not let one file become the only source of truth.
- `reports/` is people-facing. Prefer a date-folder HTML journal at `reports/YYYYMMDD/index.html`. If a generator requires Markdown input, keep that input under `reports/source/`, not as the primary human surface.
- `reports/index.html` is the blog-like archive page. It should list date report pages newest-first, show a short title/date/summary for each date, and link to `reports/YYYYMMDD/index.html` rather than flattening every `units/` page into the main list.
- `reports/YYYYMMDD/index.html` is the date page. It should read like a blog entry for that date and include a clickable list of that date's unit reports under `reports/YYYYMMDD/units/*.html` when unit pages exist.
- Unit clicks on `reports/YYYYMMDD/index.html` should open the unit detail in a dismissible drawer or overlay panel inside the current page. Do not require a new browser window for normal unit reading.
- `reports/YYYYMMDD/units/` is optional detail storage for separate work-unit pages, Discord attachments, or portfolio drill-down pages.
- `evidence/` stores or links useful test outputs, screenshots, logs, benchmark summaries, playtest outputs, generated QA summaries, or other proof.
- `legacy/` stores migration notes, archived old docs, or pointer files. Legacy docs should not be required for normal resume after migration.
- `templates/HTML_INTERFACE_TEMPLATE.md` should be checked before creating or revising HTML pages.

Legacy migration rules:
- Do not blindly delete old docs.
- Move, summarize, or archive project-management docs into `docs/orchestration/`.
- If old docs are still useful as historical evidence, put them under `docs/orchestration/legacy/` or link them from a legacy index.
- If old docs must stay in their original path for external tooling, replace their contents only when safe with a short pointer to the orchestration location.
- After migration, write a migration map:

```text
docs/orchestration/legacy/MIGRATION_MAP.md
```

The migration map should list:
- old path,
- new orchestration path,
- whether the old file was moved, summarized, archived, linked, or left in place,
- whether it is still a source of truth.

Discord reporting rules:
- Keep detailed records locally in Markdown and HTML first.
- Keep the user-facing Korean report short and readable.
- Prefer `docs/orchestration/reports/YYYYMMDD/index.html` as the main report path for a day.
- Use `docs/orchestration/reports/YYYYMMDD/units/*.html` only for detailed work-unit pages, Discord attachments, or portfolio drill-down pages.
- Submit Discord delivery through Project Orchestrator's central intake when available, using the project id, report path, optional attachment flag, and a short Korean summary.
- Use `POST http://127.0.0.1:4317/api/orchestration/discord-report` as the normal function-style handoff. The minimum body is `projectId`, `reportPath`, and `attachHtml`; use `dryRun: true` before a real send when testing.
- `projectId` must match the id registered in Project Orchestrator's local `data/projects.json`. For LETHE-style projects, use that registered id, for example `lethe` if the Orchestrator project list uses `lethe`.
- `reportPath` must be relative to `docs/orchestration/reports/`, not an absolute filesystem path.
- The project may also submit `reportHtml` or a structured `report` object, but the normal path-based flow is preferred because it keeps the HTML report as the local source of truth.
- Project Orchestrator owns `DISCORD_WEBHOOK_URL` in its `.env`; migrated projects should not duplicate webhook secrets by default.
- Discord should receive a short summary/embed first and the HTML report file as the follow-up attachment when attachment delivery is requested.

Human-facing HTML rule:
- Use `templates/HTML_INTERFACE_TEMPLATE.md` as the visual and structural reference.
- `interface/index.html` is a status dashboard. It should be short.
- It should show current state, latest verification, blocker, next gate, current conclusion, recent completion, and date.
- It should not show long explanations, report-send controls, scanner warnings, interface checklists, or broad document navigation unless explicitly requested.
- `interface/command.html` should show the next instruction, copyable prompt if useful, done criteria, and do-not-touch notes.
- `interface/runbook.html` should show repeated commands and operating procedures.
- `reports/index.html` lists date journal pages newest-first like a compact blog archive, with title, date, short summary, and link to each `reports/YYYYMMDD/index.html`.
- `reports/YYYYMMDD/index.html` is the human-facing daily development journal page and should be the main report page the host dashboard reads. It should also show clickable unit entries for that date when `units/*.html` pages exist.
- `reports/YYYYMMDD/units/YYYY-MM-DD-NN-slug.html` is an optional detailed work-unit report or Discord attachment.
- People should not need to open Markdown for normal review.
- If an existing project already uses root-level `docs/orchestration/index.html`, `command.html`, and `runbook.html`, preserve that layout during migration unless the user explicitly asks to move them into `interface/`. The page roles and format are more important than the folder name during adoption.

AI-facing Markdown rule:
- AI should read `state/` first.
- AI should use `devlog/` for chronological process history.
- AI should use `state/DECISION_LOG.md` for durable decisions.
- AI can read HTML reports when needed, but Markdown state/devlog should be the faster source for resume.
- Keep current-state Markdown short. Move history into `devlog/`, `reports/`, `evidence/`, or `legacy/`.
- Date-based devlogs are acceptable. If a devlog becomes too large, split older entries into `devlog/archive/`.

Generated/hand-authored interface rule:
- If a generator exists, use it to build `interface/` and `reports/` HTML.
- If no generator exists, update AI-facing Markdown first, then update the people-facing HTML manually.
- Do not let HTML become the only AI source of truth unless the project explicitly chooses that.
- Do not hand-edit generated HTML if the project has a generator that will overwrite it.

Safety rules:
- Do not delete old documentation without explicit user approval.
- Do not overwrite useful existing files without reading them first.
- If a target orchestration file exists, read it first and merge carefully.
- Do not run destructive Git or filesystem commands.
- Keep local/private paths out of portfolio-facing reports unless the project intentionally includes them.
- If unsure whether to copy a large artifact into `evidence/`, prefer a short summary file that links to the original location.

After editing:
- Summarize changed files.
- Explain what legacy documents were mapped into which orchestration files.
- List anything uncertain or not migrated.
- Verify by reading:
  - `docs/orchestration/README.md`
  - `docs/orchestration/state/STATUS.md`
  - `docs/orchestration/state/CURRENT_TASK.md`
  - `docs/orchestration/state/NEXT_TASKS.md`
- Leave a short devlog entry under `docs/orchestration/devlog/YYYY-MM-DD.md`.
- If the project has report generation or dashboard scripts, run the relevant check/generation commands. Otherwise, clearly state that no generator exists yet.
````
