// @carte/views — peer-dep Astro component library, NOT an EmDash plugin.

import type { CarteComponentExport } from "./types.js";

export type {
  CarteComponentExport,
  CarteMenu,
  CarteMenuItem,
  CarteMenuSection,
  CarteRestaurantInfo,
  CarteRestaurantSummary,
  CarteShellProps,
  CarteViewVariant,
  CarteHoursDay,
  CarteWeekday,
  DietaryFilterProps,
  HoursWidgetProps,
  MenuDisplayProps,
  MenuItemProps,
  MenuSectionProps,
  ReservationFormProps,
  RestaurantHeroProps,
  RestaurantInfoProps,
} from "./types.js";

const componentExport = (componentName: string): CarteComponentExport => ({
  componentName,
  importPath: `@carte/views/components/${componentName}.astro`,
  variants: ["default", "headless"],
});

export const CarteShell = {
  componentName: "CarteShell",
  importPath: "@carte/views/components/CarteShell.astro",
  variants: ["default", "headless"],
} as const satisfies CarteComponentExport;

export const DietaryFilter = componentExport("DietaryFilter");
export const HoursWidget = componentExport("HoursWidget");
export const MenuDisplay = componentExport("MenuDisplay");
export const MenuItem = componentExport("MenuItem");
export const MenuSection = componentExport("MenuSection");
export const ReservationForm = componentExport("ReservationForm");
export const RestaurantHero = componentExport("RestaurantHero");
export const RestaurantInfo = componentExport("RestaurantInfo");
