# AI Project Orchestrator

Local-first dashboard for tracking multiple AI-assisted development projects.

The MVP reads registered project folders, scans read-only Git state, scores simple risks, and generates focused Codex prompts.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Backend API runs on:

```text
http://127.0.0.1:4317
```

## MVP Features

- Register projects in `data/projects.json`.
- Scan all registered projects with `GET /api/snapshots`.
- Show branch, dirty state, staged/modified/untracked files, latest commit, and basic documentation signals.
- Calculate simple risk levels.
- Generate copyable Codex prompts for the selected project.

`data/projects.json` uses sanitized example paths. Replace them with your own local project paths before scanning real projects.

## Safety

The scanner only runs read-only Git commands. It does not reset, checkout, clean, delete, or push project files.
