import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const { dispatchApiMock } = vi.hoisted(() => ({
  dispatchApiMock: {
    getBoard: vi.fn(),
    getAttention: vi.fn(),
    getIntakeFormats: vi.fn(),
    getIntakeProfiles: vi.fn(),
    getServiceRequestCustomer: vi.fn(),
    getServiceRequestTimeline: vi.fn(),
    getServiceRequestWork: vi.fn(),
    getServiceRequestPhotoCompliance: vi.fn(),
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
    dispatchApiMock.getIntakeFormats.mockReset();
    dispatchApiMock.getIntakeProfiles.mockReset();
    dispatchApiMock.getServiceRequestCustomer.mockReset();
    dispatchApiMock.getServiceRequestTimeline.mockReset();
    dispatchApiMock.getServiceRequestWork.mockReset();
    dispatchApiMock.getServiceRequestPhotoCompliance.mockReset();
    dispatchApiMock.getAttention.mockResolvedValue({ items: [] });
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
});
