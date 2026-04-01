export default function RoutesView({ routePreview, heatmap, loading, error }) {
  return (
    <section className="panel">
      <div className="routes-header">
        <div>
          <p className="section-kicker">Routing migration seam</p>
          <h2>Routes</h2>
        </div>
        <p>
          This tab is the landing zone for the current `dispatcher-routing-app` behavior. Start with Ops Hub route
          payloads here, then lift planner and map components in.
        </p>
      </div>

      {loading && <p>Loading route context…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="sr-grid">
          <article className="metric-card wide">
            <p>Route preview</p>
            <pre>{routePreview ? JSON.stringify(routePreview, null, 2) : "No technician selected for route preview."}</pre>
          </article>
          <article className="metric-card wide">
            <p>Heatmap</p>
            <pre>{heatmap ? JSON.stringify(heatmap, null, 2) : "Heatmap payload not loaded yet."}</pre>
          </article>
        </div>
      )}
    </section>
  );
}
