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
