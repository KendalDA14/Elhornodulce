"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { useCart } from "@/components/public/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ResponsiveImage } from "@/components/public/responsive-image";

export function ProductPageClient({ product }: { product: PublicProduct }) {
  const { addProduct } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const [added, setAdded] = useState(false);
  const hasDiscount = Boolean(
    product.discountPercent && product.originalPrice > product.priceFinal,
  );
  const images = product.images.length
    ? product.images
    : product.imageUrl
      ? [
          {
            id: product.id,
            url: product.imageUrl,
            alt: product.name,
            isPrimary: true,
          },
        ]
      : [];

  function addToCart() {
    addProduct(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <nav aria-label="Migas de pan" className="mb-5">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:gap-12">
        <section aria-label={`Imágenes de ${product.name}`} className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
            {selectedImage ? (
              <ResponsiveImage
                src={selectedImage}
                alt={product.name}
                sizes="(min-width: 1024px) 55vw, 100vw"
                priority
                className="h-full w-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sin imagen
              </div>
            )}
          </div>

          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {images.map((image) => {
                const selected = selectedImage === image.url;
                return (
                  <button
                    key={image.id}
                    type="button"
                    aria-label={`Ver imagen de ${product.name}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedImage(image.url)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-md border-2 bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary" : "border-transparent hover:border-border",
                    )}
                  >
                    <ResponsiveImage
                      src={image.url}
                      alt={image.alt || product.name}
                      sizes="120px"
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/categorias/${product.categorySlug}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {product.categoryName}
              </Link>
              <Badge variant={product.isAvailable ? "default" : "secondary"}>
                {product.isAvailable ? "Disponible" : "Agotado"}
              </Badge>
            </div>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-rose-950 sm:text-5xl">
              {product.name}
            </h1>
            {product.ratingCount > 0 ? (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="flex text-amber-600" aria-label={`${product.averageRating.toFixed(1)} de 5 estrellas`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "h-4 w-4",
                        index < Math.round(product.averageRating) && "fill-current",
                      )}
                    />
                  ))}
                </span>
                <span className="text-muted-foreground">
                  {product.averageRating.toFixed(1)} · {product.ratingCount}{" "}
                  {product.ratingCount === 1 ? "calificación" : "calificaciones"}
                </span>
              </div>
            ) : null}
          </div>

          <p className="text-base leading-7 text-muted-foreground">{product.description}</p>

          <div>
            {hasDiscount ? (
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {currency(product.originalPrice)}
                </span>
                <Badge className="rounded-full">-{product.discountPercent}%</Badge>
              </div>
            ) : null}
            <strong className="text-3xl">{currency(product.priceFinal)}</strong>
            {product.promotionName ? (
              <p className="mt-1 text-sm font-medium text-primary">{product.promotionName}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold">Ingredientes</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {product.visibleIngredients ||
                  "Consulta los ingredientes específicos por WhatsApp."}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold">Entrega estimada</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {product.estimatedDelivery}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold">Cantidad</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={!product.isAvailable}
            onClick={addToCart}
            className="w-full"
          >
            {added ? <Check className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            {added ? "Agregado" : "Agregar al carrito"}
          </Button>
        </section>
      </div>

      <section className="mt-12 border-t pt-8 sm:mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              Opiniones reales
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-rose-950">
              Reseñas de compradores
            </h2>
          </div>
          {product.ratingCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {product.averageRating.toFixed(1)} de 5 · {product.ratingCount}{" "}
              {product.ratingCount === 1 ? "calificación" : "calificaciones"}
            </p>
          ) : null}
        </div>

        {product.productReviews.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {product.productReviews.map((review) => (
              <article key={review.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold">{review.customerName}</p>
                  <span className="whitespace-nowrap text-sm text-amber-600" aria-label={`${review.rating} de 5 estrellas`}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            Este producto todavía no tiene reseñas publicadas.
          </p>
        )}
      </section>
    </main>
  );
}
