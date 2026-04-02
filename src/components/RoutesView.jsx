import { useEffect, useState } from "react";

export default function RoutesView({
  routePreview,
  heatmap,
  loading,
  error,
  technicianId,
  originAddress,
  destinationAddress,
  onTechnicianIdChange,
  onOriginAddressChange,
  onDestinationAddressChange,
  onLoad,
  onOpenServiceRequestById,
}) {
  const [draftTechId, setDraftTechId] = useState(technicianId ? String(technicianId) : "");
  const [draftOriginAddress, setDraftOriginAddress] = useState(originAddress || "");
  const [draftDestinationAddress, setDraftDestinationAddress] = useState(destinationAddress || "");

  useEffect(() => {
    setDraftTechId(technicianId ? String(technicianId) : "");
  }, [technicianId]);

  useEffect(() => {
    setDraftOriginAddress(originAddress || "");
  }, [originAddress]);

  useEffect(() => {
    setDraftDestinationAddress(destinationAddress || "");
  }, [destinationAddress]);

  return (
    <section className="panel">
      <div className="routes-header">
        <div>
          <p className="section-kicker">Routing migration seam</p>
          <h2>Routes</h2>
        </div>
        <p>
          This tab is where the current routing app gets folded into dispatch. Use Ops Hub route payloads now, then
          lift planner and map controls from `dispatcher-routing-app` here.
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
        <button
          type="button"
          onClick={() => {
            onTechnicianIdChange(draftTechId);
            onOriginAddressChange?.(draftOriginAddress);
            onDestinationAddressChange?.(draftDestinationAddress);
            onLoad(draftTechId, {
              originAddress: draftOriginAddress,
              destinationAddress: draftDestinationAddress,
            });
          }}
        >
          Load route context
        </button>
      </div>

      {loading && <p>Loading route context…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="sr-grid">
          <article className="metric-card wide">
            <p>Route preview</p>
            {routePreview ? (
              <div className="list-stack compact">
                <div className="detail-grid single">
                  <Detail label="Technician" value={routePreview.technicianLabel} />
                  <Detail label="Assignments" value={routePreview.assignmentsConsidered} />
                  <Detail label="Mappable stops" value={routePreview.mappableStops} />
                  <Detail label="Skipped" value={routePreview.skippedWithoutAddress} />
                  <Detail label="Origin" value={routePreview.originAddress || "default"} />
                  <Detail label="Destination" value={routePreview.destinationAddress || "default"} />
                </div>
                <div className="list-stack compact">
                  {(routePreview.stops || []).map((stop, index) => (
                    <button
                      key={`${stop.srId}-${stop.address}-${index}`}
                      type="button"
                      className="list-row button-row"
                      onClick={() => stop.srId && onOpenServiceRequestById?.(stop.srId)}
                    >
                      <div>
                        <strong>{stop.label}</strong>
                        <p>{stop.subject || "Service Request"}</p>
                      </div>
                      <div className="row-meta">
                        <span>{stop.routeLabel || stop.window || "No window"}</span>
                        <span>{stop.address}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {routePreview.routeUrl && (
                  <a className="route-link" href={routePreview.routeUrl} target="_blank" rel="noreferrer">
                    Open route in maps
                  </a>
                )}
                {routePreview.imageUrl && (
                  <img className="route-image" src={routePreview.imageUrl} alt="Dispatch route preview" />
                )}
              </div>
            ) : (
              <p className="muted">Select an attention item with a mapped technician to load route context.</p>
            )}
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
                      <span>{spot.count} jobs • {spot.address}</span>
                    </div>
                  ))}
                  {!(heatmap.hotspots || []).length && <p className="muted">No hotspots loaded.</p>}
                </div>
                {heatmap.imageUrl && (
                  <img className="route-image" src={heatmap.imageUrl} alt="Dispatch assignment heatmap" />
                )}
              </div>
            ) : (
              <p className="muted">Heatmap will appear after a route payload is loaded.</p>
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
