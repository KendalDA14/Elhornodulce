import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductGrid } from "@/components/public/catalog-section";
import { getCategoryBySlug } from "@/lib/data";
import { absoluteSiteUrl, siteName, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

function categoryDescription(name: string, description: string | null) {
  const text = description?.trim();
  if (text) {
    const localized = `${text} Encuentra ${name.toLocaleLowerCase("es-CR")} en Liberia, Guanacaste.`;
    return localized.length <= 160
      ? localized
      : `${localized.slice(0, 157).trimEnd()}...`;
  }

  return `Descubre ${name.toLocaleLowerCase("es-CR")} caseros en Liberia, Guanacaste, preparados por El horno dulce. Envío gratis dentro de Liberia centro.`;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Categoría no encontrada",
      robots: { index: false, follow: false },
    };
  }

  const description = categoryDescription(category.name, category.description);
  const canonicalPath = `/categorias/${category.slug}`;
  const image = category.products.find((product) => product.imageUrl)?.imageUrl;

  return {
    title: `${category.name} en Liberia`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      locale: "es_CR",
      siteName,
      title: `${category.name} en Liberia | ${siteName}`,
      description,
      url: canonicalPath,
      images: image
        ? [{ url: image, alt: `${category.name} de ${siteName}` }]
        : [
            {
              url: "/brand/logo.jpeg",
              width: 1600,
              height: 1600,
              alt: siteName,
            },
          ],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryUrl = absoluteSiteUrl(`/categorias/${category.slug}`);
  const structuredData = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${categoryUrl}#collection`,
      name: `${category.name} en Liberia`,
      description: categoryDescription(category.name, category.description),
      url: categoryUrl,
      isPartOf: { "@id": `${siteUrl}/#website` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: category.products.length,
        itemListElement: category.products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: absoluteSiteUrl(`/productos/${product.slug}`),
        })),
      },
    },
    {
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
          name: "Catálogo",
          item: absoluteSiteUrl("/catalogo"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: category.name,
          item: categoryUrl,
        },
      ],
    },
  ]).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>

        <header className="mb-8 mt-6 max-w-3xl sm:mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Postres caseros en Liberia
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-rose-950 sm:text-5xl">
            {category.name}
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {category.description ||
              `${category.name} preparados por El horno dulce en Liberia, Guanacaste.`}
          </p>
          <p className="mt-2 text-sm font-medium text-primary">
            Envío gratis dentro de Liberia centro.
          </p>
        </header>

        <ProductGrid products={category.products} />
      </main>
    </>
  );
}
