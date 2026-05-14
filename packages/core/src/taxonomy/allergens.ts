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

export const ALLERGEN_LABELS = {
  celery: "Celery",
  "cereals-containing-gluten": "Cereals containing gluten",
  crustaceans: "Crustaceans",
  eggs: "Eggs",
  fish: "Fish",
  lupin: "Lupin",
  milk: "Milk",
  molluscs: "Molluscs",
  mustard: "Mustard",
  peanuts: "Peanuts",
  sesame: "Sesame",
  soybeans: "Soybeans",
  "sulphur-dioxide-and-sulphites": "Sulphur dioxide and sulphites",
  "tree-nuts": "Tree nuts",
  corn: "Corn",
} as const satisfies Record<AllergenTag, string>;

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

export const DIETARY_LABELS = {
  diabetic: "Diabetic",
  glutenFree: "Gluten-free",
  halal: "Halal",
  hindu: "Hindu",
  kosher: "Kosher",
  lowCalorie: "Low calorie",
  lowFat: "Low fat",
  lowLactose: "Low lactose",
  lowSalt: "Low salt",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
} as const satisfies Record<DietaryTag, string>;

const ALLERGEN_TAG_SET = new Set<string>(ALLERGEN_TAGS);

export const allergenLabelFor = (tag: string): string =>
  ALLERGEN_LABELS[tag as AllergenTag] ?? tag.replace(/-/g, " ");

export const dietaryLabelFor = (tag: DietaryTag): string => DIETARY_LABELS[tag];

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
