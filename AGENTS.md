# AGENTS.md

This file defines how AI coding agents should work in this repository.

The project is both a local-first AI Project Orchestrator and a portfolio artifact that demonstrates practical AI-assisted development operations. Treat the development process itself as part of the product evidence.

## Project Mission

AI Project Orchestrator is a local-first dashboard for managing multiple development projects assisted by Codex or other AI agents.

The MVP should:

- Run locally from `localhost`.
- Register local project folders.
- Read Git and file signals without destructive actions.
- Detect risks and likely next tasks.
- Generate useful Codex prompts without requiring paid AI APIs.
- Show the actual dashboard first, not a landing page.
- Preserve portfolio evidence of AI collaboration decisions.

## Operating Principles

- Read relevant project documents before making changes.
- Surface uncertainty instead of silently guessing.
- Ask only when the answer cannot be discovered locally and a wrong assumption would be risky.
- Prefer the smallest change that solves the current task.
- Do not perform unrelated refactors, formatting churn, or drive-by cleanup.
- Do not revert user changes unless the user explicitly asks.
- Before editing files, state what will be edited and why.
- After implementation, report what changed, how it was verified, and what should happen next.

## Karpathy-Inspired AI Coding Guardrails

Use these guardrails during implementation, review, and refactoring.

### 1. Think Before Coding

Do not assume. Do not hide confusion. Surface tradeoffs.

Before implementing:

- State assumptions explicitly.
- If uncertain, ask.
- If multiple interpretations exist, present them instead of silently choosing one.
- If a simpler approach exists, say so.
- Push back when the requested path appears risky, overcomplicated, or misaligned with the project goal.
- If something is unclear, stop, name what is confusing, and ask.

### 2. Simplicity First

Write the minimum code that solves the problem. Add nothing speculative.

Rules:

- Do not add features beyond what was asked.
- Do not create abstractions for single-use code.
- Do not add flexibility, configuration, or extension points that were not requested.
- Do not add error handling for impossible scenarios.
- If a solution is much longer than it needs to be, simplify it before finishing.
- Ask: would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes

Touch only what must be touched. Clean up only your own mess.

When editing existing code:

- Do not improve adjacent code, comments, or formatting unless it is required for the task.
- Do not refactor things that are not broken.
- Match the existing style, even if another style seems preferable.
- If unrelated dead code is noticed, mention it instead of deleting it.

When a change creates orphans:

- Remove imports, variables, functions, or files made unused by this change.
- Do not remove pre-existing dead code unless explicitly asked.

Test:

- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Transform tasks into verifiable goals and loop until verified.

Examples:

- "Add validation" means define invalid inputs, add or update checks, and verify they fail safely.
- "Fix the bug" means reproduce or identify the failure, patch it, and verify the fix.
- "Refactor X" means preserve behavior and run relevant checks before reporting completion.

For multi-step tasks, state a brief plan:

```text
1. <step> -> verify: <check>
2. <step> -> verify: <check>
3. <step> -> verify: <check>
```

Strong success criteria let the agent continue independently. Weak criteria such as "make it work" require clarification or a proposed interpretation before coding.

## Command Rules

Allowed discovery commands include:

- `git status --short`
- `git diff --stat`
- `git diff`
- `git log --oneline -n 10`
- `rg`
- `rg --files`
- `Get-ChildItem`
- `Get-Content`

