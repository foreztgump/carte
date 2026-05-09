const REDACTED = "[redacted]";
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE_PATTERN = /\+?\d[\d\s().-]{6,}\d/g;

export interface LlmTurnInput {
  message: string;
  piiOptIn: boolean;
  toolContext?: unknown;
}

export type PromptAssembler = (input: { message: string; toolContext?: unknown }) => string;

export function prepareLlmTurn(input: LlmTurnInput, assemblePrompt: PromptAssembler): string {
  if (input.piiOptIn) {
    return assemblePrompt({ message: input.message, toolContext: input.toolContext });
  }
  return assemblePrompt({
    message: redactPiiString(input.message),
    toolContext: redactPii(input.toolContext),
  });
}

export function redactPii(value: unknown): unknown {
  if (typeof value === "string") {
    return redactPiiString(value);
  }
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

function redactPiiString(value: string): string {
  return value.replace(EMAIL_PATTERN, REDACTED).replace(PHONE_PATTERN, REDACTED);
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
