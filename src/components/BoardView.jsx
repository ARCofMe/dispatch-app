import { technicianDisplayLabel } from "./labelUtils";

function metricValue(payload, ...keys) {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return "n/a";
}

function queueEntries(payload) {
  const metrics = payload?.attentionMetrics || {};
  const queueCounts = metrics.queueCounts || payload?.queueCounts || {};
  return Object.entries(queueCounts)
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([key, value]) => ({ key, value }));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function allTechniciansIdle(payload) {
  const technicianLoad = asArray(payload?.technicianLoad);
  return technicianLoad.length > 0 && technicianLoad.every((tech) => Number(tech.assignmentCount || 0) === 0);
}

function formatCountMap(values) {
  if (!values || typeof values !== "object") return "No catalog loaded";
  const entries = Object.entries(values).filter(([, value]) => Number(value || 0) > 0);
  if (!entries.length) return "No catalog groups";
  return entries
    .sort((left, right) => Number(right[1] || 0) - Number(left[1] || 0))
    .map(([key, value]) => `${key.replaceAll("_", " ")} ${value}`)
    .join(" · ");
}

function formatDecision(item) {
  return [item?.recommendedItem, item?.decision, item?.modelNumber || item?.complaintTag].filter(Boolean).join(" · ");
}

function commandBrief(board) {
  const load = asArray(board?.technicianLoad);
  const topTech = load
    .filter((tech) => Number(tech.assignmentCount || 0) > 0)
    .sort((left, right) => Number(right.assignmentCount || 0) - Number(left.assignmentCount || 0))[0];
  const topAttention = asArray(board?.topAttention)[0];
  const queues = queueEntries(board);
  const hotQueue = queues.sort((left, right) => Number(right.value || 0) - Number(left.value || 0))[0];
  const items = [];

  if (topAttention) {
    items.push({
      label: "First risk",
      value: topAttention.reference,
      detail: topAttention.nextAction || topAttention.stageLabel || topAttention.stage || "Open attention item",
    });
  }

  if (topTech) {
    items.push({
      label: "Loaded tech",
      value: topTech.technicianLabel || "Technician",
      detail: `${topTech.assignmentCount || 0} jobs${topTech.nextJob?.summary ? ` · Next: ${topTech.nextJob.summary}` : ""}`,
    });
  }

  if (hotQueue) {
    items.push({
      label: "Hot queue",
      value: hotQueue.key.replaceAll("_", " "),
      detail: `${hotQueue.value} item${Number(hotQueue.value) === 1 ? "" : "s"} waiting`,
    });
  }

  if (Number(board?.openPartsCases || 0) > 0) {
    items.push({
      label: "Parts drag",
      value: String(board.openPartsCases),
      detail: "Open parts cases can block dispatch completion",
    });
  }

  if (!items.length) {
    items.push({
      label: "Board state",
      value: "Clean",
      detail: "No attention, route load, or parts blockers detected.",
    });
  }

  return items.slice(0, 4);
}

function boardRoleLabel(tech) {
  const role = String(tech?.bluefolderRole || "").trim().toLowerCase();
  if (!role) return null;
  if (role === "technician") return "Technician";
  if (role === "dispatch") return "Dispatch";
  if (role === "admin") return "Admin";
  if (role === "other") return tech?.bluefolderUserType || "Other";
  return tech?.bluefolderUserType || role;
}

