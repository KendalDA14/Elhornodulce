"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/public/cart-provider";
import { ProductDetailDialog } from "@/components/public/product-detail-dialog";
import { ResponsiveImage } from "@/components/public/responsive-image";

export function ProductCard({ product }: { product: PublicProduct }) {
  const { addProduct } = useCart();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const roundedRating = Math.round(product.averageRating);
  const hasDiscount = Boolean(product.discountPercent && product.originalPrice > product.priceFinal);

  return (
    <article data-no-reveal className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <ProductDetailDialog
        product={product}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        trigger={
          <button
            type="button"
            className="flex min-h-0 w-full flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {product.imageUrl ? (
                <ResponsiveImage
                  src={product.imageUrl}
                  alt={product.name}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col space-y-3 p-4 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{product.categoryName}</p>
                  <h3 className="mt-1 line-clamp-2 min-h-14 text-lg font-semibold leading-7">
                    {product.name}
                  </h3>
                </div>
                <Badge variant={product.isAvailable ? "default" : "secondary"}>
                  {product.isAvailable ? "Disponible" : "Agotado"}
                </Badge>
              </div>
              <div className="text-sm text-amber-600">
                {"★".repeat(roundedRating)}
                {"☆".repeat(5 - roundedRating)}
                <span className="ml-2 text-muted-foreground">
                  {product.ratingCount ? `${product.ratingCount} calif.` : "Nuevo"}
                </span>
              </div>
              <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-auto text-sm font-medium text-muted-foreground">
                {product.estimatedDelivery}
              </p>
            </div>
          </button>
        }
      />
      <div className="mt-auto p-4 pt-2">
        <div className="min-h-12">
          {hasDiscount ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {currency(product.originalPrice)}
              </span>
              <Badge className="rounded-full">-{product.discountPercent}%</Badge>
            </div>
          ) : null}
          <span className="font-semibold">{currency(product.priceFinal)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full rounded-full px-3"
          >
            <Link
              href={`/productos/${product.slug}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Eye className="mr-2 h-4 w-4" />
              Detalles
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!product.isAvailable}
            onClick={() => addProduct(product)}
            className="w-full rounded-full px-3"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>
    </article>
  );
}
