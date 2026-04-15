import { useEffect, useMemo, useState } from "react";

const DRAFT_STORAGE_KEY = "dispatch-intake-draft";

export default function IntakeView({
  formats,
  formatsLoading,
  formatsError,
  profiles,
  profilesLoading,
  profilesError,
  onRefreshProfiles,
  analysis,
  analysisLoading,
  analysisError,
  onAnalyze,
  preview,
  previewLoading,
  previewError,
  onPreview,
  importResult,
  importLoading,
  importError,
  onImport,
  onUploadSpreadsheet,
  onSaveProfile,
  onDeleteProfile,
  manualPreview = null,
  manualPreviewLoading = false,
  manualPreviewError = "",
  onManualPreview = () => Promise.resolve(null),
  manualResult = null,
  manualImportLoading = false,
  manualImportError = "",
  onManualImport = () => Promise.resolve(null),
  onOpenServiceRequestById,
}) {
  const [spreadsheetPath, setSpreadsheetPath] = useState("");
  const [spreadsheetName, setSpreadsheetName] = useState("");
  const [formatName, setFormatName] = useState("default");
  const [fieldMapPath, setFieldMapPath] = useState("");
  const [rowStart, setRowStart] = useState("");
  const [rowEnd, setRowEnd] = useState("");
  const [limit, setLimit] = useState("25");
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [previewMode, setPreviewMode] = useState("plan");
  const [failFast, setFailFast] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetState, setPresetState] = useState("");
  const [uploadState, setUploadState] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmPreviewed, setConfirmPreviewed] = useState(false);
  const [allowValidationOverride, setAllowValidationOverride] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    contactFirstName: "",
    contactLastName: "",
    address: "",
    city: "",
    state: "ME",
    postalCode: "",
    subject: "",
    description: "",
    priority: "",
    status: "",
    externalId: "",
  });
  const [manualDuplicateMode, setManualDuplicateMode] = useState("error");
  const [manualPreviewFingerprint, setManualPreviewFingerprint] = useState("");
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [manualAllowValidationOverride, setManualAllowValidationOverride] = useState(false);

  const sortedMatches = useMemo(() => analysis?.adapterMatches || [], [analysis]);

  const requestBody = {
    spreadsheetPath,
    format: formatName,
    fieldMapPath,
    rowStart: rowStart ? Number(rowStart) : undefined,
    rowEnd: rowEnd ? Number(rowEnd) : undefined,
    limit: limit ? Number(limit) : undefined,
    duplicateMode,
  };

  const previewMatchesCurrentRequest =
    preview?.spreadsheetPath === spreadsheetPath &&
    preview?.duplicateMode === duplicateMode &&
    Number(preview?.rowCount || 0) > 0;
  const hasBlockingValidationErrors = (analysis?.validationIssues || []).some((item) => item.level === "error");
  const intakeReadyForImport = previewMatchesCurrentRequest && confirmPreviewed && (!hasBlockingValidationErrors || allowValidationOverride);
  const manualRequest = compactObject(manualForm);
  const manualFingerprint = JSON.stringify({ request: manualRequest, duplicateMode: manualDuplicateMode });
  const manualPreviewFresh = manualPreviewFingerprint === manualFingerprint && Boolean(manualPreview);
  const manualBlockingIssues = (manualPreview?.validationIssues || []).filter((item) => item.level === "error");
  const manualDuplicateAction = manualPreview?.plan?.service_request_action || "";
  const manualDuplicateBlocked = manualDuplicateAction === "error_duplicate";
  const manualReadyForImport =
    manualPreviewFresh &&
    manualConfirmed &&
    (!manualBlockingIssues.length || manualAllowValidationOverride) &&
    !manualDuplicateBlocked;

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setSpreadsheetPath(draft.spreadsheetPath || "");
    setSpreadsheetName(draft.spreadsheetName || "");
    setFormatName(draft.formatName || "default");
    setFieldMapPath(draft.fieldMapPath || "");
    setRowStart(draft.rowStart || "");
    setRowEnd(draft.rowEnd || "");
    setLimit(draft.limit || "25");
    setDuplicateMode(draft.duplicateMode || "skip");
    setPreviewMode(draft.previewMode || "plan");
    setFailFast(Boolean(draft.failFast));
  }, []);

  useEffect(() => {
    saveDraft({
      spreadsheetPath,
      spreadsheetName,
      formatName,
      fieldMapPath,
      rowStart,
      rowEnd,
      limit,
      duplicateMode,
      previewMode,
      failFast,
    });
  }, [spreadsheetPath, spreadsheetName, formatName, fieldMapPath, rowStart, rowEnd, limit, duplicateMode, previewMode, failFast]);

  useEffect(() => {
    setConfirmPreviewed(false);
    setAllowValidationOverride(false);
  }, [spreadsheetPath, formatName, fieldMapPath, rowStart, rowEnd, limit, duplicateMode, previewMode]);

  useEffect(() => {
    setManualConfirmed(false);
    setManualAllowValidationOverride(false);
  }, [manualFingerprint]);

  function updateManualField(key, value) {
    setManualForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="panel intake-layout">
      <div className="attention-column">
        <div className="routes-header">
          <div>
            <p className="section-kicker">ServiceSmith migration seam</p>
            <h2>Intake</h2>
          </div>
          <p>
            Analyze inbound spreadsheets before import. This is the first frontend slice of the ServiceSmith workflow
            now living in Ops Hub.
          </p>
        </div>

        <div className="detail-panel manual-intake-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Manual entry</p>
              <h3>Create service request</h3>
            </div>
            <span className="status-pill">Preview required</span>
          </div>
          <p className="muted">
            Dispatch can enter a one-off request here. RouteDesk checks customer/location/contact matches and duplicate
            tickets before any BlueFolder write happens.
          </p>
          <div className="filter-grid intake-grid">
            <ManualField label="Customer name" value={manualForm.customerName} onChange={(value) => updateManualField("customerName", value)} wide />
            <ManualField label="Phone" value={manualForm.customerPhone} onChange={(value) => updateManualField("customerPhone", value)} />
            <ManualField label="Email" value={manualForm.customerEmail} onChange={(value) => updateManualField("customerEmail", value)} wide />
            <ManualField label="Contact first" value={manualForm.contactFirstName} onChange={(value) => updateManualField("contactFirstName", value)} />
            <ManualField label="Contact last" value={manualForm.contactLastName} onChange={(value) => updateManualField("contactLastName", value)} />
            <ManualField label="Street address" value={manualForm.address} onChange={(value) => updateManualField("address", value)} wide />
            <ManualField label="City" value={manualForm.city} onChange={(value) => updateManualField("city", value)} />
            <ManualField label="State" value={manualForm.state} onChange={(value) => updateManualField("state", value)} />
            <ManualField label="Zip" value={manualForm.postalCode} onChange={(value) => updateManualField("postalCode", value)} />
            <ManualField label="Subject" value={manualForm.subject} onChange={(value) => updateManualField("subject", value)} wide />
            <label className="field intake-span">
              <span>Description</span>
              <textarea
                value={manualForm.description}
                onChange={(event) => updateManualField("description", event.target.value)}
                placeholder="Dispatcher notes, symptoms, access info, or customer request."
              />
            </label>
            <ManualField label="External ID" value={manualForm.externalId} onChange={(value) => updateManualField("externalId", value)} />
            <ManualField label="Priority" value={manualForm.priority} onChange={(value) => updateManualField("priority", value)} />
            <ManualField label="Status" value={manualForm.status} onChange={(value) => updateManualField("status", value)} />
            <label className="field">
              <span>Duplicate mode</span>
              <select value={manualDuplicateMode} onChange={(event) => setManualDuplicateMode(event.target.value)}>
                <option value="error">Block duplicate</option>
                <option value="skip">Skip existing</option>
                <option value="allow">Allow duplicate</option>
              </select>
            </label>
          </div>
          <div className="action-row">
            <button
              type="button"
              disabled={!manualForm.customerName.trim() || !manualForm.subject.trim() || manualPreviewLoading}
              onClick={() =>
                onManualPreview({ request: manualRequest, duplicateMode: manualDuplicateMode }).then((payload) =>
                  payload ? setManualPreviewFingerprint(manualFingerprint) : undefined
                )
              }
            >
              Preview manual SR
            </button>
            <button
              type="button"
              disabled={!manualReadyForImport || manualImportLoading}
              onClick={() => {
                if (!window.confirm(`Create this service request for ${manualForm.customerName || "this customer"} in BlueFolder?`)) {
                  return;
                }
                onManualImport({
                  request: manualRequest,
                  duplicateMode: manualDuplicateMode,
                  confirmed: true,
                  allowValidationOverride: manualAllowValidationOverride,
                });
              }}
            >
              Create in BlueFolder
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setManualForm({
                  customerName: "",
                  customerPhone: "",
                  customerEmail: "",
                  contactFirstName: "",
                  contactLastName: "",
                  address: "",
                  city: "",
                  state: "ME",
                  postalCode: "",
                  subject: "",
                  description: "",
                  priority: "",
                  status: "",
                  externalId: "",
                });
                setManualPreviewFingerprint("");
                setManualConfirmed(false);
                setManualAllowValidationOverride(false);
              }}
            >
              Clear manual form
            </button>
          </div>
          {manualPreviewLoading && <p>Checking BlueFolder matches…</p>}
          {manualPreviewError && <p className="error-text">{manualPreviewError}</p>}
          {manualImportLoading && <p>Creating service request…</p>}
          {manualImportError && <p className="error-text">{manualImportError}</p>}
          {manualPreview && (
            <div className="detail-block">
              <div className="section-head">
                <strong>Manual preview</strong>
                <span className={manualDuplicateBlocked ? "status-pill danger" : "status-pill"}>
                  {manualDuplicateAction || "planned"}
                </span>
              </div>
              {!manualPreviewFresh && <p className="muted">Manual preview is stale. Preview again before creating.</p>}
              {manualDuplicateBlocked && (
                <p className="error-text">A matching service request already exists. Change duplicate mode only if this is intentional.</p>
              )}
              <div className="detail-grid">
                <Detail label="Customer" value={manualPreview.plan?.customer_action} />
                <Detail label="Location" value={manualPreview.plan?.location_action} />
                <Detail label="Contact" value={manualPreview.plan?.contact_action} />
                <Detail label="Ticket" value={manualPreview.plan?.service_request_action} />
              </div>
              <div className="chip-list">
                {manualPreview.plan?.existing_customer_id && (
                  <span className="queue-chip">Customer {manualPreview.plan.existing_customer_id}</span>
                )}
                {manualPreview.plan?.existing_location_id && (
                  <span className="queue-chip">Location {manualPreview.plan.existing_location_id}</span>
                )}
                {manualPreview.plan?.existing_contact_id && (
                  <span className="queue-chip">Contact {manualPreview.plan.existing_contact_id}</span>
                )}
                {manualPreview.plan?.existing_service_request_id && (
                  <span className="queue-chip danger-chip">Existing SR {manualPreview.plan.existing_service_request_id}</span>
                )}
                {manualPreview.row?.external_id && <span className="queue-chip">External ID {manualPreview.row.external_id}</span>}
              </div>
              {!!(manualPreview.validationIssues || []).length && (
                <div className="history-list">
                  {(manualPreview.validationIssues || []).map((issue, index) => (
                    <div key={`${issue.row}-${index}`} className="history-entry">
                      <p>{issue.level}</p>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="action-row">
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={manualConfirmed}
                    onChange={(event) => setManualConfirmed(event.target.checked)}
                    disabled={!manualPreviewFresh || manualDuplicateBlocked}
                  />
                  <span>I reviewed the customer match and duplicate result</span>
                </label>
                {!!manualBlockingIssues.length && (
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={manualAllowValidationOverride}
                      onChange={(event) => setManualAllowValidationOverride(event.target.checked)}
                    />
                    <span>Allow create despite validation errors</span>
                  </label>
                )}
              </div>
            </div>
          )}
          {manualResult && (
            <div className="detail-block">
              <strong>Manual create result</strong>
              <div className="chip-list">
                {Object.entries(manualResult.summary || {}).map(([key, value]) => (
                  <span key={key} className="queue-chip">{key}: {value}</span>
                ))}
              </div>
              <p className={manualResult.success ? "muted" : "error-text"}>{summarizeImportResult(manualResult.result || {}) || "No service request id returned."}</p>
              {manualResult.result?.service_request_id && (
                <div className="action-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onOpenServiceRequestById?.(manualResult.result.service_request_id)}
                  >
                    Open created SR
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="detail-panel">
          <div className="filter-grid intake-grid">
            <label className="field intake-span">
              <span>Upload spreadsheet</span>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setUploadState("");
                  try {
                    const payload = await onUploadSpreadsheet(file);
                    setSpreadsheetPath(payload.spreadsheetPath || "");
                    setSpreadsheetName(payload.fileName || file.name);
                    setUploadState(payload.message || `Uploaded ${file.name}.`);
                  } catch (error) {
                    setUploadState(error instanceof Error ? error.message : String(error));
                  } finally {
                    setUploading(false);
                    event.target.value = "";
                  }
                }}
              />
            </label>
            <label className="field">
              <span>Format</span>
              <input
                list="intake-formats"
                value={formatName}
                onChange={(event) => setFormatName(event.target.value)}
                placeholder="default"
              />
              <datalist id="intake-formats">
                {(formats?.items || []).map((item) => (
                  <option key={item.name} value={item.name} />
                ))}
              </datalist>
            </label>
            <label className="field intake-span">
              <span>Field-map override path</span>
              <input
                value={fieldMapPath}
                onChange={(event) => setFieldMapPath(event.target.value)}
                placeholder="/home/ner0tic/.../custom_map.json"
              />
            </label>
            <label className="field">
              <span>Row start</span>
              <input value={rowStart} onChange={(event) => setRowStart(event.target.value)} inputMode="numeric" />
            </label>
            <label className="field">
              <span>Row end</span>
              <input value={rowEnd} onChange={(event) => setRowEnd(event.target.value)} inputMode="numeric" />
            </label>
            <label className="field">
              <span>Limit</span>
              <input value={limit} onChange={(event) => setLimit(event.target.value)} inputMode="numeric" />
            </label>
            <label className="field">
              <span>Duplicate mode</span>
              <input
                list="duplicate-modes"
                value={duplicateMode}
                onChange={(event) => setDuplicateMode(event.target.value)}
              />
              <datalist id="duplicate-modes">
                <option value="skip" />
                <option value="error" />
                <option value="allow" />
              </datalist>
            </label>
            <label className="field">
              <span>Preview mode</span>
              <input
                list="preview-modes"
                value={previewMode}
                onChange={(event) => setPreviewMode(event.target.value)}
              />
              <datalist id="preview-modes">
                <option value="plan" />
                <option value="payload_preview" />
              </datalist>
            </label>
            <label className="field">
              <span>Preset name</span>
              <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="vendor-a-review" />
            </label>
          </div>

          <div className="action-row">
            <button type="button" disabled={!spreadsheetPath || uploading} onClick={() => onAnalyze(requestBody)}>
              Analyze spreadsheet
            </button>
            <button type="button" disabled={!spreadsheetPath || uploading} onClick={() => onPreview({ ...requestBody, previewMode })}>
              Preview import
            </button>
            <button
              type="button"
              disabled={!intakeReadyForImport}
              onClick={() => {
                const warnings = [];
                if (hasBlockingValidationErrors) warnings.push("validation errors are still present");
                if (!previewMatchesCurrentRequest) warnings.push("current spreadsheet has not been previewed yet");
                if (!confirmPreviewed) warnings.push("the preview checklist is not confirmed");
                const proceed = window.confirm(
                  warnings.length
                    ? `Run import even though ${warnings.join(" and ")}?`
                    : `Run import for ${spreadsheetName || spreadsheetPath || "this spreadsheet"} now?`
                );
                if (!proceed) return;
                onImport({ ...requestBody, failFast });
              }}
            >
              Run import
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const name = presetName.trim();
                if (!name) {
                  setPresetState("Enter a preset name first.");
                  return;
                }
                onSaveProfile({
                  name,
                  formatName,
                  fieldMapPath,
                  rowStart: rowStart ? Number(rowStart) : undefined,
                  rowEnd: rowEnd ? Number(rowEnd) : undefined,
                  limit: limit ? Number(limit) : undefined,
                  duplicateMode,
                  previewMode,
                  failFast,
                })
                  .then((payload) => setPresetState(payload.message || `Saved preset ${name}.`))
                  .catch((error) => setPresetState(error instanceof Error ? error.message : String(error)));
              }}
            >
              Save preset
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                clearDraft();
                setSpreadsheetPath("");
                setSpreadsheetName("");
                setFormatName("default");
                setFieldMapPath("");
                setRowStart("");
                setRowEnd("");
                setLimit("25");
                setDuplicateMode("skip");
                setPreviewMode("plan");
                setFailFast(false);
                setConfirmPreviewed(false);
                setAllowValidationOverride(false);
                setUploadState("");
                setPresetState("Cleared intake draft.");
              }}
            >
              Clear draft
            </button>
            <label className="check-field">
              <input type="checkbox" checked={failFast} onChange={(event) => setFailFast(event.target.checked)} />
              <span>Fail fast</span>
            </label>
          </div>
          {spreadsheetName && <p className="muted">Selected spreadsheet: {spreadsheetName}</p>}
          {spreadsheetPath && <p className="muted">Spreadsheet upload is staged on Ops Hub and ready for analysis.</p>}
          {uploading && <p>Uploading spreadsheet…</p>}
          {uploadState && <p className={uploadState.toLowerCase().includes("uploaded") ? "muted" : "error-text"}>{uploadState}</p>}
          {presetState && <p className="muted">{presetState}</p>}
          <div className="detail-block">
            <div className="section-head">
              <strong>Import safety</strong>
            </div>
            <div className="list-stack compact">
              <div className="history-entry">
                <p>Preview freshness</p>
                <span>
                  {previewMatchesCurrentRequest
                    ? "Current preview matches the selected spreadsheet and import settings."
                    : "Preview is stale or missing. Run Preview import again before importing."}
                </span>
              </div>
              <div className="history-entry">
                <p>Validation status</p>
                <span>
                  {hasBlockingValidationErrors
                    ? "Blocking validation errors were found. Override explicitly if you still intend to import."
                    : "No blocking validation errors are currently reported."}
                </span>
              </div>
            </div>
            <div className="action-row">
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={confirmPreviewed}
                  onChange={(event) => setConfirmPreviewed(event.target.checked)}
                  disabled={!previewMatchesCurrentRequest}
                />
                <span>I reviewed the current preview and want to use it for import</span>
              </label>
              {hasBlockingValidationErrors && (
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={allowValidationOverride}
                    onChange={(event) => setAllowValidationOverride(event.target.checked)}
                  />
                  <span>Allow import despite blocking validation errors</span>
                </label>
              )}
            </div>
          </div>

          {!!(profiles?.items || []).length && (
            <div className="detail-block">
              <div className="section-head">
                <strong>Saved presets</strong>
                <button type="button" className="secondary-button" onClick={onRefreshProfiles}>
                  Refresh presets
                </button>
              </div>
              <div className="chip-list">
                {(profiles?.items || []).map((preset) => (
                  <span key={preset.name} className="chip-row">
                    <button
                      type="button"
                      className="queue-chip chip-button"
                      onClick={() => {
                        setPresetName(preset.name);
                        setFormatName(preset.formatName || "default");
                        setFieldMapPath(preset.fieldMapPath || "");
                        setRowStart(`${preset.rowStart || ""}`);
                        setRowEnd(`${preset.rowEnd || ""}`);
                        setLimit(`${preset.limit || "25"}`);
                        setDuplicateMode(preset.duplicateMode || "skip");
                        setPreviewMode(preset.previewMode || "plan");
                        setFailFast(Boolean(preset.failFast));
                        setPresetState(`Loaded preset ${preset.name}.`);
                      }}
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onDeleteProfile(preset.name)
                          .then((payload) => setPresetState(payload.message || `Deleted preset ${preset.name}.`))
                          .catch((error) => setPresetState(error instanceof Error ? error.message : String(error)))
                      }
                    >
                      Delete
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {profilesLoading && <p>Loading saved presets…</p>}
          {profilesError && <p className="error-text">{profilesError}</p>}

          {analysisLoading && <p>Running intake analysis…</p>}
          {analysisError && <p className="error-text">{analysisError}</p>}
          {previewLoading && <p>Building import preview…</p>}
          {previewError && <p className="error-text">{previewError}</p>}
          {importLoading && <p>Importing selected rows…</p>}
          {importError && <p className="error-text">{importError}</p>}
        </div>

        <div className="detail-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Supported formats</p>
              <h3>Adapters</h3>
            </div>
          </div>
          {formatsLoading && <p>Loading intake formats…</p>}
          {formatsError && <p className="error-text">{formatsError}</p>}
          <div className="list-stack">
            {(formats?.items || []).map((item) => (
              <div key={item.name} className="history-entry">
                <p>{item.name}</p>
                <span>{item.description}</span>
              </div>
            ))}
            {!(formats?.items || []).length && !formatsLoading && !formatsError && (
              <p className="muted">No intake formats loaded.</p>
            )}
          </div>
        </div>
      </div>

      <aside className="detail-panel">
        {!analysis && !analysisLoading && (
          <p className="muted">Run an intake analysis to inspect header fit, preview mapped rows, and validation issues.</p>
        )}

        {analysis && (
          <>
            <div className="detail-head">
              <div>
                <p className="section-kicker">Spreadsheet analysis</p>
                <h3>{analysis.selectedAdapter?.name || "Adapter"}</h3>
              </div>
              <span className="status-pill">{analysis.rowCount ?? 0} rows</span>
            </div>

            <div className="detail-grid">
              <Detail label="Matched headers" value={analysis.headerAnalysis?.matchedCount} />
              <Detail label="Missing headers" value={analysis.headerAnalysis?.missingCount} />
              <Detail label="Validation issues" value={(analysis.validationIssues || []).length} />
              <Detail label="Preview rows" value={(analysis.previewRows || []).length} />
            </div>

            <div className="detail-block">
              <strong>Header fit</strong>
              <div className="chip-list">
                {(analysis.headerAnalysis?.missingHeaders || []).map((header) => (
                  <span key={header} className="queue-chip danger-chip">Missing: {header}</span>
                ))}
                {(analysis.headerAnalysis?.unexpectedHeaders || []).slice(0, 8).map((header) => (
                  <span key={header} className="queue-chip">Extra: {header}</span>
                ))}
                {!((analysis.headerAnalysis?.missingHeaders || []).length || (analysis.headerAnalysis?.unexpectedHeaders || []).length) && (
                  <span className="queue-chip">Header map looks clean.</span>
                )}
              </div>
            </div>

            <div className="detail-block">
              <strong>Best adapter matches</strong>
              <div className="history-list">
                {sortedMatches.slice(0, 5).map((item) => (
                  <div key={item.name} className="history-entry">
                    <p>{item.name}</p>
                    <span>
                      Score {Number(item.score || 0).toFixed(2)} • matched {item.matchedCount} • missing {item.missingCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-block">
              <strong>Row preview</strong>
              <div className="history-list tall">
                {(analysis.previewRows || []).map((row, index) => (
                  <div key={`${row.source_row_number}-${index}`} className="history-entry">
                    <p>Row {row.source_row_number || index + 1}</p>
                    <span>{summarizeRow(row)}</span>
                  </div>
                ))}
                {!(analysis.previewRows || []).length && <p className="muted">No preview rows returned.</p>}
              </div>
            </div>

            <div className="detail-block">
              <strong>Validation issues</strong>
              {hasBlockingValidationErrors && (
                <p className="error-text">Blocking validation errors are present. Fix or intentionally override before importing.</p>
              )}
              <div className="history-list tall">
                {(analysis.validationIssues || []).map((issue, index) => (
                  <div key={`${issue.row}-${index}`} className="history-entry">
                    <p>Row {issue.row} • {issue.level}</p>
                    <span>{issue.message}</span>
                  </div>
                ))}
                {!(analysis.validationIssues || []).length && <p className="muted">No validation issues found in the selected rows.</p>}
              </div>
            </div>

            <div className="detail-block">
              <strong>Import preview</strong>
              {!previewMatchesCurrentRequest && spreadsheetPath && (
                <p className="muted">Preview the current spreadsheet settings before importing.</p>
              )}
              <div className="history-list tall">
                {(preview?.items || []).slice(0, 20).map((item, index) => (
                  <div key={`${item.row_number}-${index}`} className="history-entry">
                    <p>Row {item.row_number || index + 1}</p>
                    <span>{summarizePreviewItem(preview?.previewMode, item)}</span>
                  </div>
                ))}
                {!((preview?.items || []).length) && <p className="muted">No import preview loaded yet.</p>}
              </div>
              {!!(preview?.items || []).length && (
                <div className="action-row">
                  <button type="button" className="secondary-button" onClick={() => downloadJson("intake-preview.json", preview)}>
                    Export preview JSON
                  </button>
                </div>
              )}
            </div>

            <div className="detail-block">
              <strong>Import results</strong>
              <div className="chip-list">
                {Object.entries(importResult?.summary || {}).map(([key, value]) => (
                  <span key={key} className="queue-chip">{key}: {value}</span>
                ))}
              </div>
              <div className="history-list tall">
                {(importResult?.results || []).slice(0, 20).map((item, index) => (
                  <div key={`${item.row_number}-${index}`} className="history-entry">
                    <p>Row {item.row_number || index + 1} • {item.status}</p>
                    <span>{summarizeImportResult(item)}</span>
                  </div>
                ))}
                {!((importResult?.results || []).length) && <p className="muted">No import execution has been run yet.</p>}
              </div>
              {!!(importResult?.results || []).length && (
                <div className="action-row">
                  <button type="button" className="secondary-button" onClick={() => downloadJson("intake-import-results.json", importResult)}>
                    Export import JSON
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-value">
      <span>{label}</span>
      <strong>{value ?? "n/a"}</strong>
    </div>
  );
}

function ManualField({ label, value, onChange, wide = false }) {
  return (
    <label className={wide ? "field intake-span" : "field"}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function summarizeRow(row) {
  return [
    row.customer_name,
    row.subject || row.description,
    row.address,
    [row.city, row.state, row.zip].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" • ");
}

function summarizePreviewItem(previewMode, item) {
  if (previewMode === "payload_preview") {
    return [
      item.customer_payload?.customerName,
      item.location_payload?.addressStreet,
      item.service_request_payload?.externalId,
      item.service_request_payload?.subject,
    ]
      .filter(Boolean)
      .join(" • ");
  }
  return [
    item.customer_action,
    item.location_action,
    item.contact_action,
    item.service_request_action,
  ]
    .filter(Boolean)
    .join(" • ");
}

function summarizeImportResult(item) {
  return [
    item.customer_id ? `customer ${item.customer_id}` : null,
    item.customer_location_id ? `location ${item.customer_location_id}` : null,
    item.customer_contact_id ? `contact ${item.customer_contact_id}` : null,
    item.service_request_id ? `SR ${item.service_request_id}` : null,
    item.existing_service_request_id ? `existing ${item.existing_service_request_id}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

function loadDraft() {
  return readStoredJson(localStorage, DRAFT_STORAGE_KEY);
}

function saveDraft(value) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

function readStoredJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && `${item}`.trim() !== "")
  );
}
