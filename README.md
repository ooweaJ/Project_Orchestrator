# AI Project Orchestrator

여러 개발 프로젝트를 로컬에서 한 번에 확인하고, Codex에게 다음에 시킬 작업 프롬프트를 만들어주는 대시보드입니다.

이 프로젝트의 목적은 단순히 파일 상태를 보여주는 것이 아니라, AI를 활용한 개발 과정을 더 안전하고 체계적으로 운영하는 것입니다.

## 현재 구현 상태

첫 MVP가 실행 가능한 상태입니다.

- Vite + React + TypeScript 프론트엔드
- Node + Express 백엔드
- 로컬 JSON 기반 프로젝트 목록
- 읽기 전용 Git 상태 스캔
- 파일 신호 스캔: 최근 파일, TODO/FIXME/BUG, 대용량 파일
- 위험도와 액션 카테고리 계산
- 프로젝트별 Codex 프롬프트 생성
- 로컬 경로와 파일명을 숨기는 Portfolio Mode
- 대시보드 카드, 상세 패널, 프롬프트 복사 UI

기본 등록 후보는 두 개만 둡니다.

- UE5 SoulLike
- LETHE Prototype

## 실행 방법

```bash
npm install
npm run dev
```

프론트엔드:

```text
http://127.0.0.1:5173
```

백엔드 API:

```text
http://127.0.0.1:4317
```

## 프로젝트 목록 설정

프로젝트 목록은 `data/projects.json`에서 관리합니다.

GitHub에 실제 로컬 경로가 올라가지 않도록 현재 파일에는 예시 경로가 들어 있습니다.

실제 스캔을 하려면 본인 PC의 경로로 바꿔서 사용하면 됩니다.

```json
{
  "name": "LETHE Prototype",
  "path": "C:\\Projects\\WebGamePrototype"
}
```

## 주요 API

- `GET /api/projects`: 등록 프로젝트 목록
- `POST /api/projects`: 프로젝트 추가
- `DELETE /api/projects/:id`: 프로젝트 제거
- `GET /api/projects/:id/snapshot`: 단일 프로젝트 스캔
- `GET /api/snapshots`: 전체 프로젝트 스캔
- `POST /api/projects/:id/prompt`: Codex 프롬프트 생성
- `GET /api/activity`: 활동 로그 조회
- `GET /api/report`: 전체 스캔 기반 요약 보고서 생성

## Portfolio Mode

대시보드 상단의 `Portfolio Mode`를 켜면 로컬 경로, 파일명, TODO 내용, 프로젝트명이 숨겨집니다.

이 모드는 실제 개발 상태를 보여주면서도 포트폴리오나 화면 공유에서 민감한 경로를 노출하지 않기 위한 기능입니다.

## Discord 보고서 전송

사용자용 한글 보고서는 `docs/reports/latest-status.html`에 있습니다.

Discord에는 이 보고서에서 뽑은 요약 embed를 먼저 보내고, HTML 파일을 다음 메시지로 전송합니다.

1. `.env.example`을 참고해서 `.env`를 만듭니다.

```text
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_REPORT_USERNAME=AI Project Orchestrator
```

2. 전송 전에 미리보기 JSON을 확인합니다.

```bash
npm run report:discord:dry
```

3. Discord 웹훅으로 전송합니다.

```bash
npm run report:discord
```

`.env`는 Git에 올라가지 않습니다.

HTML 파일 메시지 없이 embed만 보내고 싶을 때는 직접 스크립트를 실행합니다.

```bash
node scripts/send-discord-report.mjs --no-attach
```

현재 스캔 결과를 기준으로 간단한 Discord 보고서를 만들 수도 있습니다.

```bash
npm run report:discord:snapshot:dry
npm run report:discord:snapshot
```

스냅샷 보고서는 `GET /api/report` 결과를 사용하고, HTML 파일은 첨부하지 않습니다.

## 안전 규칙

스캐너는 읽기 전용 Git 명령만 실행합니다.

자동으로 실행하지 않는 작업:

- `git reset`
- `git checkout`
- `git clean`
- 파일 삭제
- force push
- 프로젝트 파일 자동 수정

## 참고 문서

- `docs/CODEX_STATUS.md`: 현재 구현 상태
- `docs/NEXT_TASKS.md`: 다음 작업
- `docs/DEV_LOG.md`: 작업 단위 개발 로그
- `docs/reports/latest-status.html`: 사용자용 한글 진행 보고서
- `docs/AI_USAGE_PORTFOLIO.md`: AI 활용 능력 정리본
- `docs/PROMPT_DECISION_LOG.md`: 프롬프트/의사결정 기록
