# Dispatch App

Dispatch web frontend for Ops Hub.

This project is intentionally separate from `ops-hub`:
- `ops-hub` stays the backend, workflow engine, and Discord surface
- `dispatch-app` is the web UI for dispatch workflows
- route-planning work from `dispatcher-routing-app` should be folded into the `Routes` tab here over time

## Current scope

- `Board`
Queue-first overview for mapped technicians, visible assignments, attention load, and open parts cases.

- `Attention`
Actionable workflow queue with item detail, recent history, and controls for:
  - `ack`
  - `reopen`
  - `unsnooze`
  - `snooze`
  - `assign`
  - `clear owner`

- `Service Request`
Customer detail and merged SR timeline pulled from Ops Hub.

- `Routes`
Structured route preview and heatmap payloads. This is the landing zone for migrating the older routing app into dispatch instead of keeping it separate.

- `Intake`
ServiceSmith intake surface over Ops Hub. It now supports spreadsheet analysis, import planning, payload preview, and first-pass import execution from the dispatch UI.

## Environment

Copy `.env.example` to `.env.local` and set:

- `VITE_OPS_HUB_API_BASE`
- `VITE_OPS_HUB_API_TOKEN`
- `VITE_DISPATCHER_ID`

These values are consumed by [src/api/client.js](./src/api/client.js).

## Local development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

By default Vite will print a local URL such as `http://localhost:5173`.

Build the app:

```bash
npm run build
```

Run frontend tests:

```bash
npm test -- --run
```

## Docker

This repo now includes a simple production-style frontend container similar to the routing frontend.

Build and run with Docker Compose:

```bash
docker compose up -d --build
```

That serves the app on `http://localhost:4173`.

Before building, export or place these values in an env file that Compose can read:

- `VITE_OPS_HUB_API_BASE`
- `VITE_OPS_HUB_API_TOKEN`
- `VITE_DISPATCHER_ID`

The included `docker-compose.yml` currently defaults `VITE_OPS_HUB_API_BASE` to `http://host.docker.internal:8787`, which is useful when `ops-hub` is running directly on the host. On Linux, if `host.docker.internal` is not available in your Docker setup, replace it with your host IP or run the frontend with plain `npm run dev`.
The compose file now includes `host-gateway` mapping, which usually makes `host.docker.internal` work on modern Linux Docker as well.

## Current status

This app is now a real first-pass dispatch shell, not just a stub:
- it renders meaningful Ops Hub dispatch data
- it supports basic queue actions
- it opens SR detail and route context from the same app
- it includes the first ServiceSmith migration surface through the `Intake` tab
- it can analyze spreadsheets, preview import plans/payloads, and run intake imports through Ops Hub
- it includes basic import guardrails like preview-before-import, confirmation prompts, and local presets
- it now persists working drafts for `Routes` and `Intake`, and can export preview/import JSON artifacts

What is not migrated yet:
- the richer route-planner map interactions from `dispatcher-routing-app`
- more advanced assignment and scheduling workflows
- deeper parts-facing dispatch cross-links
- richer ServiceSmith reporting, saved profiles, and operator guardrails around import execution
