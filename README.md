# Dispatch App

Dispatch web frontend for Ops Hub.

This project is intentionally separate from `ops-hub`:
- `ops-hub` stays the backend, workflow engine, and Discord surface
- `dispatch-app` is the web UI for dispatch workflows
- route-planning work from `dispatcher-routing-app` should be folded into the `Routes` tab here over time

## Planned tabs

- `Board`: queue-first dispatch overview
- `Attention`: actionable workflow objects
- `Service Request`: customer and timeline detail
- `Routes`: technician route preview and routing migration seam

## Expected environment

Create a `.env.local` or otherwise provide:

- `VITE_OPS_HUB_API_BASE`
- `VITE_OPS_HUB_API_TOKEN`
- `VITE_DISPATCHER_ID`

Those values are used by `src/api/client.js`.
