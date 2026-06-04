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
