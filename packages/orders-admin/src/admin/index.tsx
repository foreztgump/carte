import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { OrdersAdminApp } from "./App.js";

const ROOT_ID = "carte-orders-admin-root";

export const mountOrdersAdmin = (element: HTMLElement, currentPath = location.pathname): void => {
  createRoot(element).render(createElement(OrdersAdminApp, { currentPath }));
};

const rootElement = typeof document === "undefined" ? null : document.getElementById(ROOT_ID);

if (rootElement) {
  mountOrdersAdmin(rootElement);
}
