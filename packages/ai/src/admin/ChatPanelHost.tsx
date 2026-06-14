import { useMemo, type ReactElement } from "react";

import { ChatPanel, type StreamChatInput } from "../components/ChatPanel.js";
import type { ChatMessage } from "../chat-history.js";

const PLUGIN_ROUTE_BASE = "/_emdash/api/plugins/carte-ai";
const HISTORY_ROUTE = `${PLUGIN_ROUTE_BASE}/history`;
const CHAT_STREAM_ROUTE = `${PLUGIN_ROUTE_BASE}/chat-stream`;

export interface ChatPanelHostProps {
  userId: string;
  workspaceId: string;
}

const headersFor = (workspaceId: string): Record<string, string> => ({
  "Content-Type": "application/json",
  "X-EmDash-Request": "1",
  "X-Workspace-Id": workspaceId,
});

const postJson = async (url: string, body: unknown, workspaceId: string): Promise<Response> =>
  fetch(url, { body: JSON.stringify(body), headers: headersFor(workspaceId), method: "POST" });

export const ChatPanelHost = ({ userId, workspaceId }: ChatPanelHostProps): ReactElement => {
  const fetchHistory = useMemo(
    () => async (): Promise<ChatMessage[]> => {
      const response = await postJson(HISTORY_ROUTE, { userId }, workspaceId);
      const payload = (await response.json()) as { messages?: ChatMessage[] };
      return payload.messages ?? [];
    },
    [userId, workspaceId],
  );

  const streamChat = useMemo(
    () =>
      async (input: StreamChatInput): Promise<Response> =>
        postJson(CHAT_STREAM_ROUTE, input, workspaceId),
    [workspaceId],
  );

  return (
    <ChatPanel
      fetchHistory={fetchHistory}
      streamChat={streamChat}
      userId={userId}
      workspaceId={workspaceId}
    />
  );
};
