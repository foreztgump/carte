export const EU_FIC_14_ALLERGENS = [
  "celery",
  "cereals-containing-gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "peanuts",
  "sesame",
  "soybeans",
  "sulphur-dioxide-and-sulphites",
  "tree-nuts",
] as const;

export const US_ALLERGEN_EXTENSIONS = ["corn"] as const;

export const ALLERGEN_TAGS = [...EU_FIC_14_ALLERGENS, ...US_ALLERGEN_EXTENSIONS] as const;

export type AllergenTag = (typeof ALLERGEN_TAGS)[number];

export const DIETARY_TAG_TO_SCHEMA_URI = {
  diabetic: "https://schema.org/DiabeticDiet",
  glutenFree: "https://schema.org/GlutenFreeDiet",
  halal: "https://schema.org/HalalDiet",
  hindu: "https://schema.org/HinduDiet",
  kosher: "https://schema.org/KosherDiet",
  lowCalorie: "https://schema.org/LowCalorieDiet",
  lowFat: "https://schema.org/LowFatDiet",
  lowLactose: "https://schema.org/LowLactoseDiet",
  lowSalt: "https://schema.org/LowSaltDiet",
  vegan: "https://schema.org/VeganDiet",
  vegetarian: "https://schema.org/VegetarianDiet",
} as const;

export type DietaryTag = keyof typeof DIETARY_TAG_TO_SCHEMA_URI;

const ALLERGEN_TAG_SET = new Set<string>(ALLERGEN_TAGS);

export const normalizeAllergenTag = (value: unknown): AllergenTag => {
  if (typeof value !== "string") throw new Error("Allergen tags must be strings.");
  const tag = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (!ALLERGEN_TAG_SET.has(tag)) throw new Error(`Unknown allergen tag: ${value}`);
  return tag as AllergenTag;
};

export const normalizeAllergenTags = (value: unknown): AllergenTag[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Error("Menu item allergens must be an array.");
  return value.map(normalizeAllergenTag);
};
