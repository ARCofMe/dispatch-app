function metricValue(payload, ...keys) {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return "n/a";
}

export default function BoardView({ board, loading, error }) {
  if (loading) return <section className="panel">Loading board…</section>;
  if (error) return <section className="panel error-panel">{error}</section>;
  if (!board) return <section className="panel">Board is not loaded yet.</section>;

  const metrics = [
    ["Mapped techs", metricValue(board, "mappedTechs", "mapped_techs")],
    ["Attention jobs", metricValue(board, "attentionJobs", "attention_jobs", "attentionCount")],
    ["Urgent open", metricValue(board, "urgentOpenItems", "urgent_open_items")],
    ["Suppressed urgent", metricValue(board, "suppressedUrgentItems", "suppressed_urgent_items")],
  ];

  return (
    <section className="panel board-grid">
      {metrics.map(([label, value]) => (
        <article key={label} className="metric-card">
          <p>{label}</p>
          <strong>{value}</strong>
        </article>
      ))}
      <article className="metric-card wide">
        <p>Queue mix</p>
        <pre>{JSON.stringify(board.queueCounts || board.queue_counts || {}, null, 2)}</pre>
      </article>
      <article className="metric-card wide">
        <p>Owner coverage</p>
        <pre>{JSON.stringify(board.ownerCoverage || board.owner_coverage || {}, null, 2)}</pre>
      </article>
    </section>
  );
}
