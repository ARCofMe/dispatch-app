import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

  const { dispatchApiMock } = vi.hoisted(() => ({
  dispatchApiMock: {
    getBoard: vi.fn(),
    getAttention: vi.fn(),
    getAttentionItem: vi.fn(),
    getIntakeFormats: vi.fn(),
    getIntakeProfiles: vi.fn(),
    getServiceRequestCustomer: vi.fn(),
    getServiceRequestTimeline: vi.fn(),
    getServiceRequestWork: vi.fn(),
    getServiceRequestPhotoCompliance: vi.fn(),
    getServiceRequestSmsCapabilities: vi.fn(),
    getServiceRequestSmsHistory: vi.fn(),
    previewServiceRequestSms: vi.fn(),
    sendServiceRequestSms: vi.fn(),
  },
}));

vi.mock("./api/client", () => ({
  dispatchApi: dispatchApiMock,
}));

describe("Dispatch App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    dispatchApiMock.getBoard.mockReset();
    dispatchApiMock.getAttention.mockReset();
    dispatchApiMock.getAttentionItem.mockReset();
    dispatchApiMock.getIntakeFormats.mockReset();
    dispatchApiMock.getIntakeProfiles.mockReset();
    dispatchApiMock.getServiceRequestCustomer.mockReset();
    dispatchApiMock.getServiceRequestTimeline.mockReset();
    dispatchApiMock.getServiceRequestWork.mockReset();
    dispatchApiMock.getServiceRequestPhotoCompliance.mockReset();
    dispatchApiMock.getServiceRequestSmsCapabilities.mockReset();
    dispatchApiMock.getServiceRequestSmsHistory.mockReset();
    dispatchApiMock.previewServiceRequestSms.mockReset();
    dispatchApiMock.sendServiceRequestSms.mockReset();
    dispatchApiMock.getAttention.mockResolvedValue({ items: [] });
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
    dispatchApiMock.getServiceRequestSmsCapabilities.mockResolvedValue({
      provider: "dry_run",
      enabled: true,
      toNumber: "555-0100",
      fromLabel: "ARCoM Ops",
      intents: [{ key: "dispatch_follow_up", label: "General follow-up", recommended: "true" }],
    });
    dispatchApiMock.getServiceRequestSmsHistory.mockResolvedValue({ items: [] });
    dispatchApiMock.previewServiceRequestSms.mockResolvedValue({
      provider: "dry_run",
      toNumber: "555-0100",
      message: "ARCoM Ops: Test",
      segments: 1,
    });
    dispatchApiMock.sendServiceRequestSms.mockResolvedValue({
      success: true,
      provider: "dry_run",
      status: "dry_run",
      toNumber: "555-0100",
      message: "ARCoM Ops: Test",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the hardened dispatcher auth error on initial board load", async () => {
    dispatchApiMock.getBoard.mockRejectedValue(
      new Error("Dispatcher or admin identity could not be resolved. Check the dispatcher/admin user ID allowlist."),
    );

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText("Dispatcher or admin identity could not be resolved. Check the dispatcher/admin user ID allowlist."),
      ).toBeInTheDocument();
    });
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
    expect(screen.getByText("Missing required archived photos.")).toBeInTheDocument();
    expect(screen.getByText("Serial")).toBeInTheDocument();
  });

  it("keeps usable SR sections when only one SR subrequest fails", async () => {
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
    expect(screen.getByText("Photo service unavailable.")).toBeInTheDocument();
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
    expect(document.title).toBe("RouteDesk | ARCoM Ops Hub");
  });

  it("clears stale attention detail when a refresh drops the selected item", async () => {
    dispatchApiMock.getBoard.mockResolvedValue({ mappedTechs: [] });
    dispatchApiMock.getAttention
      .mockResolvedValueOnce({
        items: [
          {
            itemId: "dispatch:SR-100:quote_needed",
            reference: "SR-100",
            stage: "quote_needed",
            stageLabel: "Quote Needed",
            nextAction: "Call landlord",
            status: "open",
          },
        ],
      })
      .mockResolvedValueOnce({ items: [] });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Attention" }));
    fireEvent.click(await screen.findByRole("button", { name: /SR-100/i }));
    expect(await screen.findByRole("heading", { name: "SR-100" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(screen.getByText("Select an attention item to inspect history and take action.")).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "SR-100" })).not.toBeInTheDocument();
  });
});
