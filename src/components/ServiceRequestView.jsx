import { technicianDisplayLabel } from "./labelUtils";

export default function ServiceRequestView({
  srId,
  customer,
  timeline,
  work,
  photoCompliance,
  loading,
  error,
  onChange,
  onOpenRoutes,
  onOpenAttentionItem,
  technicianOptions = [],
}) {
  const normalizedSrId = String(srId || "").trim();
  const timelineEntries = Array.isArray(timeline?.entries) ? timeline.entries : Array.isArray(timeline) ? timeline : [];

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

      {!loading && !error && !normalizedSrId && (
        <article className="metric-card wide empty-state-card">
          <p className="section-kicker">Service Request</p>
          <strong>Choose an SR to load dispatch context.</strong>
          <p>
            Open one from the board, attention queue, or enter a service request ID here. This view should not be a
            blank screen when no SR has been selected yet.
          </p>
        </article>
      )}

      {!loading && !error && normalizedSrId && (
        <div className="sr-grid">
          <article className="metric-card wide">
            <p>Work panel</p>
            {work ? (
              <div className="list-stack compact">
                <div className="detail-grid">
                  <Detail label="Urgent items" value={work.urgentCount} />
                  <Detail label="Owner gaps" value={work.ownerGapCount} />
                  <Detail label="Attention items" value={(work.attentionItems || []).length} />
                  <Detail label="Parts stage" value={work.partsCase?.stageLabel || "none"} />
                </div>
                <div className="detail-block">
                  <strong>Next actions</strong>
                  <div className="chip-list">
                    {(work.nextActions || []).map((action) => (
                      <span key={action} className="queue-chip">{action}</span>
                    ))}
                    {!(work.nextActions || []).length && <span className="muted">No derived next actions.</span>}
                  </div>
                </div>
                {!!work.partsCase && (
                  <div className="history-entry">
                    <p>{work.partsCase.reference} • {work.partsCase.stageLabel || work.partsCase.stage}</p>
                    <span>
                      {[work.partsCase.nextAction, work.partsCase.assignedPartsLabel, work.partsCase.ageBucket].filter(Boolean).join(" • ") || "No parts detail"}
                    </span>
                  </div>
                )}
                <div className="history-list">
                  {(work.attentionItems || []).map((item) => (
                    <button key={item.itemId} type="button" className="history-entry history-button" onClick={() => onOpenAttentionItem?.(item)}>
                      <p>{item.reference} • {item.stageLabel || item.stage}</p>
                      <span>{[item.nextAction, technicianDisplayLabel(item, technicianOptions), item.ageBucket].filter(Boolean).join(" • ")}</span>
                    </button>
                  ))}
                  {!(work.attentionItems || []).length && <p className="muted">No dispatch attention items tied to this SR.</p>}
                </div>
                <div className="action-row">
                  {(work.attentionItems || [])
                    .map((item) => item.ownerBluefolderUserId || item.technicianBluefolderUserId)
                    .filter(Boolean)
                    .slice(0, 1)
                    .map((techId) => (
                      <button key={techId} type="button" onClick={() => onOpenRoutes?.(techId)}>
                        Open technician route
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <p className="muted">Choose an SR to load work context.</p>
            )}
          </article>

          <article className="metric-card wide">
            <p>Photo compliance</p>
            {photoCompliance ? (
              <div className="list-stack compact">
                <div className="detail-grid">
                  <Detail label="Mailbox" value={photoCompliance.mailboxStatus || "unknown"} />
                  <Detail label="Photos" value={photoCompliance.totalPhotos} />
                  <Detail label="Required status" value={photoCompliance.matchedRequiredStatus ? "yes" : "no"} />
                  <Detail label="Needs follow-up" value={photoCompliance.shouldNotify ? "yes" : "no"} />
                </div>
                <div className="detail-block">
                  <strong>Current read</strong>
                  <p>{photoCompliance.reason || photoCompliance.message || "No photo compliance detail."}</p>
                  {photoCompliance.checkedAt && <span className="muted">Checked {photoCompliance.checkedAt}</span>}
                </div>
                <div className="detail-grid single">
                  <Detail label="Found tags" value={formatTagList(photoCompliance.foundTags)} />
                  <Detail label="Missing tags" value={formatTagList(photoCompliance.missingTags)} />
                </div>
              </div>
            ) : (
              <p className="muted">No photo compliance detail loaded.</p>
            )}
          </article>

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
              {timelineEntries.map((entry, index) => (
                <div key={`${entry.occurredAt}-${index}`} className="history-entry">
                  <p>{entry.summary}</p>
                  <span>
                    {entry.occurredAt || "unknown"} • {entry.actorLabel || entry.source || entry.eventType}
                  </span>
                  {entry.details && <small>{entry.details}</small>}
                </div>
              ))}
              {!timelineEntries.length && <p className="muted">No timeline loaded.</p>}
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

function formatTagList(tags) {
  if (!Array.isArray(tags) || !tags.length) return "none";
  return tags.join(", ");
}
