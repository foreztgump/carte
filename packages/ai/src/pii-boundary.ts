const REDACTED = "[redacted]";

export interface LlmTurnInput {
  message: string;
  piiOptIn: boolean;
  toolContext?: unknown;
}

export type PromptAssembler = (input: { message: string; toolContext?: unknown }) => string;

export function prepareLlmTurn(input: LlmTurnInput, assemblePrompt: PromptAssembler): string {
  const toolContext = input.piiOptIn ? input.toolContext : redactPii(input.toolContext);
  return assemblePrompt({ message: input.message, toolContext });
}

export function redactPii(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactPii(item));
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, redactEntry(key, child)]),
  );
}

function redactEntry(key: string, value: unknown): unknown {
  if (isPiiKey(key)) {
    return REDACTED;
  }
  return redactPii(value);
}

function isPiiKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return ["email", "phone", "notes", "name", "guestname"].includes(normalized);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
