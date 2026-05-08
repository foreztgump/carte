export const CORE_ALLERGEN_TAGS = [
  "celery",
  "cereals-containing-gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "nuts",
  "peanuts",
  "sesame",
  "soybeans",
  "sulphites",
] as const;

export type CoreAllergenTag = (typeof CORE_ALLERGEN_TAGS)[number];

export const CORE_ALLERGEN_LABELS: Record<CoreAllergenTag, string> = {
  celery: "Celery",
  "cereals-containing-gluten": "Cereals containing gluten",
  crustaceans: "Crustaceans",
  eggs: "Eggs",
  fish: "Fish",
  lupin: "Lupin",
  milk: "Milk",
  molluscs: "Molluscs",
  mustard: "Mustard",
  nuts: "Tree nuts",
  peanuts: "Peanuts",
  sesame: "Sesame",
  soybeans: "Soybeans",
  sulphites: "Sulphites",
};
