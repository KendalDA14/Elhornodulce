"use client";

import type { PublicProduct } from "@/types/shop";
import { ProductDetailsContent } from "@/components/public/product-details-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProductDetailDialog({
  product,
  trigger,
  open,
  onOpenChange,
}: {
  product: PublicProduct;
  trigger: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto p-4 sm:max-w-5xl sm:p-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Vista rápida de {product.name}</DialogTitle>
          <DialogDescription>
            Información, fotografías y opciones de compra de {product.name}.
          </DialogDescription>
        </DialogHeader>
        <ProductDetailsContent product={product} variant="dialog" />
      </DialogContent>
    </Dialog>
  );
}
