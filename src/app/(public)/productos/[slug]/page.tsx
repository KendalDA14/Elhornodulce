import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageClient } from "@/components/public/product-page-client";
import { getProductBySlug } from "@/lib/data";
import { absoluteSiteUrl, siteName, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function productDescription(name: string, description: string) {
  const localText = `${name} artesanal en Liberia, Guanacaste. ${description}`;
  return localText.length <= 160 ? localText : `${localText.slice(0, 157).trimEnd()}...`;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
      robots: { index: false, follow: false },
    };
  }

  const description = productDescription(product.name, product.description);
  const canonicalPath = `/productos/${product.slug}`;

  return {
    title: `${product.name} artesanal en Liberia`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      locale: "es_CR",
      siteName,
      title: `${product.name} artesanal en Liberia | ${siteName}`,
      description,
      url: canonicalPath,
      images: product.imageUrl
        ? [{ url: product.imageUrl, alt: product.name }]
        : [{ url: "/brand/logo.jpeg", width: 1600, height: 1600, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} artesanal en Liberia | ${siteName}`,
      description,
      images: product.imageUrl ? [product.imageUrl] : ["/brand/logo.jpeg"],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const productUrl = absoluteSiteUrl(`/productos/${product.slug}`);
  const imageUrls = product.images.length
    ? product.images.map((image) => absoluteSiteUrl(image.url))
    : product.imageUrl
      ? [absoluteSiteUrl(product.imageUrl)]
      : [];
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: product.description,
    image: imageUrls,
    sku: product.id,
    category: product.categoryName,
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "CRC",
      price: product.priceFinal.toFixed(2),
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteName,
        url: `${siteUrl}/`,
      },
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.averageRating.toFixed(2)),
            reviewCount: product.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.categoryName,
        item: absoluteSiteUrl(`/categorias/${product.categorySlug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };
  const structuredData = JSON.stringify([
    ...(imageUrls.length ? [productStructuredData] : []),
    breadcrumbStructuredData,
  ]).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <ProductPageClient product={product} />
    </>
  );
}
