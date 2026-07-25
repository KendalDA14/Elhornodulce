"use client";

import { ReactNode, useEffect } from "react";

export function SmoothProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    let active = true;
    let frame = 0;
    let destroy: (() => void) | undefined;

    void Promise.all([import("lenis"), import("gsap/ScrollTrigger")]).then(
      ([{ default: Lenis }, { ScrollTrigger }]) => {
        if (!active) return;

        const lenis = new Lenis({
          duration: 0.85,
          smoothWheel: true,
          syncTouch: false,
        });

        lenis.on("scroll", ScrollTrigger.update);

        function raf(time: number) {
          if (!active) return;
          lenis.raf(time);
          frame = requestAnimationFrame(raf);
        }

        frame = requestAnimationFrame(raf);
        destroy = () => lenis.destroy();
      },
    );

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      destroy?.();
    };
  }, []);

  return children;
}
