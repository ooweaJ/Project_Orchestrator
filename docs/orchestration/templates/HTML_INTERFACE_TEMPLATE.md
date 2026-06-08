# HTML Interface Template

Use this template as the human-facing format contract for project orchestration HTML.

This format is based on the LETHE project dashboard. Other projects should keep the same structure and visual density, but fill the content from their own orchestration state and reports.

## Interface Pages

Place generated or maintained HTML under `docs/orchestration/`.

```text
docs/orchestration/
  index.html
  command.html
  runbook.html
  reports/
    index.html
    YYYY-MM-DD-NN-slug.html
```

If a project has adopted the newer split layout, the same page roles may live under `docs/orchestration/interface/`. Keep page roles identical.

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
- Report list:
  - newest first
  - each item links to an HTML report
  - include a short date or summary line when available

Reports can be daily, commit-based, or work-unit based. The recommended default is:

```text
docs/orchestration/reports/
  index.html
  2026-06-08-01-short-slug.html
  2026-06-08-02-short-slug.html
```

## Source Relationship

- AI reads Markdown/state.
- People open HTML.
- HTML should be regenerated after meaningful state/report changes.
- Do not let HTML become the only source of truth unless the project explicitly chooses that.

