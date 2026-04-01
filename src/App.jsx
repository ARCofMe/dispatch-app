import { useEffect, useState } from "react";
import { dispatchApi } from "./api/client";
import BrandBar from "./components/BrandBar";
import TabNav from "./components/TabNav";
import BoardView from "./components/BoardView";
import AttentionView from "./components/AttentionView";
import ServiceRequestView from "./components/ServiceRequestView";
import RoutesView from "./components/RoutesView";

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

  useEffect(() => {
    loadBoard();
    loadAttention();
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

  async function loadRoutesFromItem(item) {
    const techId = item.technicianBluefolderUserId || item.technician_bluefolder_user_id;
    if (!techId) {
      setRoutesError("Selected attention item does not include a technician mapping yet.");
      setActiveTab("routes");
      return;
    }
    setRoutesLoading(true);
    setRoutesError("");
    setActiveTab("routes");
    try {
      const [previewPayload, heatmapPayload] = await Promise.all([
        dispatchApi.getRoutePreview(techId),
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
        <BoardView board={board} loading={boardLoading} error={boardError} onOpenAttention={() => setActiveTab("attention")} />
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
        <RoutesView routePreview={routePreview} heatmap={heatmap} loading={routesLoading} error={routesError} />
      )}
    </div>
  );
}

function formatError(error) {
  if (error instanceof Error) return error.message;
  return String(error || "Unknown error");
}
