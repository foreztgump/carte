import { useState } from "react";

import type { MenuItemAiInput } from "../inline-tools.js";

export interface InlineAiActionsProps {
  actorId: string;
  item: MenuItemAiInput;
  toolCall: (input: InlineToolCallInput) => Promise<InlineToolCallResult>;
  workspaceId: string;
}

export interface InlineToolCallInput {
  actorId: string;
  arguments: MenuItemAiInput;
  confirmToken?: string;
  toolName: string;
  workspaceId: string;
}

export interface InlineToolCallResult {
  confirmToken?: string;
  diff?: { after: unknown; before: unknown };
  ok: boolean;
  status: string;
}

interface InlineAction {
  label: string;
  toolName: string;
}

const INLINE_ACTIONS: InlineAction[] = [
  { label: "Generate description with AI", toolName: "updateMenuItemDescription" },
  { label: "Suggest allergens with AI", toolName: "suggestMenuItemAllergens" },
  { label: "Generate alt text with AI", toolName: "generateMenuItemAltText" },
  { label: "Translate with AI", toolName: "translateMenuItem" },
];

export function InlineAiActions(props: InlineAiActionsProps) {
  const [pending, setPending] = useState<InlineToolCallResult | null>(null);
  const [pendingToolName, setPendingToolName] = useState<string | null>(null);

  async function requestPreview(toolName: string): Promise<void> {
    const result = await props.toolCall(baseInput(props, toolName));
    setPending(result);
    setPendingToolName(toolName);
  }

  async function confirmPreview(): Promise<void> {
    if (pending?.confirmToken === undefined || pendingToolName === null) {
      return;
    }
    const result = await props.toolCall({
      ...baseInput(props, pendingToolName),
      confirmToken: pending.confirmToken,
    });
    setPending(result);
  }

  return (
    <section aria-label="Inline AI actions">
      <div>
        {INLINE_ACTIONS.map((action) => (
          <button
            key={action.toolName}
            onClick={() => void requestPreview(action.toolName)}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
      {pending?.diff !== undefined && (
        <aside aria-live="polite">
          <h2>AI diff preview</h2>
          <DiffBlock title="Before" value={pending.diff.before} />
          <DiffBlock title="After" value={pending.diff.after} />
          {pending.confirmToken !== undefined && (
            <button onClick={() => void confirmPreview()} type="button">
              Confirm AI change
            </button>
          )}
        </aside>
      )}
    </section>
  );
}

function DiffBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      <pre>{formatDiff(value)}</pre>
    </section>
  );
}

function baseInput(props: InlineAiActionsProps, toolName: string): InlineToolCallInput {
  return {
    actorId: props.actorId,
    arguments: props.item,
    toolName,
    workspaceId: props.workspaceId,
  };
}

function formatDiff(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (isSingleStringField(value)) {
    return Object.values(value)[0] ?? "";
  }
  return JSON.stringify(value, null, 2);
}

function isSingleStringField(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).length === 1 &&
    typeof Object.values(value)[0] === "string"
  );
}
