# Runbook

## Preflight

```powershell
git status --short
git diff --stat
```

## Build

```powershell
npm run build
```

## Lint

```powershell
npm run lint
```

## Test

```powershell
npm run test
```

## Discord Dry Run

```powershell
npm run report:discord:unit:dry
```

## Reporting

- Update internal notes in `docs/orchestration/devlog/`.
- Update user-facing summaries in `docs/orchestration/reports/` or the existing `docs/reports/` compatibility path.
- Keep `.env` out of Git.

## Install Orchestration Interface In Another Project

Use this for a new or lightly documented project. For an active project with many existing docs, prefer the migration prompt at `docs/orchestration/templates/EXISTING_PROJECT_MIGRATION_PROMPT.md` so AI can map existing meaning into the new interface.

Dry run:

```powershell
npm run orchestration:install -- --target "C:\path\to\project" --dry-run
```

Create missing orchestration files and folders:

```powershell
npm run orchestration:install -- --target "C:\path\to\project"
```

Create missing orchestration files and a root `AGENTS.md` when the target project does not already have one:

```powershell
npm run orchestration:install -- --target "C:\path\to\project" --with-agents
```

## Migrate An Existing Project With AI

For a project that already has documentation and work history:

1. Open `docs/orchestration/templates/EXISTING_PROJECT_MIGRATION_PROMPT.md`.
2. Start Codex in the target project.
3. Paste the prompt and let Codex inspect existing docs before editing.
4. Review the proposed mapping before allowing broad changes.
5. Keep old docs until the migrated interface is verified.