Common project commands, once the app exists:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`

Commands that require explicit user approval:

- `git reset --hard`
- `git checkout --`
- `git clean`
- `git push --force`
- `Remove-Item -Recurse`
- deleting, moving, or overwriting large sets of files
- modifying files outside this workspace

Never run destructive Git or filesystem commands automatically.

## Commit Convention

Use Conventional Commits with Korean descriptions allowed.

Format:

```text
type(scope): Korean or English summary
```

Preferred types:

- `feat`: new user-facing feature
- `fix`: bug fix
- `docs`: documentation-only change
- `style`: formatting or visual-only change with no logic impact
- `refactor`: code restructuring without behavior change
- `test`: test additions or updates
- `chore`: maintenance that does not affect product behavior
- `build`: build system or dependency changes
- `ci`: CI configuration
- `perf`: performance improvement

Examples:

```text
feat(scanner): 프로젝트 Git 상태 스캔 추가
fix(api): 없는 프로젝트 경로 처리 오류 수정
docs(agents): AI 작업 규칙과 보고 기준 추가
chore(setup): Vite와 Express 초기 설정
```

Before preparing a commit, report:

- changed files
- behavioral summary
- verification performed
- remaining risks or unverified items

## Naming Rules

Use these defaults unless the codebase establishes a stronger local convention:

- React components: `PascalCase`, for example `ProjectCard.tsx`
- TypeScript types and interfaces: `PascalCase`
- functions and variables: `camelCase`
- utility files: `camelCase.ts`, for example `projectScanner.ts`
- route paths: plural REST paths, for example `/api/projects`
- JSON fields: `camelCase`
- project ids and slugs: `kebab-case`

## Documentation System

Prefer the shared orchestration interface for project handoff documents:

- `docs/orchestration/README.md`: how to read and maintain the interface
- `docs/orchestration/PROJECT_BRIEF.md`: project identity, goals, stack, and portfolio angle
- `docs/orchestration/STATUS.md`: current project state, latest verification, blockers, and next major step
- `docs/orchestration/CURRENT_TASK.md`: active work unit, done criteria, related files, and verification commands
- `docs/orchestration/NEXT_TASKS.md`: top upcoming task candidates, usually limited to five
- `docs/orchestration/PROMPT_CONTEXT.md`: stable Codex context, rules, workflow, and recurring commands
- `docs/orchestration/RUNBOOK.md`: command and operating procedures
- `docs/orchestration/SCOPE_GUARD.md`: explicit non-goals and scope limits
- `docs/orchestration/DECISION_LOG.md`: index of important technical and AI-direction decisions
- `docs/orchestration/devlog/`: internal work traces
- `docs/orchestration/reports/`: external/user-facing or portfolio-facing reports

Recommended orchestration extensions:

- `docs/orchestration/review_prompts/`: prompts sent to other AI reviewers
- `docs/orchestration/review_responses/`: responses received from AI reviewers
- `docs/orchestration/evidence/`: test output, screenshots, logs, benchmark results, and QA artifacts
- `docs/orchestration/templates/`: reusable report, task, review, and AGENTS templates

Treat AGENTS.md templates as repository templates first. Promote them to a reusable Codex skill only after the workflow is stable across multiple projects.

Keep these documents current:

- `docs/CODEX_STATUS.md`: current implementation state, known issues, and verification notes
- `docs/NEXT_TASKS.md`: prioritized next tasks
- `docs/DEV_LOG.md`: index of implementation logs
- `docs/AI_USAGE_PORTFOLIO.md`: curated portfolio narrative about AI collaboration
- `docs/PROMPT_DECISION_LOG.md`: index of prompt and decision records
- `docs/ai-collaboration/YYYY-MM-DD/*.md`: detailed AI collaboration records by task

These existing documents remain valid as compatibility documents until their contents are migrated or mirrored into `docs/orchestration/*`.

Do not dump every conversation into portfolio docs. Curate only decisions that show useful AI collaboration skill.

Record a prompt or decision when:

- the user clarified the real problem behind a task
- the user constrained AI behavior to avoid risk
- the user rejected or redirected an AI suggestion
- a reusable workflow, rule, or reporting structure was created
- the decision can later support a portfolio explanation

Skip records for:

- simple typo fixes
- routine file edits
- repeated confirmations
- low-value implementation chatter

## Development Log Unit

Logs should be task-based, not full-day diaries.

Good log units:

- project setup
- Git scanner
- project registration API
- risk scoring
- prompt generator
- dashboard project cards
- report generation
- portfolio mode

Each log should include:

- goal
- work performed
- problem encountered
- resolution
- result
- verification
- next task

## User Reporting Contract

For each meaningful work unit, report in this shape:

```text
작업 완료: <작업명>

한 일:
- ...

문제와 해결:
- ...

결과:
- ...

검증:
- ...

다음 작업:
- ...
```

If a bug or blocker appears during work, include what happened, how it was diagnosed, and how it was resolved. If verification could not be run, say that plainly.

## Korean User Report

Maintain a Korean user-facing report separately from the agent-facing Markdown documents.

Default report path:

- `docs/reports/latest-status.html`
- `docs/reports/index.html`
- `docs/reports/YYYY-MM-DD/*.html`

The report should stay short and readable for the user. Use this structure:

- `어떤 작업`: what work unit was completed
- `진행 내용`: notable issues, bugs, conflicts, or decisions during the work
- `결과`: final outcome and verification
- `참고 문서`: links to relevant Markdown documents

Do not turn this report into a full development diary. Keep detailed records in `docs/DEV_LOG.md` and `docs/ai-collaboration/YYYY-MM-DD/*.md`.

## Discord Report Direction

Discord reports should be short summaries, not full logs.

Preferred flow:

- write detailed records locally in Markdown
- update `docs/reports/latest-status.html` as the user-facing Korean summary
- keep dated HTML reports under `docs/reports/YYYY-MM-DD/*.html` for larger work units
- update `docs/reports/index.html` when adding dated reports
- send the Korean summary to Discord with `npm run report:discord`
- send the Discord embed first, then send the HTML report file as a follow-up message so it appears below the summary
- use `npm run report:discord:snapshot` only when a compact live scan report is requested
- use `GET /api/report` as the source for scan-based reports
- use `.env` for `DISCORD_WEBHOOK_URL`
- keep `.env` out of Git
- use `.env.example` to document required variables

Discord does not render arbitrary HTML as a report. Send a Markdown/embed summary derived from the HTML report and attach the HTML file for later reading.
