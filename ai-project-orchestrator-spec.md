# AI Project Orchestrator

## 1. Purpose

AI Project Orchestrator is a local-first dashboard for managing multiple development projects that are being assisted by Codex or other AI agents.

The goal is not to replace Codex. The goal is to give the developer a command center that can read local project state, detect risks, summarize progress, and generate the next useful AI prompt for each project.

This makes AI-assisted development easier to operate across several projects at once.

## 2. Core Idea

The app runs locally and registers projects by folder path.

Example project paths:

- `C:\Projects\UnrealGame`
- `C:\Projects\WebGamePrototype`

For each project, the app scans local files and Git state, then turns that raw state into an actionable project card.

Each card should answer:

- What is the current state?
- What changed recently?
- What looks risky or blocked?
- What should I ask Codex to do next?
- Does this need commit, test, push, documentation, or review?

## 3. Product Positioning

This is a local AI development command center.

It demonstrates AI usage beyond simple prompt-and-response coding by showing an orchestration workflow:

1. Read multiple project states.
2. Detect important signals.
3. Prioritize what needs attention.
4. Generate focused AI task prompts.
5. Let the developer approve and execute the next action.
6. Track outcomes over time.

Portfolio framing:

> A local-first orchestration dashboard that monitors multiple development projects, detects engineering risks, and turns project state into actionable AI prompts.

## 4. Non-Goals

The first version should not try to fully control Codex threads.

Avoid these in MVP:

- Directly sending prompts to Codex internal threads.
- Running destructive Git commands.
- Automatically fixing project files without user approval.
- Replacing project-specific IDE workflows.
- Calling paid AI APIs by default.

The MVP should be useful even with zero external AI API cost.

## 5. Local-First Requirements

The dashboard must run locally.

Recommended stack:

- Frontend: Vite + React + TypeScript
- Backend: Node.js + Express
- Git access: `simple-git` or direct `git` commands
- Config storage: local JSON file
- Optional future local AI: Ollama

The app should work from `localhost`.

No cloud database is required.
No paid API is required for the MVP.

## 6. Project Registration

Users can add projects by selecting or entering a local folder path.

Each registered project should store:

```json
{
  "id": "lethe-prototype",
  "name": "LETHE Prototype",
  "path": "C:\\Projects\\WebGamePrototype",
  "type": "web-game",
  "tags": ["game", "prototype", "javascript"],
  "importantFiles": [
    "AGENTS.md",
    "README.md",
    "docs/CODEX_STATUS.md",
    "docs/NEXT_TASKS.md",
    "package.json"
  ],
  "createdAt": "2026-06-04T00:00:00.000Z",
  "updatedAt": "2026-06-04T00:00:00.000Z"
}
```

Project type should be optional.

Suggested project types:

- `web`
- `web-game`
- `unity`
- `unreal`
- `portfolio`
- `node`
- `docs`
- `unknown`

## 7. Project Scanner

The scanner reads each registered local project and produces a normalized project snapshot.

### 7.1 Git Signals

Collect:

- Current branch
- Whether the directory is a Git repo
- Working tree status
- Modified files
- Untracked files
- Staged files
- Latest commit hash
- Latest commit message
- Whether upstream exists
- Whether local branch is ahead or behind
- Recent commit list

Important risk rules:

- Uncommitted changes exist.
- Untracked files exist.
- Branch has no upstream.
- Local branch is ahead but not pushed.
- Local branch is behind remote.
- Very large files are present.
- Git LFS may be needed for binary-heavy projects.

### 7.2 File Signals

Collect:

- `AGENTS.md` or `AGENT.md`
- `README.md`
- `package.json`
- `.gitignore`
- `docs/CODEX_STATUS.md`
- `docs/NEXT_TASKS.md`
- Recent files changed by modified time
- TODO/FIXME/BUG comments
- Build or test logs when known

Do not scan the entire repository blindly for huge projects.

Ignore common heavy folders:

- `.git`
- `node_modules`
- `Binaries`
- `Intermediate`
- `Saved`
- `Library`
- `Temp`
- `.vs`
- `.next`
- `dist`
- `build`

### 7.3 Project Type Detection

Detect project type using files:

- Unreal: `*.uproject`
- Unity: `Assets/`, `ProjectSettings/`, `Packages/manifest.json`
- Node/Web: `package.json`
- Portfolio site: `index.html`, `projects.js`, GitHub Pages repo name
- Docs-heavy project: `docs/`, many Markdown files

### 7.4 Task Signals

Detect likely task categories:

