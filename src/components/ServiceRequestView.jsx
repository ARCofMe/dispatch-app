export default function ServiceRequestView({ srId, customer, timeline, loading, error, onChange }) {
  return (
    <section className="panel">
      <div className="sr-toolbar">
        <label className="field narrow">
          <span>SR ID</span>
          <input value={srId} onChange={(event) => onChange(event.target.value)} placeholder="100" />
        </label>
      </div>

      {loading && <p>Loading service request detail…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="sr-grid">
          <article className="metric-card wide">
            <p>Customer</p>
            <pre>{customer ? JSON.stringify(customer, null, 2) : "Choose an SR to load customer detail."}</pre>
          </article>
          <article className="metric-card wide">
            <p>Timeline</p>
            <pre>{timeline?.length ? JSON.stringify(timeline, null, 2) : "No timeline loaded."}</pre>
          </article>
        </div>
      )}
    </section>
  );
}
