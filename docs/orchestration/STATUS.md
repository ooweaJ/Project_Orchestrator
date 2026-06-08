# Status

## Current State

- MVP app exists with a React dashboard and Express backend.
- Project registration, local Git scanning, scanner signals, risk scoring, prompt generation, portfolio mode, and Discord report prototype are implemented.
- The orchestration interface standard is being expanded from the original six-role document set.
- `npm run orchestration:install` now scaffolds the default orchestration interface into another local project without overwriting existing files.

## Latest Verification

- `npm run build` verified earlier MVP setup and dashboard changes.
- Current documentation and install-command updates have been checked by file review.
- `npm run orchestration:install -- --target . --dry-run` passed.

## Blockers

- Browser visual QA is still pending.
- Real project path validation for LETHE and SoulLike is still pending.

## Next Major Step

Implement dashboard and backend support for detecting and scaffolding the expanded `docs/orchestration/*` interface.
