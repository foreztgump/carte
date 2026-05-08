import { useMemo, useState, type ReactElement } from "react";

import type {
  ModifierUpdateRequest,
  OrderStateChangeRequest,
  OrderStateChangeResponse,
  RefundRequest,
  RefundResponse,
} from "@carte/core/contracts";
import { ordersBackendRoutes } from "@carte/core/contracts";

import type { ActiveOrderStatus, AdminOrder, EmailTemplate, OrderFilters } from "./order-types.js";
import {
  ACTIVE_STATUSES,
  DEFAULT_EMAIL_TEMPLATE,
  ORDERS_BACKEND_BASE_PATH,
  filterOrders,
  formatMoney,
  formatTimestamp,
  getNextStatus,
  renderTemplate,
} from "./order-utils.js";

const ORDER_ROUTE = "/carte-orders";
const MODIFIER_ROUTE = "/carte-orders/modifiers";
const EMPTY_ORDERS: AdminOrder[] = [];
const INITIAL_FILTERS: OrderFilters = { status: "all", from: "", to: "" };

type OrdersAdminRoute = typeof ORDER_ROUTE | typeof MODIFIER_ROUTE;

type OrdersAdminAppProps = {
  currentPath?: string;
  initialOrders?: AdminOrder[];
  backendBasePath?: string;
};

const pendingRefund: RefundRequest = { orderId: "pending-selection" };
const pendingModifierUpdate: ModifierUpdateRequest = { groups: [] };
const pendingStateChange: OrderStateChangeRequest = {
  orderId: "pending-selection",
  nextStatus: "preparing",
};

export const getInitialOrdersAdminRoute = (path = ORDER_ROUTE): OrdersAdminRoute => {
  if (path === MODIFIER_ROUTE) {
    return MODIFIER_ROUTE;
  }
  return ORDER_ROUTE;
};

export const OrdersAdminApp = ({
  backendBasePath = ORDERS_BACKEND_BASE_PATH,
  currentPath,
  initialOrders = EMPTY_ORDERS,
}: OrdersAdminAppProps): ReactElement => {
  const route = getInitialOrdersAdminRoute(currentPath);

  return (
    <main aria-labelledby="carte-orders-title">
      <header>
        <p>Carte</p>
        <h1 id="carte-orders-title">Carte Orders</h1>
        <nav aria-label="Carte orders admin">
          <a href={ORDER_ROUTE} aria-current={route === ORDER_ROUTE ? "page" : undefined}>
            Orders
          </a>
          <a href={MODIFIER_ROUTE} aria-current={route === MODIFIER_ROUTE ? "page" : undefined}>
            Modifiers
          </a>
        </nav>
      </header>
      {route === MODIFIER_ROUTE ? (
        <ModifierGroupsPanel />
      ) : (
        <OrdersPanel backendBasePath={backendBasePath} initialOrders={initialOrders} />
      )}
    </main>
  );
};

type OrdersPanelProps = {
  backendBasePath: string;
  initialOrders: AdminOrder[];
};

const OrdersPanel = ({ backendBasePath, initialOrders }: OrdersPanelProps): ReactElement => {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0]?.id ?? "");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [template, setTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);
  const filteredOrders = useMemo(() => filterOrders(orders, filters), [filters, orders]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  return (
    <section aria-labelledby="orders-panel-title">
      <h2 id="orders-panel-title">Orders queue</h2>
      <p>Review incoming orders, update kitchen status, and submit refunds.</p>
      <OrderFiltersForm filters={filters} onChange={setFilters} />
      <OrderList orders={filteredOrders} onSelect={setSelectedOrderId} />
      <OrderDetail
        backendBasePath={backendBasePath}
        onOrderChange={setOrders}
        order={selectedOrder}
      />
      <EmailTemplateEditor order={selectedOrder} template={template} onSave={setTemplate} />
      <ContractProbe refund={pendingRefund} stateChange={pendingStateChange} />
    </section>
  );
};

