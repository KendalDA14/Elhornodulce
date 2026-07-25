import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ResponsiveImage } from "@/components/public/responsive-image";

export function StarProductSection({ product }: { product: PublicProduct | null }) {
  if (!product) return null;

  return (
    <section data-star-section className="overflow-hidden border-b border-rose-100 bg-rose-50/75">
      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-14 lg:px-12">
        <div data-reveal className="order-2 space-y-4 lg:order-1 lg:pl-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            Producto estrella
          </p>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-rose-950 sm:text-5xl">
            {product.name}
          </h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {product.description}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-1">
            <strong className="text-2xl">{currency(product.priceFinal)}</strong>
            <span className="text-sm text-muted-foreground">
              Entrega estimada: {product.estimatedDelivery}
            </span>
          </div>
          <Button asChild>
            <Link href={`/productos/${product.slug}`}>Ver detalles del producto</Link>
          </Button>
        </div>
        <div data-reveal className="relative order-1 aspect-[4/3] overflow-hidden rounded-lg bg-muted sm:aspect-[16/9] lg:order-2 lg:max-h-[380px]">
          {product.imageUrl ? (
            <ResponsiveImage
              src={product.imageUrl}
              alt={product.name}
              sizes="(min-width: 1024px) 55vw, 100vw"
              dataAttribute="star"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
