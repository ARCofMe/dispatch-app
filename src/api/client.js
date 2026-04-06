const API_BASE = (import.meta.env.VITE_OPS_HUB_API_BASE || "http://127.0.0.1:8787").replace(/\/$/, "");
const API_TOKEN = import.meta.env.VITE_OPS_HUB_API_TOKEN || "";
const DISPATCHER_ID = import.meta.env.VITE_DISPATCHER_ID || "";
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_OPS_HUB_API_TIMEOUT_MS || 30000);

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const hasBody = options.body !== undefined;
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
        "X-Dispatch-Subject": DISPATCHER_ID,
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = parsePayload(text);

    if (!response.ok) {
      throw new Error(buildErrorMessage(response.status, payload, text));
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Ops Hub request timed out after ${Math.round(REQUEST_TIMEOUT_MS / 1000)}s.`);
    }
    if (error instanceof TypeError) {
      throw new Error("Could not reach Ops Hub. Check that ops-hub is running and the API base URL is correct.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
  getServiceRequestWork(srId) {
    return request(`/dispatch/sr/${srId}/work`);
  },
  getRoutePreview(bluefolderUserId, options = {}) {
    const params = new URLSearchParams({
      bluefolder_user_id: `${bluefolderUserId}`,
    });
    if (options.date) params.set("date", options.date);
    if (options.originAddress) params.set("origin_address", options.originAddress);
    if (options.destinationAddress) params.set("destination_address", options.destinationAddress);
    if (options.optimize) params.set("optimize", "true");
    return request(`/dispatch/routes/preview?${params.toString()}`);
  },
  getRouteHeatmap(bluefolderUserId) {
    const suffix = bluefolderUserId ? `?bluefolder_user_id=${encodeURIComponent(bluefolderUserId)}` : "";
    return request(`/dispatch/routes/heatmap${suffix}`);
  },
  simulateRoute(body) {
    return request("/dispatch/routes/simulate", {
      method: "POST",
      body,
    });
  },
  getIntakeFormats() {
    return request("/dispatch/intake/formats");
  },
  getIntakeProfiles() {
    return request("/dispatch/intake/profiles");
  },
  saveIntakeProfile(body) {
    return request("/dispatch/intake/profiles", {
      method: "POST",
      body,
    });
  },
  uploadIntakeSpreadsheet({ fileName, contentBase64 }) {
    return request("/dispatch/intake/upload", {
      method: "POST",
      body: {
        fileName,
        contentBase64,
      },
    });
  },
  deleteIntakeProfile(name) {
    return request(`/dispatch/intake/profiles/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  },
  analyzeIntake(body) {
    return request("/dispatch/intake/analyze", {
      method: "POST",
      body,
    });
  },
  previewIntake(body) {
    return request("/dispatch/intake/preview", {
      method: "POST",
      body,
    });
  },
  importIntake(body) {
    return request("/dispatch/intake/import", {
      method: "POST",
      body,
    });
  },
  postAttentionAction(itemId, action, body = {}) {
    return request(`/dispatch/attention/${encodeURIComponent(itemId)}/${action}`, {
      method: "POST",
      body,
    });
  },
  postAttentionBulkAction(action, itemIds, body = {}) {
    return request("/dispatch/attention/bulk", {
      method: "POST",
      body: {
        action,
        itemIds,
        ...body,
      },
    });
  },
};

function parsePayload(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildErrorMessage(status, payload, text) {
  const message =
    (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string" && payload.message) ||
    (typeof payload === "string" ? payload : "") ||
    text ||
    `HTTP ${status}`;

  if (status === 401) return `${message} Check the Ops Hub API token.`;
  if (status === 403) return `${message} Check the dispatcher/admin user ID allowlist.`;
  return message;
}
