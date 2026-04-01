import { useMemo, useState } from "react";

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
  onRefresh,
  onSelectItem,
  selectedItem,
  selectedItemDetail,
  actionState,
  onAction,
  onOpenServiceRequest,
  onOpenRoutes,
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const visibleItems = useMemo(() => {
    return (items || []).filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const current = item?.[key] ?? item?.[camelFromSnake(key)] ?? "";
        return String(current).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [filters, items]);

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
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={onRefresh}>
            Refresh
          </button>
        </div>

        {loading && <p>Loading attention queue…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && visibleItems.length === 0 && <p>No attention items match the current filters.</p>}

        <div className="list-stack">
          {visibleItems.map((item) => (
            <button
              key={item.itemId || item.item_id}
              className={selectedItem?.itemId === item.itemId ? "attention-card selected" : "attention-card"}
              type="button"
              onClick={() => onSelectItem(item)}
            >
              <div className="attention-card-top">
                <strong>{item.reference || item.srReference || "SR"}</strong>
                <span>{item.stageLabel || item.stage || "Stage"}</span>
              </div>
              <p>{item.nextAction || item.summary || "No next action text yet."}</p>
              <div className="attention-card-meta">
                <span>Status: {item.status || "open"}</span>
                <span>Age: {item.ageBucket || item.age_bucket || "n/a"}</span>
                <span>Owner: {item.followUpOwnerLabel || item.follow_up_owner_label || "unassigned"}</span>
              </div>
            </button>
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
      />
    </section>
  );
}

function AttentionDetail({ item, history, actionState, onAction, onOpenServiceRequest, onOpenRoutes }) {
  const [ownerId, setOwnerId] = useState("");
  const [snoozeHours, setSnoozeHours] = useState("4");

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
      </div>

      <div className="detail-grid">
        <DetailValue label="Status" value={item.status} />
        <DetailValue label="Age bucket" value={item.ageBucket} />
        <DetailValue label="Owner" value={item.assignedOwnerLabel || item.ownerLabel || "unassigned"} />
        <DetailValue label="Technician" value={item.technicianLabel || "n/a"} />
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
