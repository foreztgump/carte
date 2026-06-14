import { createElement, useEffect, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

import type { PluginAdminExports } from "emdash";

import {
  ADMIN_IDENTITY_UNAVAILABLE_MESSAGE,
  identityFromElementDataset,
  resolveAdminIdentity,
  type AdminIdentity,
} from "./admin-identity.js";
import { ChatPanelHost } from "./ChatPanelHost.js";

const ROOT_ID = "carte-ai-root";
const CHAT_PATH = "/carte-ai";

export const mountCarteAiAdmin = (element: HTMLElement): void => {
  const identity = identityFromElementDataset(element);
  const component = identity ? createElement(ChatPanelHost, identity) : createElement(CarteAiPage);
  createRoot(element).render(component);
};

const rootElement = typeof document === "undefined" ? null : document.getElementById(ROOT_ID);

if (rootElement) {
  mountCarteAiAdmin(rootElement);
}

// EmDash 0.18 native `./admin` registry convention: the host stores the whole
// module namespace and reads `pluginAdmins[id].pages` (a NAMED export), then
// renders each page via `jsx(PluginComponent, {})` — so values must be
// COMPONENT FUNCTIONS, not React elements. The registry render path passes no
// props (VERIFIED-PLATFORM §5.1), so the page resolves the current admin user
// from EmDash's `/auth/me` endpoint and scopes chat KV to the current origin.
const CarteAiPage = (): ReactElement => {
  const [identity, setIdentity] = useState<AdminIdentity | null>();

  useEffect(() => {
    let active = true;
    void resolveAdminIdentity().then((resolved) => {
      if (active) {
        setIdentity(resolved);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (identity === undefined) {
    return createElement("p", { role: "status" }, "Loading Carte AI…");
  }
  if (identity === null) {
    return createElement(AdminIdentityUnavailable);
  }
  return createElement(ChatPanelHost, identity);
};

const AdminIdentityUnavailable = (): ReactElement =>
  createElement(
    "section",
    { "aria-labelledby": "carte-ai-title" },
    createElement("h1", { id: "carte-ai-title" }, "Carte AI"),
    createElement("p", null, ADMIN_IDENTITY_UNAVAILABLE_MESSAGE),
  );

// The platform `PluginAdminExports.pages` type is annotated `JSX.Element` but
// the runtime invokes the values as components (VERIFIED-PLATFORM §5.1) — this
// is the one sanctioned cast to reconcile the misleading platform type.
export const pages = {
  [CHAT_PATH]: CarteAiPage,
} as unknown as NonNullable<PluginAdminExports["pages"]>;

const adminExports: PluginAdminExports = { pages };

export default adminExports;
