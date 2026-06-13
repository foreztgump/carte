import { createElement } from "react";
import { createRoot } from "react-dom/client";

import type { PluginAdminExports } from "emdash";

import { ChatPanelHost } from "./ChatPanelHost.js";

const ROOT_ID = "carte-ai-root";
const CHAT_PATH = "/carte-ai";
const ANONYMOUS_USER = "anonymous";
const NO_WORKSPACE = "";

interface AdminIdentity {
  userId: string;
  workspaceId: string;
}

const identityFrom = (element: HTMLElement): AdminIdentity => ({
  userId: element.dataset.userId ?? ANONYMOUS_USER,
  workspaceId: element.dataset.workspaceId ?? NO_WORKSPACE,
});

export const mountCarteAiAdmin = (element: HTMLElement): void => {
  createRoot(element).render(createElement(ChatPanelHost, identityFrom(element)));
};

const rootElement = typeof document === "undefined" ? null : document.getElementById(ROOT_ID);

if (rootElement) {
  mountCarteAiAdmin(rootElement);
}

// EmDash 0.18 native `./admin` export convention: `PluginAdminExports` keys
// each admin page by the `path` declared in `admin.pages`. The host mounts
// these React elements when `adminMode === "react"` (set because the plugin
// declares an admin entry specifier). The chat page supplies runtime identity
// from the mount root's data attributes. See PluginAdminExports in emdash types.
const adminExports: PluginAdminExports = {
  pages: {
    [CHAT_PATH]: createElement(ChatPanelHost, {
      userId: ANONYMOUS_USER,
      workspaceId: NO_WORKSPACE,
    }),
  },
};

export default adminExports;
