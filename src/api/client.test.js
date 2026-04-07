import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchApi } from "./client";

describe("dispatchApi client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("omits json content-type on GET requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ mappedTechs: 1 })),
    });
    vi.stubGlobal("fetch", fetchMock);

    await dispatchApi.getBoard();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Content-Type"]).toBeUndefined();
    expect(options.headers["X-Dispatch-Subject"]).toBeTypeOf("string");
  });

  it("adds a clearer dispatcher message for 403 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ success: false, message: "Dispatcher or admin identity could not be resolved." })),
      }),
    );

    await expect(dispatchApi.getBoard()).rejects.toThrow(
      "Dispatcher or admin identity could not be resolved. Check the dispatcher/admin user ID allowlist.",
    );
  });

  it("uses the extended route timeout for route preview requests", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              text: () => Promise.resolve(JSON.stringify({ success: true, stops: [] })),
            });
          }, 31_000);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const requestPromise = dispatchApi.getRoutePreview(9001, { optimize: true });
    await vi.advanceTimersByTimeAsync(31_000);

    await expect(requestPromise).resolves.toEqual({ success: true, stops: [] });
    vi.useRealTimers();
  });

  it("keeps the shorter default timeout for non-route requests", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_, options) =>
        new Promise((_, reject) => {
          options.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
      ),
    );

    const requestPromise = dispatchApi.getBoard();
    const rejection = expect(requestPromise).rejects.toThrow("Ops Hub request timed out after 30s.");
    await vi.advanceTimersByTimeAsync(30_000);

    await rejection;
    vi.useRealTimers();
  });
});
