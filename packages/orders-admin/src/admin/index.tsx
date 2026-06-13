import { createElement } from "react";
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

// EmDash 0.18 native `./admin` export convention: `PluginAdminExports` keys
// each admin page by the `path` declared in `admin.pages`. The host mounts
// these React elements when `adminMode === "react"` (set because the plugin
// declares an admin entry specifier). See PluginAdminExports in emdash types.
const adminExports: PluginAdminExports = {
  pages: {
    [ORDERS_PATH]: createElement(OrdersAdminApp, { currentPath: ORDERS_PATH }),
    [MODIFIERS_PATH]: createElement(OrdersAdminApp, { currentPath: MODIFIERS_PATH }),
  },
};

export default adminExports;
