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

export interface CarteOrderModifier {
  id: string;
  name: string;
  price: number;
}

export interface CarteOrderLineItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: CarteOrderModifier[];
}

export interface CarteOrderTotals {
  subtotal: number;
  tax?: number;
  serviceFee?: number;
  tip?: number;
  total: number;
}

export interface CarteOrderingCart {
  id: string;
  currency: string;
  lineItems: CarteOrderLineItem[];
  totals: CarteOrderTotals;
}

export interface OrderingCartProps {
  cart: CarteOrderingCart;
  heading?: string;
  variant?: CarteViewVariant;
}

export interface OrderingCheckoutProps {
  action: string;
  cart: CarteOrderingCart;
  heading?: string;
  variant?: CarteViewVariant;
}

export type CarteOrderRecordStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded";

export interface CarteOrderFulfillmentWindow {
  label: string;
  startsAt: string;
  endsAt: string;
}

export interface CarteOrderRecord {
  id: string;
  status: CarteOrderRecordStatus;
  currency: string;
  fulfillment: CarteOrderFulfillmentWindow;
  lineItems: CarteOrderLineItem[];
  totals: CarteOrderTotals;
  guestName?: string;
  placedAt?: string;
}

export interface OrderRecordStatusProps {
  order: CarteOrderRecord;
  heading?: string;
  variant?: CarteViewVariant;
}

export type CarteReservationRecordStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled";

export interface CarteReservationRecord {
  token: string;
  status: CarteReservationRecordStatus;
  guestName: string;
  partySize: number;
  date: string;
  time: string;
  notes?: string;
}

export interface ReservationRecordStatusProps {
  reservation: CarteReservationRecord;
  heading?: string;
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
