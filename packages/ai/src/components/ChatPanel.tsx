import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { ChatMessage } from "../chat-history.js";

export interface ChatPanelProps {
  fetchHistory: () => Promise<ChatMessage[]>;
  streamChat: (input: StreamChatInput) => Promise<Response>;
  userId: string;
  workspaceId: string;
}

export interface StreamChatInput {
  message: string;
  piiOptIn: boolean;
  userId: string;
  workspaceId: string;
}

export function ChatPanel(props: ChatPanelProps) {
  const { fetchHistory, streamChat, userId, workspaceId } = props;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [piiOptIn, setPiiOptIn] = useState(false);

  useEffect(() => {
    void fetchHistory().then(setMessages);
  }, [fetchHistory]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (message === "") {
      return;
    }

    setDraft("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    await appendStreamedReply({
      message,
      piiOptIn,
      setMessages,
      streamChat,
      userId,
      workspaceId,
    });
  }

  return (
    <section aria-labelledby="carte-ai-title">
      <h1 id="carte-ai-title">Carte AI</h1>
      <MessageList messages={messages} />
      <form onSubmit={onSubmit}>
        <label htmlFor="carte-ai-message">Message</label>
        <textarea
          id="carte-ai-message"
          onChange={(event) => setDraft(event.target.value)}
          value={draft}
        />
        <label>
          <input
            checked={piiOptIn}
            onChange={(event) => setPiiOptIn(event.target.checked)}
            type="checkbox"
          />
          Include guest PII for this turn
        </label>
        <button type="submit">Send</button>
      </form>
    </section>
  );
}

function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <ol aria-label="Chat history">
      {messages.map((message, index) => (
        <li key={`${message.role}-${index}`}>
          <strong>{message.role}</strong>: <span>{message.content}</span>
        </li>
      ))}
    </ol>
  );
}

async function appendStreamedReply(
  params: StreamChatInput & {
    setMessages: (update: (current: ChatMessage[]) => ChatMessage[]) => void;
    streamChat: ChatPanelProps["streamChat"];
  },
) {
  const response = await params.streamChat({
    message: params.message,
    piiOptIn: params.piiOptIn,
    userId: params.userId,
    workspaceId: params.workspaceId,
  });
  const content = await readSse(response);
  params.setMessages((current) => [...current, { role: "assistant", content }]);
}

async function readSse(response: Response): Promise<string> {
  const body = await response.text();
  return body
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length))
    .join("");
}
