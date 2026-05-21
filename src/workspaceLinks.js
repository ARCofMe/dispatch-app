export const WORKSPACE_LINK_DEFINITIONS = [
  { key: "opsHubUrl", appKey: "opsHub", label: "OpsHub" },
  { key: "routeDeskUrl", appKey: "routeDesk", label: "RouteDesk" },
  { key: "partsAppUrl", appKey: "partsDesk", label: "PartsDesk" },
];

export function sanitizeWorkspaceUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const normalized = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(normalized);
    if (!/^https?:$/i.test(parsed.protocol) || !parsed.host) return "";
    if (parsed.username || parsed.password) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function normalizeWorkspaceLinks(links, defaults = {}) {
  const source = links && typeof links === "object" ? links : {};
  return Object.fromEntries(
    WORKSPACE_LINK_DEFINITIONS.map(({ key }) => [key, sanitizeWorkspaceUrl(source[key] ?? defaults[key])]),
  );
}

export function getWorkspaceLinkStatus(workspaceLinks = {}, currentApp = "") {
  return WORKSPACE_LINK_DEFINITIONS.map(({ key, appKey, label }) => {
    const href = sanitizeWorkspaceUrl(workspaceLinks[key]);
    return {
      key,
      appKey,
      label,
      href,
      configured: Boolean(href),
      current: appKey === currentApp,
    };
  });
}

export function summarizeWorkspaceLinks(workspaceLinks = {}, currentApp = "") {
  const status = getWorkspaceLinkStatus(workspaceLinks, currentApp);
  const siblings = status.filter((item) => !item.current);
  const configuredSiblings = siblings.filter((item) => item.configured);
  return {
    total: status.length,
    configured: status.filter((item) => item.configured).length,
    siblingTotal: siblings.length,
    siblingConfigured: configuredSiblings.length,
    ready: configuredSiblings.length === siblings.length,
    missingLabels: siblings.filter((item) => !item.configured).map((item) => item.label),
    configuredLabels: configuredSiblings.map((item) => item.label),
  };
}
