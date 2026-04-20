import { useEffect, useState } from "react";

import { technicianDisplayLabel } from "./labelUtils";

export default function ServiceRequestView({
  srId,
  customer,
  timeline,
  work,
  photoCompliance,
  complaintIntelligence,
  sectionErrors = {},
  sectionLoading = {},
  smsCapabilities,
  smsHistory,
  smsPreview,
  smsActionState,
  loading,
  error,
  onChange,
  onOpenRoutes,
  onPreviewSms,
  onSendSms,
  onLoadSection,
  onOpenAttentionItem,
  technicianOptions = [],
}) {
  const normalizedSrId = String(srId || "").trim();
  const timelineEntries = Array.isArray(timeline?.entries) ? timeline.entries : Array.isArray(timeline) ? timeline : [];
  const smsIntents = Array.isArray(smsCapabilities?.intents) ? smsCapabilities.intents : [];
  const [smsIntent, setSmsIntent] = useState("");
  const [smsDraft, setSmsDraft] = useState("");
  const evidencePacket = complaintIntelligence?.evidencePacket && typeof complaintIntelligence.evidencePacket === "object"
    ? complaintIntelligence.evidencePacket
    : null;
  const classification = evidencePacket?.classification || {};
  const diagnosticQuestions = Array.isArray(evidencePacket?.diagnosticQuestions) ? evidencePacket.diagnosticQuestions : [];
  const matchScope = classification.matchScope || complaintIntelligence?.matchScope;
  const confidence = evidencePacket?.confidence || complaintIntelligence?.confidence;
  const smsLoaded = Boolean(smsCapabilities) || Boolean((smsHistory || []).length);

  useEffect(() => {
    setSmsIntent("");
    setSmsDraft("");
  }, [normalizedSrId]);

  useEffect(() => {
    if (smsIntent || !smsIntents.length) return;
    const recommendedIntent = smsIntents.find((intent) => String(intent.recommended) === "true")?.key || smsIntents[0]?.key || "";
    setSmsIntent(recommendedIntent);
  }, [smsIntent, smsIntents]);

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
          <article className="metric-card wide command-brief sr-decision-brief">
            <div className="section-head compact">
              <div>
                <p className="section-kicker">SR decision brief</p>
                <h2>{customer?.reference || `SR ${normalizedSrId}`}</h2>
              </div>
              <span className="status-pill">{customer?.status || work?.serviceRequestStatus || "unknown"}</span>
            </div>
            <div className="brief-grid">
              <div className="brief-card">
                <span>Next action</span>
                <strong>{(work?.nextActions || []).length ? `${work.nextActions.length} ready` : "Review"}</strong>
                <p>{(work?.nextActions || []).length ? "Open the work panel for the action list." : describeStatusMeta(customer?.statusMeta || work?.statusMeta)}</p>
              </div>
              <div className="brief-card">
                <span>Attention</span>
                <strong>{(work?.attentionItems || []).length || 0}</strong>
                <p>{work?.ownerGapCount ? `${work.ownerGapCount} owner gap${Number(work.ownerGapCount) === 1 ? "" : "s"}` : "No owner gaps tied to this SR."}</p>
              </div>
              <div className="brief-card">
                <span>Complaint evidence</span>
                <strong>{complaintIntelligence?.available ? "Available" : "Not loaded"}</strong>
                <p>{complaintIntelligence?.available ? `${complaintIntelligence.similarRequestCount || 0} similar SRs found.` : "Open Complaint Intelligence below when history is needed."}</p>
              </div>
              <div className="brief-card">
                <span>Customer contact</span>
                <strong>{smsCapabilities?.enabled ? "SMS ready" : "Check contact"}</strong>
                <p>{smsCapabilities?.toNumber || customer?.customerPhone || "No customer phone loaded."}</p>
              </div>
            </div>
          </article>

          <article className="metric-card wide">
            <p>SR status</p>
            {!!sectionErrors.work && <p className="error-text">{sectionErrors.work}</p>}
            <div className="list-stack compact">
              <div className="detail-grid">
                <Detail label="Current" value={customer?.status || work?.serviceRequestStatus || "unknown"} />
                <Detail label="Category" value={customer?.statusMeta?.categoryLabel || work?.statusMeta?.categoryLabel || "Other"} />
                <Detail label="Parts active" value={flagText(customer?.statusMeta?.isActiveParts || work?.statusMeta?.isActiveParts)} />
                <Detail label="Closed" value={flagText(customer?.statusMeta?.isClosed || work?.statusMeta?.isClosed)} />
              </div>
              <div className="detail-block">
                <strong>Operational read</strong>
                <p>{describeStatusMeta(customer?.statusMeta || work?.statusMeta)}</p>
              </div>
            </div>
          </article>

          <article className="metric-card wide">
            <p>Work panel</p>
            {!!sectionErrors.work && !work && <p className="error-text">{sectionErrors.work}</p>}
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
                      {[
                        work.partsCase.serviceRequestStatus,
                        work.partsCase.nextAction,
                        work.partsCase.assignedPartsLabel,
                        work.partsCase.ageBucket,
                      ].filter(Boolean).join(" • ") || "No parts detail"}
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
            <p>Complaint Intelligence</p>
            {!!sectionErrors.complaintIntelligence && !complaintIntelligence && (
              <p className="error-text">{sectionErrors.complaintIntelligence}</p>
            )}
            {complaintIntelligence ? (
              <div className="list-stack compact">
                {complaintIntelligence.available ? (
                  <>
                    <div className="detail-grid">
                      <Detail label="Model" value={complaintIntelligence.request?.modelNumber} />
                      <Detail label="Brand" value={complaintIntelligence.request?.brand} />
                      <Detail label="Appliance" value={complaintIntelligence.request?.applianceType} />
                      <Detail label="Similar SRs" value={complaintIntelligence.similarRequestCount} />
                      <Detail label="Evidence" value={formatEvidenceLabel(matchScope, confidence)} />
                    </div>
                    <div className="detail-block">
                      <strong>Complaint tags</strong>
                      <div className="chip-list">
                        {(complaintIntelligence.complaintTags || []).map((tag) => (
                          <span key={tag.tag} className="queue-chip">{tag.tag}</span>
                        ))}
                        {!(complaintIntelligence.complaintTags || []).length && (
                          <span className="muted">No complaint tags found.</span>
                        )}
                      </div>
                    </div>
                    <div className="history-list">
                      {(complaintIntelligence.recommendations || []).map((item) => (
                        <div key={`${item.itemType}-${item.item}`} className="history-entry">
                          <p>{item.item}</p>
                          <span>
                            {[item.itemType, `${item.matchingRequestCount || 0} matching SRs`, formatScore(item.score)].filter(Boolean).join(" • ")}
                          </span>
                        </div>
                      ))}
                      {!(complaintIntelligence.recommendations || []).length && (
                        <p className="muted">No historical part recommendations yet.</p>
                      )}
                    </div>
                    {!!diagnosticQuestions.length && (
                      <div className="detail-block">
                        <strong>Triage questions</strong>
                        <div className="history-list">
                          {diagnosticQuestions.slice(0, 4).map((question, index) => (
                            <div key={`${question}-${index}`} className="history-entry">
                              <small>{question}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!(complaintIntelligence.commonResolutions || []).length && (
                      <div className="detail-block">
                        <strong>Common resolutions</strong>
                        <div className="history-list">
                          {complaintIntelligence.commonResolutions.map((note, index) => (
                            <div key={`${note}-${index}`} className="history-entry">
                              <small>{truncateText(note, 320)}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!complaintIntelligence.request?.complaintText && (
                      <div className="detail-block">
                        <strong>Raw complaint</strong>
                        <p>{truncateText(complaintIntelligence.request.complaintText, 700)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="detail-block">
                    <strong>{formatComplaintStatus(complaintIntelligence.integrationStatus)}</strong>
                    <p>{describeComplaintIntelligenceUnavailable(complaintIntelligence, normalizedSrId)}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="muted">No Complaint Intelligence detail loaded.</p>
            )}
          </article>

          <details
            className="metric-card wide disclosure-card"
            onToggle={(event) => {
              if (event.currentTarget.open && !photoCompliance && !sectionLoading.photoCompliance) {
                onLoadSection?.("photoCompliance");
              }
            }}
          >
            <summary>Photo compliance</summary>
            {!!sectionLoading.photoCompliance && <p className="muted">Loading photo compliance from Ops Hub...</p>}
            {!!sectionErrors.photoCompliance && !photoCompliance && <p className="error-text">{sectionErrors.photoCompliance}</p>}
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
              <SectionEmpty
                message="Open this section to check mailbox photos and required tags."
                error={sectionErrors.photoCompliance}
                loading={sectionLoading.photoCompliance}
                onRetry={() => onLoadSection?.("photoCompliance")}
              />
            )}
          </details>

          <details
            className="metric-card wide disclosure-card"
            onToggle={(event) => {
              if (event.currentTarget.open && !smsLoaded && !sectionLoading.sms) {
                onLoadSection?.("sms");
              }
            }}
          >
            <summary>Customer SMS</summary>
            {!!sectionLoading.sms && <p className="muted">Loading SMS capabilities and history...</p>}
            {!!sectionErrors.sms && !smsCapabilities && <p className="error-text">{sectionErrors.sms}</p>}
            {smsCapabilities ? (
              <div className="list-stack compact">
                <div className="detail-grid">
                  <Detail label="Provider" value={smsCapabilities.provider || "unknown"} />
                  <Detail label="Enabled" value={smsCapabilities.enabled ? "yes" : "no"} />
                  <Detail label="To number" value={smsCapabilities.toNumber || "n/a"} />
                  <Detail label="Sender" value={smsCapabilities.fromLabel || "OpsHub"} />
                </div>
                {!!smsCapabilities.reason && <p className="muted">{smsCapabilities.reason}</p>}
                <label className="field">
                  <span>Intent</span>
                  <select value={smsIntent} onChange={(event) => setSmsIntent(event.target.value)}>
                    {!smsIntents.length && <option value="">No SMS intents available</option>}
                    {smsIntents.map((intent) => (
                      <option key={intent.key} value={intent.key}>
                        {intent.label}{String(intent.recommended) === "true" ? " (recommended)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Custom message</span>
                  <textarea
                    rows={4}
                    placeholder="Optional custom SMS text. Leave blank to use the template."
                    value={smsDraft}
                    onChange={(event) => setSmsDraft(event.target.value)}
                  />
                </label>
                <div className="action-row">
                  <button
                    type="button"
                    disabled={!smsCapabilities.enabled || !smsIntent || smsActionState?.loading}
                    onClick={() => onPreviewSms?.(smsIntent, smsDraft)}
                  >
                    Preview SMS
                  </button>
                  <button
                    type="button"
                    disabled={!smsCapabilities.enabled || !smsIntent || smsActionState?.loading}
                    onClick={() => onSendSms?.(smsIntent, smsDraft)}
                  >
                    Send SMS
                  </button>
                  {smsActionState?.message && (
                    <span className={smsActionState?.error ? "error-text" : "muted"}>{smsActionState.message}</span>
                  )}
                </div>
                {smsPreview && (
                  <div className="detail-block">
                    <strong>Preview</strong>
                    <p>{smsPreview.message || "No SMS preview text available."}</p>
                    <span className="muted">
                      {(smsPreview.provider || smsCapabilities.provider || "unknown")} • {smsPreview.toNumber || "n/a"} •{" "}
                      {(smsPreview.segments || 0) || 1} segment(s)
                    </span>
                  </div>
                )}
                <div className="history-list">
                  {!!sectionErrors.smsHistory && !(smsHistory || []).length && <p className="error-text">{sectionErrors.smsHistory}</p>}
                  {(smsHistory || []).map((entry, index) => (
                    <div key={`${entry.sentAt}-${index}`} className="history-entry">
                      <p>{entry.intent || "SMS"} • {entry.status || "unknown"}</p>
                      <span>{[entry.sentAt, entry.provider, entry.toNumber].filter(Boolean).join(" • ")}</span>
                      <small>{entry.message}</small>
                    </div>
                  ))}
                  {!(smsHistory || []).length && <p className="muted">No SMS attempts recorded for this SR yet.</p>}
                </div>
              </div>
            ) : (
              <SectionEmpty
                message="Open this section to check SMS readiness and history."
                error={sectionErrors.sms}
                loading={sectionLoading.sms}
                onRetry={() => onLoadSection?.("sms")}
              />
            )}
          </details>

          <details
            className="metric-card wide disclosure-card"
            onToggle={(event) => {
              if (event.currentTarget.open && !customer && !sectionLoading.customer) {
                onLoadSection?.("customer");
              }
            }}
          >
            <summary>Customer</summary>
            {!!sectionLoading.customer && <p className="muted">Loading customer context...</p>}
            {!!sectionErrors.customer && !customer && <p className="error-text">{sectionErrors.customer}</p>}
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
              <SectionEmpty
                message="Customer context loads first, but can be retried here if BlueFolder was slow."
                error={sectionErrors.customer}
                loading={sectionLoading.customer}
                onRetry={() => onLoadSection?.("customer")}
              />
            )}
          </details>

          <details
            className="metric-card wide disclosure-card"
            onToggle={(event) => {
              if (event.currentTarget.open && !timelineEntries.length && !sectionLoading.timeline) {
                onLoadSection?.("timeline");
              }
            }}
          >
            <summary>Timeline</summary>
            {!!sectionLoading.timeline && <p className="muted">Loading SR timeline...</p>}
            {!!sectionErrors.timeline && !timelineEntries.length && <p className="error-text">{sectionErrors.timeline}</p>}
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
              {!timelineEntries.length && (
                <SectionEmpty
                  message="Open this section to load the SR event history."
                  error={sectionErrors.timeline}
                  loading={sectionLoading.timeline}
                  onRetry={() => onLoadSection?.("timeline")}
                />
              )}
            </div>
          </details>
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

function SectionEmpty({ message, error, loading, onRetry }) {
  if (loading) return null;
  return (
    <div className="section-empty">
      <p className="muted">{message}</p>
      {!!error && (
        <button type="button" className="secondary-button" onClick={onRetry}>
          Retry section
        </button>
      )}
    </div>
  );
}

function formatComplaintStatus(status) {
  const value = String(status || "").replace(/_/g, " ").trim();
  return value ? value[0].toUpperCase() + value.slice(1) : "Unavailable";
}

function describeComplaintIntelligenceUnavailable(payload, srId) {
  if (payload?.integrationStatus === "not_found") {
    return `No Complaint Intelligence record has been ingested for SR ${srId} yet. The SR can still be triaged from BlueFolder context.`;
  }
  return payload?.message || "Complaint Intelligence is not available for this SR.";
}

function formatTagList(tags) {
  if (!Array.isArray(tags) || !tags.length) return "none";
  return tags.join(", ");
}

function flagText(value) {
  return value ? "yes" : "no";
}

function formatScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return `${Math.round(numeric * 100)}% match`;
}

function formatEvidenceLabel(matchScope, confidence) {
  const values = [formatMatchScope(matchScope), confidence].filter(Boolean);
  return values.length ? values.join(" • ") : "unknown";
}

function formatMatchScope(matchScope) {
  const value = String(matchScope || "").replace(/_/g, " ").trim();
  return value || "";
}

function truncateText(value, maxLength) {
  const text = String(value || "").trim();
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function describeStatusMeta(meta) {
  if (!meta || typeof meta !== "object") return "No BlueFolder status classification loaded yet.";
  if (meta.isClosed) return "This SR is in a closed/completed state and should generally not drive new dispatch or parts work.";
  if (meta.isQuoteNeeded) return "This SR is blocked on quote approval before it can move forward cleanly.";
  if (meta.isActiveParts) return "This SR still reflects active parts work and should stay visible to operations until the parts loop is cleared.";
  if (meta.isWaitingCustomer) return "This SR is waiting on customer-side follow-up, payment, or contact.";
  if (meta.isScheduling) return "This SR is in a scheduling-oriented state rather than an active blocker state.";
  if (meta.isReview) return "This SR is sitting in a review/triage state that may need office follow-up.";
  return "This SR status is known but does not currently map to a stronger operations rule.";
}
