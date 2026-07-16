import type { PublicProduct } from "@/types/shop";
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
