"use client";

import { useMemo, useState } from "react";
import type { PublicProduct } from "@/types/shop";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/public/catalog-section";

export function FeaturedProductFilter({ products }: { products: PublicProduct[] }) {
  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((product) => product.categoryName)))],
    [products],
  );
  const [selected, setSelected] = useState("Todos");
  const filtered = selected === "Todos" ? products : products.filter((product) => product.categoryName === selected);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            type="button"
            size="sm"
            variant={selected === category ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSelected(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      <ProductGrid products={filtered} />
    </div>
  );
}
