import { useEffect, useRef, useState } from "react";
import { dispatchApi } from "./api/client";
import BrandBar from "./components/BrandBar";
import TabNav from "./components/TabNav";
import BoardView from "./components/BoardView";
import AttentionView from "./components/AttentionView";
import TriageView from "./components/TriageView";
import ServiceRequestView from "./components/ServiceRequestView";
import RoutesView from "./components/RoutesView";
import IntakeView from "./components/IntakeView";
import SettingsView from "./components/SettingsView";
import { buildTechnicianOptions } from "./components/labelUtils";

const THEME_MODE_KEY = "dispatch-theme-mode";
const DISPATCH_PREFERENCES_KEY = "dispatch-preferences";
const LAST_SR_KEY = "dispatch-last-sr";
const INTAKE_DRAFT_KEY = "dispatch-intake-draft";
const ROUTE_DRAFT_KEY = "dispatch-route-draft";
const DEFAULT_PREFERENCES = {
  attentionFilters: { stage: "", age: "", status: "", reference: "" },
  attentionSortBy: "priority",
  defaultRouteTechnicianId: "",
  autoLoadDefaultRouteTech: true,
  routeOptimizeByDefault: false,
  defaultRouteDate: getLocalISODate(),
  rememberLastSr: true,
  restoreLastSrOnLaunch: false,
  openSrOnAttentionSelect: false,
};

function getLocalISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function App() {
  const attentionDetailRequestIdRef = useRef(0);
  const serviceRequestLoadIdRef = useRef(0);
  const routesLoadIdRef = useRef(0);
  const [activeTab, setActiveTab] = useState("board");
  const [board, setBoard] = useState(null);
  const [boardError, setBoardError] = useState("");
  const [boardLoading, setBoardLoading] = useState(true);

  const [attention, setAttention] = useState([]);
  const [attentionOwnerOptions, setAttentionOwnerOptions] = useState([]);
  const [attentionError, setAttentionError] = useState("");
  const [attentionLoading, setAttentionLoading] = useState(false);
  const [attentionLoaded, setAttentionLoaded] = useState(false);
  const [selectedAttention, setSelectedAttention] = useState(null);
  const [selectedAttentionDetail, setSelectedAttentionDetail] = useState(null);
  const [attentionActionState, setAttentionActionState] = useState(null);

  const [selectedSrId, setSelectedSrId] = useState("");
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [srWork, setSrWork] = useState(null);
  const [srPhotoCompliance, setSrPhotoCompliance] = useState(null);
  const [srSmsCapabilities, setSrSmsCapabilities] = useState(null);
  const [srSmsHistory, setSrSmsHistory] = useState([]);
  const [srSmsPreview, setSrSmsPreview] = useState(null);
  const [srSmsActionState, setSrSmsActionState] = useState(null);
  const [srError, setSrError] = useState("");
  const [srLoading, setSrLoading] = useState(false);

  const [routePreview, setRoutePreview] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [routesError, setRoutesError] = useState("");
  const [routesLoading, setRoutesLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [selectedRouteDate, setSelectedRouteDate] = useState(() => readStoredPreferences().defaultRouteDate || getLocalISODate());
  const [routeOriginAddress, setRouteOriginAddress] = useState("");
  const [routeDestinationAddress, setRouteDestinationAddress] = useState("");
  const [routeOptimize, setRouteOptimize] = useState(false);
  const [intakeFormats, setIntakeFormats] = useState(null);
  const [intakeFormatsLoading, setIntakeFormatsLoading] = useState(false);
  const [intakeFormatsError, setIntakeFormatsError] = useState("");
  const [intakeProfiles, setIntakeProfiles] = useState(null);
  const [intakeProfilesLoading, setIntakeProfilesLoading] = useState(false);
  const [intakeProfilesError, setIntakeProfilesError] = useState("");
  const [intakeAnalysis, setIntakeAnalysis] = useState(null);
  const [intakeAnalysisLoading, setIntakeAnalysisLoading] = useState(false);
  const [intakeAnalysisError, setIntakeAnalysisError] = useState("");
  const [intakePreview, setIntakePreview] = useState(null);
  const [intakePreviewLoading, setIntakePreviewLoading] = useState(false);
  const [intakePreviewError, setIntakePreviewError] = useState("");
  const [intakeImportResult, setIntakeImportResult] = useState(null);
  const [intakeImportLoading, setIntakeImportLoading] = useState(false);
  const [intakeImportError, setIntakeImportError] = useState("");
  const [themeMode, setThemeMode] = useState(() => window.localStorage.getItem(THEME_MODE_KEY) || "light");
  const [preferences, setPreferences] = useState(() => readStoredPreferences());

  useEffect(() => {
    loadBoard();
    loadIntakeFormats();
    loadIntakeProfiles();
  }, []);

  useEffect(() => {
    if (activeTab !== "attention" && activeTab !== "triage") return;
    if (attentionLoaded || attentionLoading) return;
    loadAttention();
  }, [activeTab, attentionLoaded, attentionLoading]);

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_KEY, themeMode);
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.removeItem("dispatch-app-name");
    document.title = "RouteDesk | ARCoM Ops Hub";
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DISPATCH_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!preferences.restoreLastSrOnLaunch) return;
    const lastSr = window.localStorage.getItem(LAST_SR_KEY) || "";
    if (!lastSr.trim()) return;
    setSelectedSrId((current) => current || lastSr.trim());
  }, [preferences.restoreLastSrOnLaunch]);

  useEffect(() => {
    if (!selectedSrId.trim()) return;
    if (preferences.rememberLastSr) {
      window.localStorage.setItem(LAST_SR_KEY, selectedSrId.trim());
    }
    loadServiceRequest(selectedSrId.trim());
  }, [preferences.rememberLastSr, selectedSrId]);

  useEffect(() => {
    if (!selectedAttention?.itemId) return;
    const match = attention.find((item) => item.itemId === selectedAttention.itemId);
    if (!match) {
      setSelectedAttention(null);
      setSelectedAttentionDetail(null);
      setAttentionActionState(null);
      return;
    }
    if (match !== selectedAttention) {
      setSelectedAttention(match);
    }
    setSelectedAttentionDetail((detail) =>
      detail?.item?.itemId === match.itemId ? { ...detail, item: { ...detail.item, ...match } } : detail
    );
  }, [attention, selectedAttention]);

  async function loadBoard() {
    setBoardLoading(true);
    setBoardError("");
    try {
      setBoard(await dispatchApi.getBoard());
    } catch (error) {
      setBoardError(formatError(error));
    } finally {
      setBoardLoading(false);
    }
  }

  async function loadAttention() {
    setAttentionLoading(true);
    setAttentionError("");
    try {
      const payload = await dispatchApi.getAttention();
      setAttention(payload.items || payload.attentionItems || payload || []);
      setAttentionOwnerOptions(payload.ownerOptions || []);
      setAttentionLoaded(true);
    } catch (error) {
      setAttentionError(formatError(error));
    } finally {
      setAttentionLoading(false);
    }
  }

  async function loadAttentionDetail(itemId) {
    const requestId = attentionDetailRequestIdRef.current + 1;
    attentionDetailRequestIdRef.current = requestId;
    setSelectedAttentionDetail(null);
    try {
      const payload = await dispatchApi.getAttentionItem(itemId);
      if (attentionDetailRequestIdRef.current !== requestId) return;
      setSelectedAttentionDetail(payload);
      setAttentionActionState(null);
    } catch (error) {
      if (attentionDetailRequestIdRef.current !== requestId) return;
      setSelectedAttentionDetail(null);
      setAttentionActionState({ error: true, message: formatError(error) });
    }
  }

  async function loadServiceRequest(srId) {
    const requestId = serviceRequestLoadIdRef.current + 1;
    serviceRequestLoadIdRef.current = requestId;
    setSrLoading(true);
    setSrError("");
    setCustomer(null);
    setTimeline([]);
    setSrWork(null);
    setSrPhotoCompliance(null);
    setSrSmsCapabilities(null);
    setSrSmsHistory([]);
    setSrSmsPreview(null);
    setSrSmsActionState(null);
    try {
      const [customerPayload, timelinePayload, workPayload, photoCompliancePayload, smsCapabilitiesPayload, smsHistoryPayload] = await Promise.all([
        dispatchApi.getServiceRequestCustomer(srId),
        dispatchApi.getServiceRequestTimeline(srId),
        dispatchApi.getServiceRequestWork(srId),
        dispatchApi.getServiceRequestPhotoCompliance(srId),
        dispatchApi.getServiceRequestSmsCapabilities(srId),
        dispatchApi.getServiceRequestSmsHistory(srId),
      ]);
      if (serviceRequestLoadIdRef.current !== requestId) return;
      setCustomer(customerPayload);
      setTimeline(timelinePayload);
      setSrWork(workPayload);
      setSrPhotoCompliance(photoCompliancePayload);
      setSrSmsCapabilities(smsCapabilitiesPayload);
      setSrSmsHistory(smsHistoryPayload?.items || []);
    } catch (error) {
      if (serviceRequestLoadIdRef.current !== requestId) return;
      setCustomer(null);
      setTimeline([]);
      setSrWork(null);
      setSrPhotoCompliance(null);
      setSrSmsCapabilities(null);
      setSrSmsHistory([]);
      setSrSmsPreview(null);
      setSrSmsActionState(null);
      setSrError(formatError(error));
    } finally {
      if (serviceRequestLoadIdRef.current !== requestId) return;
      setSrLoading(false);
    }
  }

  async function previewServiceRequestSms(intent, customMessage) {
    const srId = selectedSrId.trim();
    if (!srId) return;
    setSrSmsActionState({ loading: true, message: "Generating SMS preview…" });
    try {
      const payload = await dispatchApi.previewServiceRequestSms(srId, {
        intent,
        customMessage,
      });
      setSrSmsPreview(payload);
      setSrSmsActionState(null);
    } catch (error) {
      setSrSmsPreview(null);
      setSrSmsActionState({ error: true, message: formatError(error) });
    }
  }

  async function sendServiceRequestSms(intent, customMessage) {
    const srId = selectedSrId.trim();
    if (!srId) return;
    setSrSmsActionState({ loading: true, message: "Sending SMS…" });
    try {
      const payload = await dispatchApi.sendServiceRequestSms(srId, {
        intent,
        customMessage,
      });
      setSrSmsPreview(payload);
      setSrSmsActionState({
        error: !payload?.success,
        message:
          payload?.status === "dry_run"
            ? "SMS recorded in dry-run mode."
            : payload?.success
              ? "SMS submitted."
              : payload?.error || "SMS delivery failed.",
      });
      const historyPayload = await dispatchApi.getServiceRequestSmsHistory(srId);
      setSrSmsHistory(historyPayload?.items || []);
    } catch (error) {
      setSrSmsActionState({ error: true, message: formatError(error) });
    }
  }

  async function loadRoutes(techIdInput, options = {}) {
    const techId = String(techIdInput || "").trim();
    if (!techId) {
      setRoutesError("Selected attention item does not include a technician mapping yet.");
      return;
    }
    setSelectedTechnicianId(techId);
    const nextOriginAddress = options.originAddress ?? routeOriginAddress;
    const nextDestinationAddress = options.destinationAddress ?? routeDestinationAddress;
    const nextOptimize = options.optimize ?? routeOptimize ?? preferences.routeOptimizeByDefault;
    const nextDate = options.date ?? selectedRouteDate ?? preferences.defaultRouteDate ?? getLocalISODate();
    setRouteOriginAddress(nextOriginAddress);
    setRouteDestinationAddress(nextDestinationAddress);
    setRouteOptimize(Boolean(nextOptimize));
    setSelectedRouteDate(nextDate);
    const requestId = routesLoadIdRef.current + 1;
    routesLoadIdRef.current = requestId;
    setRoutesLoading(true);
    setRoutesError("");
    setRoutePreview(null);
    setHeatmap(null);
    setActiveTab("routes");
    try {
      const [previewPayload, heatmapPayload] = await Promise.all([
        dispatchApi.getRoutePreview(techId, {
          date: nextDate,
          originAddress: nextOriginAddress,
          destinationAddress: nextDestinationAddress,
          optimize: nextOptimize,
        }),
        dispatchApi.getRouteHeatmap(techId),
      ]);
      if (routesLoadIdRef.current !== requestId) return;
      setRoutePreview(previewPayload);
      setHeatmap(heatmapPayload);
    } catch (error) {
      if (routesLoadIdRef.current !== requestId) return;
      setRoutePreview(null);
      setHeatmap(null);
      setRoutesError(formatError(error));
    } finally {
      if (routesLoadIdRef.current !== requestId) return;
      setRoutesLoading(false);
    }
  }

  async function simulateRouteDraft(body) {
    setRoutesLoading(true);
    setRoutesError("");
    try {
      const payload = await dispatchApi.simulateRoute(body);
      setRoutePreview(payload);
    } catch (error) {
      setRoutesError(formatError(error));
    } finally {
      setRoutesLoading(false);
    }
  }

  async function loadIntakeFormats() {
    setIntakeFormatsLoading(true);
    setIntakeFormatsError("");
    try {
      setIntakeFormats(await dispatchApi.getIntakeFormats());
    } catch (error) {
      setIntakeFormatsError(formatError(error));
    } finally {
      setIntakeFormatsLoading(false);
    }
  }

  async function loadIntakeProfiles() {
    setIntakeProfilesLoading(true);
    setIntakeProfilesError("");
    try {
      setIntakeProfiles(await dispatchApi.getIntakeProfiles());
    } catch (error) {
      setIntakeProfilesError(formatError(error));
    } finally {
      setIntakeProfilesLoading(false);
    }
  }

  async function analyzeIntake(body) {
    setIntakeAnalysisLoading(true);
    setIntakeAnalysisError("");
    try {
      setIntakeAnalysis(await dispatchApi.analyzeIntake(body));
    } catch (error) {
      setIntakeAnalysisError(formatError(error));
    } finally {
      setIntakeAnalysisLoading(false);
    }
  }

  async function previewIntake(body) {
    setIntakePreviewLoading(true);
    setIntakePreviewError("");
    try {
      setIntakePreview(await dispatchApi.previewIntake(body));
    } catch (error) {
      setIntakePreviewError(formatError(error));
    } finally {
      setIntakePreviewLoading(false);
    }
  }

  async function importIntake(body) {
    setIntakeImportLoading(true);
    setIntakeImportError("");
    try {
      setIntakeImportResult(await dispatchApi.importIntake(body));
    } catch (error) {
      setIntakeImportError(formatError(error));
    } finally {
      setIntakeImportLoading(false);
    }
  }

  async function saveIntakeProfile(body) {
    const payload = await dispatchApi.saveIntakeProfile(body);
    await loadIntakeProfiles();
    return payload;
  }

  async function deleteIntakeProfile(name) {
    const payload = await dispatchApi.deleteIntakeProfile(name);
    await loadIntakeProfiles();
    return payload;
  }

  async function uploadIntakeSpreadsheet(file) {
    const contentBase64 = await readFileAsBase64(file);
    return dispatchApi.uploadIntakeSpreadsheet({
      fileName: file.name,
      contentBase64,
    });
  }

  function handleAttentionSelect(item) {
    setSelectedAttention(item);
    setSelectedAttentionDetail(null);
    setAttentionActionState(null);
    loadAttentionDetail(item.itemId);
    const reference = item.reference || item.srReference || "";
    const srId = reference.replace(/^SR-/i, "");
    if (srId) {
      setSelectedSrId(srId);
      if (preferences.openSrOnAttentionSelect) {
        setActiveTab("sr");
      }
    }
  }

  function openServiceRequestFromAttention(item) {
    const reference = item.reference || item.srReference || "";
    const srId = reference.replace(/^SR-/i, "");
    if (srId) {
      setSelectedSrId(srId);
      setActiveTab("sr");
    }
  }

  function openServiceRequestById(srId) {
    const normalized = String(srId || "").replace(/^SR-/i, "").trim();
    if (!normalized) return;
    setSelectedSrId(normalized);
    setActiveTab("sr");
  }

  function openRoutesFromAttention(item) {
    const techId = item.ownerBluefolderUserId || item.owner_bluefolder_user_id || item.technicianBluefolderUserId;
    loadRoutes(techId);
  }

  const technicianOptions = buildTechnicianOptions(board);

  useEffect(() => {
    if (activeTab !== "routes") return;
    if (selectedTechnicianId) return;
    if (!preferences.autoLoadDefaultRouteTech) return;
    if (!preferences.defaultRouteTechnicianId) return;
    loadRoutes(preferences.defaultRouteTechnicianId, {
      date: selectedRouteDate || preferences.defaultRouteDate,
      optimize: preferences.routeOptimizeByDefault,
    });
  }, [
    activeTab,
    preferences.autoLoadDefaultRouteTech,
    preferences.defaultRouteTechnicianId,
    preferences.defaultRouteDate,
    preferences.routeOptimizeByDefault,
    selectedRouteDate,
    selectedTechnicianId,
  ]);

  async function handleAttentionAction(itemId, action, body = {}) {
    setAttentionActionState({ error: false, message: `Running ${action}…` });
    try {
      const payload = await dispatchApi.postAttentionAction(itemId, action, body);
      setAttentionActionState({ error: false, message: payload.message || `${action} complete` });
      if (payload.item) {
        setSelectedAttention(payload.item);
        setSelectedAttentionDetail((current) => ({ ...(current || {}), item: payload.item, history: current?.history || [] }));
      } else {
        await loadAttentionDetail(itemId);
      }
      await loadAttention();
    } catch (error) {
      setAttentionActionState({ error: true, message: formatError(error) });
    }
  }

  async function handleBulkAttentionAction(action, itemIds, body = {}) {
    setAttentionActionState({ error: false, message: `Running bulk ${action}…` });
    try {
      const payload = await dispatchApi.postAttentionBulkAction(action, itemIds, body);
      setAttentionActionState({ error: !payload.success, message: payload.message || `Bulk ${action} complete` });
      if (selectedAttention?.itemId) {
        await loadAttentionDetail(selectedAttention.itemId);
      }
      await loadAttention();
      if (selectedSrId.trim()) {
        await loadServiceRequest(selectedSrId.trim());
      }
    } catch (error) {
      setAttentionActionState({ error: true, message: formatError(error) });
    }
  }

  return (
    <div className="app-shell">
      <BrandBar />
      <TabNav activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === "board" && (
        <BoardView
          board={board}
          loading={boardLoading}
          error={boardError}
          technicianOptions={technicianOptions}
          onOpenAttention={() => setActiveTab("attention")}
          onOpenAttentionItem={(item) => {
            setActiveTab("attention");
            handleAttentionSelect(item);
          }}
          onOpenServiceRequest={(item) => openServiceRequestById(item?.srId || item?.reference)}
          onOpenRoutes={(item) =>
            loadRoutes(item?.ownerBluefolderUserId || item?.technicianBluefolderUserId || item?.bluefolderUserId)
          }
        />
      )}
      {activeTab === "triage" && (
        <TriageView
          items={attention}
          ownerOptions={attentionOwnerOptions}
          loading={attentionLoading}
          error={attentionError}
          initialFilters={preferences.attentionFilters}
          initialSortBy={preferences.attentionSortBy}
          onPreferencesChange={({ filters, sortBy }) =>
            setPreferences((current) => ({
              ...current,
              attentionFilters: filters,
              attentionSortBy: sortBy,
            }))
          }
          onRefresh={loadAttention}
          onSelectItem={handleAttentionSelect}
          selectedItem={selectedAttention}
          selectedItemDetail={selectedAttentionDetail}
          actionState={attentionActionState}
          onAction={handleAttentionAction}
          onBulkAction={handleBulkAttentionAction}
          onOpenServiceRequest={openServiceRequestFromAttention}
          onOpenRoutes={openRoutesFromAttention}
          onOpenServiceRequestById={openServiceRequestById}
        />
      )}
      {activeTab === "attention" && (
        <AttentionView
          items={attention}
          ownerOptions={attentionOwnerOptions}
          loading={attentionLoading}
          error={attentionError}
          initialFilters={preferences.attentionFilters}
          initialSortBy={preferences.attentionSortBy}
          onPreferencesChange={({ filters, sortBy }) =>
            setPreferences((current) => ({
              ...current,
              attentionFilters: filters,
              attentionSortBy: sortBy,
            }))
          }
          onRefresh={loadAttention}
          onSelectItem={handleAttentionSelect}
          selectedItem={selectedAttention}
          selectedItemDetail={selectedAttentionDetail}
          actionState={attentionActionState}
          onAction={handleAttentionAction}
          onBulkAction={handleBulkAttentionAction}
          onOpenServiceRequest={openServiceRequestFromAttention}
          onOpenRoutes={openRoutesFromAttention}
          onOpenServiceRequestById={openServiceRequestById}
        />
      )}
      {activeTab === "sr" && (
        <ServiceRequestView
          srId={selectedSrId}
          customer={customer}
          timeline={timeline}
          work={srWork}
          photoCompliance={srPhotoCompliance}
          smsCapabilities={srSmsCapabilities}
          smsHistory={srSmsHistory}
          smsPreview={srSmsPreview}
          smsActionState={srSmsActionState}
          technicianOptions={technicianOptions}
          loading={srLoading}
          error={srError}
          onChange={setSelectedSrId}
          onOpenRoutes={(techId) => loadRoutes(techId)}
          onPreviewSms={previewServiceRequestSms}
          onSendSms={sendServiceRequestSms}
          onOpenAttentionItem={(item) => {
            setActiveTab("attention");
            handleAttentionSelect(item);
          }}
        />
      )}
      {activeTab === "routes" && (
        <RoutesView
          routePreview={routePreview}
          heatmap={heatmap}
          loading={routesLoading}
          error={routesError}
          technicianId={selectedTechnicianId}
          routeDate={selectedRouteDate}
          technicianOptions={technicianOptions}
          defaultTechnicianId={preferences.defaultRouteTechnicianId}
          onSetDefaultTechnician={(technicianId) =>
            setPreferences((current) => ({
              ...current,
              defaultRouteTechnicianId: technicianId,
            }))
          }
          onRouteDateChange={(value) => {
            setSelectedRouteDate(value);
            setPreferences((current) => ({
              ...current,
              defaultRouteDate: value,
            }));
          }}
          originAddress={routeOriginAddress}
          destinationAddress={routeDestinationAddress}
          optimize={routeOptimize}
          onTechnicianIdChange={setSelectedTechnicianId}
          onOriginAddressChange={setRouteOriginAddress}
          onDestinationAddressChange={setRouteDestinationAddress}
          onOptimizeChange={setRouteOptimize}
          onLoad={loadRoutes}
          onSimulateRoute={simulateRouteDraft}
          onOpenServiceRequestById={openServiceRequestById}
        />
      )}
      {activeTab === "intake" && (
        <IntakeView
          formats={intakeFormats}
          formatsLoading={intakeFormatsLoading}
          formatsError={intakeFormatsError}
          profiles={intakeProfiles}
          profilesLoading={intakeProfilesLoading}
          profilesError={intakeProfilesError}
          onRefreshProfiles={loadIntakeProfiles}
          analysis={intakeAnalysis}
          analysisLoading={intakeAnalysisLoading}
          analysisError={intakeAnalysisError}
          onAnalyze={analyzeIntake}
          preview={intakePreview}
          previewLoading={intakePreviewLoading}
          previewError={intakePreviewError}
          onPreview={previewIntake}
          importResult={intakeImportResult}
          importLoading={intakeImportLoading}
          importError={intakeImportError}
          onImport={importIntake}
          onUploadSpreadsheet={uploadIntakeSpreadsheet}
          onSaveProfile={saveIntakeProfile}
          onDeleteProfile={deleteIntakeProfile}
        />
      )}
      {activeTab === "settings" && (
        <SettingsView
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          technicianOptions={technicianOptions}
          defaultRouteTechnicianId={preferences.defaultRouteTechnicianId}
          onDefaultRouteTechnicianChange={(value) =>
            setPreferences((current) => ({
              ...current,
              defaultRouteTechnicianId: value,
            }))
          }
          autoLoadDefaultRouteTech={preferences.autoLoadDefaultRouteTech}
          onAutoLoadDefaultRouteTechChange={(value) =>
            setPreferences((current) => ({
              ...current,
              autoLoadDefaultRouteTech: value,
            }))
          }
          routeOptimizeByDefault={preferences.routeOptimizeByDefault}
          onRouteOptimizeByDefaultChange={(value) =>
            setPreferences((current) => ({
              ...current,
              routeOptimizeByDefault: value,
            }))
          }
          rememberLastSr={preferences.rememberLastSr}
          onRememberLastSrChange={(value) =>
            setPreferences((current) => ({
              ...current,
              rememberLastSr: value,
            }))
          }
          restoreLastSrOnLaunch={preferences.restoreLastSrOnLaunch}
          onRestoreLastSrOnLaunchChange={(value) =>
            setPreferences((current) => ({
              ...current,
              restoreLastSrOnLaunch: value,
            }))
          }
          openSrOnAttentionSelect={preferences.openSrOnAttentionSelect}
          onOpenSrOnAttentionSelectChange={(value) =>
            setPreferences((current) => ({
              ...current,
              openSrOnAttentionSelect: value,
            }))
          }
          dispatcherId={import.meta.env.VITE_DISPATCHER_ID || ""}
          apiBase={import.meta.env.VITE_OPS_HUB_API_BASE || "http://127.0.0.1:8787"}
          onClearRouteDraft={() => {
            window.localStorage.removeItem(ROUTE_DRAFT_KEY);
          }}
          onClearIntakeDraft={() => {
            window.localStorage.removeItem(INTAKE_DRAFT_KEY);
          }}
        />
      )}
    </div>
  );
}

function formatError(error) {
  if (error instanceof Error) return error.message;
  return String(error || "Unknown error");
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",", 2)[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error("File read failed."));
    reader.readAsDataURL(file);
  });
}

function readStoredPreferences() {
  const parsed = readStoredJson(window.localStorage, DISPATCH_PREFERENCES_KEY);
  if (!parsed || typeof parsed !== "object") return DEFAULT_PREFERENCES;
  return {
    ...DEFAULT_PREFERENCES,
    ...parsed,
    attentionFilters: {
      ...DEFAULT_PREFERENCES.attentionFilters,
      ...(parsed.attentionFilters || {}),
    },
  };
}

function readStoredJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    storage.removeItem(key);
    return null;
  }
}
