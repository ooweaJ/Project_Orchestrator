# Runbook

## Preflight

```powershell
git status --short
git diff --stat
```

## Build

```powershell

```

## Lint

```powershell

```

## Test

```powershell

```

## Report

```powershell

```

## Discord Report

Project Orchestrator should own the Discord webhook secret. Keep `DISCORD_WEBHOOK_URL` in Project Orchestrator's `.env`, not in this project by default.

Send the finished HTML report through Project Orchestrator's central intake:

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

Use `dryRun = $true` first. For the real send, remove `dryRun` or set it to `$false`.

`projectId` must match the id registered in Project Orchestrator. `reportPath` is relative to `docs/orchestration/reports/`, for example `20260609/index.html`.

## Deploy Or Package

```powershell

```
