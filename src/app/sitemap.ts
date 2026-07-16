import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

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
  ];
}
