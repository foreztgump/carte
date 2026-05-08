import type { AllergenTag, DietaryTag } from "@carte/core/taxonomy";

export type CarteViewVariant = "default" | "headless";

export interface CarteShellProps {
  heading: string;
  eyebrow?: string;
  description?: string;
  variant?: CarteViewVariant;
}

export interface CarteComponentExport {
  componentName: string;
  importPath: string;
  variants: readonly CarteViewVariant[];
}

export interface CarteHeroImage {
  alt: string;
  src: string;
}

export interface CarteRestaurantSummary {
  name: string;
  tagline?: string;
  heroImage?: CarteHeroImage;
  cuisine?: string[];
  priceRange?: string;
}

export interface RestaurantHeroProps {
  restaurant: CarteRestaurantSummary;
  variant?: CarteViewVariant;
}

export interface CarteRestaurantInfo {
  addressLines: string[];
  email?: string;
  phone?: string;
}

export interface RestaurantInfoProps {
  info: CarteRestaurantInfo;
  variant?: CarteViewVariant;
}

export type CarteWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface CarteHoursDay {
  day: CarteWeekday;
  opensAt?: string;
  closesAt?: string;
  closed?: boolean;
}

export interface HoursWidgetProps {
  hours: CarteHoursDay[];
  today: CarteWeekday;
  variant?: CarteViewVariant;
}

export interface ReservationFormProps {
  action: string;
  defaultDate?: string;
  defaultTime?: string;
  partySizeOptions?: number[];
  variant?: CarteViewVariant;
}

export interface CarteMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  allergens: AllergenTag[];
  dietaryTags?: DietaryTag[];
}

export interface CarteMenuSection {
  id: string;
  name: string;
  description?: string;
  items: CarteMenuItem[];
}

export interface CarteMenu {
  id: string;
  name: string;
  description?: string;
  sections: CarteMenuSection[];
}

export interface MenuDisplayProps {
  menu: CarteMenu;
  variant?: CarteViewVariant;
}

export interface MenuSectionProps {
  section: CarteMenuSection;
  variant?: CarteViewVariant;
}

export interface MenuItemProps {
  item: CarteMenuItem;
  variant?: CarteViewVariant;
}

export interface DietaryFilterProps {
  allergens: AllergenTag[];
  targetMenuId: string;
  variant?: CarteViewVariant;
}
