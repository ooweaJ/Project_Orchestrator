# HTML Interface Template

Use this template as the human-facing format contract for the personal development-docs plugin HTML.

This format is based on the LETHE project dashboard. Other projects should keep the same structure and visual density, but fill the content from their own orchestration state and reports.

## Interface Pages

Place generated or maintained HTML under `docs/orchestration/interface/`.

```text
docs/orchestration/
  interface/
    index.html
    command.html
    runbook.html
  reports/
    index.html
    YYYYMMDD/
      index.html
      units/
        YYYY-MM-DD-NN-slug.html
```

Older projects may still have root-level `docs/orchestration/index.html`, `command.html`, and `runbook.html`. New projects should use the split `interface/` and `state/` layout.

## index.html - Project Dashboard

Purpose: show the project state in about 30 seconds.

Required sections:

- Header:
  - project dashboard eyebrow
  - `상태 요약` title
  - compact phase badge
- Four metric cards:
  - `현재 단계`
  - `최신 검증`
  - `막힌 점`
  - `다음 게이트`
- `현재 결론` hero panel:
  - one short paragraph
- Three summary panels:
  - `이번 목표`
  - `다음 판단`
  - `최근 완료`
- Footer:
  - date or generated timestamp

Do not include:

- risk badges such as `높은 위험`
- scanner warnings
- Discord/report-send controls
- long Markdown dumps
- broad document navigation
- visible interface completion checklist

Interface completion checks may exist in the host dashboard, but should be collapsed or secondary.

## command.html - Next Instruction Block

Purpose: sit above the command prompt and tell the user what to ask Codex next.

Required sections:

- Header:
  - `다음 지시`
  - link back to `index.html`
- Main task card:
  - `Codex에게 지금 시킬 일`
  - one short explanation
  - copyable prompt textarea when useful
- Warning card:
  - `지금 하지 말 것`
  - project-specific scope guard bullets
- Done criteria card:
  - `완료 기준`
- Source document card:
  - links to the state/source Markdown files used to generate the prompt

## runbook.html - Operating Procedures

Purpose: show repeated commands with short explanations.

Required sections:

- Header:
  - `운영 절차`
  - link to `RUNBOOK.md`
- Intro:
  - one sentence explaining that Markdown owns the commands
- Command cards:
  - heading
  - short purpose
  - command code block

Prefer 4-8 command cards. Avoid long manuals.

## reports/index.html - Development Journal List

Purpose: show user-facing progress reports like a report-oriented devlog.

Required sections:

- Header:
  - project journal eyebrow
  - `보고서 목록`
  - one short explanation
- Blog-style date report list:
  - newest first
  - each item links to `reports/YYYYMMDD/index.html`
  - each item includes a date, title, short summary, and optionally a compact verification/result line
  - list date journal pages first, not every `units/` detail page
  - keep the page scannable like a compact blog archive

Reports can be daily, commit-based, or work-unit based. The recommended default is:

```text
docs/orchestration/reports/
  index.html
  20260608/
    index.html
    units/
      2026-06-08-01-short-slug.html
```

The host Project Orchestrator dashboard should read date folder `index.html` pages only, such as `reports/20260608/index.html`. Files under `units/` are detail pages or Discord attachments and should be reachable from the date page, but they should not be the primary journal list.

Each date page should also show its own unit entries when they exist:

```text
reports/20260608/index.html
  -> units/2026-06-08-01-short-slug.html
  -> units/2026-06-08-02-short-slug.html
```

This gives the human flow: report archive -> date page -> unit detail page.

When a date page has unit entries, clicking a unit should open the detail in a dismissible drawer or overlay panel within the same page. Avoid opening a new browser window for normal reading. Provide a clear close/back control and keep the date page visible as the user's place in the archive.

## Discord Report Relationship

- Keep the readable report in `reports/YYYYMMDD/index.html`.
- Keep `reports/index.html` as the archive of date pages.
- Use `reports/YYYYMMDD/units/*.html` when a specific work unit needs an attachable or portfolio drill-down page.
- Submit Discord delivery through Project Orchestrator's central intake when available: `POST /api/orchestration/discord-report`.
- Use `projectId`, `reportPath`, `attachHtml`, and optional `dryRun` in the request body.
- `projectId` is the id registered in Project Orchestrator's local project list.
- `reportPath` is relative to `docs/orchestration/reports/`, for example `20260609/index.html` or `20260609/units/2026-06-09-02-short-slug.html`.
- Keep `DISCORD_WEBHOOK_URL` in Project Orchestrator's `.env`; individual projects should not copy the webhook secret by default.
- Test with:

```json
{
  "projectId": "<registered-project-id>",
  "reportPath": "YYYYMMDD/index.html",
  "attachHtml": true,
  "dryRun": true
}
```

- Discord should receive a short Korean summary/embed first, then the HTML report attachment when requested.

## Source Relationship

- AI reads Markdown/state.
- People open HTML.
- HTML should be regenerated after meaningful state/report changes.
- The daily report page is the normal human review surface.
- Project Orchestrator can use a project's report path or structured payload to send the shared Discord summary and HTML attachment.
- Do not let HTML become the only source of truth unless the project explicitly chooses that.
