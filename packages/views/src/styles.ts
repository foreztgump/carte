import type { CarteViewVariant } from "./types.js";

const SHELL_DEFAULT_CLASSES =
  "rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-stone-200 sm:px-10";
const HERO_DEFAULT_CLASSES = "overflow-hidden rounded-3xl bg-stone-950 text-white shadow-sm";
const INFO_DEFAULT_CLASSES =
  "rounded-2xl border border-stone-200 bg-white p-6 text-stone-800 shadow-sm";
const MENU_DEFAULT_CLASSES = "space-y-10";
const SECTION_DEFAULT_CLASSES = "space-y-5";
const ITEM_DEFAULT_CLASSES =
  "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition";
const FILTER_DEFAULT_CLASSES = "rounded-2xl border border-amber-200 bg-amber-50 p-4 text-stone-900";

export const isHeadless = (variant: CarteViewVariant): boolean => variant === "headless";

export const shellClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : SHELL_DEFAULT_CLASSES;

export const heroClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : HERO_DEFAULT_CLASSES;

export const infoClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : INFO_DEFAULT_CLASSES;

export const menuClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : MENU_DEFAULT_CLASSES;

export const sectionClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : SECTION_DEFAULT_CLASSES;

export const itemClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : ITEM_DEFAULT_CLASSES;

export const filterClassesFor = (variant: CarteViewVariant): string | undefined =>
  isHeadless(variant) ? undefined : FILTER_DEFAULT_CLASSES;
