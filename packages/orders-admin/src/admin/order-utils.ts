import type { ActiveOrderStatus, AdminOrder, EmailTemplate, OrderFilters } from "./order-types.js";

export const ORDERS_BACKEND_BASE_PATH = "/_emdash/api/plugins/carte-orders-backend";

export const ACTIVE_STATUSES: readonly ActiveOrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "completed",
];

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
  subject: "Order {{orderId}} is ready",
  body: "Hi {{customerName}}, your order {{orderId}} is ready for pickup.",
};

export const filterOrders = (orders: AdminOrder[], filters: OrderFilters): AdminOrder[] =>
  orders.filter((order) => matchesStatus(order, filters) && matchesDateRange(order, filters));

export const formatMoney = (cents: number): string =>
  new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(cents / 100);

export const formatTimestamp = (timestamp: string): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));

export const getNextStatus = (status: AdminOrder["status"]): ActiveOrderStatus | null => {
  const index = ACTIVE_STATUSES.indexOf(status as ActiveOrderStatus);
  return index >= 0 ? (ACTIVE_STATUSES[index + 1] ?? null) : null;
};

export const renderTemplate = (template: string, order: AdminOrder): string =>
  template.replaceAll("{{orderId}}", order.id).replaceAll("{{customerName}}", order.customerName);

const matchesStatus = (order: AdminOrder, filters: OrderFilters): boolean =>
  filters.status === "all" || order.status === filters.status;

const matchesDateRange = (order: AdminOrder, filters: OrderFilters): boolean => {
  const date = order.placedAt.slice(0, 10);
  if (filters.from && date < filters.from) {
    return false;
  }
  return !filters.to || date <= filters.to;
};
