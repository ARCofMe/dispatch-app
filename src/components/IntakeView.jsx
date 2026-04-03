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
  onSaveProfile,
  onDeleteProfile,
}) {
  const [spreadsheetPath, setSpreadsheetPath] = useState("");
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

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setSpreadsheetPath(draft.spreadsheetPath || "");
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
      formatName,
      fieldMapPath,
      rowStart,
      rowEnd,
      limit,
      duplicateMode,
      previewMode,
      failFast,
    });
  }, [spreadsheetPath, formatName, fieldMapPath, rowStart, rowEnd, limit, duplicateMode, previewMode, failFast]);

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

        <div className="detail-panel">
          <div className="filter-grid intake-grid">
            <label className="field intake-span">
              <span>Spreadsheet path</span>
              <input
                value={spreadsheetPath}
                onChange={(event) => setSpreadsheetPath(event.target.value)}
                placeholder="/home/ner0tic/Downloads/vendor_export.xlsx"
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
            <button type="button" onClick={() => onAnalyze(requestBody)}>
              Analyze spreadsheet
            </button>
            <button type="button" onClick={() => onPreview({ ...requestBody, previewMode })}>
              Preview import
            </button>
            <button
              type="button"
              disabled={!previewMatchesCurrentRequest}
              onClick={() => {
                const warnings = [];
                if (hasBlockingValidationErrors) warnings.push("validation errors are still present");
                if (!previewMatchesCurrentRequest) warnings.push("current spreadsheet has not been previewed yet");
                const proceed = window.confirm(
                  warnings.length
                    ? `Run import even though ${warnings.join(" and ")}?`
                    : `Run import for ${spreadsheetPath || "this spreadsheet"} now?`
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
                setFormatName("default");
                setFieldMapPath("");
                setRowStart("");
                setRowEnd("");
                setLimit("25");
                setDuplicateMode("skip");
                setPreviewMode("plan");
                setFailFast(false);
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
          {presetState && <p className="muted">{presetState}</p>}

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
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(value) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
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
