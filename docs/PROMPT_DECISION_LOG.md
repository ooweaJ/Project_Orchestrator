# Prompt Decision Log

This document is an index of important prompt and decision records.

Do not store every conversation here. Store only curated moments where the user's prompt, clarification, correction, or constraint improved the AI-assisted development process.

Detailed records live in:

```text
docs/ai-collaboration/YYYY-MM-DD/<sequence>-<topic>.md
```

## Selection Criteria

Record a decision when it shows at least one of these:

- problem framing
- AI behavior constraint
- risk reduction
- AI suggestion rejection or redirection
- reusable workflow design
- reporting or verification improvement
- portfolio value

Skip:

- routine implementation messages
- tiny copy edits
- repeated confirmations
- low-signal transcript fragments

## Index

### 2026-06-04

#### Agent Rules And Reporting

- File: `docs/ai-collaboration/2026-06-04/01-agent-rules-and-reporting.md`
- User intent: Set up AI agent rules, commit conventions, development logs, and reporting before starting implementation.
- Key decision: Use `AGENTS.md` for operating rules, but keep portfolio and prompt evidence in separate docs.
- User refinement: Logs should be task-based rather than full-day reports, and should preserve only useful AI collaboration evidence.
- Portfolio value: Demonstrates AI coding harness design and human-in-the-loop workflow management.

#### Karpathy Guardrails Expansion

- File: `docs/ai-collaboration/2026-06-04/01-agent-rules-and-reporting.md`
- User intent: Strengthen the Karpathy-inspired rules in `AGENTS.md` from a short summary into explicit operating instructions.
- Key decision: Use four named guardrails: Think Before Coding, Simplicity First, Surgical Changes, and Goal-Driven Execution.
- User refinement: The user identified that the first draft was too compressed and supplied the more useful rule shape.
- Portfolio value: Demonstrates that the user can audit AI operating rules and improve the harness before coding begins.

### 2026-06-05

#### Action-Oriented Orchestration

- File: `docs/ai-collaboration/2026-06-05/02-risk-prompts-portfolio-report.md`
- User intent: Continue the planned next work and complete risk scoring, prompt generator, portfolio mode, and Discord reporting together.
- Key decision: Represent project state as action categories instead of only broad risk levels.
- User refinement: Keep reports readable and task-based, while preserving portfolio evidence separately.
- Portfolio value: Demonstrates that the user designs AI workflows as operational systems, not isolated prompts.

#### Privacy-Aware Portfolio Mode

- File: `docs/ai-collaboration/2026-06-05/02-risk-prompts-portfolio-report.md`
- User intent: Make the project usable as portfolio evidence without leaking local paths or private file details.
- Key decision: Add Portfolio Mode directly to the dashboard instead of creating a separate static portfolio page.
- User refinement: The portfolio record should preserve strong prompts and design decisions selectively, not every raw message.
- Portfolio value: Shows privacy-aware presentation of AI-assisted development process.

#### Project Document Interface And Profile Mapping

- File: `docs/ai-collaboration/2026-06-05/03-project-document-interface-profile-mapping.md`
- User intent: Avoid turning project-specific orchestration documents into brittle hardcoded paths.
- Key decision: Use a common document-role interface backed by per-project profile mappings.
- User refinement: Treat this as an interface design problem: every project exposes common roles, but each project can map those roles to different existing files.
- Portfolio value: Demonstrates system design judgment around AI context management, configurability, and project-specific documentation.
