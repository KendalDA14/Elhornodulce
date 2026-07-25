"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ClipboardCheck, HandCoins, RotateCcw } from "lucide-react";

type RefundPolicyAccordionProps = {
  reviewText: string;
  replacementText: string;
  partialText: string;
};

const policyItems = [
  {
    title: "Revisión del pedido",
    icon: ClipboardCheck,
  },
  {
    title: "Reposición o descuento",
    icon: HandCoins,
  },
  {
    title: "Devolución parcial",
    icon: RotateCcw,
  },
];

function PolicyContent({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      gsap.set(element, {
        height: isOpen ? "auto" : 0,
        autoAlpha: isOpen ? 1 : 0,
      });
      return;
    }

    gsap.to(element, {
      height: isOpen ? "auto" : 0,
      autoAlpha: isOpen ? 1 : 0,
      duration: 0.28,
      ease: "power2.out",
      overwrite: true,
    });
  }, [isOpen]);

  return (
    <div ref={ref} className="h-0 overflow-hidden opacity-0">
      <div className="mx-3 mb-3 rounded-lg bg-rose-50/70 px-3 py-3 text-sm leading-6 text-muted-foreground sm:px-4 sm:leading-7">
        {children}
      </div>
    </div>
  );
}

export function RefundPolicyAccordion({
  reviewText,
  replacementText,
  partialText,
}: RefundPolicyAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const texts = [reviewText, replacementText, partialText];

  return (
    <div className="space-y-2 rounded-xl border bg-card p-2 shadow-sm sm:p-3">
      {policyItems.map((item, index) => {
        const Icon = item.icon;
        const isOpen = openIndex === index;

        return (
          <div
            key={item.title}
            className="overflow-hidden rounded-xl border bg-background/70 transition-colors data-[open=true]:border-rose-200 data-[open=true]:bg-white"
            data-open={isOpen}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-3 text-left sm:px-4 sm:py-3.5"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-700">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                {item.title}
              </span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-50 text-lg leading-none text-rose-700 transition-transform duration-200">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <PolicyContent isOpen={isOpen}>
              <p className="whitespace-pre-line">{texts[index]}</p>
            </PolicyContent>
          </div>
        );
      })}
    </div>
  );
}
