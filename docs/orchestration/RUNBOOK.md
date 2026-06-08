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

## Central Discord Report Intake

```powershell
$body = @{
  projectId = "lethe-prototype"
  reportPath = "20260608/units/2026-06-08-10-오케스트레이션-리포트와-개발로그-실제-마이그레이션.html"
  dryRun = $true
  attachHtml = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:4317/api/orchestration/discord-report" `
  -Method POST `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

Actual send uses the same body with `dryRun = $false` or without `dryRun`:

```powershell
$body = @{
  projectId = "lethe-prototype"
  reportPath = "20260608/units/latest-report.html"
  attachHtml = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:4317/api/orchestration/discord-report" `
  -Method POST `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
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

## Build Orchestration HTML Dashboard

Build this project's generated dashboard:

```powershell
npm run orchestration:dashboard
```

Build a dashboard for one registered or external project:

```powershell
npm run orchestration:dashboard -- --target "C:\path\to\project"
```

Build dashboards for every project registered in `data/projects.json`:

```powershell
npm run orchestration:dashboard -- --all
```

The generated human-facing files are written under `docs/orchestration/interface/` inside each target project. Markdown state remains the source of truth under `docs/orchestration/state/`; regenerate the HTML after meaningful Markdown updates.
