import { useEffect, useMemo, useState } from "react";
import RouteMapPanel from "./RouteMapPanel";

const ROUTE_DRAFT_KEY = "dispatch-route-draft";
const BLUEFOLDER_ACCOUNT_NAME = import.meta.env.VITE_BLUEFOLDER_ACCOUNT_NAME || "";

export default function RoutesView({
  routePreview,
  heatmap,
  loading,
  error,
  technicianId,
  routeDate,
  technicianOptions = [],
  defaultTechnicianId = "",
  onSetDefaultTechnician,
  originAddress,
  destinationAddress,
  optimize,
  onRouteDateChange,
  onTechnicianIdChange,
  onOriginAddressChange,
  onDestinationAddressChange,
  onOptimizeChange,
  onLoad,
  onSimulateRoute,
  onOpenServiceRequestById,
}) {
  const [draftTechId, setDraftTechId] = useState(technicianId ? String(technicianId) : "");
  const [draftRouteDate, setDraftRouteDate] = useState(routeDate || "");
  const [draftOriginAddress, setDraftOriginAddress] = useState(originAddress || "");
  const [draftDestinationAddress, setDraftDestinationAddress] = useState(destinationAddress || "");
  const [draftOptimize, setDraftOptimize] = useState(Boolean(optimize));
  const [stopFilter, setStopFilter] = useState("");
  const [routeStatus, setRouteStatus] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [selectedStopId, setSelectedStopId] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [draggedStopId, setDraggedStopId] = useState("");
  const [expandedStopId, setExpandedStopId] = useState("");
  const [stopEdits, setStopEdits] = useState({});
  const [newStop, setNewStop] = useState({
    name: "",
    address: "",
    durationMinutes: "30",
    windowStart: "",
    windowEnd: "",
  });

  useEffect(() => {
    setDraftTechId(technicianId ? String(technicianId) : "");
  }, [technicianId]);

  useEffect(() => {
    setDraftRouteDate(routeDate || "");
  }, [routeDate]);

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
    if (!routeDate && draft.routeDate) onRouteDateChange?.(draft.routeDate);
    if (!originAddress && draft.originAddress) onOriginAddressChange?.(draft.originAddress);
    if (!destinationAddress && draft.destinationAddress) onDestinationAddressChange?.(draft.destinationAddress);
    if (draft.optimize !== undefined) onOptimizeChange?.(Boolean(draft.optimize));
  }, []);

  useEffect(() => {
    saveRouteDraft({
      technicianId: draftTechId,
      routeDate: draftRouteDate,
      originAddress: draftOriginAddress,
      destinationAddress: draftDestinationAddress,
      optimize: draftOptimize,
    });
  }, [draftTechId, draftRouteDate, draftOriginAddress, draftDestinationAddress, draftOptimize]);

  const visibleStops = useMemo(() => {
    const needle = stopFilter.trim().toLowerCase();
    const stops = (routePreview?.stops || []).filter((stop) => !hideCompleted || stop.status !== "complete");
    if (!needle) return stops;
    return stops.filter((stop) =>
      [stop.label, stop.subject, stop.address, stop.routeLabel, stop.window]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [hideCompleted, routePreview?.stops, stopFilter]);
  const canDragReorder = Boolean(routePreview?.stops?.length) && !stopFilter.trim() && !hideCompleted;

  const filteredTechnicians = useMemo(() => {
    const needle = techFilter.trim().toLowerCase();
    if (!needle) return technicianOptions;
    return technicianOptions.filter((tech) =>
      [tech.label, tech.originAddress, tech.value].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [techFilter, technicianOptions]);

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

  const validation = useMemo(() => {
    const stops = routePreview?.stops || [];
    const lateCount = stops.filter((stop) => stop.eta && stop.window_end && stop.eta > stop.window_end).length;
    const windowSorted = [...stops]
      .filter((stop) => stop.window_start)
      .sort((left, right) => String(left.window_start).localeCompare(String(right.window_start)));
    return {
      lateCount,
      suggestedFirstStop: windowSorted[0]?.label || "n/a",
    };
  }, [routePreview?.stops]);

  const mapStatus = useMemo(() => {
    const hasPath = Array.isArray(routePreview?.path) && routePreview.path.length > 1;
    const hasStopCoords = (routePreview?.stops || []).some((stop) => hasUsableCoordinates(stop));
    if (hasPath || hasStopCoords) {
      return {
        label: "Interactive map",
        detail: "Route geometry or stop coordinates are available for the embedded map.",
      };
    }
    if (routePreview?.imageUrl) {
      return {
        label: "Static map fallback",
        detail: "OpsHub returned a static map image because BlueFolder stops do not include usable coordinates yet.",
      };
    }
    if (routePreview?.routeUrl) {
      return {
        label: "External route only",
        detail: "No embedded geometry or static image is available; use the external route link.",
      };
    }
    return {
      label: "Map unavailable",
      detail: "Load a route with mappable addresses or check OpsHub map/geocoding configuration.",
    };
  }, [routePreview]);

  function handleLoad() {
    onTechnicianIdChange(draftTechId);
    onRouteDateChange?.(draftRouteDate);
    onOriginAddressChange?.(draftOriginAddress);
    onDestinationAddressChange?.(draftDestinationAddress);
    onOptimizeChange?.(draftOptimize);
    onLoad(draftTechId, {
      date: draftRouteDate,
      originAddress: draftOriginAddress,
      destinationAddress: draftDestinationAddress,
      optimize: draftOptimize,
    });
  }

  async function simulateRoute({
    existingStops = routePreview?.stops || [],
    addedStops = [],
    removedIds = [],
    manualOrder,
    optimizeOverride,
  } = {}) {
    if (!onSimulateRoute) return;
    const defaultOrder = existingStops
      .filter((stop) => !removedIds.includes(String(stop.id || stop.srId || "")))
      .map((stop) => String(stop.id || stop.srId || ""))
      .concat(addedStops.map((stop) => String(stop.id || stop.srId || "")));
    await onSimulateRoute({
      technicianBluefolderUserId: draftTechId ? Number(draftTechId) : null,
      routeDate: draftRouteDate,
      originAddress: draftOriginAddress,
      destinationAddress: draftDestinationAddress,
      optimize: optimizeOverride ?? draftOptimize,
      existingStops,
      addedStops,
      removedIds,
      manualOrder: manualOrder || defaultOrder,
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

  function buildRouteUrl() {
    if (routePreview?.routeUrl) return routePreview.routeUrl;
    const parts = [];
    if (draftOriginAddress) parts.push(draftOriginAddress);
    (routePreview?.stops || []).forEach((stop) => parts.push(stop.address || ""));
    if (draftDestinationAddress) parts.push(draftDestinationAddress);
    const filtered = parts.filter(Boolean);
    return filtered.length ? `https://www.google.com/maps/dir/${filtered.map(encodeURIComponent).join("/")}` : "";
  }

  async function copyRouteLink() {
    await handleCopy(buildRouteUrl(), "Copied route link.");
    setShareStatus("Route link copied.");
    window.setTimeout(() => setShareStatus(""), 1800);
  }

  function shiftStop(stopId, direction) {
    const stops = [...(routePreview?.stops || [])];
    const index = stops.findIndex((stop) => getStopIdentity(stop) === String(stopId));
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= stops.length) return;
    const reordered = [...stops];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    onOptimizeChange?.(false);
    setDraftOptimize(false);
    simulateRoute({
      existingStops: reordered,
      manualOrder: reordered.map(getStopIdentity),
      optimizeOverride: false,
    });
  }

  function toggleStopComplete(stopId) {
    const stops = (routePreview?.stops || []).map((stop) =>
      getStopIdentity(stop) === String(stopId)
        ? { ...stop, status: stop.status === "complete" ? "scheduled" : "complete" }
        : stop
    );
    simulateRoute({
      existingStops: stops,
      manualOrder: stops.map((stop) => String(stop.id || stop.srId || "")),
    });
  }

  function removeStop(stopId) {
    const stops = routePreview?.stops || [];
    simulateRoute({
      existingStops: stops,
      removedIds: [String(stopId)],
      manualOrder: stops
        .filter((stop) => getStopIdentity(stop) !== String(stopId))
        .map(getStopIdentity),
    });
    setRouteStatus("Removed stop from route draft.");
  }

  function updateStopEdit(stopId, patch) {
    setStopEdits((current) => ({
      ...current,
      [stopId]: {
        ...(current[stopId] || {}),
        ...patch,
      },
    }));
  }

  function stopEditValue(stop, key) {
    const stopId = getStopIdentity(stop);
    const edits = stopEdits[stopId] || {};
    if (edits[key] !== undefined) return edits[key];
    if (key === "duration_minutes") return String(stop.duration_minutes ?? stop.durationMinutes ?? "");
    if (key === "window_start") return stop.window_start || stop.windowStart || "";
    if (key === "window_end") return stop.window_end || stop.windowEnd || "";
    if (key === "status") return stop.status || "scheduled";
    return "";
  }

  function applyStopEdit(stop) {
    const stopId = getStopIdentity(stop);
    const edits = stopEdits[stopId] || {};
    const durationText = edits.duration_minutes ?? stopEditValue(stop, "duration_minutes");
    const updatedStops = (routePreview?.stops || []).map((candidate) =>
      getStopIdentity(candidate) === stopId
        ? {
            ...candidate,
            duration_minutes: durationText === "" ? undefined : Number(durationText),
            window_start: (edits.window_start ?? stopEditValue(stop, "window_start")) || undefined,
            window_end: (edits.window_end ?? stopEditValue(stop, "window_end")) || undefined,
            status: edits.status ?? stopEditValue(stop, "status"),
          }
        : candidate
    );
    simulateRoute({
      existingStops: updatedStops,
      manualOrder: updatedStops.map(getStopIdentity),
    });
    setRouteStatus("Stop details updated in route draft.");
  }

  function reorderStop(dragStopId, targetStopId) {
    if (!canDragReorder || !dragStopId || !targetStopId || dragStopId === targetStopId) return;
    const stops = [...(routePreview?.stops || [])];
    const sourceIndex = stops.findIndex((stop) => getStopIdentity(stop) === String(dragStopId));
    const targetIndex = stops.findIndex((stop) => getStopIdentity(stop) === String(targetStopId));
    if (sourceIndex < 0 || targetIndex < 0) return;
    const reordered = [...stops];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onOptimizeChange?.(false);
    setDraftOptimize(false);
    simulateRoute({
      existingStops: reordered,
      manualOrder: reordered.map(getStopIdentity),
      optimizeOverride: false,
    });
    setRouteStatus("Route draft reordered. Optimization disabled for this manual sequence.");
  }

  async function addAdHocStop() {
    if (!newStop.address.trim()) {
      setRouteStatus("Ad-hoc stop needs an address.");
      return;
    }
    const stopId = `adhoc-${Date.now()}`;
    await simulateRoute({
      existingStops: routePreview?.stops || [],
      addedStops: [
        {
          id: stopId,
          label: newStop.name.trim() || "Ad-hoc stop",
          customer_name: newStop.name.trim() || "Ad-hoc stop",
          subject: newStop.name.trim() || "Ad-hoc stop",
          address: newStop.address.trim(),
          duration_minutes: Number(newStop.durationMinutes || 30),
          window_start: newStop.windowStart || undefined,
          window_end: newStop.windowEnd || undefined,
          status: "draft",
        },
      ],
    });
    setNewStop({ name: "", address: "", durationMinutes: "30", windowStart: "", windowEnd: "" });
    setRouteStatus("Added ad-hoc stop to route draft.");
  }

  useEffect(() => {
    const handler = (event) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        saveRouteDraft({
          technicianId: draftTechId,
          routeDate: draftRouteDate,
          originAddress: draftOriginAddress,
          destinationAddress: draftDestinationAddress,
          optimize: draftOptimize,
        });
        setRouteStatus("Route draft saved.");
      }
      if (key === "c") {
        event.preventDefault();
        copyRouteLink();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [draftDestinationAddress, draftOptimize, draftOriginAddress, draftRouteDate, draftTechId, routePreview]);

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
        {technicianOptions.length ? (
          <label className="field route-field">
            <span>Technician</span>
            <select value={draftTechId} onChange={(event) => setDraftTechId(event.target.value)}>
              <option value="">Select a technician</option>
              {technicianOptions.map((tech) => (
                <option key={tech.value} value={tech.value}>
                  {tech.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field narrow">
            <span>Technician BlueFolder ID</span>
            <input
              value={draftTechId}
              onChange={(event) => setDraftTechId(event.target.value)}
              placeholder="9001"
              inputMode="numeric"
            />
          </label>
        )}
        <label className="field narrow">
          <span>Route date</span>
          <input type="date" value={draftRouteDate} onChange={(event) => setDraftRouteDate(event.target.value)} />
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
            setDraftRouteDate("");
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
          <article className="metric-card route-signal-card">
            <p>Distinct areas</p>
            <strong>{routeMetrics.uniqueAreas}</strong>
          </article>
          <article className="metric-card route-signal-card">
            <p>Skipped without address</p>
            <strong>{routePreview?.skippedWithoutAddress || 0}</strong>
          </article>

          <article className="metric-card wide">
            <div className="section-head">
              <p>Route map</p>
              <span className="muted">{mapStatus.detail}</span>
            </div>
            <div className="route-map-status">
              <span>{mapStatus.label}</span>
              <small>
                Path points: {(routePreview?.path || []).length} | Coordinate stops: {(routePreview?.stops || []).filter(hasUsableCoordinates).length} | Static image: {routePreview?.imageUrl ? "yes" : "no"}
              </small>
            </div>
            <RouteMapPanel
              stops={routePreview?.stops || []}
              path={routePreview?.path || []}
              imageUrl={routePreview?.imageUrl || ""}
              selectedStopId={selectedStopId}
              onSelectStop={setSelectedStopId}
            />
          </article>

          <article className="metric-card wide">
            <div className="section-head">
              <p>Stop workspace</p>
              <div className="action-row compact-row">
                <label className="field narrow">
                  <span>Filter stops</span>
                  <input
                    value={stopFilter}
                    onChange={(event) => setStopFilter(event.target.value)}
                    placeholder="SR, city, address, subject"
                  />
                </label>
                <label className="check-field">
                  <input type="checkbox" checked={hideCompleted} onChange={(event) => setHideCompleted(event.target.checked)} />
                  <span>Hide completed</span>
                </label>
                <button type="button" className="secondary-button" onClick={() => setRouteStatus("Route draft saved.")}>
                  Save draft
                </button>
                <button type="button" className="secondary-button" onClick={copyRouteLink}>
                  Copy route
                </button>
              </div>
            </div>
            {routePreview ? (
              <div className="list-stack compact">
                {!canDragReorder && routePreview?.stops?.length > 1 && (
                  <p className="muted">Drag reorder is available when filters and hide-completed are off.</p>
                )}
                {visibleStops.map((stop, index) => {
                  const stopId = getStopIdentity(stop);
                  return (
                  <div
                    key={`${stop.srId}-${stop.address}-${index}`}
                    className={
                      String(selectedStopId) === String(stop.srId)
                        ? "list-row route-stop-row route-stop-row-selected"
                        : "list-row route-stop-row"
                    }
                    draggable={canDragReorder}
                    onDragStart={() => canDragReorder && setDraggedStopId(stopId)}
                    onDragOver={(event) => {
                      if (!canDragReorder) return;
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      reorderStop(draggedStopId, stopId);
                      setDraggedStopId("");
                    }}
                    onDragEnd={() => setDraggedStopId("")}
                  >
                    <div>
                      <strong>
                        {index + 1}. {stop.label}
                      </strong>
                      {canDragReorder && <span className="route-drag-hint">Drag to reorder</span>}
                      <p>{stop.subject || "Service Request"}</p>
                      <p className="muted">{stop.address}</p>
                    </div>
                    <div className="row-meta">
                      <span>
                        {[stop.routeLabel || stop.window || inferCityLabel(stop.address), stop.eta ? `ETA ${stop.eta}` : null, stop.status]
                          .filter(Boolean)
                          .join(" • ") || "No area label"}
                      </span>
                      <div className="route-stop-actions">
                        <button type="button" className="secondary-button" onClick={() => shiftStop(stopId, -1)}>
                          Up
                        </button>
                        <button type="button" className="secondary-button" onClick={() => shiftStop(stopId, 1)}>
                          Down
                        </button>
                      </div>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setSelectedStopId(String(stop.srId || ""))}
                      >
                        Focus on map
                      </button>
                      <button type="button" className="secondary-button" onClick={() => toggleStopComplete(stopId)}>
                        {stop.status === "complete" ? "Reopen" : "Complete"}
                      </button>
                      <button type="button" className="secondary-button" onClick={() => removeStop(stopId)}>
                        Remove
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setExpandedStopId((current) => (current === stopId ? "" : stopId))}
                      >
                        {expandedStopId === stopId ? "Hide details" : "Details"}
                      </button>
                      <button type="button" className="secondary-button" onClick={() => stop.srId && onOpenServiceRequestById?.(stop.srId)}>
                        Open SR
                      </button>
                    </div>
                    {expandedStopId === stopId && (
                      <div className="route-stop-detail-editor">
                        <div className="detail-grid">
                          <Detail label="Service Request" value={stop.srId || stop.id || "draft"} />
                          <Detail label="Window label" value={stop.routeLabel || stop.window || "n/a"} />
                          <label className="field">
                            <span>On-site minutes</span>
                            <input
                              inputMode="numeric"
                              value={stopEditValue(stop, "duration_minutes")}
                              onChange={(event) => updateStopEdit(stopId, { duration_minutes: event.target.value })}
                            />
                          </label>
                          <label className="field">
                            <span>Window start</span>
                            <input
                              type="time"
                              value={stopEditValue(stop, "window_start")}
                              onChange={(event) => updateStopEdit(stopId, { window_start: event.target.value })}
                            />
                          </label>
                          <label className="field">
                            <span>Window end</span>
                            <input
                              type="time"
                              value={stopEditValue(stop, "window_end")}
                              onChange={(event) => updateStopEdit(stopId, { window_end: event.target.value })}
                            />
                          </label>
                          <label className="field">
                            <span>Status</span>
                            <select
                              value={stopEditValue(stop, "status")}
                              onChange={(event) => updateStopEdit(stopId, { status: event.target.value })}
                            >
                              <option value="scheduled">scheduled</option>
                              <option value="in-progress">in-progress</option>
                              <option value="complete">complete</option>
                              <option value="draft">draft</option>
                            </select>
                          </label>
                        </div>
                        <div className="action-row compact-row">
                          <button type="button" onClick={() => applyStopEdit(stop)}>
                            Apply stop edits
                          </button>
                          {buildBlueFolderUrl(stop) && (
                            <a className="route-link button-link" href={buildBlueFolderUrl(stop)} target="_blank" rel="noreferrer">
                              Open in BlueFolder
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )})}
                {!visibleStops.length && <p className="muted">No stops match the current filter.</p>}
              </div>
            ) : (
              <p className="muted">Select a technician or jump in from board/SR attention to load route context.</p>
            )}
            <div className="detail-block">
              <div className="section-head">
                <p>Add ad-hoc stop</p>
              </div>
              <div className="detail-grid">
                <label className="field">
                  <span>Label</span>
                  <input value={newStop.name} onChange={(event) => setNewStop((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Address</span>
                  <input value={newStop.address} onChange={(event) => setNewStop((current) => ({ ...current, address: event.target.value }))} />
                </label>
                <label className="field">
                  <span>On-site minutes</span>
                  <input
                    inputMode="numeric"
                    value={newStop.durationMinutes}
                    onChange={(event) => setNewStop((current) => ({ ...current, durationMinutes: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Window start</span>
                  <input type="time" value={newStop.windowStart} onChange={(event) => setNewStop((current) => ({ ...current, windowStart: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Window end</span>
                  <input type="time" value={newStop.windowEnd} onChange={(event) => setNewStop((current) => ({ ...current, windowEnd: event.target.value }))} />
                </label>
              </div>
              <div className="action-row">
                <button type="button" onClick={addAdHocStop}>
                  Add stop
                </button>
              </div>
            </div>
          </article>

          <article className="metric-card wide">
            <div className="section-head">
              <p>Technician workspace</p>
              <label className="field narrow">
                <span>Filter techs</span>
                <input value={techFilter} onChange={(event) => setTechFilter(event.target.value)} placeholder="Name or area" />
              </label>
            </div>
            <div className="list-stack compact">
              {filteredTechnicians.map((tech) => (
                <div
                  key={tech.value}
                  className={
                    String(draftTechId) === String(tech.value)
                      ? "list-row route-tech-row route-tech-row-selected"
                      : "list-row route-tech-row"
                  }
                >
                  <button type="button" className="card-button-reset" onClick={() => setDraftTechId(tech.value)}>
                    <strong>{tech.label}</strong>
                    <p>{tech.originAddress || "Origin not set"}</p>
                  </button>
                  <div className="row-meta">
                    <span>BF {tech.value}</span>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => onSetDefaultTechnician?.(String(tech.value))}
                    >
                      {String(defaultTechnicianId) === String(tech.value) ? "Default route tech" : "Set default"}
                    </button>
                  </div>
                </div>
              ))}
              {!filteredTechnicians.length && <p className="muted">No technicians match the current filter.</p>}
            </div>
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
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleCopy(buildRouteBrief(routePreview, mapStatus, validation), "Copied route brief.")}
                >
                  Copy route brief
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
              <Detail label="Route date" value={routePreview?.routeDate || draftRouteDate || "today"} />
              <Detail label="Assignments" value={routePreview?.assignmentsConsidered} />
              <Detail label="First stop" value={routeMetrics.firstStop} />
              <Detail label="Last stop" value={routeMetrics.lastStop} />
              <Detail label="Origin" value={routePreview?.originAddress || "default"} />
              <Detail label="Destination" value={routePreview?.destinationAddress || "default"} />
              <Detail label="Optimization" value={routePreview?.optimized ? "enabled" : "off"} />
            </div>
          </article>

          <article className="metric-card">
            <p>Stops</p>
            <strong>{routeMetrics.stopCount}</strong>
          </article>
          <article className="metric-card">
            <p>Visible after filter</p>
            <strong>{routeMetrics.filteredCount}</strong>
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
            <p>Validation and share</p>
            <div className="detail-grid">
              <Detail label="Late stops" value={validation.lateCount} />
              <Detail label="Suggested first stop" value={validation.suggestedFirstStop} />
            </div>
            <div className="action-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.open(`mailto:?subject=${encodeURIComponent(`Route for ${draftRouteDate || "today"}`)}&body=${encodeURIComponent(buildRouteUrl())}`, "_blank")}
              >
                Email route
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.open(`sms:?&body=${encodeURIComponent(buildRouteUrl())}`, "_blank")}
              >
                SMS route
              </button>
              {shareStatus && <span className="muted">{shareStatus}</span>}
            </div>
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

function hasUsableCoordinates(stop) {
  const lat = Number(stop?.lat ?? stop?.latitude ?? stop?.coords?.[0]);
  const lng = Number(stop?.lng ?? stop?.lon ?? stop?.longitude ?? stop?.coords?.[1]);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function getStopIdentity(stop) {
  return String(stop?.id || stop?.srId || stop?.service_request_id || stop?.label || stop?.address || "");
}

function buildBlueFolderUrl(stop) {
  const srId = stop?.srId || stop?.service_request_id || stop?.id;
  if (!BLUEFOLDER_ACCOUNT_NAME || !srId || String(srId).startsWith("adhoc-")) return "";
  return `https://${BLUEFOLDER_ACCOUNT_NAME}.bluefolder.com/service/srLog.aspx?srid=${encodeURIComponent(srId)}`;
}

function buildManifest(stops) {
  if (!stops.length) return "";
  return stops
    .map((stop, index) => `${index + 1}. ${stop.label} | ${stop.subject || "Service Request"} | ${stop.address}`)
    .join("\n");
}

function buildRouteBrief(routePreview, mapStatus, validation) {
  if (!routePreview) return "";
  return [
    `RouteDesk brief for ${routePreview.technicianLabel || "technician"} on ${routePreview.routeDate || "today"}`,
    `Stops: ${(routePreview.stops || []).length}`,
    `Map: ${mapStatus?.label || "unknown"}`,
    `Late stops: ${validation?.lateCount ?? 0}`,
    `Suggested first stop: ${validation?.suggestedFirstStop || "n/a"}`,
    `First/last: ${(routePreview.stops || [])[0]?.label || "n/a"} -> ${(routePreview.stops || []).at(-1)?.label || "n/a"}`,
  ].join("\n");
}

function formatMetric(value) {
  if (value === undefined || value === null || value === "") return "n/a";
  if (typeof value === "number") return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  return `${value}`;
}

function loadRouteDraft() {
  return readStoredJson(localStorage, ROUTE_DRAFT_KEY);
}

function saveRouteDraft(value) {
  localStorage.setItem(ROUTE_DRAFT_KEY, JSON.stringify(value));
}

function clearRouteDraft() {
  localStorage.removeItem(ROUTE_DRAFT_KEY);
}

function readStoredJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    storage.removeItem(key);
    return null;
  }
}
