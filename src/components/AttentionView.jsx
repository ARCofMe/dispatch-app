import { useEffect, useMemo, useState } from "react";

const DEFAULT_FILTERS = {
  stage: "",
  age: "",
  status: "",
  reference: "",
};

export default function AttentionView({
  items,
  loading,
  error,
  initialFilters = DEFAULT_FILTERS,
  initialSortBy = "priority",
  onPreferencesChange,
  onRefresh,
  onSelectItem,
  selectedItem,
  selectedItemDetail,
  actionState,
  onAction,
  onBulkAction,
  onOpenServiceRequest,
  onOpenRoutes,
  onOpenServiceRequestById,
}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...(initialFilters || {}) });
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOwnerId, setBulkOwnerId] = useState("");
  const [bulkSnoozeHours, setBulkSnoozeHours] = useState("4");

  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS, ...(initialFilters || {}) });
    setSortBy(initialSortBy || "priority");
  }, [initialFilters, initialSortBy]);

  useEffect(() => {
    onPreferencesChange?.({ filters, sortBy });
  }, [filters, sortBy, onPreferencesChange]);

  const visibleItems = useMemo(() => {
    const filtered = (items || []).filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const current = item?.[key] ?? item?.[camelFromSnake(key)] ?? "";
        return String(current).toLowerCase().includes(value.toLowerCase());
      });
    });
    return filtered.sort((left, right) => compareAttentionItems(left, right, sortBy));
  }, [filters, items, sortBy]);

  return (
    <section className="panel attention-layout">
      <div className="attention-column">
        <div className="attention-toolbar">
          <div className="filter-grid">
            {Object.keys(DEFAULT_FILTERS).map((key) => (
              <label key={key} className="field">
                <span>{labelFor(key)}</span>
                <input
                  value={filters[key]}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={key === "reference" ? "SR-1234" : ""}
                />
              </label>
            ))}
            <label className="field">
              <span>Sort</span>
              <input list="attention-sorts" value={sortBy} onChange={(event) => setSortBy(event.target.value)} />
              <datalist id="attention-sorts">
                <option value="priority" />
                <option value="age" />
                <option value="reference" />
                <option value="owner_gap" />
              </datalist>
            </label>
          </div>
          <div className="action-row">
            <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</button>
            <button
              type="button"
              onClick={() => setSelectedIds(visibleItems.slice(0, 25).map((item) => item.itemId))}
            >
              Select visible
            </button>
            <button type="button" onClick={() => setSelectedIds([])}>
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => {
                onBulkAction(
                  "ack",
                  visibleItems
                    .slice(0, 20)
                    .filter((item) => item.status === "open")
                    .map((item) => item.itemId)
                );
                setSelectedIds([]);
              }}
            >
              Ack visible
            </button>
            <button
              type="button"
              disabled={!selectedIds.length}
              onClick={() => {
                onBulkAction("ack", selectedIds);
                setSelectedIds([]);
              }}
            >
              Ack selected
            </button>
            <span className="muted">Selected: {selectedIds.length}</span>
            <button type="button" onClick={onRefresh}>
              Refresh
            </button>
          </div>

          <div className="action-row">
            <label className="field slim">
              <span>Bulk owner ID</span>
              <input value={bulkOwnerId} onChange={(event) => setBulkOwnerId(event.target.value)} inputMode="numeric" />
            </label>
            <button
              type="button"
              disabled={!selectedIds.length}
              onClick={() => onBulkAction("assign", selectedIds, { assignedOwnerDiscordUserId: Number.parseInt(bulkOwnerId, 10) || 0 })}
            >
              Assign selected
            </button>
            <button type="button" disabled={!selectedIds.length} onClick={() => onBulkAction("clear_owner", selectedIds)}>
              Clear owner
            </button>
            <label className="field slim">
              <span>Bulk snooze</span>
              <input
                value={bulkSnoozeHours}
                onChange={(event) => setBulkSnoozeHours(event.target.value)}
                inputMode="numeric"
              />
            </label>
            <button
              type="button"
              disabled={!selectedIds.length}
              onClick={() => onBulkAction("snooze", selectedIds, { hours: Number.parseInt(bulkSnoozeHours, 10) || 1 })}
            >
              Snooze selected
            </button>
          </div>
        </div>

        {loading && <p>Loading attention queue…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && visibleItems.length === 0 && <p>No attention items match the current filters.</p>}

        <div className="list-stack">
          {visibleItems.map((item) => (
            <div
              key={item.itemId || item.item_id}
              className={selectedItem?.itemId === item.itemId ? "attention-card selected" : "attention-card"}
            >
              <div className="attention-card-top">
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.itemId)}
                    onChange={(event) => {
                      setSelectedIds((current) =>
                        event.target.checked ? [...current, item.itemId] : current.filter((value) => value !== item.itemId)
                      );
                    }}
                  />
                  <strong>{item.reference || item.srReference || "SR"}</strong>
                </label>
                <span>{item.stageLabel || item.stage || "Stage"}</span>
              </div>
              <button className="card-button-reset" type="button" onClick={() => onSelectItem(item)}>
                <p>{item.nextAction || item.summary || "No next action text yet."}</p>
                <div className="attention-card-meta">
                  <span>Status: {item.status || "open"}</span>
                  <span>Age: {item.ageBucket || item.age_bucket || "n/a"}</span>
                  <span>Owner: {item.followUpOwnerLabel || item.follow_up_owner_label || "unassigned"}</span>
                </div>
              </button>
              <div className="chip-list">
                {quickChip(item.ageBucket || item.age_bucket, "urgent") && <span className="queue-chip danger-chip">Urgent</span>}
                {!item.assignedOwnerDiscordUserId && <span className="queue-chip">Owner gap</span>}
                {isTriageStage(item.stage) && <span className="queue-chip">Triage</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AttentionDetail
        item={selectedItemDetail?.item || selectedItem}
        history={selectedItemDetail?.history || []}
        actionState={actionState}
        onAction={onAction}
        onOpenServiceRequest={onOpenServiceRequest}
        onOpenRoutes={onOpenRoutes}
        onOpenServiceRequestById={onOpenServiceRequestById}
      />
    </section>
  );
}

