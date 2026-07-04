"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const revealSelectors = [
  "[data-reveal]",
  "[data-reveal-card]",
];

function uniqueVisibleElements(scope: HTMLElement) {
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

  useGSAP(
    () => {
      if (!scope.current) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          mobile: "(max-width: 767px)",
          desktop: "(min-width: 768px)",
        },
        (context) => {
          const elements = uniqueVisibleElements(scope.current!);
          const heroItems = gsap.utils.toArray<HTMLElement>("[data-hero]", scope.current!);

          if (context.conditions?.reduceMotion) {
            gsap.set([...elements, ...heroItems], {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              filter: "none",
              clearProps: "transform,filter,opacity,visibility",
            });
            return;
          }

          const isMobile = Boolean(context.conditions?.mobile);
          const distance = isMobile ? 24 : 38;
          const duration = isMobile ? 0.52 : 0.72;

          if (heroItems.length) {
            gsap.from(heroItems, {
              autoAlpha: 0,
              y: isMobile ? 18 : 28,
              scale: 0.985,
              duration: 0.75,
              stagger: 0.09,
              ease: "power3.out",
            });
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
            filter: isMobile ? "blur(3px)" : "blur(6px)",
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
                filter: "blur(0px)",
                duration,
                stagger: 0.06,
                ease: "power3.out",
                overwrite: true,
              });
            },
            onEnterBack: (batch) => {
              gsap.to(batch, {
                autoAlpha: 1,
                x: 0,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                duration: duration * 0.85,
                stagger: 0.04,
                ease: "power2.out",
                overwrite: true,
              });
            },
            onLeave: (batch) => {
              gsap.to(batch, {
                autoAlpha: 0,
                y: -distance * 0.7,
                scale: 0.99,
                filter: isMobile ? "blur(2px)" : "blur(4px)",
                duration: 0.36,
                stagger: 0.025,
                ease: "power2.out",
                overwrite: true,
              });
            },
            onLeaveBack: (batch) => {
              gsap.to(batch, {
                autoAlpha: 0,
                y: distance * 0.7,
                scale: 0.99,
                filter: isMobile ? "blur(2px)" : "blur(4px)",
                duration: 0.34,
                stagger: 0.025,
                ease: "power2.out",
                overwrite: true,
              });
            },
          });

          gsap.utils.toArray<HTMLElement>("[data-star-image], [data-parallax]", scope.current!).forEach((element) => {
            gsap.to(element, {
              yPercent: isMobile ? -5 : -11,
              scale: isMobile ? 1.03 : 1.06,
              ease: "none",
              scrollTrigger: {
                trigger: element.closest("section") || element,
                start: "top bottom",
                end: "bottom top",
                scrub: isMobile ? 0.5 : 1,
              },
            });
          });

          const refresh = () => ScrollTrigger.refresh();
          const refreshTimeout = window.setTimeout(refresh, 250);
          window.addEventListener("load", refresh, { once: true });
          document.fonts?.ready.then(refresh).catch(() => undefined);

          return () => {
            window.clearTimeout(refreshTimeout);
            window.removeEventListener("load", refresh);
          };
        },
      );

      return () => mm.revert();
    },
    { scope, dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={scope}>{children}</div>;
}
