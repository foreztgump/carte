import type { ReactElement } from "react";

import type {
  ModifierUpdateRequest,
  OrderStateChangeRequest,
  RefundRequest,
} from "@carte/core/contracts";

const ORDER_ROUTE = "/carte-orders";
const MODIFIER_ROUTE = "/carte-orders/modifiers";

type OrdersAdminRoute = typeof ORDER_ROUTE | typeof MODIFIER_ROUTE;

type OrdersAdminAppProps = {
  currentPath?: string;
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

export const OrdersAdminApp = ({ currentPath }: OrdersAdminAppProps): ReactElement => {
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
      {route === MODIFIER_ROUTE ? <ModifierGroupsPanel /> : <OrdersPanel />}
    </main>
  );
};

const OrdersPanel = (): ReactElement => (
  <section aria-labelledby="orders-panel-title">
    <h2 id="orders-panel-title">Orders queue</h2>
    <p>Review incoming orders, update kitchen status, and submit refunds.</p>
    <ContractProbe refund={pendingRefund} stateChange={pendingStateChange} />
  </section>
);

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
