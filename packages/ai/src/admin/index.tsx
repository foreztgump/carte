import { createElement, type ReactElement } from "react";
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

// EmDash 0.18 native `./admin` registry convention: the host stores the whole
// module namespace and reads `pluginAdmins[id].pages` (a NAMED export), then
// renders each page via `jsx(PluginComponent, {})` — so values must be
// COMPONENT FUNCTIONS, not React elements. The registry render path passes no
// props, so the chat page defaults to an anonymous, workspace-less identity
// (mirroring the prior element). See VERIFIED-PLATFORM §5.1.
const CarteAiPage = (): ReactElement =>
  createElement(ChatPanelHost, { userId: ANONYMOUS_USER, workspaceId: NO_WORKSPACE });

// The platform `PluginAdminExports.pages` type is annotated `JSX.Element` but
// the runtime invokes the values as components (VERIFIED-PLATFORM §5.1) — this
// is the one sanctioned cast to reconcile the misleading platform type.
export const pages = {
  [CHAT_PATH]: CarteAiPage,
} as unknown as NonNullable<PluginAdminExports["pages"]>;

const adminExports: PluginAdminExports = { pages };

export default adminExports;