- Needs commit
- Needs push
- Needs test
- Needs documentation update
- Needs cleanup
- Needs dependency install
- Blocked by environment
- Blocked by Git/LFS
- Ready for review

## 8. Snapshot Schema

The backend should return project snapshots in a consistent shape.

```json
{
  "id": "ue5-soullike",
  "name": "UE5 SoulLike",
  "path": "C:\\Projects\\UnrealGame",
  "exists": true,
  "type": "unreal",
  "git": {
    "isRepo": true,
    "branch": "main",
    "latestCommit": {
      "hash": "e026227",
      "message": "Add UE-MCP bridge and editor performance settings"
    },
    "hasUpstream": false,
    "ahead": 0,
    "behind": 0,
    "modified": [],
    "staged": [],
    "untracked": [],
    "dirty": false
  },
  "files": {
    "hasAgentsMd": false,
    "hasReadme": true,
    "hasPackageJson": false,
    "hasDocsStatus": false,
    "todoCount": 0,
    "recentFiles": []
  },
  "risks": [
    {
      "level": "high",
      "type": "git-lfs",
      "message": "Unreal binary assets may require Git LFS before push."
    }
  ],
  "recommendedActions": [
    {
      "kind": "codex-prompt",
      "label": "Diagnose Git LFS state",
      "prompt": "먼저 git status, git lfs status, .gitattributes, index.lock 여부를 확인하고 destructive 작업 없이 현재 상태만 요약해줘."
    }
  ],
  "updatedAt": "2026-06-04T00:00:00.000Z"
}
```

## 9. Dashboard UI

The first screen should be the actual dashboard, not a landing page.

Primary sections:

1. Top status bar
2. Global priority summary
3. Project cards
4. Selected project detail panel
5. Prompt composer
6. Activity log

### 9.1 Top Status Bar

Show:

- Number of registered projects
- Number of risky projects
- Number needing commit
- Number needing test
- Last scan time
- Rescan button

### 9.2 Global Priority Summary

Show a short list:

- Today blocked
- Ready to finish
- Needs verification
- Needs commit or push
- Needs documentation

### 9.3 Project Card

Each project card should show:

- Project name
- Local path
- Project type
- Current branch
- Dirty/clean state
- Last commit
- Risk level
- Main recommended action
- Copy prompt button
- Open folder button, optional

### 9.4 Detail Panel

When selecting a project, show:

- Git status
- Recent commits
- Modified files
- Untracked files
- Important docs status
- TODO list
- Generated Codex prompt
- Manual notes

### 9.5 Prompt Composer

The prompt composer generates a focused prompt for Codex.

Prompt types:

- Diagnose
- Continue implementation
- Run verification
- Prepare commit
- Update documentation
- Review changes
- Clean up untracked files

The user can copy the prompt and paste it into a Codex project thread.

Future version may send prompts to Codex threads if a stable integration exists.

## 10. Prompt Generation Rules

Prompt generation should be rule-based in MVP.

No AI API required.

Example prompt for dirty project:

```text
현재 프로젝트 상태를 먼저 확인해줘.

목표:
- 변경 파일을 기능 단위로 요약
- 커밋해도 되는 범위인지 판단
- 테스트/검증이 필요한 항목 제안

주의:
- destructive 명령은 실행하지 마
- 사용자 변경을 되돌리지 마
- 먼저 git status와 주요 diff를 보고 요약해줘
```

Example prompt for Unreal Git LFS risk:

```text
Git LFS 상태를 안전하게 진단해줘.

확인할 것:
- git status
- git lfs status
- .gitattributes
- .git/index.lock 존재 여부
- 큰 Git pack이나 대용량 에셋 여부

주의:
- git reset, checkout, rm 같은 destructive 작업은 하지 마
- migrate나 force push는 먼저 안전성 판단과 계획만 제안해줘
```

Example prompt for docs lag:

```text
현재 구현과 문서가 어긋난 부분을 확인해줘.

확인할 문서:
- README.md
- AGENTS.md
- docs/CODEX_STATUS.md
- docs/NEXT_TASKS.md

결과:
- 오래된 문서 항목
- 수정해야 할 문서
- 바로 반영 가능한 최소 패치 제안
```

## 11. Risk Scoring

Use simple scoring for MVP.

Risk levels:

- `low`
- `medium`
- `high`
- `blocked`

Example scoring:

- Dirty working tree: medium
- Untracked docs: low or medium
- Build/test failure log: high
- No upstream on active project: medium
- Ahead of remote: medium
- Large files in Git: high
- Interrupted task marker: blocked
- Missing README or AGENTS.md: low
- Unreal project without LFS patterns: high

