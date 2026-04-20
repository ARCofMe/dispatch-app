import { afterEach, describe, expect, it, vi } from "vitest";
import { DISPATCHER_ID_STORAGE_KEY, dispatchApi, getDispatcherId, setDispatcherId } from "./client";

describe("dispatchApi client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem(DISPATCHER_ID_STORAGE_KEY);
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

  it("uses the per-browser dispatcher id for dispatch requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ mappedTechs: 1 })),
    });
    vi.stubGlobal("fetch", fetchMock);

    setDispatcherId("dispatcher-42");
    await dispatchApi.getBoard();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["X-Dispatch-Subject"]).toBe("dispatcher-42");
    expect(getDispatcherId()).toBe("dispatcher-42");
  });

  it("clears the per-browser dispatcher id when blanked", () => {
    setDispatcherId("dispatcher-42");
    setDispatcherId("");

    expect(window.localStorage.getItem(DISPATCHER_ID_STORAGE_KEY)).toBeNull();
  });

  it("keeps dispatcher identity helpers safe when browser storage is blocked", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(getDispatcherId()).toEqual(expect.any(String));
    expect(setDispatcherId("dispatcher-42")).toBe("dispatcher-42");
    expect(setDispatcherId("")).toBe("");
    expect(getItemSpy).toHaveBeenCalled();
    expect(setItemSpy).toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalled();
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

    await expect(dispatchApi.getBoard()).rejects.toThrow("routedesk-dispatcher-id browser setting.");
  });

  it("includes the sent dispatcher operator id in 403 responses", async () => {
    setDispatcherId("wrong-dispatcher");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve(JSON.stringify({ success: false, message: "Dispatcher or admin identity could not be resolved." })),
      }),
    );

    await expect(dispatchApi.getBoard()).rejects.toThrow('Sent operator ID "wrong-dispatcher".');
  });

  it("sanitizes internal asyncio task errors from Ops Hub responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: false,
              message:
                "Task <Task pending name='Task-211'> got Future <Task pending name='Task-212'> attached to a different loop",
            }),
          ),
      }),
    );

    await expect(dispatchApi.getServiceRequestWork(100)).rejects.toThrow("internal refresh error");
    await expect(dispatchApi.getServiceRequestWork(100)).rejects.not.toThrow("Task <Task");
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

  it("uses the extended attention timeout for attention requests", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              text: () => Promise.resolve(JSON.stringify({ items: [] })),
            });
          }, 31_000);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const requestPromise = dispatchApi.getAttention();
    await vi.advanceTimersByTimeAsync(31_000);

    await expect(requestPromise).resolves.toEqual({ items: [] });
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

  it("posts SR SMS preview payloads to the dispatch API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ provider: "dry_run", message: "Test" })),
    });
    vi.stubGlobal("fetch", fetchMock);

    await dispatchApi.previewServiceRequestSms(100, { intent: "dispatch_follow_up", customMessage: "Test" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/dispatch/sr/100/sms/preview");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ intent: "dispatch_follow_up", customMessage: "Test" });
  });

  it("loads complaint intelligence for a service request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ available: true, srId: "100" })),
    });
    vi.stubGlobal("fetch", fetchMock);

    await dispatchApi.getServiceRequestComplaintIntelligence(100);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/dispatch/sr/100/complaint_intelligence");
    expect(options.method).toBe("GET");
  });
});
