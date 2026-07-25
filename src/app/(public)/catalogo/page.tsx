import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCatalogPage } from "@/lib/data";
import { ProductGrid } from "@/components/public/catalog-section";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(params.page || 1) || 1);
  const canonical = requestedPage > 1 ? `/catalogo?page=${requestedPage}` : "/catalogo";
  const pageSuffix = requestedPage > 1 ? ` - Página ${requestedPage}` : "";

  return {
    title: `Postres caseros en Liberia${pageSuffix}`,
    description:
      "Descubre postres caseros en Liberia, Guanacaste. Encuentra opciones disponibles y pedidos especiales, con envío gratis dentro de Liberia centro.",
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "es_CR",
      title: `Postres caseros en Liberia${pageSuffix} | El horno dulce`,
      description:
        "Catálogo de postres caseros disponibles y por encargo en Liberia, Guanacaste.",
      url: canonical,
      images: [
        {
          url: "/brand/logo.jpeg",
          width: 1600,
          height: 1600,
          alt: "El horno dulce",
        },
      ],
    },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1) || 1);
  const perPage = 9;
  const { categories, totalProducts, products } = await getCatalogPage(page, perPage);
  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage));
  const currentPage = Math.min(page, totalPages);
  if (page > totalPages) {
    redirect(totalPages > 1 ? `/catalogo?page=${totalPages}` : "/catalogo");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div data-reveal className="mb-6 max-w-2xl sm:mb-10">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Catálogo</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Postres disponibles</h1>
        <p className="mt-4 text-muted-foreground">
          Agrega productos al carrito y confirma el pedido con SINPE manual o efectivo.
        </p>
      </div>
      {categories.length ? (
        <nav
          aria-label="Categorías de postres"
          className="mb-8 flex flex-wrap gap-2"
        >
          {categories.map((category) => (
            <Button key={category.id} asChild size="sm" variant="outline">
              <Link href={`/categorias/${category.slug}`}>{category.name}</Link>
            </Button>
          ))}
        </nav>
      ) : null}
      <ProductGrid products={products} />
      <div data-reveal className="mt-10 flex items-center justify-center gap-3">
        <Button asChild variant="outline" disabled={currentPage <= 1}>
          <a href={`/catalogo?page=${Math.max(1, currentPage - 1)}`}>Anterior</a>
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>
        <Button asChild variant="outline" disabled={currentPage >= totalPages}>
          <a href={`/catalogo?page=${Math.min(totalPages, currentPage + 1)}`}>Siguiente</a>
        </Button>
      </div>
    </section>
  );
}
