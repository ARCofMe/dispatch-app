import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const { dispatchApiMock } = vi.hoisted(() => ({
  dispatchApiMock: {
    getBoard: vi.fn(),
    getAttention: vi.fn(),
    getIntakeFormats: vi.fn(),
    getIntakeProfiles: vi.fn(),
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
    dispatchApiMock.getAttention.mockResolvedValue({ items: [] });
    dispatchApiMock.getIntakeFormats.mockResolvedValue({ items: [] });
    dispatchApiMock.getIntakeProfiles.mockResolvedValue({ items: [] });
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
});
