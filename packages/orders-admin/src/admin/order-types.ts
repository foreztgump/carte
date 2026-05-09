import type { CarteOrderStatus, RefundResponse } from "@carte/core/contracts";

export type ActiveOrderStatus = Exclude<CarteOrderStatus, "refunded">;

export type OrderModifierSnapshot = {
  id: string;
  name: string;
  feeCents: number;
};

export type OrderLineItemSnapshot = {
  id: string;
  itemName: string;
  unitPriceCents: number;
  quantity: number;
  modifiers: OrderModifierSnapshot[];
};

export type AdminOrder = {
  id: string;
  customerName: string;
  placedAt: string;
  status: CarteOrderStatus;
  totalCents: number;
  lineItems: OrderLineItemSnapshot[];
  refund?: RefundResponse;
};

export type OrderFilters = {
  status: "all" | CarteOrderStatus;
  from: string;
  to: string;
};

export type EmailTemplate = {
  subject: string;
  body: string;
};
