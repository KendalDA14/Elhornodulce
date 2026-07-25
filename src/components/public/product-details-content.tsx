"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { whatsappUrl } from "@/lib/settings";
import { useCart } from "@/components/public/cart-provider";
import { ResponsiveImage } from "@/components/public/responsive-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ProductDetailsContentProps = {
  product: PublicProduct;
  variant: "dialog" | "page";
};

export function ProductDetailsContent({
  product,
  variant,
}: ProductDetailsContentProps) {
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
  const whatsapp = useMemo(
    () =>
      whatsappUrl(
        `Hola, quiero consultar sobre este postre: ${product.name}`,
      ),
    [product.name],
  );
  const isPage = variant === "page";

  function addToCart() {
    addProduct(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  function addAndCheckout(method: "SINPE" | "CASH") {
    addProduct(product, quantity);
    window.location.href = `/checkout?payment=${method}`;
  }

  return (
    <div className={cn("space-y-8", isPage && "sm:space-y-12")}>
      <div
        className={cn(
          "grid gap-6",
          isPage
            ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:gap-12"
            : "lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8",
        )}
      >
        <section
          aria-label={`Imágenes de ${product.name}`}
          className="min-w-0 space-y-3"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
            {selectedImage ? (
              <ResponsiveImage
                src={selectedImage}
                alt={product.name}
                sizes={
                  isPage
                    ? "(min-width: 1024px) 55vw, 100vw"
                    : "(min-width: 1024px) 58vw, 100vw"
                }
                priority={isPage}
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
                      selected
                        ? "border-primary"
                        : "border-transparent hover:border-border",
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

        <section className="min-w-0 space-y-5">
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
            {isPage ? (
              <h1 className="mt-3 pr-8 font-serif text-4xl font-semibold leading-tight text-rose-950 sm:text-5xl">
                {product.name}
              </h1>
            ) : (
              <h2 className="mt-3 pr-8 font-serif text-3xl font-semibold leading-tight text-rose-950 sm:text-4xl">
                {product.name}
              </h2>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span
                className="flex text-amber-600"
                aria-label={`${product.averageRating.toFixed(1)} de 5 estrellas`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-4 w-4",
                      index < Math.round(product.averageRating) &&
                        "fill-current",
                    )}
                  />
                ))}
              </span>
              <span className="text-muted-foreground">
                {product.ratingCount
                  ? `${product.averageRating.toFixed(1)} · ${product.ratingCount} ${
                      product.ratingCount === 1
                        ? "calificación"
                        : "calificaciones"
                    }`
                  : "Producto nuevo"}
              </span>
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {product.description}
          </p>

          <div>
            {hasDiscount ? (
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {currency(product.originalPrice)}
                </span>
                <Badge className="rounded-full">
                  -{product.discountPercent}%
                </Badge>
              </div>
            ) : null}
            <strong className="text-3xl">{currency(product.priceFinal)}</strong>
            {product.promotionName ? (
              <p className="mt-1 text-sm font-medium text-primary">
                {product.promotionName}
              </p>
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
                onClick={() =>
                  setQuantity((value) => Math.max(1, value - 1))
                }
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
            className="w-full rounded-full"
          >
            {added ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <ShoppingBag className="mr-2 h-4 w-4" />
            )}
            {added ? "Agregado al carrito" : "Agregar al carrito"}
          </Button>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              disabled={!product.isAvailable}
              onClick={() => addAndCheckout("SINPE")}
              className="min-h-11 whitespace-normal rounded-full px-4"
            >
              Pagar con SINPE
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!product.isAvailable}
              onClick={() => addAndCheckout("CASH")}
              className="min-h-11 whitespace-normal rounded-full px-4"
            >
              Pagar en efectivo
            </Button>
          </div>

          <Button
            asChild
            variant="secondary"
            className="w-full rounded-full"
          >
            <a href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Consultar por WhatsApp
            </a>
          </Button>
        </section>
      </div>

      <section className="border-t pt-7 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
              Opiniones reales
            </p>
            <h2
              className={cn(
                "mt-2 font-serif font-semibold text-rose-950",
                isPage ? "text-3xl" : "text-2xl",
              )}
            >
              Reseñas de compradores
            </h2>
          </div>
          {product.ratingCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {product.averageRating.toFixed(1)} de 5 · {product.ratingCount}{" "}
              {product.ratingCount === 1
                ? "calificación"
                : "calificaciones"}
            </p>
          ) : null}
        </div>

        {product.productReviews.length ? (
          <div
            className={cn(
              "mt-5 grid gap-3",
              isPage
                ? "md:grid-cols-2 lg:grid-cols-3"
                : "max-h-72 overflow-y-auto pr-1 sm:grid-cols-2",
            )}
          >
            {product.productReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold">{review.customerName}</p>
                  <span
                    className="whitespace-nowrap text-sm text-amber-600"
                    aria-label={`${review.rating} de 5 estrellas`}
                  >
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {review.comment}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Este producto todavía no tiene reseñas publicadas.
          </p>
        )}
      </section>
    </div>
  );
}
