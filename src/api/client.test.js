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
});
