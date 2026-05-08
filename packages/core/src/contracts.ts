export const ordersBackendRoutes = {
  refund: "/refund",
  modifierUpdate: "/modifier-update",
  orderStateChange: "/order-state-change",
} as const;

export type CarteOrderStatus = "pending" | "preparing" | "ready" | "completed" | "refunded";

export type RefundRequest = {
  orderId: string;
  reason?: string;
};

export type RefundResponse = {
  orderId: string;
  status: Extract<CarteOrderStatus, "refunded">;
  refundId: string;
  refundedAt: string;
};

export type ModifierOptionContract = {
  id: string;
  name: string;
  feeCents: number;
};

export type ModifierGroupContract = {
  id: string;
  name: string;
  options: ModifierOptionContract[];
};

export type ModifierUpdateRequest = {
  groups: ModifierGroupContract[];
};

export type ModifierUpdateResponse = {
  groups: ModifierGroupContract[];
  updatedAt: string;
};

export type OrderStateChangeRequest = {
  orderId: string;
  nextStatus: Exclude<CarteOrderStatus, "refunded">;
};

export type OrderStateChangeResponse = {
  orderId: string;
  status: Exclude<CarteOrderStatus, "refunded">;
  updatedAt: string;
};
