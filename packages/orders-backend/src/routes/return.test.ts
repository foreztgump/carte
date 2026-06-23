import { afterEach, describe, expect, it, vi } from "vitest";

// Keep the real fulfillTransaction / createKvDedupStore / abort error under
// test; only the client constructor is redirected to the scriptable client the
// test-support context carries.
vi.mock("@tenderpay/sdk", async (importActual) => {
  const actual = await importActual<typeof import("@tenderpay/sdk")>();
  return {
    ...actual,
    createTenderClientFromContext: vi.fn((ctx: { tenderClient: unknown }) => ctx.tenderClient),
  };
});

import { tenderReturnContext } from "../test-support.js";
import { returnRoute } from "./return.js";

const PAID = { id: "txn_123", status: "paid", metadata: { carte_order_id: "order_123" } };
const PROCESSING = {
  id: "txn_123",
  status: "processing",
  metadata: { carte_order_id: "order_123" },
};
const PAID_NO_ORDER = { id: "txn_123", status: "paid", metadata: {} };

afterEach(() => {
  vi.useRealTimers();
});

describe("returnRoute bounded fulfillment", () => {
  it("drives a single paid order update once the transaction settles", async () => {
    const handle = tenderReturnContext({ transactions: [PROCESSING, PAID] });

    vi.useFakeTimers();
    const pending = returnRoute(handle.ctx);
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await pending;

    expect(result).toEqual({ status: "paid" });
    expect(handle.updates).toHaveLength(1);
    expect(handle.updates[0]).toMatchObject({
      collection: "carte_orders",
      id: "order_123",
      value: { status: "paid" },
    });
  });

  it("is idempotent when the same paid transaction is observed twice", async () => {
    const handle = tenderReturnContext({ transactions: [PAID] });

    await returnRoute(handle.ctx);
    await returnRoute(handle.ctx);

    expect(handle.updates).toHaveLength(1);
  });

  it("returns processing without writing when the poll budget aborts", async () => {
    const handle = tenderReturnContext({ transactions: [PROCESSING] });

    vi.useFakeTimers();
    const pending = returnRoute(handle.ctx);
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await pending;

    expect(result).toEqual({ status: "processing" });
    expect(handle.updates).toHaveLength(0);
    expect(handle.getTransactionCalls.length).toBeGreaterThan(0);
  });

  it("is a no-op when paid transaction metadata lacks carte_order_id", async () => {
    const handle = tenderReturnContext({ transactions: [PAID_NO_ORDER] });

    const result = await returnRoute(handle.ctx);

    expect(result).toEqual({ status: "paid" });
    expect(handle.updates).toHaveLength(0);
  });

  it("degrades to processing without escaping when the order update fails", async () => {
    const handle = tenderReturnContext({ transactions: [PAID], failOrderUpdate: true });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await returnRoute(handle.ctx);

    expect(result).toEqual({ status: "processing" });
    expect(handle.updates).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });
});
