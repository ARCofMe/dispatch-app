const WORKSPACES = [
  ["opsHub", "OpsHub", "opsHubUrl"],
  ["routeDesk", "RouteDesk", "routeDeskUrl"],
  ["partsApp", "PartsApp", "partsAppUrl"],
  ["fieldDesk", "FieldDesk", "fieldDeskUrl"],
];

function safeWorkspaceUrl(value) {
  const trimmed = String(value || "").trim();
  const normalized = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(normalized);
    return /^https?:$/i.test(parsed.protocol) && parsed.host ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export default function BrandBar({ workspaceLinks = {}, currentApp = "routeDesk" }) {
  return (
    <header className="brand-bar">
      <div className="brand-bar-top">
        <div>
          <p className="brand-kicker">OpsHub ecosystem</p>
          <h1 className="brand-wordmark">
            <span className="brand-wordmark-primary">Route</span>
            <span className="brand-wordmark-accent">Desk</span>
          </h1>
        </div>
        <div className="brand-context">
          <span className="status-pill">OpsHub brain</span>
          <span className="queue-chip">Route orchestration</span>
        </div>
      </div>
      <p className="brand-copy">
        Smart routes. Better days. Own the dispatch board, work the queue, and shape the field day before it slips.
      </p>
      <div className="brand-link-row">
        {WORKSPACES.map(([key, label, linkKey]) =>
          key === currentApp ? (
            <span key={key} className="queue-chip">
              {label}
            </span>
          ) : safeWorkspaceUrl(workspaceLinks?.[linkKey]) ? (
            <a
              key={key}
              className="button-link secondary-button"
              href={safeWorkspaceUrl(workspaceLinks?.[linkKey])}
              target="_blank"
              rel="noreferrer"
            >
              Open {label}
            </a>
          ) : null
        )}
      </div>
    </header>
  );
}
