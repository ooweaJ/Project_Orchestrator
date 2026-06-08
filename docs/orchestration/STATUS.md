# Status

## Current State

- MVP app exists with a React dashboard and Express backend.
- Project registration, local Git scanning, scanner signals, risk scoring, prompt generation, portfolio mode, and Discord report prototype are implemented.
- The orchestration interface standard is being expanded from the original six-role document set.
- `npm run orchestration:install` now scaffolds the default orchestration interface into another local project without overwriting existing files.
- The scanner now detects `docs/orchestration/*` required core and recommended extension paths.
- The dashboard now shows an `오케스트레이션 인터페이스` panel for the selected project.

## Latest Verification

- `npm run build` passed after the orchestration dashboard update.
- Current documentation and install-command updates have been checked by file review.
- `npm run orchestration:install -- --target . --dry-run` passed.
- `GET /api/snapshots` returned `requiredPresent: 11`, `requiredTotal: 11`, and `complete: true` for LETHE_Prototype and Project_Orchestrator.

## Blockers

- Browser plugin visual QA is still blocked by a Windows sandbox browser-runtime error.
- SoulLike real project path validation is still pending.

## Next Major Step

Add dashboard actions for copying the install command or existing-project migration prompt.
