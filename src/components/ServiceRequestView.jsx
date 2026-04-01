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
            {customer ? (
              <div className="list-stack compact">
                <div className="list-row">
                  <div>
                    <strong>{customer.customerName || "Unknown customer"}</strong>
                    <p>{customer.subject || "No subject"}</p>
                  </div>
                  <div className="row-meta">
                    <span>{customer.status || "n/a"}</span>
                    <span>{customer.reference}</span>
                  </div>
                </div>
                <div className="detail-grid single">
                  <Detail label="Phone" value={customer.customerPhone} />
                  <Detail label="Address" value={customer.address} />
                  <Detail label="Integration" value={customer.integrationStatus} />
                </div>
                <div className="history-list">
                  {(customer.contacts || []).map((contact, index) => (
                    <div key={`${contact.name}-${index}`} className="history-entry">
                      <p>{contact.name || "Contact"}</p>
                      <span>
                        {[contact.title, contact.phone, contact.email].filter(Boolean).join(" • ") || "No details"}
                      </span>
                    </div>
                  ))}
                  {!(customer.contacts || []).length && <p className="muted">No customer contacts provided.</p>}
                </div>
              </div>
            ) : (
              <p className="muted">Choose an SR to load customer detail.</p>
            )}
          </article>

          <article className="metric-card wide">
            <p>Timeline</p>
            <div className="history-list tall">
              {(timeline?.entries || timeline || []).map((entry, index) => (
                <div key={`${entry.occurredAt}-${index}`} className="history-entry">
                  <p>{entry.summary}</p>
                  <span>
                    {entry.occurredAt || "unknown"} • {entry.actorLabel || entry.source || entry.eventType}
                  </span>
                  {entry.details && <small>{entry.details}</small>}
                </div>
              ))}
              {!((timeline?.entries || timeline || []).length) && <p className="muted">No timeline loaded.</p>}
            </div>
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
