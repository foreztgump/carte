import type { AllergenTag, DietaryTag } from "@carte/core/taxonomy";
import { allergenLabelFor, dietaryLabelFor } from "@carte/core/taxonomy";

export const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(amount / 100);

export const formatAllergens = (allergens: AllergenTag[]): string =>
  allergens.map(allergenLabelFor).join(", ");

export const formatDietaryTags = (tags: DietaryTag[]): string =>
  tags.map(dietaryLabelFor).join(", ");

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const timeDateFor = (time: string): Date => {
  const [hour = "0", minute = "0"] = time.split(":");
  const date = new Date(2026, 0, 1, Number(hour), Number(minute));
  return date;
};

export const formatTime = (time: string): string => TIME_FORMATTER.format(timeDateFor(time));

export const formatHoursRange = (opensAt?: string, closesAt?: string): string =>
  opensAt && closesAt ? `${formatTime(opensAt)}–${formatTime(closesAt)}` : "Closed";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const isoDateFor = (date: string): Date => {
  const [year = "2026", month = "1", day = "1"] = date.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const formatDate = (date: string): string => DATE_FORMATTER.format(isoDateFor(date));
