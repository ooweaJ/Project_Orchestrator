# Static MVP Scaffold

Date: 2026-06-04

## Context

After setting up the AI collaboration harness, the developer approved starting implementation with a one-hour MVP target.

The agreed scope was a runnable local dashboard rather than a complete product.

## Goal

Create the first executable AI Project Orchestrator MVP:

- Vite + React + TypeScript frontend
- Node + Express backend
- local JSON project config
- read-only Git scanner
- basic risk scoring
- generated Codex prompt display

## Work Performed

- Added `package.json` scripts for development and production build.
- Added Vite, React, TypeScript, and Express configuration.
- Created local project data in `data/projects.json`.
- Implemented Express API routes:
  - `GET /api/projects`
  - `POST /api/projects`
  - `DELETE /api/projects/:id`
  - `GET /api/projects/:id/snapshot`
  - `GET /api/snapshots`
  - `POST /api/projects/:id/prompt`
  - `GET /api/activity`
- Implemented a read-only Git scanner using `git` commands.
- Added simple project type detection.
- Added rule-based risk messages and risk levels.
- Built a dashboard UI with:
  - top summary metrics
  - project cards
  - selected project detail panel
  - Git/doc signal panels
  - risk list
  - copyable Codex prompt
- Updated README and project status documents.

## Problem Encountered

The shell and browser tools intermittently failed with a Windows sandbox spawn error.

The in-app browser verification could not complete because the browser runtime exited unexpectedly during setup.

## Resolution

- Used escalated shell execution where needed for local commands.
- Verified the frontend and backend with HTTP requests instead of browser automation.
- Recorded the browser verification limitation clearly in status notes.

## Result

The project now has a runnable MVP scaffold.

The dashboard can read registered local projects, display Git state, score basic risks, and generate Codex prompts.

## Verification

Commands and checks:

```text
npm install
npm run build
GET http://127.0.0.1:5173
GET http://127.0.0.1:4317/api/projects
GET http://127.0.0.1:4317/api/snapshots
```

Observed snapshot summary:

```text
UE5 SoulLike     unreal     exists true  risk medium  branch main  dirty true
LETHE Prototype web-game   exists true  risk medium  branch main  dirty true
Portfolio Site  portfolio  exists true  risk low     branch main  dirty false
VRBeat          unity      exists true  risk medium  branch main  dirty true
```

## Next Task

Improve dashboard interactions:

- add project registration form
- add delete confirmation
- add prompt type selector
- improve scanner signals for recent files and TODO/FIXME counts
