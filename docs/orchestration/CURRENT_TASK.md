# Current Task

## Task

Show each generated orchestration HTML dashboard inside the homepage.

## Goal

- Serve `docs/orchestration/index.html` for a selected registered project.
- Embed that generated HTML view in the dashboard detail panel.
- Keep Markdown as the source of truth and HTML as the generated view.

## Done Criteria

- The selected project detail view includes an `HTML 대시보드` panel.
- The panel loads `/api/projects/:id/orchestration-dashboard` in the homepage.
- A `새 창` link opens the same generated view directly.
- Missing generated HTML returns a clear fallback message instead of breaking the homepage.

## Related Files

- `server/index.mjs`
- `src/main.tsx`
- `src/styles.css`

## Verification

- `npm run build`
- `GET /api/projects/lethe-prototype/orchestration-dashboard`
- `GET http://127.0.0.1:5173`