export default function BoardView({
  board,
  complaintDashboard,
  complaintReviewQueue,
  complaintReviewAction,
  statusCatalog,
  loading,
  error,
  onOpenAttention,
  onOpenAttentionItem,
  onOpenServiceRequest,
  onOpenRoutes,
  onSeedComplaintFeedback,
  onResolveComplaintReview,
  onRefresh,
  technicianOptions = [],
}) {
  if (loading) return <section className="panel">Loading board…</section>;
  if (error && !board) return <section className="panel error-panel">{error}</section>;
  if (!board) return <section className="panel">Board is not loaded yet.</section>;

  const metrics = [
    ["Visible BF users", metricValue(board, "visibleOperators")],
    ["Visible techs", metricValue(board, "mappedTechs")],
    ["Discord-linked", metricValue(board, "discordLinkedTechs")],
    ["Active techs", metricValue(board, "activeTechs")],
    ["Visible assignments", metricValue(board, "totalVisibleAssignments")],
    ["Attention jobs", metricValue(board, "attentionJobs")],
    ["Open parts cases", metricValue(board, "openPartsCases")],
    ["Scanned jobs", metricValue(board, "scannedJobs")],
  ];
  const complaintReviewBusy = Boolean(complaintReviewAction?.loading);
  const briefItems = commandBrief(board);
  const technicianLoad = asArray(board.technicianLoad);
  const topAttentionItems = asArray(board.topAttention);
  const openPartsCaseItems = asArray(board.openPartsCaseItems);

  return (
    <section className="panel board-layout">
      <div className="board-grid secondary">
        <article className="metric-card wide command-brief">
          <div className="section-head compact">
            <div>
              <p className="section-kicker">Dispatch command brief</p>
              <h2>Work the board in this order</h2>
            </div>
            <button type="button" onClick={onOpenAttention}>
              Open attention
            </button>
            <button type="button" onClick={onRefresh}>
              Refresh board
            </button>
          </div>
          <div className="brief-grid">
            {briefItems.map((item) => (
              <div key={item.label} className="brief-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      {error && <p className="error-text">Showing last board snapshot. Refresh failed: {error}</p>}

      <details className="dashboard-disclosure">
        <summary>Board health and scan metrics</summary>
        <div className="board-grid">
        {metrics.map(([label, value]) => (
          <article key={label} className="metric-card">
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
        <article className="metric-card">
          <p>Evidence feedback</p>
          <strong>{complaintDashboard?.available ? complaintDashboard.feedbackVolume ?? 0 : "n/a"}</strong>
          <span>
            {complaintDashboard?.available
              ? `${complaintDashboard.reviewQueueCount || 0} weak signals, ${formatRate(complaintDashboard.helpfulRate)} helpful`
              : "Complaint Intelligence feedback is not available."}
          </span>
          {complaintDashboard?.available && (
            <small>
              Decisions: {complaintDashboard.trustedCount || 0} trusted, {complaintDashboard.downgradedCount || 0} downgraded,{" "}
              {complaintDashboard.excludedCount || 0} excluded
            </small>
          )}
          {complaintDashboard?.feedbackHealth?.label && <small>{complaintDashboard.feedbackHealth.label}</small>}
          {Array.isArray(complaintDashboard?.recentReviewDecisions) && complaintDashboard.recentReviewDecisions.length > 0 && (
            <small>
              Recent decisions: {complaintDashboard.recentReviewDecisions.slice(0, 2).map(formatDecision).filter(Boolean).join(", ")}
            </small>
          )}
          {Array.isArray(complaintReviewQueue?.items) && complaintReviewQueue.items.length > 0 && (
            <small>
              Review: {complaintReviewQueue.items
                .slice(0, 2)
                .map((item) => `SR-${item.serviceRequestId} ${item.outcome}`)
                .join(", ")}
            </small>
          )}
        </article>
        <article className="metric-card">
          <p>Status ownership</p>
          <strong>{statusCatalog?.knownCount ?? "n/a"}</strong>
          <span>{formatCountMap(statusCatalog?.primarySurfaceCounts)}</span>
          <small>{formatCountMap(statusCatalog?.categoryCounts)}</small>
          {Array.isArray(statusCatalog?.surfaceActions) && statusCatalog.surfaceActions.length > 0 && (
            <small>{statusCatalog.surfaceActions.slice(0, 2).map((item) => `${item.label}: ${item.action}`).join(" ")}</small>
          )}
        </article>
        </div>
      </details>

      <details className="dashboard-disclosure">
        <summary>Complaint evidence review</summary>
        <div className="review-toolbar">
          <button type="button" className="secondary-button" onClick={onSeedComplaintFeedback} disabled={complaintReviewBusy}>
            Seed from completed SRs
          </button>
          {complaintReviewAction?.message && (
            <span className={complaintReviewAction.error ? "error-text" : "muted"}>{complaintReviewAction.message}</span>
          )}
        </div>
        <div className="history-list">
          {Array.isArray(complaintReviewQueue?.items) && complaintReviewQueue.items.length ? (
            complaintReviewQueue.items.map((item) => (
              <div key={item.feedbackId} className="history-entry">
                <p>
                  SR-{item.serviceRequestId} · {item.outcome?.replaceAll("_", " ")} · {item.recommendedItem || "unspecified part"}
                </p>
                <span>{[item.modelNumber, item.applianceType, item.createdAt].filter(Boolean).join(" · ")}</span>
                {item.notes && <small>{item.notes}</small>}
                <div className="review-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onResolveComplaintReview?.(item.feedbackId, "trusted")}
                    disabled={complaintReviewBusy}
                  >
                    Trust
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onResolveComplaintReview?.(item.feedbackId, "downgraded")}
                    disabled={complaintReviewBusy}
                  >
                    Downgrade
                  </button>
                  <button
                    type="button"
                    className="secondary-button danger"
                    onClick={() => onResolveComplaintReview?.(item.feedbackId, "excluded")}
                    disabled={complaintReviewBusy}
                  >
                    Exclude
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No weak evidence is waiting for review.</p>
          )}
        </div>
      </details>

      <div className="board-grid secondary">
        <article className="metric-card wide">
          <p>Attention queues</p>
          <div className="chip-list">
            {queueEntries(board).length ? (
              queueEntries(board).map((entry) => (
                <span key={entry.key} className="queue-chip">
                  {entry.key.replaceAll("_", " ")}: {entry.value}
                </span>
              ))
            ) : (
              <span className="muted">No queue metrics yet.</span>
            )}
          </div>
        </article>

        <article className="metric-card wide">
          <p>Technician load</p>
          <div className="list-stack compact">
            {allTechniciansIdle(board) && (
              <p className="muted">No calls assigned yet for the current day. Routes can wait until the board fills in.</p>
            )}
            {technicianLoad.map((tech) => (
              <div key={tech.bluefolderUserId || tech.discordUserId} className="list-row">
                <div>
                  <strong>{tech.technicianLabel || "Technician"}</strong>
                  <p>
                    {boardRoleLabel(tech) ? `${boardRoleLabel(tech)} · ` : ""}
                    {tech.originAddress || "Origin not set"}
                  </p>
                </div>
                <div className="row-meta">
                  <span>{tech.assignmentCount || 0} jobs</span>
                  <span>{tech.nextJob?.summary || "No calls on deck"}</span>
                </div>
              </div>
            ))}
            {!technicianLoad.length && <p className="muted">No technician load data yet.</p>}
          </div>
        </article>
      </div>

      <details className="dashboard-disclosure" open>
        <summary>Queue details and parts blockers</summary>
        <div className="board-grid secondary">
        <article className="metric-card wide">
          <div className="section-head">
            <p>Top attention</p>
            <button type="button" onClick={onOpenAttention}>
              Open queue
            </button>
          </div>
          <div className="list-stack compact">
            {topAttentionItems.map((item) => (
              <button key={item.itemId} type="button" className="list-row button-row" onClick={() => onOpenAttentionItem?.(item)}>
                <div>
                  <strong>{item.reference}</strong>
                  <p>{item.stageLabel || item.stage}</p>
                </div>
                <div className="row-meta">
                  <span>{item.ageBucket || "n/a"}</span>
                  <span>{technicianDisplayLabel(item, technicianOptions)}</span>
                </div>
              </button>
            ))}
            {!topAttentionItems.length && <p className="muted">No attention items yet.</p>}
          </div>
        </article>

        <article className="metric-card wide">
          <p>Open parts cases</p>
          <div className="list-stack compact">
            {openPartsCaseItems.map((item) => (
              <div key={item.reference} className="list-row">
                <div>
                  <strong>{item.reference}</strong>
                  <p>{item.stageLabel || item.stage}</p>
                </div>
                <div className="row-meta">
                  <span>{item.nextAction || "No next action"}</span>
                </div>
              </div>
            ))}
            {!openPartsCaseItems.length && <p className="muted">No open parts cases.</p>}
          </div>
        </article>
        </div>
      </details>

      <div className="board-grid secondary">
        <article className="metric-card wide">
          <p>Fast jumps</p>
          <div className="action-row">
            <button type="button" onClick={onOpenAttention}>Open attention queue</button>
            {topAttentionItems.slice(0, 1).map((item) => (
              <button key={`${item.itemId}-sr`} type="button" onClick={() => onOpenServiceRequest?.(item)}>
                Open {item.reference}
              </button>
            ))}
            {technicianLoad.slice(0, 1).map((tech) => (
              <button key={`${tech.bluefolderUserId}-route`} type="button" onClick={() => onOpenRoutes?.(tech)}>
                Open {tech.technicianLabel || "tech"} route
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function formatRate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0%";
  return `${Math.round(numeric * 100)}%`;
}
