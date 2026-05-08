import type { CarteViewVariant } from "./types.js";

const SHELL_DEFAULT_CLASSES =
  "rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-stone-200 sm:px-10";

export const isHeadless = (variant: CarteViewVariant): boolean => variant === "headless";

export const shellClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : SHELL_DEFAULT_CLASSES;
