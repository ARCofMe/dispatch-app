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

function allTechniciansIdle(payload) {
  const technicianLoad = payload?.technicianLoad || [];
  return technicianLoad.length > 0 && technicianLoad.every((tech) => Number(tech.assignmentCount || 0) === 0);
}

export default function BoardView({
  board,
  loading,
  error,
  onOpenAttention,
  onOpenAttentionItem,
  onOpenServiceRequest,
  onOpenRoutes,
  technicianOptions = [],
}) {
  if (loading) return <section className="panel">Loading board…</section>;
  if (error) return <section className="panel error-panel">{error}</section>;
  if (!board) return <section className="panel">Board is not loaded yet.</section>;

  const metrics = [
    ["Visible techs", metricValue(board, "mappedTechs")],
    ["Discord-linked", metricValue(board, "discordLinkedTechs")],
    ["Active techs", metricValue(board, "activeTechs")],
    ["Visible assignments", metricValue(board, "totalVisibleAssignments")],
    ["Attention jobs", metricValue(board, "attentionJobs")],
    ["Open parts cases", metricValue(board, "openPartsCases")],
    ["Scanned jobs", metricValue(board, "scannedJobs")],
  ];

  return (
    <section className="panel board-layout">
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
            {(board.technicianLoad || []).map((tech) => (
              <div key={tech.bluefolderUserId || tech.discordUserId} className="list-row">
                <div>
                  <strong>{tech.technicianLabel || "Technician"}</strong>
                  <p>{tech.originAddress || "Origin not set"}</p>
                </div>
                <div className="row-meta">
                  <span>{tech.assignmentCount || 0} jobs</span>
                  <span>{tech.nextJob?.summary || "No calls on deck"}</span>
                </div>
              </div>
            ))}
            {!(board.technicianLoad || []).length && <p className="muted">No technician load data yet.</p>}
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
            {(board.topAttention || []).map((item) => (
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
            {!(board.topAttention || []).length && <p className="muted">No attention items yet.</p>}
          </div>
        </article>

        <article className="metric-card wide">
          <p>Open parts cases</p>
          <div className="list-stack compact">
            {(board.openPartsCaseItems || []).map((item) => (
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
            {!(board.openPartsCaseItems || []).length && <p className="muted">No open parts cases.</p>}
          </div>
        </article>
      </div>

      <div className="board-grid secondary">
        <article className="metric-card wide">
          <p>Fast jumps</p>
          <div className="action-row">
            <button type="button" onClick={onOpenAttention}>Open attention queue</button>
            {(board.topAttention || []).slice(0, 1).map((item) => (
              <button key={`${item.itemId}-sr`} type="button" onClick={() => onOpenServiceRequest?.(item)}>
                Open {item.reference}
              </button>
            ))}
            {(board.technicianLoad || []).slice(0, 1).map((tech) => (
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
