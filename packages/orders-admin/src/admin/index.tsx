import { createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

import type { PluginAdminExports } from "emdash";

import { OrdersAdminApp } from "./App.js";

const ROOT_ID = "carte-orders-admin-root";
const ORDERS_PATH = "/carte-orders";
const MODIFIERS_PATH = "/carte-orders/modifiers";

export const mountOrdersAdmin = (element: HTMLElement, currentPath = location.pathname): void => {
  createRoot(element).render(createElement(OrdersAdminApp, { currentPath }));
};

const rootElement = typeof document === "undefined" ? null : document.getElementById(ROOT_ID);

if (rootElement) {
  mountOrdersAdmin(rootElement);
}

// EmDash 0.18 native `./admin` registry convention: the host stores the whole
// module namespace and reads `pluginAdmins[id].pages` (a NAMED export), then
// renders each page via `jsx(PluginComponent, {})` — so values must be
// COMPONENT FUNCTIONS, not React elements. See VERIFIED-PLATFORM §5.1.
const OrdersPage = (): ReactElement => createElement(OrdersAdminApp, { currentPath: ORDERS_PATH });
const ModifiersPage = (): ReactElement =>
  createElement(OrdersAdminApp, { currentPath: MODIFIERS_PATH });

// The platform `PluginAdminExports.pages` type is annotated `JSX.Element` but
// the runtime invokes the values as components (VERIFIED-PLATFORM §5.1) — this
// is the one sanctioned cast to reconcile the misleading platform type.
export const pages = {
  [ORDERS_PATH]: OrdersPage,
  [MODIFIERS_PATH]: ModifiersPage,
} as unknown as NonNullable<PluginAdminExports["pages"]>;

const adminExports: PluginAdminExports = { pages };

export default adminExports;
