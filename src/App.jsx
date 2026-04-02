import { useEffect, useState } from "react";
import { dispatchApi } from "./api/client";
import BrandBar from "./components/BrandBar";
import TabNav from "./components/TabNav";
import BoardView from "./components/BoardView";
import AttentionView from "./components/AttentionView";
import ServiceRequestView from "./components/ServiceRequestView";
import RoutesView from "./components/RoutesView";
import IntakeView from "./components/IntakeView";

export default function App() {
  const [activeTab, setActiveTab] = useState("board");
  const [board, setBoard] = useState(null);
  const [boardError, setBoardError] = useState("");
  const [boardLoading, setBoardLoading] = useState(true);

  const [attention, setAttention] = useState([]);
  const [attentionError, setAttentionError] = useState("");
  const [attentionLoading, setAttentionLoading] = useState(false);
  const [selectedAttention, setSelectedAttention] = useState(null);
  const [selectedAttentionDetail, setSelectedAttentionDetail] = useState(null);
  const [attentionActionState, setAttentionActionState] = useState(null);

  const [selectedSrId, setSelectedSrId] = useState("");
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [srError, setSrError] = useState("");
  const [srLoading, setSrLoading] = useState(false);

  const [routePreview, setRoutePreview] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [routesError, setRoutesError] = useState("");
  const [routesLoading, setRoutesLoading] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [routeOriginAddress, setRouteOriginAddress] = useState("");
  const [routeDestinationAddress, setRouteDestinationAddress] = useState("");
  const [intakeFormats, setIntakeFormats] = useState(null);
  const [intakeFormatsLoading, setIntakeFormatsLoading] = useState(false);
  const [intakeFormatsError, setIntakeFormatsError] = useState("");
  const [intakeAnalysis, setIntakeAnalysis] = useState(null);
  const [intakeAnalysisLoading, setIntakeAnalysisLoading] = useState(false);
  const [intakeAnalysisError, setIntakeAnalysisError] = useState("");
  const [intakePreview, setIntakePreview] = useState(null);
  const [intakePreviewLoading, setIntakePreviewLoading] = useState(false);
  const [intakePreviewError, setIntakePreviewError] = useState("");
  const [intakeImportResult, setIntakeImportResult] = useState(null);
  const [intakeImportLoading, setIntakeImportLoading] = useState(false);
  const [intakeImportError, setIntakeImportError] = useState("");

  useEffect(() => {
    loadBoard();
    loadAttention();
    loadIntakeFormats();
  }, []);

  useEffect(() => {
    if (!selectedSrId.trim()) return;
    loadServiceRequest(selectedSrId.trim());
  }, [selectedSrId]);

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
    } catch (error) {
      setAttentionError(formatError(error));
    } finally {
      setAttentionLoading(false);
    }
  }

  async function loadAttentionDetail(itemId) {
    try {
      setSelectedAttentionDetail(await dispatchApi.getAttentionItem(itemId));
    } catch (error) {
      setAttentionActionState({ error: true, message: formatError(error) });
    }
  }

  async function loadServiceRequest(srId) {
    setSrLoading(true);
    setSrError("");
    try {
      const [customerPayload, timelinePayload] = await Promise.all([
        dispatchApi.getServiceRequestCustomer(srId),
        dispatchApi.getServiceRequestTimeline(srId),
      ]);
      setCustomer(customerPayload);
      setTimeline(timelinePayload);
    } catch (error) {
      setSrError(formatError(error));
    } finally {
      setSrLoading(false);
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
    setRouteOriginAddress(nextOriginAddress);
    setRouteDestinationAddress(nextDestinationAddress);
    setRoutesLoading(true);
    setRoutesError("");
    setActiveTab("routes");
    try {
      const [previewPayload, heatmapPayload] = await Promise.all([
        dispatchApi.getRoutePreview(techId, {
          originAddress: nextOriginAddress,
          destinationAddress: nextDestinationAddress,
        }),
        dispatchApi.getRouteHeatmap(techId),
      ]);
      setRoutePreview(previewPayload);
      setHeatmap(heatmapPayload);
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

  function handleAttentionSelect(item) {
    setSelectedAttention(item);
    setSelectedAttentionDetail(null);
    setAttentionActionState(null);
    loadAttentionDetail(item.itemId);
    const reference = item.reference || item.srReference || "";
    const srId = reference.replace(/^SR-/i, "");
    if (srId) {
      setSelectedSrId(srId);
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

  return (
    <div className="app-shell">
      <BrandBar />
      <TabNav activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === "board" && (
        <BoardView
          board={board}
          loading={boardLoading}
          error={boardError}
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
      {activeTab === "attention" && (
        <AttentionView
          items={attention}
          loading={attentionLoading}
          error={attentionError}
          onRefresh={loadAttention}
          onSelectItem={handleAttentionSelect}
          selectedItem={selectedAttention}
          selectedItemDetail={selectedAttentionDetail}
          actionState={attentionActionState}
          onAction={handleAttentionAction}
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
          loading={srLoading}
          error={srError}
          onChange={setSelectedSrId}
        />
      )}
      {activeTab === "routes" && (
        <RoutesView
          routePreview={routePreview}
          heatmap={heatmap}
          loading={routesLoading}
          error={routesError}
          technicianId={selectedTechnicianId}
          originAddress={routeOriginAddress}
          destinationAddress={routeDestinationAddress}
          onTechnicianIdChange={setSelectedTechnicianId}
          onOriginAddressChange={setRouteOriginAddress}
          onDestinationAddressChange={setRouteDestinationAddress}
          onLoad={loadRoutes}
          onOpenServiceRequestById={openServiceRequestById}
        />
      )}
      {activeTab === "intake" && (
        <IntakeView
          formats={intakeFormats}
          formatsLoading={intakeFormatsLoading}
          formatsError={intakeFormatsError}
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
        />
      )}
    </div>
  );
}

function formatError(error) {
  if (error instanceof Error) return error.message;
  return String(error || "Unknown error");
}
