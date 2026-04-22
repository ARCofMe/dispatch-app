import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

  const { dispatchApiMock } = vi.hoisted(() => ({
  dispatchApiMock: {
    getBoard: vi.fn(),
    getComplaintIntelligenceDashboard: vi.fn(),
    getComplaintIntelligenceReviewQueue: vi.fn(),
    getBlueFolderStatusCatalog: vi.fn(),
    seedComplaintIntelligenceFeedback: vi.fn(),
    resolveComplaintIntelligenceReview: vi.fn(),
    getAttention: vi.fn(),
    getAttentionItem: vi.fn(),
    getIntakeFormats: vi.fn(),
    getIntakeProfiles: vi.fn(),
    previewManualServiceRequest: vi.fn(),
    importManualServiceRequest: vi.fn(),
    getServiceRequestCustomer: vi.fn(),
    getServiceRequestTimeline: vi.fn(),
    getServiceRequestWork: vi.fn(),
    getServiceRequestPhotoCompliance: vi.fn(),
    getServiceRequestComplaintIntelligence: vi.fn(),
    submitServiceRequestComplaintFeedback: vi.fn(),
    getServiceRequestSmsCapabilities: vi.fn(),
    getServiceRequestSmsHistory: vi.fn(),
    previewServiceRequestSms: vi.fn(),
    sendServiceRequestSms: vi.fn(),
  },
}));

vi.mock("./api/client", () => ({
  dispatchApi: dispatchApiMock,
  getDispatcherId: () => {
    try {
      return window.localStorage.getItem("routedesk-dispatcher-id") || "";
    } catch {
      return "";
    }
  },
  setDispatcherId: (value) => {
    const cleaned = `${value || ""}`.trim();
    try {
      if (cleaned) {
        window.localStorage.setItem("routedesk-dispatcher-id", cleaned);
      } else {
        window.localStorage.removeItem("routedesk-dispatcher-id");
      }
    } catch {
      // Match production storage tolerance.
    }
    return cleaned;
  },
}));

