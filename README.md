# RouteDesk

RouteDesk is the dispatch and triage web app for Ops Hub.

It gives dispatch and service managers a browser-first workspace for:

- technician load and board visibility
- new-ticket triage
- attention queue ownership and follow-up
- service request review
- route planning and route simulation
- ServiceSmith intake work

## Main Workspaces

- `Board`
  Technician load, visible assignments, attention pressure, and open parts visibility.
- `Triage`
  Service-manager queue for new SR triage, missing info, parts-first, diagnostic-first, and quote-before-schedule work.
- `Attention`
  Actionable queue with assign, acknowledge, snooze, reopen, and history review.
- `Service Request`
  Customer detail, timeline, work context, photo compliance, and SMS preview/send workspace.
- `Routes`
  Route preview, heatmap, stop sequencing, stop drafting, validation, and simulation.
- `Intake`
  Spreadsheet analysis, preview, import planning, and profile-backed intake work.
- `Settings`
  Local operator preferences such as theme and saved defaults.

## Runtime Requirements

Create `.env.local` from `.env.example` and set:

- `VITE_OPS_HUB_API_BASE`
- `VITE_OPS_HUB_API_TOKEN`
- `VITE_DISPATCHER_ID`

Optional:

- `VITE_OPS_HUB_API_TIMEOUT_MS`
- `VITE_OPS_HUB_ATTENTION_TIMEOUT_MS`
- `VITE_OPS_HUB_ROUTE_TIMEOUT_MS`

RouteDesk branding is fixed in the app. There is no product-name override.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm test -- --run
```

## Docker

Run with Docker Compose:

```bash
docker compose up -d --build
```

By default the container serves on `http://localhost:4173`.

For presentation-friendly cross-app launchers, seed these in `.env.local`:

- `VITE_OPSHUB_URL`
- `VITE_ROUTEDESK_URL`
- `VITE_PARTSAPP_URL`
- `VITE_FIELDDESK_URL`

## Notes

- RouteDesk depends on Ops Hub for all workflow and BlueFolder-derived data.
- Attention owner assignment is BlueFolder-first rather than Discord-first.
- The board and attention queue are snapshot-first so the UI stays responsive during heavier background refreshes.
- SR SMS support is currently grounded in Ops Hub’s provider seam. The default backend mode is still dry-run unless a real provider is configured there.
