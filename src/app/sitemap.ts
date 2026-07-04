import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || "3000"}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const updatedAt = new Date();

  return [
    {
      url: siteUrl,
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/catalogo`,
      lastModified: updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/personalizado`,
      lastModified: updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/#politicas`,
      lastModified: updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
