import type { MetadataRoute } from "next";
import { getPrisma } from "@/lib/prisma";
import { absoluteSiteUrl, siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/catalogo`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/personalizado`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const [products, categories] = await Promise.all([
      getPrisma().product.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          updatedAt: true,
          imageUrl: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            select: { url: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      getPrisma().category.findMany({
        where: {
          isActive: true,
          products: { some: { isActive: true } },
        },
        select: {
          slug: true,
          updatedAt: true,
          products: {
            where: { isActive: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              updatedAt: true,
              imageUrl: true,
              images: {
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                take: 1,
                select: { url: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
  ]);
  const catalogUpdatedAt = products[0]?.updatedAt;

  if (catalogUpdatedAt) {
    baseEntries[0].lastModified = catalogUpdatedAt;
    baseEntries[1].lastModified = catalogUpdatedAt;
  }

  return [
    ...baseEntries,
    ...categories.map((category) => {
      const product = category.products[0];
      const lastModified =
        product && product.updatedAt > category.updatedAt
          ? product.updatedAt
          : category.updatedAt;
      const imageUrl = product?.images[0]?.url || product?.imageUrl;

      return {
        url: `${siteUrl}/categorias/${category.slug}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(imageUrl ? { images: [absoluteSiteUrl(imageUrl)] } : {}),
      };
    }),
    ...products.map((product) => ({
      url: `${siteUrl}/productos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: Array.from(
        new Set([
          ...product.images.map((image) => absoluteSiteUrl(image.url)),
          ...(product.imageUrl ? [absoluteSiteUrl(product.imageUrl)] : []),
        ]),
      ),
    })),
  ];
}
