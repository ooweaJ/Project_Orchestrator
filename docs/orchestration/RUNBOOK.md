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
