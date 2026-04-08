export const TRIAGE_STAGES = [
  "new_sr_triage",
  "model_serial_needed",
  "likely_parts_previsit",
  "diagnostic_required",
  "previsit_quote_needed",
];

export function isTriageStage(stage) {
  return TRIAGE_STAGES.includes(String(stage || "").trim());
}

export function triageStageLabel(stage) {
  const normalized = String(stage || "").trim();
  if (normalized === "new_sr_triage") return "New SR Triage";
  if (normalized === "model_serial_needed") return "Model/Serial Needed";
  if (normalized === "likely_parts_previsit") return "Likely Parts Previsit";
  if (normalized === "diagnostic_required") return "Diagnostic Required";
  if (normalized === "previsit_quote_needed") return "Previsit Quote Needed";
  return normalized.replaceAll("_", " ");
}
