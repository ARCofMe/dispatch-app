import { getWorkspaceLinkStatus } from "../workspaceLinks";

const SETTINGS_THEME_KEY = "dispatch-theme-mode";

export default function SettingsView({
  themeMode,
  onThemeModeChange,
  technicianOptions = [],
  defaultRouteTechnicianId,
  onDefaultRouteTechnicianChange,
  autoLoadDefaultRouteTech,
  onAutoLoadDefaultRouteTechChange,
  routeOptimizeByDefault,
  onRouteOptimizeByDefaultChange,
  rememberLastSr,
  onRememberLastSrChange,
  restoreLastSrOnLaunch,
  onRestoreLastSrOnLaunchChange,
  openSrOnAttentionSelect,
  onOpenSrOnAttentionSelectChange,
  dispatcherId,
  apiBase,
  onClearRouteDraft,
  onClearIntakeDraft,
  workspaceLinks,
  onWorkspaceLinksChange,
}) {
  const ecosystemStatus = getWorkspaceLinkStatus(workspaceLinks, "routeDesk");
  const configuredCount = ecosystemStatus.filter((item) => item.configured).length;
  const siblingStatus = ecosystemStatus.filter((item) => !item.current);
  const configuredSiblingCount = siblingStatus.filter((item) => item.configured).length;
  const preflightChecks = [
    { label: "API base set", ready: Boolean(apiBase) },
    { label: "Dispatcher ID set", ready: Boolean(dispatcherId) },
    { label: "Default technician selected", ready: Boolean(defaultRouteTechnicianId) },
    { label: "Auto-load default technician", ready: Boolean(autoLoadDefaultRouteTech) },
    { label: "PartsDesk launcher ready", ready: Boolean(ecosystemStatus.find((item) => item.appKey === "partsDesk")?.configured) },
    { label: "FieldDesk launcher ready", ready: Boolean(ecosystemStatus.find((item) => item.appKey === "fieldDesk")?.configured) },
  ];
  const criticalChecks = preflightChecks.filter((item) => item.label !== "Auto-load default technician");
  const readyCount = preflightChecks.filter((item) => item.ready).length;
  const isPresentationReady = criticalChecks.every((item) => item.ready);

  return (
    <section className="panel settings-layout">
      <article className="metric-card wide">
        <p className="section-kicker">Presentation preflight</p>
        <h2 className="settings-title">Readiness</h2>
        <p className="settings-copy">
          Confirm the dispatch workspace is actually safe to present before you leave Settings. This catches missing
          identity, missing launchers, and incomplete route defaults in one place.
        </p>
        <div className="settings-grid">
          <Detail label="Overall status" value={isPresentationReady ? "Ready for presentation" : "Needs attention"} />
          <Detail label="Checks passed" value={`${readyCount} / ${preflightChecks.length}`} />
          <Detail label="Sibling apps" value={`${configuredSiblingCount} / ${siblingStatus.length} linked`} />
          <Detail label="Default route tech" value={defaultRouteTechnicianId || "not selected"} />
        </div>
        <div className="settings-grid">
          {preflightChecks.map((item) => (
            <div key={item.label} className="detail-value">
              <span>{item.label}</span>
              <strong>{item.ready ? "Ready" : "Missing"}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="metric-card wide">
        <p className="section-kicker">Operator settings</p>
        <h2 className="settings-title">Workspace</h2>
        <p className="settings-copy">
          Keep the app adaptable for whoever is driving dispatch. Appearance, local draft state, and API identity all
          need a home instead of being hidden in scattered local storage keys.
        </p>
        <div className="settings-grid">
          <Detail label="API base" value={apiBase || "n/a"} />
          <Detail label="Dispatcher ID" value={dispatcherId || "not set"} />
          <Detail label="Workspace" value="RouteDesk" />
          <Detail label="Theme mode" value={themeMode} />
        </div>
      </article>

      <article className="metric-card wide">
        <p>Appearance</p>
        <div className="theme-toggle-row">
          {[
            ["system", "System"],
            ["light", "Light"],
            ["dark", "Dark"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={themeMode === value ? "tab-button active" : "tab-button"}
              onClick={() => onThemeModeChange?.(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="muted">
          Stored in local browser state under <code>{SETTINGS_THEME_KEY}</code>.
        </p>
      </article>

      <article className="metric-card wide">
        <p>Dispatch defaults</p>
        <div className="settings-grid">
          <label className="field route-field">
            <span>Default route technician</span>
            <select value={defaultRouteTechnicianId} onChange={(event) => onDefaultRouteTechnicianChange?.(event.target.value)}>
              <option value="">No default technician</option>
              {technicianOptions.map((tech) => (
                <option key={tech.value} value={tech.value}>
                  {tech.label}
                </option>
              ))}
            </select>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={autoLoadDefaultRouteTech}
              onChange={(event) => onAutoLoadDefaultRouteTechChange?.(event.target.checked)}
            />
            <span>Auto-load default technician when opening Routes</span>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={routeOptimizeByDefault}
              onChange={(event) => onRouteOptimizeByDefaultChange?.(event.target.checked)}
            />
            <span>Enable route optimization by default</span>
          </label>
        </div>
      </article>

      <article className="metric-card wide">
        <p>Service Request behavior</p>
        <div className="settings-grid">
          <label className="check-field">
            <input
              type="checkbox"
              checked={rememberLastSr}
              onChange={(event) => onRememberLastSrChange?.(event.target.checked)}
            />
            <span>Remember the last opened SR</span>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={restoreLastSrOnLaunch}
              onChange={(event) => onRestoreLastSrOnLaunchChange?.(event.target.checked)}
            />
            <span>Restore the last SR when the app loads</span>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={openSrOnAttentionSelect}
              onChange={(event) => onOpenSrOnAttentionSelectChange?.(event.target.checked)}
            />
            <span>Open the Service Request tab when selecting an attention item</span>
          </label>
        </div>
      </article>

      <article className="metric-card wide">
        <p>Local drafts</p>
        <div className="action-row">
          <button type="button" className="secondary-button" onClick={onClearRouteDraft}>
            Clear route draft
          </button>
          <button type="button" className="secondary-button" onClick={onClearIntakeDraft}>
            Clear intake draft
          </button>
        </div>
        <p className="muted">
          These only clear browser-local drafts. They do not touch saved backend intake profiles or workflow state.
        </p>
      </article>

      <article className="metric-card wide">
        <p>Ecosystem links</p>
        <p className="muted">
          {configuredCount} of {ecosystemStatus.length} workspaces configured.
        </p>
        <div className="settings-grid">
          <label className="field route-field">
            <span>RouteDesk URL</span>
            <input
              value={workspaceLinks?.routeDeskUrl || ""}
              onChange={(event) => onWorkspaceLinksChange?.({ ...workspaceLinks, routeDeskUrl: event.target.value })}
              placeholder="route.example.com"
            />
          </label>
          <label className="field route-field">
            <span>PartsDesk URL</span>
            <input
              value={workspaceLinks?.partsAppUrl || ""}
              onChange={(event) => onWorkspaceLinksChange?.({ ...workspaceLinks, partsAppUrl: event.target.value })}
              placeholder="parts.example.com"
            />
          </label>
          <label className="field route-field">
            <span>FieldDesk URL</span>
            <input
              value={workspaceLinks?.fieldDeskUrl || ""}
              onChange={(event) => onWorkspaceLinksChange?.({ ...workspaceLinks, fieldDeskUrl: event.target.value })}
              placeholder="field.example.com"
            />
          </label>
        </div>
        <p className="muted">
          Bare domains are normalized to `https://`. Invalid or unsafe URLs stay hidden. Saved values override the
          launcher defaults seeded from your env file.
        </p>
        <div className="settings-grid">
          {ecosystemStatus.map((item) => (
            <div key={item.appKey} className="detail-value">
              <span>{item.label}</span>
              <strong>{item.current ? "Current app" : item.configured ? "Ready" : "Missing"}</strong>
              {item.href && !item.current ? (
                <a className="button-link secondary-button" href={item.href} target="_blank" rel="noreferrer">
                  Open {item.label}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
