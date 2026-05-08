export const ALLERGENS = [
  { id: "celery", label: "Celery" },
  { id: "cereals_gluten", label: "Cereals containing gluten" },
  { id: "crustaceans", label: "Crustaceans" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "lupin", label: "Lupin" },
  { id: "milk", label: "Milk" },
  { id: "molluscs", label: "Molluscs" },
  { id: "mustard", label: "Mustard" },
  { id: "peanuts", label: "Peanuts" },
  { id: "sesame", label: "Sesame" },
  { id: "soybeans", label: "Soybeans" },
  { id: "sulphites", label: "Sulphites" },
  { id: "tree_nuts", label: "Tree nuts" },
  { id: "wheat", label: "Wheat" },
  { id: "shellfish", label: "Shellfish" },
] as const;

export const DIETARY_TAGS = [
  { id: "gluten_free", label: "Gluten-free", schemaUri: "https://schema.org/GlutenFreeDiet" },
  { id: "halal", label: "Halal", schemaUri: "https://schema.org/HalalDiet" },
  { id: "kosher", label: "Kosher", schemaUri: "https://schema.org/KosherDiet" },
  { id: "low_calorie", label: "Low calorie", schemaUri: "https://schema.org/LowCalorieDiet" },
  { id: "low_fat", label: "Low fat", schemaUri: "https://schema.org/LowFatDiet" },
  { id: "low_lactose", label: "Low lactose", schemaUri: "https://schema.org/LowLactoseDiet" },
  { id: "low_salt", label: "Low salt", schemaUri: "https://schema.org/LowSaltDiet" },
  { id: "vegan", label: "Vegan", schemaUri: "https://schema.org/VeganDiet" },
  { id: "vegetarian", label: "Vegetarian", schemaUri: "https://schema.org/VegetarianDiet" },
] as const;

export type AllergenTag = (typeof ALLERGENS)[number]["id"];
export type DietaryTag = (typeof DIETARY_TAGS)[number]["id"];

export const DIETARY_SCHEMA_URIS = Object.fromEntries(
  DIETARY_TAGS.map((tag) => [tag.id, tag.schemaUri]),
) as Record<DietaryTag, string>;

export const allergenLabelFor = (tag: AllergenTag): string =>
  ALLERGENS.find((allergen) => allergen.id === tag)?.label ?? tag;

export const dietaryLabelFor = (tag: DietaryTag): string =>
  DIETARY_TAGS.find((dietaryTag) => dietaryTag.id === tag)?.label ?? tag;
