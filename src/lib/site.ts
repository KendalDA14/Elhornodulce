const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (process.env.NODE_ENV === "production" && !configuredSiteUrl) {
  throw new Error("NEXT_PUBLIC_SITE_URL es obligatoria en producción.");
}

export const siteUrl = new URL(
  configuredSiteUrl || `http://localhost:${process.env.PORT || "3000"}`,
).origin;
export const siteName = "El horno dulce";
export const siteTitle = "El horno dulce | Postres caseros en Liberia";
export const siteDescription =
  "Postres caseros hechos con amor en Liberia. Elige entre opciones disponibles o pide algo especial por encargo, con envío gratis dentro de Liberia centro.";

export function absoluteSiteUrl(path: string) {
  return new URL(path, `${siteUrl}/`).toString();
}