const ModifierGroupsPanel = (): ReactElement => (
  <section aria-labelledby="modifiers-panel-title">
    <h2 id="modifiers-panel-title">Modifier groups</h2>
    <p>Configure single-tier modifier groups with per-option fee metadata.</p>
    <ContractProbe modifierUpdate={pendingModifierUpdate} />
  </section>
);

type ContractProbeProps = {
  refund?: RefundRequest;
  modifierUpdate?: ModifierUpdateRequest;
  stateChange?: OrderStateChangeRequest;
};

const ContractProbe = (props: ContractProbeProps): null => {
  void props;
  return null;
};

type OrderFiltersFormProps = {
  filters: OrderFilters;
  onChange: (filters: OrderFilters) => void;
};

const OrderFiltersForm = ({ filters, onChange }: OrderFiltersFormProps): ReactElement => (
  <fieldset>
    <legend>Filters</legend>
    <label>
      Status
      <select
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.currentTarget.value as OrderFilters["status"] })
        }
      >
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="preparing">Preparing</option>
        <option value="ready">Ready</option>
        <option value="completed">Completed</option>
        <option value="refunded">Refunded</option>
      </select>
    </label>
    <DateInput
      label="From"
      value={filters.from}
      onChange={(from) => onChange({ ...filters, from })}
    />
    <DateInput label="To" value={filters.to} onChange={(to) => onChange({ ...filters, to })} />
  </fieldset>
);

type DateInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const DateInput = ({ label, onChange, value }: DateInputProps): ReactElement => (
  <label>
    {label}
    <input type="date" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  </label>
);

type OrderListProps = {
  orders: AdminOrder[];
  onSelect: (orderId: string) => void;
};

const OrderList = ({ onSelect, orders }: OrderListProps): ReactElement => {
  if (orders.length === 0) {
    return <p>No orders match the current filters.</p>;
  }

  return (
    <ul aria-label="Orders">
      {orders.map((order) => (
        <li key={order.id}>
          <strong>{order.customerName}</strong> · {order.status} · {formatMoney(order.totalCents)}
          <button type="button" onClick={() => onSelect(order.id)}>
            View {order.id}
          </button>
        </li>
      ))}
    </ul>
  );
};

type OrderDetailProps = {
  backendBasePath: string;
  order: AdminOrder | null;
  onOrderChange: (updater: (orders: AdminOrder[]) => AdminOrder[]) => void;
};

const OrderDetail = ({ backendBasePath, onOrderChange, order }: OrderDetailProps): ReactElement => {
  if (!order) {
    return <p>Select an order to review line item snapshots.</p>;
  }

  return (
    <article aria-labelledby="order-detail-title">
      <h3 id="order-detail-title">Order {order.id}</h3>
      <p>Status: {order.status}</p>
      <LineItems order={order} />
      <StatusActions
        backendBasePath={backendBasePath}
        onOrderChange={onOrderChange}
        order={order}
      />
      <RefundPanel backendBasePath={backendBasePath} onOrderChange={onOrderChange} order={order} />
    </article>
  );
};

const LineItems = ({ order }: { order: AdminOrder }): ReactElement => (
  <ul aria-label="Line items">
    {order.lineItems.map((item) => (
      <li key={item.id}>
        <strong>{item.itemName}</strong> · {item.quantity} × {formatMoney(item.unitPriceCents)}
        <ul>
          {item.modifiers.map((modifier) => (
            <li key={modifier.id}>{modifier.name}</li>
          ))}
        </ul>
      </li>
    ))}
  </ul>
);

type OrderActionProps = {
  backendBasePath: string;
  order: AdminOrder;
  onOrderChange: (updater: (orders: AdminOrder[]) => AdminOrder[]) => void;
};

