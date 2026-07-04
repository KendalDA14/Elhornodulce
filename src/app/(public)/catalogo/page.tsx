import { getCatalog } from "@/lib/data";
import { ProductGrid } from "@/components/public/catalog-section";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const categories = await getCatalog();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const products = categories.flatMap((category) => category.products);
  const perPage = 9;
  const totalPages = Math.max(1, Math.ceil(products.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = products.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div data-reveal className="mb-6 max-w-2xl sm:mb-10">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Catálogo</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Postres disponibles</h1>
        <p className="mt-4 text-muted-foreground">
          Agrega productos al carrito y confirma el pedido con SINPE manual o efectivo.
        </p>
      </div>
      <ProductGrid products={visibleProducts} />
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
