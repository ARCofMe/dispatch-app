import { getWorkspaceLinkStatus } from "../workspaceLinks";

export default function BrandBar({ workspaceLinks = {}, currentApp = "routeDesk" }) {
  const workspaces = getWorkspaceLinkStatus(workspaceLinks, currentApp);

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
        {workspaces.map(({ appKey, label, href, current }) =>
          current ? (
            <span key={appKey} className="queue-chip">
              {label}
            </span>
          ) : href ? (
            <a key={appKey} className="button-link secondary-button" href={href} target="_blank" rel="noreferrer">
              Open {label}
            </a>
          ) : null,
        )}
      </div>
    </header>
  );
}
