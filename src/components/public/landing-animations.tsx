"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const revealSelectors = [
  "[data-reveal]",
  "[data-reveal-card]",
];

function uniqueVisibleElements(
  gsap: typeof import("gsap").default,
  scope: HTMLElement,
) {
  const seen = new Set<HTMLElement>();
  return gsap.utils
    .toArray<HTMLElement>(revealSelectors.join(","), scope)
    .filter((element) => {
      if (seen.has(element)) return false;
      if (element.closest("[data-no-reveal]")) return false;
      if (element.closest("[role='dialog']")) return false;
      if (element.offsetParent === null && getComputedStyle(element).position !== "fixed") return false;
      seen.add(element);
      return true;
    });
}

export function LandingAnimations({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const container = scope.current;
    if (!container) return;

    let disposed = false;
    let frame = 0;
    let cleanupAnimations: (() => void) | undefined;

    const start = async () => {
      if (disposed) return;

      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;

      gsap.registerPlugin(ScrollTrigger);
      const animationContext = gsap.context(() => {
        const mm = gsap.matchMedia();

        mm.add(
          {
            reduceMotion: "(prefers-reduced-motion: reduce)",
            mobile: "(max-width: 767px)",
            desktop: "(min-width: 768px)",
          },
          (context) => {
          const elements = uniqueVisibleElements(gsap, container);
          const decorLeft = gsap.utils.toArray<HTMLElement>("[data-decor-left]", container);
          const decorRight = gsap.utils.toArray<HTMLElement>("[data-decor-right]", container);
          const decorItems = [...decorLeft, ...decorRight];

          if (context.conditions?.reduceMotion) {
            gsap.set([...elements, ...decorItems], {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              clearProps: "transform,opacity,visibility",
            });
            return;
          }

          const isMobile = Boolean(context.conditions?.mobile);
          const distance = isMobile ? 24 : 38;
          const duration = isMobile ? 0.52 : 0.72;

          if (decorItems.length) {
            if (decorLeft.length) {
              gsap.from(decorLeft, {
                autoAlpha: 0,
                x: isMobile ? -14 : -24,
                y: isMobile ? 8 : 0,
                scale: isMobile ? 0.96 : 0.92,
                duration: isMobile ? 0.55 : 0.75,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: decorLeft[0].closest("section") || decorLeft[0],
                  start: "top 88%",
                  once: true,
                },
              });
            }
            if (decorRight.length) {
              gsap.from(decorRight, {
                autoAlpha: 0,
                x: isMobile ? 14 : 24,
                y: isMobile ? 8 : 0,
                scale: isMobile ? 0.96 : 0.92,
                duration: isMobile ? 0.55 : 0.75,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: decorRight[0].closest("section") || decorRight[0],
                  start: "top 88%",
                  once: true,
                },
              });
            }
          }

          if (!elements.length) return;

          gsap.set(elements, {
            autoAlpha: 0,
            y: (index, target: HTMLElement) => {
              if (target.hasAttribute("data-reveal-left") || target.dataset.reveal === "left") return 0;
              if (target.hasAttribute("data-reveal-right") || target.dataset.reveal === "right") return 0;
              return distance;
            },
            x: (index, target: HTMLElement) => {
              if (target.hasAttribute("data-reveal-left") || target.dataset.reveal === "left") return isMobile ? -18 : -34;
              if (target.hasAttribute("data-reveal-right") || target.dataset.reveal === "right") return isMobile ? 18 : 34;
              return 0;
            },
            scale: isMobile ? 0.99 : 0.975,
          });

          ScrollTrigger.batch(elements, {
            interval: 0.08,
            batchMax: isMobile ? 3 : 5,
            start: "top 88%",
            end: "bottom 12%",
            onEnter: (batch) => {
              gsap.to(batch, {
                autoAlpha: 1,
                x: 0,
                y: 0,
                scale: 1,
                duration,
                stagger: 0.06,
                ease: "power3.out",
                overwrite: true,
              });
            },
            once: true,
          });

          if (!isMobile) {
            gsap.utils.toArray<HTMLElement>("[data-star-image], [data-parallax]", container).forEach((element) => {
              gsap.to(element, {
                yPercent: -11,
                scale: 1.06,
                ease: "none",
                scrollTrigger: {
                  trigger: element.closest("section") || element,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1,
                },
              });
            });
          }

          const refresh = () => ScrollTrigger.refresh();
          document.fonts?.ready.then(refresh).catch(() => undefined);
          },
        );

        cleanupAnimations = () => mm.revert();
      }, container);

      const previousCleanup = cleanupAnimations;
      cleanupAnimations = () => {
        previousCleanup?.();
        animationContext.revert();
      };
    };

    frame = window.requestAnimationFrame(() => {
      void start();
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      cleanupAnimations?.();
    };
  }, [pathname]);

  return <div ref={scope}>{children}</div>;
}
