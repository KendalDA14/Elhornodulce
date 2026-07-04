"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicProduct } from "@/types/shop";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/public/product-card";

export function MobileProductCarousel({ products }: { products: PublicProduct[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  const goTo = useCallback(
    (nextIndex: number, userInitiated = true) => {
      if (!products.length) return;
      if (userInitiated) markInteraction();

      const index = (nextIndex + products.length) % products.length;
      const scroller = scrollerRef.current;
      const slide = scroller?.children[index] as HTMLElement | undefined;

      if (scroller && slide) {
        scroller.scrollTo({
          left: slide.offsetLeft - scroller.offsetLeft,
          behavior: "smooth",
        });
      }

      setActiveIndex(index);
    },
    [markInteraction, products.length],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const slides = Array.from(scroller.children) as HTMLElement[];
        const center = scroller.scrollLeft + scroller.clientWidth / 2;
        const closest = slides.reduce(
          (current, slide, index) => {
            const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
            const distance = Math.abs(center - slideCenter);
            return distance < current.distance ? { index, distance } : current;
          },
          { index: 0, distance: Number.POSITIVE_INFINITY },
        );
        setActiveIndex(closest.index);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (products.length < 2) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (Date.now() - lastInteractionRef.current < 6000) return;
      goTo(activeIndex + 1, false);
      lastInteractionRef.current = Date.now();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeIndex, goTo, products.length]);

  if (!products.length) {
    return (
      <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
        No hay productos disponibles en este momento.
      </div>
    );
  }

  return (
    <div className="sm:hidden" aria-label="Carrusel de productos">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {activeIndex + 1} de {products.length}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Producto anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Producto siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={markInteraction}
        onTouchStart={markInteraction}
        onFocus={markInteraction}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[86%] snap-center">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5" aria-hidden="true">
        {products.map((product, index) => (
          <span
            key={product.id}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-primary/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
