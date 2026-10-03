# LifeOS HQ

LifeOS HQ is an internal AI-startup command center for planning and coordinating the work required to build and operate LifeOS.

## GitHub Pages demo

The GitHub Pages build is intentionally **browser-local** because GitHub Pages only serves static files. You can create missions, execute agent workstreams, generate artifacts, and approve/reject gated steps. Demo state is persisted in `localStorage`.

The production/server implementation is preserved under `server-api/` and `lib/engine.ts`, `lib/runtime.ts`, `lib/github.ts`, and `lib/store.ts`. That backend is intended for a later Vercel/Node deployment where agents can call real tools.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

The included `.github/workflows/pages.yml` builds a static Next.js export and deploys `out/` using GitHub Pages Actions.

In the repository, set **Settings → Pages → Source → GitHub Actions** once if Pages has not already been enabled for the repository.

## Current capabilities

- Founder objective/mission creation
- Department and agent assignment
- Persistent browser-local runs/tasks/events
- Agent execution state machine
- Generated artifacts
- Founder approval gates
- Static GitHub Pages dashboard
- Preserved server-side GitHub/model integration layer for the next phase