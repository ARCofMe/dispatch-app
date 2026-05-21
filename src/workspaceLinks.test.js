import { describe, expect, it } from "vitest";
import { getWorkspaceLinkStatus, normalizeWorkspaceLinks, sanitizeWorkspaceUrl, summarizeWorkspaceLinks } from "./workspaceLinks";

describe("workspaceLinks", () => {
  it("normalizes bare domains to https", () => {
    expect(sanitizeWorkspaceUrl("ops.example.com")).toBe("https://ops.example.com/");
  });

  it("rejects unsafe schemes", () => {
    expect(sanitizeWorkspaceUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeWorkspaceUrl("ftp://files.example.com")).toBe("");
    expect(sanitizeWorkspaceUrl("https://user:pass@ops.example.com")).toBe("");
  });

  it("normalizes the full workspace link payload against defaults", () => {
    expect(
      normalizeWorkspaceLinks(
        { routeDeskUrl: "https://route.example.com", partsAppUrl: "bad url" },
        { opsHubUrl: "ops.example.com" },
      ),
    ).toEqual({
      opsHubUrl: "https://ops.example.com/",
      routeDeskUrl: "https://route.example.com/",
      partsAppUrl: "",
    });
  });

  it("reports ecosystem status for presentation surfaces", () => {
    const status = getWorkspaceLinkStatus(
      { opsHubUrl: "https://ops.example.com", partsAppUrl: "https://parts.example.com" },
      "routeDesk",
    );
    expect(status.find((item) => item.appKey === "opsHub")).toMatchObject({
      configured: true,
      href: "https://ops.example.com/",
      current: false,
    });
    expect(status.find((item) => item.appKey === "routeDesk")).toMatchObject({
      configured: false,
      current: true,
    });
    expect(status.find((item) => item.appKey === "partsDesk")).toMatchObject({
      configured: true,
      href: "https://parts.example.com/",
      current: false,
    });
  });

  it("summarizes configured sibling launchers", () => {
    expect(summarizeWorkspaceLinks({ opsHubUrl: "ops.example.com" }, "routeDesk")).toMatchObject({
      total: 3,
      configured: 1,
      siblingTotal: 2,
      siblingConfigured: 1,
      ready: false,
      missingLabels: ["PartsDesk"],
      configuredLabels: ["OpsHub"],
    });
  });
});