describe("Dispatch App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    dispatchApiMock.getBoard.mockReset();
    dispatchApiMock.getComplaintIntelligenceDashboard.mockReset();
    dispatchApiMock.getComplaintIntelligenceReviewQueue.mockReset();
    dispatchApiMock.getBlueFolderStatusCatalog.mockReset();
    dispatchApiMock.seedComplaintIntelligenceFeedback.mockReset();
    dispatchApiMock.resolveComplaintIntelligenceReview.mockReset();
    dispatchApiMock.getAttention.mockReset();
    dispatchApiMock.getAttentionItem.mockReset();
    dispatchApiMock.getIntakeFormats.mockReset();
    dispatchApiMock.getIntakeProfiles.mockReset();
    dispatchApiMock.previewManualServiceRequest.mockReset();
    dispatchApiMock.importManualServiceRequest.mockReset();
    dispatchApiMock.getServiceRequestCustomer.mockReset();
    dispatchApiMock.getServiceRequestTimeline.mockReset();
    dispatchApiMock.getServiceRequestWork.mockReset();
    dispatchApiMock.getServiceRequestPhotoCompliance.mockReset();
    dispatchApiMock.getServiceRequestComplaintIntelligence.mockReset();
    dispatchApiMock.submitServiceRequestComplaintFeedback.mockReset();
    dispatchApiMock.getServiceRequestSmsCapabilities.mockReset();
    dispatchApiMock.getServiceRequestSmsHistory.mockReset();
    dispatchApiMock.previewServiceRequestSms.mockReset();
    dispatchApiMock.sendServiceRequestSms.mockReset();
    dispatchApiMock.getAttention.mockResolvedValue({ items: [] });
    dispatchApiMock.getComplaintIntelligenceDashboard.mockResolvedValue({
      available: true,
      feedbackVolume: 3,
      reviewQueueCount: 1,
      helpfulRate: 0.67,
      feedbackHealth: { status: "review_needed", label: "Some evidence feedback still needs operator review" },
    });
    dispatchApiMock.getBlueFolderStatusCatalog.mockResolvedValue({
      knownCount: 4,
      primarySurfaceCounts: { partsdesk: 1, routedesk: 2, ops_hub: 1 },
      categoryCounts: { parts: 1, scheduling: 1, review: 1, quote: 1 },
    });
    dispatchApiMock.getComplaintIntelligenceReviewQueue.mockResolvedValue({
      available: true,
      items: [{ feedbackId: 1, serviceRequestId: "1001", outcome: "not_helpful", recommendedItem: "FAN-1" }],
    });
    dispatchApiMock.seedComplaintIntelligenceFeedback.mockResolvedValue({
      success: true,
      message: "Seeded 4 historical feedback records.",
      inserted: 4,
    });
    dispatchApiMock.resolveComplaintIntelligenceReview.mockResolvedValue({
      success: true,
      message: "Resolved feedback 1 as trusted.",
    });
    dispatchApiMock.getAttentionItem.mockResolvedValue({
      item: {
        itemId: "dispatch:SR-100:quote_needed",
        reference: "SR-100",
        stage: "quote_needed",
        stageLabel: "Quote Needed",
        nextAction: "Call landlord",
        status: "open",
      },
      history: [],
    });
    dispatchApiMock.getIntakeFormats.mockResolvedValue({ items: [] });
    dispatchApiMock.getIntakeProfiles.mockResolvedValue({ items: [] });
    dispatchApiMock.previewManualServiceRequest.mockResolvedValue({ success: true });
    dispatchApiMock.importManualServiceRequest.mockResolvedValue({ success: true });
    dispatchApiMock.getServiceRequestCustomer.mockResolvedValue({ customerName: "Pat", reference: "SR-100" });
    dispatchApiMock.getServiceRequestTimeline.mockResolvedValue({ entries: [] });
    dispatchApiMock.getServiceRequestWork.mockResolvedValue({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] });
    dispatchApiMock.getServiceRequestPhotoCompliance.mockResolvedValue({
      mailboxStatus: "found",
      totalPhotos: 2,
      matchedRequiredStatus: true,
      shouldNotify: false,
      foundTags: ["Model", "Serial"],
      missingTags: [],
    });
    dispatchApiMock.getServiceRequestComplaintIntelligence.mockResolvedValue({
      available: false,
      integrationStatus: "unconfigured",
      message: "Complaint Intelligence database is not configured.",
      complaintTags: [],
      recommendations: [],
      commonResolutions: [],
      feedbackSummary: { counts: {}, latest: null },
      modelFamilyTrends: null,
    });
    dispatchApiMock.submitServiceRequestComplaintFeedback.mockResolvedValue({
      success: true,
      outcome: "helpful",
      message: "Recorded Complaint Intelligence feedback as helpful.",
      feedbackSummary: { counts: { helpful: 1 }, latest: { outcome: "helpful" } },
    });
    dispatchApiMock.getServiceRequestSmsCapabilities.mockResolvedValue({
      provider: "dry_run",
      enabled: true,
      toNumber: "555-0100",
      fromLabel: "OpsHub",
      intents: [{ key: "dispatch_follow_up", label: "General follow-up", recommended: "true" }],
    });
    dispatchApiMock.getServiceRequestSmsHistory.mockResolvedValue({ items: [] });
    dispatchApiMock.previewServiceRequestSms.mockResolvedValue({
      provider: "dry_run",
      toNumber: "555-0100",
      message: "OpsHub: Test",
      segments: 1,
    });
    dispatchApiMock.sendServiceRequestSms.mockResolvedValue({
      success: true,
      provider: "dry_run",
      status: "dry_run",
      toNumber: "555-0100",
      message: "OpsHub: Test",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the hardened dispatcher auth error on initial board load", async () => {
    dispatchApiMock.getBoard.mockRejectedValue(
      new Error("Dispatcher or admin identity could not be resolved. Check the OpsHub dispatcher/admin operator allowlist."),
    );

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Dispatcher or admin identity could not be resolved. Check the OpsHub dispatcher/admin operator allowlist."),
      ).toBeInTheDocument();
    });
  });

  it("keeps a cached board visible when refresh fails", async () => {
    window.localStorage.setItem(
      "dispatch-board-cache",
      JSON.stringify({
        visibleOperators: 2,
        mappedTechs: 1,
        discordLinkedTechs: 0,
        activeTechs: 1,
        totalVisibleAssignments: 3,
        attentionJobs: 1,
        openPartsCases: 0,
        scannedJobs: 3,
        attentionMetrics: { queueCounts: {} },
        technicianLoad: [],
        topAttention: [],
        openPartsCaseItems: [],
      }),
    );
    dispatchApiMock.getBoard.mockRejectedValue(new Error("OpsHub temporarily unavailable."));

    render(<App />);

    expect(await screen.findByText("Dispatch command brief")).toBeInTheDocument();
    expect(screen.getByText("Showing last board snapshot. Refresh failed: OpsHub temporarily unavailable.")).toBeInTheDocument();
  });

  it("clears stale service request detail when a later load fails", async () => {
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });
    dispatchApiMock.getServiceRequestCustomer
      .mockResolvedValueOnce({ customerName: "Pat Smith", reference: "SR-100" })
      .mockRejectedValueOnce(new Error("Could not load SR detail."));
    dispatchApiMock.getServiceRequestTimeline
      .mockResolvedValueOnce({ entries: [] })
      .mockResolvedValueOnce({ entries: [] });
    dispatchApiMock.getServiceRequestWork
      .mockResolvedValueOnce({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] })
      .mockResolvedValueOnce({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Service Request" }));
    fireEvent.change(screen.getByLabelText("SR ID"), { target: { value: "100" } });
    expect(await screen.findByText("Pat Smith")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("SR ID"), { target: { value: "101" } });

    await waitFor(() => {
      expect(screen.getByText("Could not load SR detail.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Pat Smith")).not.toBeInTheDocument();
    expect(screen.queryByText("Work panel")).not.toBeInTheDocument();
  });

  it("shows photo compliance in service request detail", async () => {
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });
    dispatchApiMock.getServiceRequestCustomer.mockResolvedValue({ customerName: "Pat Smith", reference: "SR-100" });
    dispatchApiMock.getServiceRequestTimeline.mockResolvedValue({ entries: [] });
    dispatchApiMock.getServiceRequestWork.mockResolvedValue({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] });
    dispatchApiMock.getServiceRequestPhotoCompliance.mockResolvedValue({
      mailboxStatus: "found",
      totalPhotos: 1,
      matchedRequiredStatus: true,
      shouldNotify: true,
      reason: "Missing required archived photos.",
      foundTags: ["Model"],
      missingTags: ["Serial"],
      checkedAt: "2026-04-06T17:30:00+00:00",
    });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Service Request" }));
    fireEvent.change(screen.getByLabelText("SR ID"), { target: { value: "100" } });

    expect(await screen.findByText("Photo compliance")).toBeInTheDocument();
    expect(dispatchApiMock.getServiceRequestPhotoCompliance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Photo compliance"));
    expect(await screen.findByText("Missing required archived photos.")).toBeInTheDocument();
    expect(screen.getByText("Serial")).toBeInTheDocument();
  });

  it("shows complaint intelligence in service request detail", async () => {
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });
    dispatchApiMock.getServiceRequestCustomer.mockResolvedValue({ customerName: "Pat Smith", reference: "SR-100" });
    dispatchApiMock.getServiceRequestTimeline.mockResolvedValue({ entries: [] });
    dispatchApiMock.getServiceRequestWork.mockResolvedValue({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] });
    dispatchApiMock.getServiceRequestComplaintIntelligence.mockResolvedValue({
      available: true,
      request: {
        modelNumber: "RF1",
        brand: "Samsung",
        applianceType: "refrigerator",
        complaintText: "not cooling",
      },
      complaintTags: [{ tag: "no_cool", confidence: 1, source: "rules" }],
      similarRequestCount: 2,
      recommendations: [{ item: "FAN-1", itemType: "part", matchingRequestCount: 2, score: 1 }],
      commonResolutions: ["Replaced evaporator fan"],
      modelFamilyTrends: {
        modelFamily: "RF1",
        requestCount: 5,
        topComplaintTags: [{ tag: "no_cool", count: 4 }],
        topParts: [{ item: "FAN-1", itemType: "part", count: 3 }],
      },
      feedbackSummary: {
        counts: { helpful: 0, needs_review: 0, not_helpful: 0 },
        latest: { outcome: "helpful", notes: "Matched a prior fan repair." },
      },
      feedbackHealth: { status: "supportive", label: "Prior feedback supports this evidence" },
    });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Service Request" }));
    fireEvent.change(screen.getByLabelText("SR ID"), { target: { value: "100" } });

    expect(await screen.findByText("Complaint Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Evidence brief")).toBeInTheDocument();
    expect(screen.getByText("Prior feedback supports this evidence")).toBeInTheDocument();
    expect(screen.getByText("Matched a prior fan repair.")).toBeInTheDocument();
    expect(screen.getAllByText("FAN-1").length).toBeGreaterThan(0);
    expect(screen.getByText("no_cool")).toBeInTheDocument();
    expect(dispatchApiMock.getServiceRequestComplaintIntelligence).toHaveBeenCalledWith("100");
  });

  it("submits evidence feedback from the SR evidence brief", async () => {
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });
    dispatchApiMock.getServiceRequestCustomer.mockResolvedValue({ customerName: "Pat Smith", reference: "SR-100" });
    dispatchApiMock.getServiceRequestWork.mockResolvedValue({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] });
    dispatchApiMock.getServiceRequestComplaintIntelligence.mockResolvedValue({
      available: true,
      request: { modelNumber: "RF1", brand: "Samsung", applianceType: "refrigerator", complaintText: "not cooling" },
      complaintTags: [{ tag: "no_cool", confidence: 1, source: "rules" }],
      similarRequestCount: 2,
      recommendations: [{ item: "FAN-1", itemType: "part", matchingRequestCount: 2, score: 1 }],
      commonResolutions: [],
      modelFamilyTrends: null,
      feedbackSummary: { counts: {}, latest: null },
      evidencePacket: { confidence: "limited", classification: { matchScope: "exact_model" }, diagnosticQuestions: [] },
    });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Service Request" }));
    fireEvent.change(screen.getByLabelText("SR ID"), { target: { value: "100" } });
    fireEvent.change(await screen.findByLabelText("Feedback note"), { target: { value: "Matched final repair." } });
    fireEvent.click(await screen.findByRole("button", { name: "Evidence helped" }));

    await waitFor(() =>
      expect(dispatchApiMock.submitServiceRequestComplaintFeedback).toHaveBeenCalledWith("100", {
        outcome: "helpful",
        recommendedItem: "FAN-1",
        notes: "Matched final repair.",
      }),
    );
    expect(await screen.findByText("Recorded Complaint Intelligence feedback as helpful.")).toBeInTheDocument();
  });

  it("lazy-loads secondary SR sections without blocking usable context", async () => {
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });
    dispatchApiMock.getServiceRequestCustomer.mockResolvedValue({ customerName: "Pat Smith", reference: "SR-100" });
    dispatchApiMock.getServiceRequestTimeline.mockResolvedValue({ entries: [] });
    dispatchApiMock.getServiceRequestWork.mockResolvedValue({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] });
    dispatchApiMock.getServiceRequestPhotoCompliance.mockRejectedValue(new Error("Photo service unavailable."));

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Service Request" }));
    fireEvent.change(screen.getByLabelText("SR ID"), { target: { value: "100" } });

    expect(await screen.findByText("Pat Smith")).toBeInTheDocument();
    expect(screen.getByText("Work panel")).toBeInTheDocument();
    expect(dispatchApiMock.getServiceRequestTimeline).not.toHaveBeenCalled();
    expect(dispatchApiMock.getServiceRequestPhotoCompliance).not.toHaveBeenCalled();
    expect(dispatchApiMock.getServiceRequestSmsCapabilities).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Photo compliance"));

    expect(await screen.findByText("Photo service unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry section" })).toBeInTheDocument();
  });

  it("drops malformed stored preferences instead of crashing on boot", async () => {
    window.localStorage.setItem("dispatch-preferences", "{bad json");
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });

    render(<App />);

    await waitFor(() => {
      expect(dispatchApiMock.getBoard).toHaveBeenCalledTimes(1);
    });
    expect(() => JSON.parse(window.localStorage.getItem("dispatch-preferences") || "")).not.toThrow();
  });

  it("removes the legacy local app-name override and keeps the RouteDesk title", async () => {
    window.localStorage.setItem("dispatch-app-name", "Custom Dispatch");
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });

    render(<App />);

    await waitFor(() => {
      expect(dispatchApiMock.getBoard).toHaveBeenCalledTimes(1);
    });
    expect(window.localStorage.getItem("dispatch-app-name")).toBeNull();
    expect(document.title).toBe("RouteDesk | OpsHub");
  });

  it("keeps rendering when browser storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });

    render(<App />);

    expect(await screen.findByText("RouteDesk")).toBeInTheDocument();
    expect(dispatchApiMock.getBoard).toHaveBeenCalledTimes(1);
  });

  it("sanitizes stored ecosystem links before rendering header jumps", async () => {
    window.localStorage.setItem(
      "dispatch-workspace-links",
      JSON.stringify({
        routeDeskUrl: "https://route.example.com",
        partsAppUrl: "https://parts.example.com",
        fieldDeskUrl: "javascript:alert(1)",
      })
    );
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });

    render(<App />);

    expect(await screen.findByRole("link", { name: "Open PartsDesk" })).toHaveAttribute("href", "https://parts.example.com/");
    expect(screen.queryByRole("link", { name: "Open FieldDesk" })).not.toBeInTheDocument();
  });

  it("opens read-only discovery attention items without requesting persisted detail", async () => {
    const discoveryItem = {
      itemId: "discovery:SR-400",
      srId: 400,
      reference: "SR-400",
      stage: "bluefolder_discovery",
      stageLabel: "BlueFolder Discovery",
      nextAction: "Review this BlueFolder SR",
      status: "open",
      ageBucket: "fresh",
      readOnly: true,
    };
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });
    dispatchApiMock.getAttention.mockResolvedValue({ items: [discoveryItem] });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Attention" }));
    fireEvent.click(await screen.findByText("Review this BlueFolder SR"));

    expect(await screen.findByText("Read-only discovery candidate. Open the SR to decide the next workflow action.")).toBeInTheDocument();
    expect(dispatchApiMock.getAttentionItem).not.toHaveBeenCalled();
  });

});
