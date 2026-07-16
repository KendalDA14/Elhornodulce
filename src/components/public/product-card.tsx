"use client";

import { MessageCircle, Plus } from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { whatsappUrl } from "@/lib/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/public/cart-provider";
import { ProductDetailDialog } from "@/components/public/product-detail-dialog";

export function ProductCard({ product }: { product: PublicProduct }) {
  const { addProduct } = useCart();
  const roundedRating = Math.round(product.averageRating);
  const hasDiscount = Boolean(product.discountPercent && product.originalPrice > product.priceFinal);

  return (
    <article data-no-reveal className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <ProductDetailDialog
        product={product}
        trigger={
          <button type="button" className="flex h-full w-full flex-col text-left focus:outline-none focus:ring-2 focus:ring-ring">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
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
                  <h3 className="mt-1 text-lg font-semibold">{product.name}</h3>
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
              <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">{product.description}</p>
              <p className="text-sm font-medium text-muted-foreground">
                Entrega estimada: {product.estimatedDelivery}
              </p>
            </div>
          </button>
        }
      />
      <div className="mt-auto space-y-4 p-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
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
          <Button
            type="button"
            size="sm"
            disabled={!product.isAvailable}
            onClick={() => addProduct(product)}
            className="rounded-full px-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ProductDetailDialog
            product={product}
            trigger={
              <Button type="button" variant="outline" className="rounded-full">
                Detalles
              </Button>
            }
          />
          <Button asChild variant="secondary" className="rounded-full">
            <a
              href={whatsappUrl(`Hola, quiero consultar sobre este postre: ${product.name}`)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
