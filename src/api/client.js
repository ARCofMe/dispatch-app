const API_BASE = (import.meta.env.VITE_OPS_HUB_API_BASE || "http://127.0.0.1:8787").replace(/\/$/, "");
const API_TOKEN = import.meta.env.VITE_OPS_HUB_API_TOKEN || "";
const DISPATCHER_ID = import.meta.env.VITE_DISPATCHER_ID || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      "X-Dispatch-Subject": DISPATCHER_ID,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const dispatchApi = {
  getBoard() {
    return request("/dispatch/board");
  },
  getAttention(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        params.set(key, value);
      }
    });
    const suffix = params.size ? `?${params.toString()}` : "";
    return request(`/dispatch/attention${suffix}`);
  },
  getAttentionItem(itemId) {
    return request(`/dispatch/attention/${encodeURIComponent(itemId)}`);
  },
  getServiceRequestTimeline(srId) {
    return request(`/dispatch/sr/${srId}/timeline`);
  },
  getServiceRequestCustomer(srId) {
    return request(`/dispatch/sr/${srId}/customer`);
  },
  getRoutePreview(bluefolderUserId, options = {}) {
    const params = new URLSearchParams({
      bluefolder_user_id: `${bluefolderUserId}`,
    });
    if (options.originAddress) params.set("origin_address", options.originAddress);
    if (options.destinationAddress) params.set("destination_address", options.destinationAddress);
    return request(`/dispatch/routes/preview?${params.toString()}`);
  },
  getRouteHeatmap(bluefolderUserId) {
    const suffix = bluefolderUserId ? `?bluefolder_user_id=${encodeURIComponent(bluefolderUserId)}` : "";
    return request(`/dispatch/routes/heatmap${suffix}`);
  },
  postAttentionAction(itemId, action, body = {}) {
    return request(`/dispatch/attention/${encodeURIComponent(itemId)}/${action}`, {
      method: "POST",
      body,
    });
  },
};
