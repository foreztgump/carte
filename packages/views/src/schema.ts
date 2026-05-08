import type { CarteMenu, CarteRestaurantSummary } from "./types.js";

export const restaurantJsonLdFor = (
  restaurant: CarteRestaurantSummary,
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Restaurant",
  image: restaurant.heroImage?.src,
  name: restaurant.name,
  priceRange: restaurant.priceRange,
  servesCuisine: restaurant.cuisine,
  slogan: restaurant.tagline,
});

export const menuJsonLdFor = (menu: CarteMenu): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Menu",
  hasMenuSection: menu.sections.map((section) => ({
    "@type": "MenuSection",
    hasMenuItem: section.items.map((item) => ({
      "@type": "MenuItem",
      description: item.description,
      name: item.name,
      offers: {
        "@type": "Offer",
        price: item.price / 100,
        priceCurrency: item.currency,
      },
    })),
    name: section.name,
  })),
  name: menu.name,
});
