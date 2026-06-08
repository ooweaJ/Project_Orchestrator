# Classified HTML Dashboard And Document Browser

## Goal

Make the orchestration homepage and generated HTML dashboard easier to use as an operating interface instead of a raw Markdown reader.

## Work Performed

- Removed the duplicated top Markdown document cards from the homepage detail panel.
- Added current task and next instruction summaries directly inside the command panel.
- Reclassified generated `docs/orchestration/index.html` into instruction, status, verification, record, report, and operation sections.
- Added safe project-specific APIs for listing and previewing files under `docs/orchestration/`.
- Added a `개발 문서` browser to the homepage so users can open orchestration files one by one.

## Problem Encountered

- The user needed per-project document access, but a general file preview API would risk reading unintended local files.
- The running dev server had to be restarted before the new API routes were available.

## Resolution

- Restricted previews to supported file types inside each project's `docs/orchestration/` directory.
- Restarted only the existing local dev server process on port `4317`.

## Result

- LETHE_Prototype's generated HTML now uses the classified dashboard layout.
- The homepage can browse LETHE_Prototype's orchestration files directly from the central interface.

## Verification

- `npm run build`
- `npm run orchestration:dashboard -- --all`
- `GET /api/projects/lethe-prototype/orchestration-files` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-file?path=STATUS.md` returned `200 OK`.
- `GET /api/projects/lethe-prototype/orchestration-dashboard` returned `200 OK`.

## Next Task

Add a homepage button to regenerate the selected project's orchestration HTML.
