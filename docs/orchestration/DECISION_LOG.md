# Decision Log

This file indexes important technical and AI-direction decisions. Use separate ADR files only when a decision needs deeper context.

## Decisions

### 2026-06-05: Standard orchestration document interface

- Decision: Use `docs/orchestration/*` as the shared document contract for portfolio projects.
- Context: Per-project profile mappings are useful as a migration fallback, but should not be the primary design.
- Reference: `docs/ai-collaboration/2026-06-05/03-project-document-interface-profile-mapping.md`

### 2026-06-08: Expanded interface with operations and evidence

- Decision: Expand the interface with `README.md`, `STATUS.md`, `RUNBOOK.md`, `SCOPE_GUARD.md`, `devlog/`, and evidence-oriented extension folders.
- Context: LETHE feedback showed that current state, verification, AI handoff, scope limits, and evidence records are essential for reliable continuation.
- Result: Required core documents cover day-to-day operation; recommended extensions improve review quality and automation.
