import { useEffect, useMemo, useState } from "react";
import { isTriageStage } from "./triageStages";

const DEFAULT_FILTERS = {
  stage: "",
  age: "",
  status: "",
  reference: "",
};

export default function AttentionView({
  items,
  meta = null,
  ownerOptions = [],
  loading,
  error,
  initialFilters = DEFAULT_FILTERS,
  initialSortBy = "priority",
  onPreferencesChange,
  onRefresh,
  onSelectItem,
  selectedItem,
  selectedItemDetail,
  complaintIntelligence,
  actionState,
  onAction,
  onBulkAction,
  onOpenServiceRequest,
  onOpenRoutes,
  onOpenServiceRequestById,
  mode = "attention",
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
  }, [filters, sortBy]);

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
  const actionableVisibleIds = visibleItems
    .filter((item) => item.status === "open" && !item.readOnly)
    .slice(0, 20)
    .map((item) => item.itemId);
  const selectedActionableIds = selectedIds.filter((itemId) => {
    const item = visibleItems.find((candidate) => candidate.itemId === itemId);
    return item && !item.readOnly;
  });
  const queueSummary = useMemo(() => {
    const allItems = items || [];
    return {
      open: allItems.filter((item) => item.status === "open").length,
      discovery: allItems.filter((item) => item.readOnly).length,
      urgent: allItems.filter((item) => (item.ageBucket || item.age_bucket) === "urgent").length,
      ownerGaps: allItems.filter((item) => !item.assignedOwnerBluefolderUserId && !item.assignedOwnerDiscordUserId).length,
      visible: visibleItems.length,
    };
  }, [items, visibleItems.length]);
  const isTriageMode = mode === "triage";
  const toolbarContent = (
    <>
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
        <button type="button" onClick={() => setFilters((current) => ({ ...current, stage: "bluefolder_discovery" }))}>
          Discovery only
        </button>
        <button
          type="button"
          onClick={() => setSelectedIds(visibleItems.filter((item) => !item.readOnly).slice(0, 25).map((item) => item.itemId))}
        >
          Select visible
        </button>
        <button type="button" onClick={() => setSelectedIds([])}>
          Clear selection
        </button>
        <button
          type="button"
          disabled={!actionableVisibleIds.length}
          onClick={() => {
            onBulkAction("ack", actionableVisibleIds);
            setSelectedIds([]);
          }}
        >
          Ack visible
        </button>
        <button
          type="button"
          disabled={!selectedActionableIds.length}
          onClick={() => {
            onBulkAction("ack", selectedActionableIds);
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
          <span>Bulk owner</span>
          <select value={bulkOwnerId} onChange={(event) => setBulkOwnerId(event.target.value)}>
            <option value="">Select owner</option>
            {ownerOptions.map((option) => (
              <option key={option.bluefolderUserId} value={option.bluefolderUserId}>
                {formatOwnerOption(option)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!selectedActionableIds.length || !bulkOwnerId}
          onClick={() => onBulkAction("assign", selectedActionableIds, { assignedOwnerBluefolderUserId: Number.parseInt(bulkOwnerId, 10) })}
        >
          Assign selected
        </button>
        <button type="button" disabled={!selectedActionableIds.length} onClick={() => onBulkAction("clear_owner", selectedActionableIds)}>
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
          disabled={!selectedActionableIds.length}
          onClick={() => onBulkAction("snooze", selectedActionableIds, { hours: Number.parseInt(bulkSnoozeHours, 10) || 1 })}
        >
          Snooze selected
        </button>
      </div>
    </>
  );

  return (
    <section className={isTriageMode ? "panel attention-layout triage-decision-layout" : "panel attention-layout"}>
      <div className="attention-column">
        <div className="workflow-strip compact">
          <span>Pick urgent</span>
          <span>Assign owner</span>
          <span>Ack or snooze</span>
          <span>Open SR</span>
        </div>
        <div className="board-grid compact attention-summary-grid">
          <article className="metric-card">
            <p>{isTriageMode ? "To decide" : "Open"}</p>
            <strong>{queueSummary.open}</strong>
          </article>
          <article className="metric-card">
            <p>{isTriageMode ? "Unowned" : "Discovery"}</p>
            <strong>{isTriageMode ? queueSummary.ownerGaps : meta?.discoveryJobs ?? queueSummary.discovery}</strong>
          </article>
          <article className="metric-card">
            <p>Urgent</p>
            <strong>{queueSummary.urgent}</strong>
          </article>
          <article className="metric-card">
            <p>Visible</p>
            <strong>{queueSummary.visible}</strong>
          </article>
        </div>
        {meta?.scannedJobs !== undefined && (
          <p className="muted">OpsHub scanned {meta.scannedJobs} job{Number(meta.scannedJobs) === 1 ? "" : "s"} for this queue.</p>
        )}
        <div className="attention-toolbar">
          <details className="control-disclosure">
            <summary>{isTriageMode ? "Filters and bulk actions" : "Filters, sort, and bulk actions"}</summary>
            {toolbarContent}
          </details>
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
                    disabled={item.readOnly}
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
                {item.readOnly && <span className="queue-chip">Discovery</span>}
                {!item.assignedOwnerBluefolderUserId && !item.assignedOwnerDiscordUserId && <span className="queue-chip">Owner gap</span>}
                {isTriageStage(item.stage) && <span className="queue-chip">Triage</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AttentionDetail
        item={selectedItemDetail?.item || selectedItem}
        history={selectedItemDetail?.history || []}
        complaintIntelligence={complaintIntelligence}
        actionState={actionState}
        ownerOptions={ownerOptions}
        onAction={onAction}
        onOpenServiceRequest={onOpenServiceRequest}
        onOpenRoutes={onOpenRoutes}
        onOpenServiceRequestById={onOpenServiceRequestById}
      />
    </section>
  );
}

function AttentionDetail({
  item,
  history,
  complaintIntelligence,
  actionState,
  ownerOptions,
  onAction,
  onOpenServiceRequest,
  onOpenRoutes,
  onOpenServiceRequestById,
}) {
  const [ownerId, setOwnerId] = useState("");
  const [snoozeHours, setSnoozeHours] = useState("4");
  const [triageDisposition, setTriageDisposition] = useState("schedule_normal");
  const [triageDetails, setTriageDetails] = useState("");
  const isReadOnly = Boolean(item?.readOnly);

  useEffect(() => {
    setOwnerId(item?.assignedOwnerBluefolderUserId ? String(item.assignedOwnerBluefolderUserId) : "");
  }, [item?.assignedOwnerBluefolderUserId, item?.itemId]);

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
        {isReadOnly && <p className="muted">Read-only discovery candidate. Open the SR to decide the next workflow action.</p>}
      </div>

      <div className="detail-grid">
        <DetailValue label="Status" value={item.status} />
        <DetailValue label="Age bucket" value={item.ageBucket} />
        <DetailValue label="Owner" value={item.assignedOwnerLabel || "unassigned"} />
        <DetailValue label="Technician" value={item.technicianLabel || "n/a"} />
        <DetailValue label="Acknowledged" value={item.acknowledgedAt || "not yet"} />
        <DetailValue label="Snoozed until" value={item.snoozedUntil || "not snoozed"} />
      </div>

      <div className="action-row">
        <button type="button" disabled={isReadOnly} onClick={() => onAction(item.itemId, "ack")}>
          Ack
        </button>
        <button type="button" disabled={isReadOnly} onClick={() => onAction(item.itemId, "reopen")}>
          Reopen
        </button>
        <button type="button" disabled={isReadOnly} onClick={() => onAction(item.itemId, "unsnooze")}>
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
          disabled={isReadOnly}
          onClick={() => onAction(item.itemId, "snooze", { hours: Number.parseInt(snoozeHours, 10) || 1 })}
        >
          Apply snooze
        </button>
      </div>

      <div className="inline-form-row">
        <label className="field slim">
          <span>Assign owner</span>
          <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
            <option value="">Select owner</option>
            {(ownerOptions || []).map((option) => (
              <option key={option.bluefolderUserId} value={option.bluefolderUserId}>
                {formatOwnerOption(option)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={isReadOnly || !ownerId}
          onClick={() =>
            onAction(item.itemId, "assign", {
              assignedOwnerBluefolderUserId: Number.parseInt(ownerId, 10),
            })
          }
        >
          Assign
        </button>
        <button type="button" disabled={isReadOnly} onClick={() => onAction(item.itemId, "clear_owner")}>
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
              disabled={isReadOnly}
              onClick={() => onAction(item.itemId, "triage_disposition", { disposition: triageDisposition, details: triageDetails })}
            >
              Apply triage
            </button>
          </div>
        </div>
      )}

      {isTriageStage(item.stage) && (
        <ComplaintEvidenceCard complaintIntelligence={complaintIntelligence} />
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

function ComplaintEvidenceCard({ complaintIntelligence }) {
  if (!complaintIntelligence) {
    return (
      <div className="detail-block">
        <strong>Complaint evidence</strong>
        <p className="muted">Select a triage item with an SR to load historical evidence.</p>
      </div>
    );
  }
  if (complaintIntelligence.loading) {
    return (
      <div className="detail-block">
        <strong>Complaint evidence</strong>
        <p className="muted">Loading historical complaint evidence…</p>
      </div>
    );
  }
  if (!complaintIntelligence.available) {
    return (
      <div className="detail-block">
        <strong>Complaint evidence</strong>
        <p className="muted">{complaintIntelligence.message || "No complaint evidence is available for this SR."}</p>
      </div>
    );
  }

  const evidencePacket = complaintIntelligence.evidencePacket || {};
  const classification = evidencePacket.classification || {};
  const recommendations = complaintIntelligence.recommendations || evidencePacket.rankedParts || [];
  const questions = evidencePacket.diagnosticQuestions || [];
  const confidence = evidencePacket.confidence || complaintIntelligence.confidence || "unknown";
  const matchScope = classification.matchScope || complaintIntelligence.matchScope || "unknown";

  return (
    <div className="detail-block command-brief">
      <strong>Complaint evidence</strong>
      <div className="detail-grid single">
        <DetailValue label="Scope" value={formatEvidenceToken(matchScope)} />
        <DetailValue label="Confidence" value={formatEvidenceToken(confidence)} />
      </div>
      <div className="chip-list">
        {(complaintIntelligence.complaintTags || []).slice(0, 6).map((tag) => (
          <span key={tag.tag || tag} className="queue-chip">{tag.tag || tag}</span>
        ))}
        {!(complaintIntelligence.complaintTags || []).length && <span className="muted">No tags matched.</span>}
      </div>
      <div className="history-list">
        {recommendations.slice(0, 3).map((part) => (
          <div key={`${part.itemType || part.item_type}-${part.item}`} className="history-entry">
            <p>{part.item}</p>
            <span>
              {[part.itemType || part.item_type, `${part.matchingRequestCount || part.matching_request_count || 0} matching SRs`, formatEvidenceScore(part.score)]
                .filter(Boolean)
                .join(" • ")}
            </span>
          </div>
        ))}
        {!recommendations.length && <p className="muted">No supported part recommendation yet. Use diagnostic-first handling.</p>}
      </div>
      {!!questions.length && (
        <div className="history-list">
          {questions.slice(0, 2).map((question, index) => (
            <div key={`${question}-${index}`} className="history-entry">
              <small>{question}</small>
            </div>
          ))}
        </div>
      )}
    </div>
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

function compareAttentionItems(left, right, sortBy) {
  if (sortBy === "reference") {
    return String(left.reference || "").localeCompare(String(right.reference || ""));
  }
  if (sortBy === "age") {
    return (Number(right.ageHours || 0) - Number(left.ageHours || 0)) || String(left.reference || "").localeCompare(String(right.reference || ""));
  }
  if (sortBy === "owner_gap") {
    return Number(Boolean(!(left.assignedOwnerBluefolderUserId || left.assignedOwnerDiscordUserId))) <
      Number(Boolean(!(right.assignedOwnerBluefolderUserId || right.assignedOwnerDiscordUserId)))
      ? 1
      : -1;
  }
  return priorityScore(right) - priorityScore(left) || (Number(right.ageHours || 0) - Number(left.ageHours || 0));
}

function priorityScore(item) {
  let score = 0;
  const bucket = String(item.ageBucket || "").toLowerCase();
  if (bucket === "urgent") score += 100;
  else if (bucket === "stale") score += 50;
  else if (bucket === "warm") score += 25;
  if (!(item.assignedOwnerBluefolderUserId || item.assignedOwnerDiscordUserId)) score += 30;
  if (isTriageStage(item.stage)) score += 10;
  return score;
}

function quickChip(value, expected) {
  return String(value || "").toLowerCase() === expected;
}

function formatOwnerOption(option) {
  const label = String(option?.label || "").trim() || `BF ${option?.bluefolderUserId || ""}`.trim();
  const role = String(option?.role || "").trim();
  return role ? `${label} (${role})` : label;
}

function formatEvidenceToken(value) {
  return String(value || "unknown").replaceAll("_", " ");
}

function formatEvidenceScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return `${Math.round(numeric * 100)}%`;
}
