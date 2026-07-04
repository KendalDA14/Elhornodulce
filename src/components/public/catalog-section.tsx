import type { PublicCategory, PublicProduct } from "@/types/shop";
import { MobileProductCarousel } from "@/components/public/mobile-product-carousel";
import { ProductCard } from "@/components/public/product-card";

export function ProductGrid({ products }: { products: PublicProduct[] }) {
  return (
    <>
      <MobileProductCarousel products={products} />
      <div className="hidden auto-rows-fr gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}

export function CategoryCatalog({ categories }: { categories: PublicCategory[] }) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <section key={category.id} className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Categoría
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{category.name}</h2>
          </div>
          <ProductGrid products={category.products} />
        </section>
      ))}
    </div>
  );
}
