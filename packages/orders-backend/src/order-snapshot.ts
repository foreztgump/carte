// Order line-item snapshots: capture user-visible item and modifier values at
// write time so later menu edits never mutate a placed order's history.

interface SourceModifierSelection {
  modifierId: string;
  modifierName: string;
  priceDelta: number;
}

interface SourceOrderLineItem {
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  modifiers: SourceModifierSelection[];
}

export interface OrderLineItemSnapshot {
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  modifiers: SourceModifierSelection[];
}

export const createOrderLineItemSnapshot = (
  source: SourceOrderLineItem,
): OrderLineItemSnapshot => ({
  menuItemId: source.menuItemId,
  itemName: source.itemName,
  unitPrice: source.unitPrice,
  quantity: source.quantity,
  modifiers: source.modifiers.map((modifier) => ({
    modifierId: modifier.modifierId,
    modifierName: modifier.modifierName,
    priceDelta: modifier.priceDelta,
  })),
});
