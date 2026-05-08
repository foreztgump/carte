// @carte/views — peer-dep Astro component library, NOT an EmDash plugin.

import type { CarteComponentExport } from "./types.js";

export type { CarteComponentExport, CarteShellProps, CarteViewVariant } from "./types.js";

export const CarteShell = {
  componentName: "CarteShell",
  importPath: "@carte/views/components/CarteShell.astro",
  variants: ["default", "headless"],
} as const satisfies CarteComponentExport;
