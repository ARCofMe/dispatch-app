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
  loading,
  error,
  onOpenAttention,
  onOpenAttentionItem,
  onOpenServiceRequest,
  onOpenRoutes,
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

      <div className="board-grid">
        {metrics.map(([label, value]) => (
          <article key={label} className="metric-card">
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

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