function AttentionDetail({ item, history, actionState, onAction, onOpenServiceRequest, onOpenRoutes, onOpenServiceRequestById }) {
  const [ownerId, setOwnerId] = useState("");
  const [snoozeHours, setSnoozeHours] = useState("4");
  const [triageDisposition, setTriageDisposition] = useState("schedule_normal");
  const [triageDetails, setTriageDetails] = useState("");

  if (!item) {
    return (
      <aside className="detail-panel">
        <p className="muted">Select an attention item to inspect history and take action.</p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="detail-head">
        <div>
          <p className="section-kicker">Attention detail</p>
          <h3>{item.reference}</h3>
        </div>
        <span className="status-pill">{item.stageLabel || item.stage}</span>
      </div>

      <div className="detail-block">
        <strong>Next action</strong>
        <p>{item.nextAction || "No next action yet."}</p>
        {item.summary && <p className="muted">Summary: {item.summary}</p>}
        {item.details && <p className="muted">Details: {item.details}</p>}
        {item.location && <p className="muted">Location: {item.location}</p>}
        {item.routeLabel && <p className="muted">Window: {item.routeLabel}</p>}
      </div>

      <div className="detail-grid">
        <DetailValue label="Status" value={item.status} />
        <DetailValue label="Age bucket" value={item.ageBucket} />
        <DetailValue label="Owner" value={item.assignedOwnerLabel || item.ownerLabel || "unassigned"} />
        <DetailValue label="Technician" value={item.technicianLabel || "n/a"} />
        <DetailValue label="Acknowledged" value={item.acknowledgedAt || "not yet"} />
        <DetailValue label="Snoozed until" value={item.snoozedUntil || "not snoozed"} />
      </div>

      <div className="action-row">
        <button type="button" onClick={() => onAction(item.itemId, "ack")}>
          Ack
        </button>
        <button type="button" onClick={() => onAction(item.itemId, "reopen")}>
          Reopen
        </button>
        <button type="button" onClick={() => onAction(item.itemId, "unsnooze")}>
          Unsnooze
        </button>
        <button type="button" onClick={() => onOpenServiceRequest(item)}>
          Open SR
        </button>
        <button type="button" onClick={() => onOpenRoutes(item)}>
          Open routes
        </button>
      </div>

      <div className="inline-form-row">
        <label className="field slim">
          <span>Snooze hours</span>
          <input value={snoozeHours} onChange={(event) => setSnoozeHours(event.target.value)} inputMode="numeric" />
        </label>
        <button
          type="button"
          onClick={() => onAction(item.itemId, "snooze", { hours: Number.parseInt(snoozeHours, 10) || 1 })}
        >
          Apply snooze
        </button>
      </div>

      <div className="inline-form-row">
        <label className="field slim">
          <span>Assign owner Discord ID</span>
          <input value={ownerId} onChange={(event) => setOwnerId(event.target.value)} inputMode="numeric" />
        </label>
        <button
          type="button"
          onClick={() =>
            onAction(item.itemId, "assign", {
              assignedOwnerDiscordUserId: Number.parseInt(ownerId, 10) || 0,
            })
          }
        >
          Assign
        </button>
        <button type="button" onClick={() => onAction(item.itemId, "clear_owner")}>
          Clear owner
        </button>
      </div>

      {isTriageStage(item.stage) && (
        <div className="detail-block">
          <strong>Triage disposition</strong>
          <div className="inline-form-row">
            <label className="field slim">
              <span>Disposition</span>
              <input
                list="triage-dispositions"
                value={triageDisposition}
                onChange={(event) => setTriageDisposition(event.target.value)}
              />
              <datalist id="triage-dispositions">
                <option value="schedule_normal" />
                <option value="collect_info" />
                <option value="parts_first" />
                <option value="diag_first" />
                <option value="quote_before_schedule" />
              </datalist>
            </label>
            <label className="field slim">
              <span>Details</span>
              <input value={triageDetails} onChange={(event) => setTriageDetails(event.target.value)} placeholder="Why this disposition?" />
            </label>
            <button
              type="button"
              onClick={() => onAction(item.itemId, "triage_disposition", { disposition: triageDisposition, details: triageDetails })}
            >
              Apply triage
            </button>
          </div>
        </div>
      )}

      {actionState && <p className={actionState.error ? "error-text" : "muted"}>{actionState.message}</p>}

      <div className="detail-block">
        <strong>History</strong>
        <div className="history-list">
          {history.length ? (
            history.map((event, index) => (
              <div key={`${event.occurredAt}-${index}`} className="history-entry">
                <p>{event.summary}</p>
                <span>
                  {event.occurredAt || "unknown"} • {event.actorLabel || event.source}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">No workflow history yet.</p>
          )}
        </div>
      </div>

      {item.srId && (
        <div className="action-row">
          <button type="button" onClick={() => onOpenServiceRequestById?.(item.srId)}>Open SR {item.srId}</button>
        </div>
      )}
    </aside>
  );
}

function DetailValue({ label, value }) {
  return (
    <div className="detail-value">
      <span>{label}</span>
      <strong>{value || "n/a"}</strong>
    </div>
  );
}

function camelFromSnake(value) {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function labelFor(key) {
  if (key === "reference") return "Reference";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function isTriageStage(stage) {
  return [
    "new_sr_triage",
    "model_serial_needed",
    "likely_parts_previsit",
    "diagnostic_required",
    "previsit_quote_needed",
  ].includes(stage);
}

function compareAttentionItems(left, right, sortBy) {
  if (sortBy === "reference") {
    return String(left.reference || "").localeCompare(String(right.reference || ""));
  }
  if (sortBy === "age") {
    return (Number(right.ageHours || 0) - Number(left.ageHours || 0)) || String(left.reference || "").localeCompare(String(right.reference || ""));
  }
  if (sortBy === "owner_gap") {
    return Number(Boolean(!left.assignedOwnerDiscordUserId)) < Number(Boolean(!right.assignedOwnerDiscordUserId)) ? 1 : -1;
  }
  return priorityScore(right) - priorityScore(left) || (Number(right.ageHours || 0) - Number(left.ageHours || 0));
}

function priorityScore(item) {
  let score = 0;
  const bucket = String(item.ageBucket || "").toLowerCase();
  if (bucket === "urgent") score += 100;
  else if (bucket === "stale") score += 50;
  else if (bucket === "warm") score += 25;
  if (!item.assignedOwnerDiscordUserId) score += 30;
  if (isTriageStage(item.stage)) score += 10;
  return score;
}

function quickChip(value, expected) {
  return String(value || "").toLowerCase() === expected;
}
