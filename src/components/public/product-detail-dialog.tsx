"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { whatsappUrl } from "@/lib/settings";
import { useCart } from "@/components/public/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function ProductDetailDialog({
  product,
  trigger,
}: {
  product: PublicProduct;
  trigger: React.ReactNode;
}) {
  const { addProduct } = useCart();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const hasDiscount = Boolean(product.discountPercent && product.originalPrice > product.priceFinal);
  const images = product.images.length
    ? product.images
    : product.imageUrl
      ? [{ id: product.id, url: product.imageUrl, alt: product.name, isPrimary: true }]
      : [];

  const whatsapp = useMemo(
    () => whatsappUrl(`Hola, quiero consultar sobre este postre: ${product.name}`),
    [product.name],
  );

  function addAndCheckout(method: "SINPE" | "CASH") {
    addProduct(product, quantity);
    window.location.href = `/checkout?payment=${method}`;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setOpen(true);
        }}
        className="contents"
      >
        {trigger}
      </span>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.categoryName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              {selectedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    className="aspect-square overflow-hidden rounded-md border bg-muted"
                    onClick={() => setSelectedImage(image.url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                {hasDiscount ? (
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {currency(product.originalPrice)}
                    </span>
                    <Badge className="rounded-full">-{product.discountPercent}%</Badge>
                  </div>
                ) : null}
                <strong className="text-2xl">{currency(product.priceFinal)}</strong>
                {product.promotionName ? (
                  <p className="mt-1 text-xs font-medium text-primary">{product.promotionName}</p>
                ) : null}
              </div>
              <Badge variant={product.isAvailable ? "default" : "secondary"}>
                {product.isAvailable ? "Disponible" : "Agotado"}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{product.description}</p>
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-medium">Ingredientes visibles</p>
              <p className="mt-2 text-muted-foreground">
                {product.visibleIngredients || "Consulta ingredientes especificos por WhatsApp."}
              </p>
            </div>
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-medium">Tiempo estimado de entrega</p>
              <p className="mt-2 text-muted-foreground">{product.estimatedDelivery}</p>
            </div>
            {product.productReviews.length ? (
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">Reseñas de compradores</p>
                <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                  {product.productReviews.map((review) => (
                    <div key={review.id} className="rounded-md bg-muted/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{review.customerName}</span>
                        <span className="text-amber-600">
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="mt-2 text-muted-foreground">{review.comment}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cantidad</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setQuantity((value) => value + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full rounded-full"
              disabled={!product.isAvailable}
              onClick={() => addProduct(product, quantity)}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Agregar al carrito
            </Button>
            <div className="grid gap-2">
              <Button
                disabled={!product.isAvailable}
                onClick={() => addAndCheckout("SINPE")}
                className="min-h-11 whitespace-normal rounded-full px-5"
              >
                Agregar y pagar con SINPE
              </Button>
              <Button
                variant="outline"
                disabled={!product.isAvailable}
                onClick={() => addAndCheckout("CASH")}
                className="min-h-11 whitespace-normal rounded-full px-5"
              >
                Agregar y pagar en efectivo
              </Button>
            </div>
            <Button asChild variant="secondary" className="w-full rounded-full">
              <a href={whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Consultar por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
