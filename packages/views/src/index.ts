// @carte/views — peer-dep npm library, NOT an EmDash plugin.
//
// Ships Astro components and React building blocks for consumer
// storefronts. The full v0.1 surface lands in a later mission. For
// now, a placeholder MenuItem named export documents the shape and
// lets the smoke test assert that the package has a public surface
// without depending on a plugin manifest.

export interface MenuItemProps {
  id: string;
  name: string;
  priceMinorUnits: number;
  currency: string;
  shortDescription?: string;
}

/**
 * Placeholder MenuItem shape. Returns null for now — the real Astro
 * + React implementation arrives with the @carte/views mission.
 */
export const MenuItem = (props: MenuItemProps): null => {
  void props;
  return null;
};