const StatusActions = ({
  backendBasePath,
  onOrderChange,
  order,
}: OrderActionProps): ReactElement => {
  const nextStatus = getNextStatus(order.status);
  const changeStatus = async (status: ActiveOrderStatus): Promise<void> => {
    const response = await postJson<OrderStateChangeRequest, OrderStateChangeResponse>(
      `${backendBasePath}${ordersBackendRoutes.orderStateChange}`,
      { orderId: order.id, nextStatus: status },
    );
    onOrderChange((orders) => updateOrderStatus(orders, response.orderId, response.status));
  };

  return (
    <div aria-label="Status workflow">
      {ACTIVE_STATUSES.slice(1).map((status) => (
        <button
          disabled={nextStatus !== status}
          key={status}
          type="button"
          onClick={() => void changeStatus(status)}
        >
          Mark {status}
        </button>
      ))}
    </div>
  );
};

const RefundPanel = ({ backendBasePath, onOrderChange, order }: OrderActionProps): ReactElement => {
  const issueRefund = async (): Promise<void> => {
    const response = await postJson<RefundRequest, RefundResponse>(
      `${backendBasePath}${ordersBackendRoutes.refund}`,
      { orderId: order.id },
    );
    onOrderChange((orders) => updateRefundedOrder(orders, response));
  };

  return (
    <div>
      <button
        disabled={order.status === "refunded"}
        type="button"
        onClick={() => void issueRefund()}
      >
        Issue refund
      </button>
      {order.refund ? (
        <p>
          Refund {order.refund.refundId} issued at {formatTimestamp(order.refund.refundedAt)}
        </p>
      ) : null}
    </div>
  );
};

type EmailTemplateEditorProps = {
  order: AdminOrder | null;
  template: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
};

const EmailTemplateEditor = ({
  onSave,
  order,
  template,
}: EmailTemplateEditorProps): ReactElement => {
  const [draft, setDraft] = useState(template);
  const [saved, setSaved] = useState(false);
  const previewOrder = order ?? EMPTY_ORDERS[0];

  return (
    <section aria-labelledby="email-template-title">
      <h3 id="email-template-title">Email notification template</h3>
      <LabeledTextInput
        label="Ready email subject"
        value={draft.subject}
        onChange={updateSubject(setDraft)}
      />
      <LabeledTextarea
        label="Ready email body"
        value={draft.body}
        onChange={updateBody(setDraft)}
      />
      <button type="button" onClick={() => saveTemplate(draft, onSave, setSaved)}>
        Save email template
      </button>
      {saved ? <p>Template saved for email notifications.</p> : null}
      {previewOrder ? <TemplatePreview order={previewOrder} template={draft} /> : null}
    </section>
  );
};

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const LabeledTextInput = ({ label, onChange, value }: TextFieldProps): ReactElement => (
  <label>
    {label}
    <input type="text" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  </label>
);

const LabeledTextarea = ({ label, onChange, value }: TextFieldProps): ReactElement => (
  <label>
    {label}
    <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  </label>
);

const TemplatePreview = ({
  order,
  template,
}: {
  order: AdminOrder;
  template: EmailTemplate;
}): ReactElement => (
  <aside aria-label="Email preview">
    <p>{renderTemplate(template.subject, order)}</p>
    <p>{renderTemplate(template.body, order)}</p>
  </aside>
);

const postJson = async <Request, Response>(url: string, body: Request): Promise<Response> => {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }
  return (await response.json()) as Response;
};

const updateOrderStatus = (
  orders: AdminOrder[],
  orderId: string,
  status: ActiveOrderStatus,
): AdminOrder[] => orders.map((order) => (order.id === orderId ? { ...order, status } : order));

const updateRefundedOrder = (orders: AdminOrder[], refund: RefundResponse): AdminOrder[] =>
  orders.map((order) =>
    order.id === refund.orderId ? { ...order, refund, status: refund.status } : order,
  );

const updateSubject =
  (setDraft: (updater: (draft: EmailTemplate) => EmailTemplate) => void) => (subject: string) =>
    setDraft((draft) => ({ ...draft, subject }));

const updateBody =
  (setDraft: (updater: (draft: EmailTemplate) => EmailTemplate) => void) => (body: string) =>
    setDraft((draft) => ({ ...draft, body }));

const saveTemplate = (
  draft: EmailTemplate,
  onSave: (template: EmailTemplate) => void,
  setSaved: (saved: boolean) => void,
): void => {
  onSave(draft);
  setSaved(true);
};
