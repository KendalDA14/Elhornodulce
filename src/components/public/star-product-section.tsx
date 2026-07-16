import { Sparkles } from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { ProductDetailDialog } from "@/components/public/product-detail-dialog";
import { Button } from "@/components/ui/button";

export function StarProductSection({ product }: { product: PublicProduct | null }) {
  if (!product) return null;

  return (
    <section data-star-section className="overflow-hidden border-y bg-accent/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div data-reveal className="space-y-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
            <Sparkles className="h-4 w-4" />
            Producto estrella
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">{product.name}</h2>
          <p className="max-w-xl text-muted-foreground">{product.description}</p>
          <div className="flex flex-wrap items-center gap-4">
            <strong className="text-2xl">{currency(product.priceFinal)}</strong>
            <span className="text-sm text-muted-foreground">
              Entrega estimada: {product.estimatedDelivery}
            </span>
          </div>
          <ProductDetailDialog product={product} trigger={<Button>Ver detalles</Button>} />
        </div>
        <div data-reveal className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              data-star-image
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-[115%] w-full object-cover"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