## 12. Portfolio Mode

Portfolio mode hides sensitive local details.

It should:

- Hide full local paths.
- Replace private project names if needed.
- Show summarized risks instead of raw file paths.
- Display orchestration workflow visually.
- Show before/after examples of generated prompts.

Portfolio mode should explain:

- What signals were collected.
- How risks were detected.
- How the dashboard generated next actions.
- How this improved multi-project AI-assisted development.

## 13. MVP API Design

### `GET /api/projects`

Return registered projects.

### `POST /api/projects`

Add project.

Body:

```json
{
  "name": "LETHE Prototype",
  "path": "C:\\Projects\\WebGamePrototype"
}
```

### `DELETE /api/projects/:id`

Remove project from dashboard config.

Do not delete files.

### `GET /api/projects/:id/snapshot`

Scan one project and return snapshot.

### `GET /api/snapshots`

Scan all projects and return snapshots.

### `POST /api/projects/:id/prompt`

Generate a prompt for a project.

Body:

```json
{
  "kind": "diagnose"
}
```

### `GET /api/activity`

Return dashboard activity log.

## 14. Config Files

Recommended local app data:

```text
data/
  projects.json
  snapshots/
    ue5-soullike.json
    lethe-prototype.json
  activity.jsonl
```

`projects.json` stores registered projects.

`snapshots` stores recent scan results.

`activity.jsonl` stores scan and prompt-generation history.

## 15. Implementation Phases

### Phase 1: Static MVP

- Create Vite React app.
- Create Express backend.
- Hardcode 3 project paths.
- Display project cards.
- Run Git status scan.
- Generate basic prompts.

### Phase 2: Project Registration

- Add project form.
- Validate folder exists.
- Persist `projects.json`.
- Add rescan button.
- Add project detail panel.

### Phase 3: Better Scanner

- Detect project type.
- Read AGENTS.md and README summary.
- Count TODO/FIXME.
- Detect recent files.
- Detect large files.
- Detect Git LFS risk.

### Phase 4: Portfolio Mode

- Add sanitized display mode.
- Add orchestration explanation panel.
- Add prompt examples.
- Add local demo data option.

### Phase 5: Optional AI Layer

- Add local LLM summarization with Ollama.
- Keep rule-based fallback.
- Do not require paid API.

### Phase 6: Optional Codex Bridge

- Export prompt intents to JSON.
- Let a Codex master thread read the intents.
- If stable APIs become available, add direct thread integration later.

## 16. First Codex Implementation Prompt

Use this prompt to start implementation:

```text
로컬 AI Project Orchestrator 대시보드를 MVP로 만들어줘.

기술 스택:
- Vite + React + TypeScript frontend
- Node + Express backend
- 로컬 JSON config
- simple-git 또는 git command 기반 프로젝트 스캔

첫 버전 목표:
- 로컬 프로젝트 폴더를 등록할 수 있게 해줘.
- 등록된 프로젝트들의 git status를 읽어 카드로 보여줘.
- 프로젝트 타입을 대략 감지해줘. Unreal, Unity, Node/Web, Portfolio 정도면 돼.
- modified/untracked/staged/latest commit/branch를 보여줘.
- 위험도 low/medium/high/blocked를 rule-based로 계산해줘.
- 각 프로젝트별 다음 Codex 프롬프트를 생성하고 copy 버튼을 제공해줘.
- 외부 AI API는 쓰지 마.
- destructive git 명령은 절대 실행하지 마.

첫 화면은 랜딩 페이지가 아니라 실제 대시보드여야 해.

초기 등록 후보:
- C:\Projects\UnrealGame
- C:\Projects\WebGamePrototype

구현 후:
- 실행 방법을 README에 적어줘.
- 로컬 서버를 띄워서 접속 URL을 알려줘.
```

## 17. Success Criteria

MVP succeeds if:

- User can add a local folder as a project.
- Dashboard shows all registered projects.
- Git status appears correctly.
- Dirty projects are easy to spot.
- Risk level is understandable.
- Generated Codex prompts are useful enough to paste directly.
- No paid AI API is required.
- No destructive command is run automatically.

## 18. Future Vision

Longer term, the app can become a personal AI development operations layer.

Possible future features:

- Local LLM project summaries
- Codex thread intent bridge
- Build/test command registry
- AGENTS.md editor
- Commit plan generator
- Daily project report
- Discord/Notion report export
- Portfolio demo replay
- Multi-project timeline
- AI agent work queue

The important design principle is that the dashboard should reduce decision fatigue.

It should not merely show files. It should help the developer decide what to do next.
