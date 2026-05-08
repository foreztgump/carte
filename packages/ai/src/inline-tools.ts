import { CORE_ALLERGEN_TAGS } from "@carte/core/taxonomy/allergens";

import { prepareLlmTurn, redactPii } from "./pii-boundary.js";
import type { ContentApi, DiffPreview, MutationResult, ToolRegistry } from "./tool-call.js";

export interface MenuItemAiInput {
  allergens?: string[];
  altText?: string;
  description?: string;
  id: string;
  ingredients?: string[];
  name: string;
  piiOptIn?: boolean;
  targetLocale?: string;
  toolContext?: unknown;
}

export interface InlineAiLlm {
  describe?: (item: MenuItemAiInput) => string;
  generateAltText?: (item: MenuItemAiInput) => string;
  translate?: (prompt: string) => string;
}

export interface InlineAiToolsOptions {
  content?: ContentApi;
  llm?: InlineAiLlm;
}

const COLLECTION = "carte_menu_items";
const DEFAULT_LOCALE = "es";

export function createInlineAiTools(options: InlineAiToolsOptions = {}): ToolRegistry {
  return {
    updateMenuItemDescription: mutationTool("description", descriptionDiff, options),
    generateMenuItemAltText: mutationTool("altText", altTextDiff, options),
    suggestMenuItemAllergens: mutationTool("allergens", allergensDiff, options),
    translateMenuItem: mutationTool("translation", translateDiff, options),
  };
}

function mutationTool(
  patchKey: string,
  diffFor: (input: MenuItemAiInput, llm?: InlineAiLlm) => DiffPreview,
  options: InlineAiToolsOptions,
) {
  return {
    kind: "mutation" as const,
    async preview(input: unknown) {
      return diffFor(menuItemFrom(input), options.llm);
    },
    async execute(input: unknown) {
      const item = menuItemFrom(input);
      const diff = diffFor(item, options.llm);
      const patch = patchFrom(patchKey, diff.after);
      const result = await options.content?.update?.(COLLECTION, item.id, patch);
      return { ...diff, result } satisfies MutationResult;
    },
  };
}

function descriptionDiff(input: MenuItemAiInput, llm?: InlineAiLlm): DiffPreview {
  const safeInput = withPiiBoundary(input);
  const description = llm?.describe?.(safeInput) ?? defaultDescription(safeInput);
  return fieldDiff("description", input.description ?? "", description);
}

function altTextDiff(input: MenuItemAiInput, llm?: InlineAiLlm): DiffPreview {
  const safeInput = withPiiBoundary(input);
  const altText = llm?.generateAltText?.(safeInput) ?? defaultAltText(safeInput);
  return fieldDiff("altText", input.altText ?? "", altText);
}

function withPiiBoundary(input: MenuItemAiInput): MenuItemAiInput {
  if (input.piiOptIn === true) {
    return input;
  }
  if (input.toolContext === undefined) {
    return input;
  }
  return { ...input, toolContext: redactPii(input.toolContext) };
}

function allergensDiff(input: MenuItemAiInput): DiffPreview {
  const allergens = suggestAllergens(input);
  return fieldDiff("allergens", input.allergens ?? [], allergens);
}

function translateDiff(input: MenuItemAiInput, llm?: InlineAiLlm): DiffPreview {
  const prompt = prepareTranslatePrompt(input);
  const translated = llm?.translate?.(prompt) ?? defaultTranslation(input, prompt);
  return {
    before: { locale: input.targetLocale ?? DEFAULT_LOCALE, text: input.description ?? "" },
    after: { locale: input.targetLocale ?? DEFAULT_LOCALE, text: translated },
  };
}

function prepareTranslatePrompt(input: MenuItemAiInput): string {
  return prepareLlmTurn(
    {
      message: `Translate ${input.name} to ${input.targetLocale ?? DEFAULT_LOCALE}.`,
      piiOptIn: input.piiOptIn === true,
      toolContext: { item: input, requestContext: input.toolContext },
    },
    (turn) => JSON.stringify(turn),
  );
}

function suggestAllergens(input: MenuItemAiInput): string[] {
  const text = `${input.name} ${input.description ?? ""} ${input.ingredients?.join(" ") ?? ""}`;
  const normalized = text.toLowerCase();
  return CORE_ALLERGEN_TAGS.filter((tag) =>
    allergenNeedles(tag).some((needle) => normalized.includes(needle)),
  );
}

function allergenNeedles(tag: string): string[] {
  const words = tag.split("-");
  return [tag, ...words, ...extraNeedles(tag)].map((word) => word.replace("soybeans", "soy"));
}

function extraNeedles(tag: string): string[] {
  return tag === "peanuts" ? ["peanut"] : [];
}

function fieldDiff(field: string, before: unknown, after: unknown): DiffPreview {
  return { before: { [field]: before }, after: { [field]: after } };
}

function patchFrom(patchKey: string, after: unknown): Record<string, unknown> {
  if (patchKey === "translation") {
    return { translations: after };
  }
  const record = after as Record<string, unknown>;
  return { [patchKey]: record[patchKey] };
}

function defaultDescription(input: MenuItemAiInput): string {
  const ingredients = input.ingredients?.join(", ") ?? "seasonal ingredients";
  return `${input.name} with ${ingredients}.`;
}

function defaultAltText(input: MenuItemAiInput): string {
  return `${input.name} menu item prepared by the restaurant.`;
}

function defaultTranslation(input: MenuItemAiInput, prompt: string): string {
  void prompt;
  return `[${input.targetLocale ?? DEFAULT_LOCALE}] ${input.description ?? input.name}`;
}

function menuItemFrom(input: unknown): MenuItemAiInput {
  if (!isRecord(input) || typeof input.id !== "string" || typeof input.name !== "string") {
    throw new Error("Inline AI action requires a menu item id and name.");
  }
  return input as unknown as MenuItemAiInput;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
