"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PublicProduct } from "@/types/shop";
import { ProductDetailsContent } from "@/components/public/product-details-content";

export function ProductPageClient({ product }: { product: PublicProduct }) {
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
      <ProductDetailsContent product={product} variant="page" />
    </main>
  );
}
