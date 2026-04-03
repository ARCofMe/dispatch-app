import { useEffect, useMemo, useState } from "react";

const ROUTE_DRAFT_KEY = "dispatch-route-draft";

export default function RoutesView({
  routePreview,
  heatmap,
  loading,
  error,
  technicianId,
  originAddress,
  destinationAddress,
  optimize,
  onTechnicianIdChange,
  onOriginAddressChange,
  onDestinationAddressChange,
  onOptimizeChange,
  onLoad,
  onOpenServiceRequestById,
}) {
  const [draftTechId, setDraftTechId] = useState(technicianId ? String(technicianId) : "");
  const [draftOriginAddress, setDraftOriginAddress] = useState(originAddress || "");
  const [draftDestinationAddress, setDraftDestinationAddress] = useState(destinationAddress || "");
  const [draftOptimize, setDraftOptimize] = useState(Boolean(optimize));
  const [stopFilter, setStopFilter] = useState("");
  const [routeStatus, setRouteStatus] = useState("");

  useEffect(() => {
    setDraftTechId(technicianId ? String(technicianId) : "");
  }, [technicianId]);

  useEffect(() => {
    setDraftOriginAddress(originAddress || "");
  }, [originAddress]);

  useEffect(() => {
    setDraftDestinationAddress(destinationAddress || "");
  }, [destinationAddress]);

  useEffect(() => {
    setDraftOptimize(Boolean(optimize));
  }, [optimize]);

  useEffect(() => {
    const draft = loadRouteDraft();
    if (!draft) return;
    if (!technicianId && draft.technicianId) onTechnicianIdChange?.(draft.technicianId);
    if (!originAddress && draft.originAddress) onOriginAddressChange?.(draft.originAddress);
    if (!destinationAddress && draft.destinationAddress) onDestinationAddressChange?.(draft.destinationAddress);
    if (draft.optimize !== undefined) onOptimizeChange?.(Boolean(draft.optimize));
  }, []);

  useEffect(() => {
    saveRouteDraft({
      technicianId: draftTechId,
      originAddress: draftOriginAddress,
      destinationAddress: draftDestinationAddress,
      optimize: draftOptimize,
    });
  }, [draftTechId, draftOriginAddress, draftDestinationAddress, draftOptimize]);

  const visibleStops = useMemo(() => {
    const needle = stopFilter.trim().toLowerCase();
    const stops = routePreview?.stops || [];
    if (!needle) return stops;
    return stops.filter((stop) =>
      [stop.label, stop.subject, stop.address, stop.routeLabel, stop.window]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [routePreview?.stops, stopFilter]);

  const routeMetrics = useMemo(() => {
    const stops = routePreview?.stops || [];
    const cityLabels = new Set(
      stops
        .map((stop) => inferCityLabel(stop.address))
        .filter(Boolean)
    );
    return {
      stopCount: stops.length,
      filteredCount: visibleStops.length,
      uniqueAreas: cityLabels.size,
      firstStop: stops[0]?.label || "n/a",
      lastStop: stops[stops.length - 1]?.label || "n/a",
    };
  }, [routePreview?.stops, visibleStops.length]);

  function handleLoad() {
    onTechnicianIdChange(draftTechId);
    onOriginAddressChange?.(draftOriginAddress);
    onDestinationAddressChange?.(draftDestinationAddress);
    onOptimizeChange?.(draftOptimize);
    onLoad(draftTechId, {
      originAddress: draftOriginAddress,
      destinationAddress: draftDestinationAddress,
      optimize: draftOptimize,
    });
  }

  async function handleCopy(text, successMessage) {
    if (!text) {
      setRouteStatus("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setRouteStatus(successMessage);
    } catch {
      setRouteStatus("Clipboard write failed.");
    }
  }

  return (
    <section className="panel">
      <div className="routes-header">
        <div>
          <p className="section-kicker">Routing migration seam</p>
          <h2>Routes</h2>
        </div>
        <p>
          Route planning now lives here inside dispatch. Load one technician, inspect the stop sequence, validate the
          area mix, then jump straight into SRs or the external route link without leaving the app.
        </p>
      </div>

      <div className="sr-toolbar">
        <label className="field narrow">
          <span>Technician BlueFolder ID</span>
          <input
            value={draftTechId}
            onChange={(event) => setDraftTechId(event.target.value)}
            placeholder="9001"
            inputMode="numeric"
          />
        </label>
        <label className="field route-field">
          <span>Custom origin</span>
          <input
            value={draftOriginAddress}
            onChange={(event) => setDraftOriginAddress(event.target.value)}
            placeholder="Lewiston, ME"
          />
        </label>
        <label className="field route-field">
          <span>Custom destination</span>
          <input
            value={draftDestinationAddress}
            onChange={(event) => setDraftDestinationAddress(event.target.value)}
            placeholder="Auburn, ME"
          />
        </label>
        <button type="button" onClick={handleLoad}>
          Load route context
        </button>
        <label className="check-field">
          <input type="checkbox" checked={draftOptimize} onChange={(event) => setDraftOptimize(event.target.checked)} />
          <span>Optimize route order</span>
        </label>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            clearRouteDraft();
            setDraftTechId("");
            setDraftOriginAddress("");
            setDraftDestinationAddress("");
            setDraftOptimize(false);
            setStopFilter("");
            setRouteStatus("Cleared route draft.");
          }}
        >
          Clear draft
        </button>
      </div>

      {routeStatus && <p className="muted">{routeStatus}</p>}
      {loading && <p>Loading route context…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="sr-grid">
          <article className="metric-card">
            <p>Stops</p>
            <strong>{routeMetrics.stopCount}</strong>
          </article>
          <article className="metric-card">
            <p>Visible after filter</p>
            <strong>{routeMetrics.filteredCount}</strong>
          </article>
          <article className="metric-card">
            <p>Distinct areas</p>
            <strong>{routeMetrics.uniqueAreas}</strong>
          </article>
          <article className="metric-card">
            <p>Skipped without address</p>
            <strong>{routePreview?.skippedWithoutAddress || 0}</strong>
          </article>

          <article className="metric-card wide">
            <div className="section-head">
              <p>Route controls</p>
              <div className="action-row compact-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleCopy(routePreview?.routeUrl, "Copied route link.")}
                >
                  Copy route link
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleCopy(buildManifest(routePreview?.stops || []), "Copied stop manifest.")}
                >
                  Copy stop manifest
                </button>
                {routePreview?.routeUrl && (
                  <a className="route-link button-link" href={routePreview.routeUrl} target="_blank" rel="noreferrer">
                    Open route in maps
                  </a>
                )}
              </div>
            </div>
            <div className="detail-grid">
              <Detail label="Technician" value={routePreview?.technicianLabel} />
              <Detail label="Assignments" value={routePreview?.assignmentsConsidered} />
              <Detail label="First stop" value={routeMetrics.firstStop} />
              <Detail label="Last stop" value={routeMetrics.lastStop} />
              <Detail label="Origin" value={routePreview?.originAddress || "default"} />
              <Detail label="Destination" value={routePreview?.destinationAddress || "default"} />
              <Detail label="Optimization" value={routePreview?.optimized ? "enabled" : "off"} />
            </div>
          </article>

          <article className="metric-card wide">
            <p>Route metrics</p>
            <div className="detail-grid">
              <Detail label="Miles" value={formatMetric(routePreview?.metrics?.total_distance_miles)} />
              <Detail label="Drive minutes" value={formatMetric(routePreview?.metrics?.total_drive_minutes)} />
              <Detail label="Labor minutes" value={formatMetric(routePreview?.metrics?.total_labor_minutes)} />
              <Detail label="Total minutes" value={formatMetric(routePreview?.metrics?.total_minutes)} />
            </div>
          </article>

          <article className="metric-card wide">
            <div className="section-head">
              <p>Stop workspace</p>
              <label className="field narrow">
                <span>Filter stops</span>
                <input
                  value={stopFilter}
                  onChange={(event) => setStopFilter(event.target.value)}
                  placeholder="SR, city, address, subject"
                />
              </label>
            </div>
            {routePreview ? (
              <div className="list-stack compact">
                {visibleStops.map((stop, index) => (
                  <div key={`${stop.srId}-${stop.address}-${index}`} className="list-row route-stop-row">
                    <div>
                      <strong>
                        {index + 1}. {stop.label}
                      </strong>
                      <p>{stop.subject || "Service Request"}</p>
                      <p className="muted">{stop.address}</p>
                    </div>
                    <div className="row-meta">
                      <span>{stop.routeLabel || stop.window || inferCityLabel(stop.address) || "No area label"}</span>
                      <button type="button" className="secondary-button" onClick={() => stop.srId && onOpenServiceRequestById?.(stop.srId)}>
                        Open SR
                      </button>
                    </div>
                  </div>
                ))}
                {!visibleStops.length && <p className="muted">No stops match the current filter.</p>}
              </div>
            ) : (
              <p className="muted">Select a technician or jump in from board/SR attention to load route context.</p>
            )}
          </article>

          <article className="metric-card wide">
            <p>Route timeline</p>
            <div className="history-list">
              {(routePreview?.stops || []).map((stop, index) => (
                <div key={`${stop.srId}-${index}`} className="history-entry">
                  <p>
                    Stop {index + 1}: {stop.label}
                  </p>
                  <span>{[stop.subject, inferCityLabel(stop.address), stop.routeLabel].filter(Boolean).join(" • ") || stop.address}</span>
                </div>
              ))}
              {!(routePreview?.stops || []).length && <p className="muted">No route timeline loaded yet.</p>}
            </div>
          </article>

          <article className="metric-card wide">
            <p>Heatmap</p>
            {heatmap ? (
              <div className="list-stack compact">
                <div className="detail-grid single">
                  <Detail label="Scanned jobs" value={heatmap.scannedJobs} />
                  <Detail label="Unique locations" value={heatmap.uniqueMappedLocations} />
                </div>
                <div className="history-list">
                  {(heatmap.hotspots || []).map((spot) => (
                    <div key={spot.address} className="history-entry">
                      <p>{spot.label || spot.address}</p>
                      <span>
                        {spot.count} jobs • {spot.address}
                      </span>
                    </div>
                  ))}
                  {!(heatmap.hotspots || []).length && <p className="muted">No hotspots loaded.</p>}
                </div>
                {heatmap.imageUrl && <img className="route-image" src={heatmap.imageUrl} alt="Dispatch assignment heatmap" />}
              </div>
            ) : (
              <p className="muted">Heatmap will appear after a route payload is loaded.</p>
            )}
          </article>

          <article className="metric-card wide">
            <p>Map preview</p>
            {routePreview?.imageUrl ? (
              <img className="route-image" src={routePreview.imageUrl} alt="Dispatch route preview" />
            ) : (
              <p className="muted">No route image is available for the current selection.</p>
            )}
          </article>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-value">
      <span>{label}</span>
      <strong>{value || "n/a"}</strong>
    </div>
  );
}

function inferCityLabel(address) {
  if (!address) return "";
  const parts = String(address)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "";
}

function buildManifest(stops) {
  if (!stops.length) return "";
  return stops
    .map((stop, index) => `${index + 1}. ${stop.label} | ${stop.subject || "Service Request"} | ${stop.address}`)
    .join("\n");
}

function formatMetric(value) {
  if (value === undefined || value === null || value === "") return "n/a";
  if (typeof value === "number") return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  return `${value}`;
}

function loadRouteDraft() {
  try {
    const raw = localStorage.getItem(ROUTE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveRouteDraft(value) {
  localStorage.setItem(ROUTE_DRAFT_KEY, JSON.stringify(value));
}

function clearRouteDraft() {
  localStorage.removeItem(ROUTE_DRAFT_KEY);
}
