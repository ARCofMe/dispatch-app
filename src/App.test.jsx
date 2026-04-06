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
    dispatchApiMock.getAttention.mockResolvedValue({ items: [] });
    dispatchApiMock.getIntakeFormats.mockResolvedValue({ items: [] });
    dispatchApiMock.getIntakeProfiles.mockResolvedValue({ items: [] });
    dispatchApiMock.getServiceRequestCustomer.mockResolvedValue({ customerName: "Pat", reference: "SR-100" });
    dispatchApiMock.getServiceRequestTimeline.mockResolvedValue({ entries: [] });
    dispatchApiMock.getServiceRequestWork.mockResolvedValue({ urgentCount: 0, ownerGapCount: 0, attentionItems: [], nextActions: [] });
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
});
