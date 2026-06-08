# Current Task

## Task

Show orchestration interface status in the dashboard.

## Goal

- Add scanner support for `docs/orchestration/*` required core and recommended extension paths.
- Show required orchestration file/folder status in the selected project detail view.
- Keep existing legacy document checks visible as compatibility signals.

## Done Criteria

- `GET /api/snapshots` includes `files.orchestration`.
- Dashboard shows required core completion count and per-file status.
- Dashboard shows recommended extension completion in a collapsed section.
- `needsDocs` includes incomplete required orchestration documents.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`

## Verification

- Run `npm run build`.
- Run `GET /api/snapshots` and confirm `files.orchestration.requiredPresent` and `requiredTotal`.
