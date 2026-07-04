"use client";

import { useMemo, useRef } from "react";
import { Clock3 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { PromotionTickerItem } from "@/types/shop";

gsap.registerPlugin(useGSAP);

function formatEndDate(value: string) {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function buildPromotionTrack(items: PromotionTickerItem[]) {
  if (!items.length) return [];

  const grouped = items.flatMap((item) =>
    Array.from({ length: 4 }, (_, index) => ({
      item,
      key: `${item.id}-group-${index}`,
    })),
  );

  const filledTrack =
    items.length === 1
      ? Array.from({ length: 12 }, (_, index) => ({
          item: items[0],
          key: `${items[0].id}-fill-${index}`,
        }))
      : grouped;

  return [...filledTrack, ...filledTrack.map((entry) => ({ ...entry, key: `${entry.key}-copy` }))];
}

export function PromotionTicker({ items }: { items: PromotionTickerItem[] }) {
  const scope = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackItems = useMemo(() => buildPromotionTrack(items), [items]);
  const animationKey = items.map((item) => item.id).join("-");

  useGSAP(
    () => {
      const content = contentRef.current;
      if (!content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const halfWidth = content.scrollWidth / 2;
      if (!halfWidth) return;

      gsap.fromTo(
        content,
        { x: 0, autoAlpha: 1 },
        {
          x: -halfWidth,
          duration: Math.max(18, halfWidth / 58),
          ease: "none",
          repeat: -1,
        },
      );
    },
    { scope, dependencies: [animationKey], revertOnUpdate: true },
  );

  if (!items.length) return null;

  return (
    <div
      ref={scope}
      data-promotion-ticker
      data-promotion-count={items.length}
      className="fixed inset-x-0 top-0 z-50 h-8 overflow-hidden border-b border-primary/20 bg-primary text-primary-foreground shadow-sm"
    >
      <div
        ref={contentRef}
        data-promotion-content
        className="flex h-full w-max items-center gap-10 whitespace-nowrap px-4 text-xs font-semibold"
      >
        {trackItems.map(({ item, key }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="font-bold">{item.name}</span>
            <span className="shrink-0 rounded-full bg-primary-foreground/18 px-2 py-0.5">
              -{item.discountPercent}% en {item.scope}
            </span>
            <span className="hidden shrink-0 items-center gap-1 opacity-90 min-[420px]:flex">
              <Clock3 className="h-3 w-3" />
              hasta {formatEndDate(item.endsAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
