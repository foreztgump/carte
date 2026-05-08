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
