# RouteDesk

RouteDesk is the dispatch web frontend for Ops Hub.

This project is intentionally separate from `ops-hub`:
- `ops-hub` stays the backend, workflow engine, and Discord surface
- `dispatch-app` is the RouteDesk web UI for dispatch workflows
- route-planning work from `dispatcher-routing-app` should be folded into the `Routes` tab here over time

## Current scope

- `Board`
Queue-first overview for mapped technicians, visible assignments, attention load, and open parts cases.

- `Attention`
Actionable workflow queue with item detail, recent history, and controls for:
  - `ack`
  - bulk `ack`
  - `reopen`
  - `unsnooze`
  - `snooze`
  - bulk `snooze`
  - `assign`
  - bulk `assign`
  - `clear owner`
  - bulk `clear owner`

- `Service Request`
Customer detail and merged SR timeline pulled from Ops Hub.

- `Routes`
Structured route preview and heatmap payloads with a real stop workspace, filter/search, manual reordering, ad-hoc stop drafting, validation/share controls, date selection, saved route preferences, and an optimization toggle backed by Ops Hub. The route tab now renders a Leaflet/OpenStreetMap map when route geometry is available, with backend image fallbacks when it is not.

- `Intake`
ServiceSmith intake surface over Ops Hub. It now supports spreadsheet upload, analysis, import planning, payload preview, first-pass import execution, import-safety confirmations, and backend-saved intake profiles from the dispatch UI.

## Environment

Copy `.env.example` to `.env.local` and set:

- `VITE_OPS_HUB_API_BASE`
- `VITE_OPS_HUB_API_TOKEN`
- `VITE_DISPATCHER_ID`
- `VITE_OPS_HUB_API_TIMEOUT_MS` (optional, defaults to `30000`)
- `VITE_OPS_HUB_ROUTE_TIMEOUT_MS` (optional, defaults to `90000` for route preview, heatmap, and simulation calls)

These values are consumed by [src/api/client.js](./src/api/client.js). The checked-in `.env.example` includes the full supported set.

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
- routes now include stop filtering, route summary, copy/share helpers, and a timeline view
- routes now render inside a real Leaflet/OpenStreetMap panel instead of a placeholder SVG-only map
- route previews can now request optimized order and expose route metrics when the legacy routing backend is available
- routes now support manual resequencing, ad-hoc stop drafting, share actions, and route validation cues through Ops Hub-backed simulation
- it includes the first ServiceSmith migration surface through the `Intake` tab
- it can upload spreadsheets, preview import plans/payloads, and run intake imports through Ops Hub
- intake now requires a fresh preview plus explicit operator acknowledgement before import, with a separate override for blocking validation errors
- it includes basic import guardrails like preview-before-import, confirmation prompts, and saved intake profiles
- it now persists working drafts for `Routes` and `Intake`, and can export preview/import JSON artifacts

What is not migrated yet:
- the full route-planner interaction model from `dispatcher-routing-app` such as drag/drop resequencing and deeper map editing
- more advanced assignment and scheduling workflows
- deeper parts-facing dispatch cross-links
- richer ServiceSmith reporting and operator guardrails around import execution
