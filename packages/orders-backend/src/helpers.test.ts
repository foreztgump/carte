import { describe, expect, it } from "vitest";

import { createOrderLineItemSnapshot } from "./order-snapshot.js";
import { createStaleStripeSettingsWarning } from "./stale-stripe-warning.js";
import { staleStripeWarningContext } from "./test-support.js";

describe("createOrderLineItemSnapshot", () => {
  it("snapshots user-visible line item and modifier values at write time", () => {
    const menuLineItem = {
      menuItemId: "item_123",
      itemName: "Margherita Pizza",
      unitPrice: 1295,
      quantity: 2,
      modifiers: [{ modifierId: "mod_1", modifierName: "Extra basil", priceDelta: 100 }],
    };

    const snapshot = createOrderLineItemSnapshot(menuLineItem);
    menuLineItem.itemName = "Seasonal Pizza";
    menuLineItem.modifiers[0] = {
      modifierId: "mod_1",
      modifierName: "No longer basil",
      priceDelta: 0,
    };

    expect(snapshot).toEqual({
      menuItemId: "item_123",
      itemName: "Margherita Pizza",
      unitPrice: 1295,
      quantity: 2,
      modifiers: [{ modifierId: "mod_1", modifierName: "Extra basil", priceDelta: 100 }],
    });
  });
});

describe("createStaleStripeSettingsWarning", () => {
  it("shows the stale Stripe secret migration warning exactly once without leaking the key", async () => {
    const { ctx, writes } = staleStripeWarningContext();

    const firstWarning = await createStaleStripeSettingsWarning(ctx);
    const secondWarning = await createStaleStripeSettingsWarning(ctx);

    expect(firstWarning).toMatchObject({
      type: "section",
      label: "Tender migration notice",
      text: expect.stringContaining("Move the legacy Stripe secret to @tenderpay/stripe settings"),
    });
    expect(secondWarning).toBeNull();
    expect(writes).toEqual([
      {
        key: "migration:stripe-secret-warning-shown",
        value: "shown",
        options: { expirationTtl: 31_536_000 },
      },
    ]);
    expect(JSON.stringify(firstWarning)).not.toContain("sk_live_should_never_leak");
  });
});
