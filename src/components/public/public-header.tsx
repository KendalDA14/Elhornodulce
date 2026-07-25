"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, UserCircle } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartButton } from "@/components/public/cart-provider";
import { BrandLogo } from "@/components/public/brand-logo";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/personalizado", label: "Personalizado" },
  { href: "/#nosotros", label: "Sobre nosotros" },
  { href: "/#resenas", label: "Reseñas" },
  { href: "/#devoluciones", label: "Políticas" },
];

export function PublicHeader({
  customerName,
  isAdmin,
  logoSrc,
  promoOffset,
}: {
  customerName?: string | null;
  isAdmin?: boolean;
  logoSrc?: string | null;
  promoOffset?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      setHidden(current > lastY && current > 90);
      lastY = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return;

    let attempts = 0;
    let timeout = 0;
    const scrollToHash = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < 10) timeout = window.setTimeout(scrollToHash, 120);
    };

    timeout = window.setTimeout(scrollToHash, 120);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  const accountLink = isAdmin ? "/admin" : customerName ? "/cuenta" : "/login";
  const accountLabel = isAdmin ? "Panel" : customerName || "Cuenta";

  const handleMobileLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setMenuOpen(false);

    if (!href.startsWith("/#")) return;

    event.preventDefault();
    if (pathname !== "/") {
      window.location.assign(href);
      return;
    }

    const targetId = href.slice(2);
    window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      const top = target.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      window.history.replaceState(null, "", `#${targetId}`);
    }, 520);
  };

  return (
    <header
      className={`sticky ${promoOffset ? "top-8" : "top-0"} z-40 border-b bg-background/92 backdrop-blur transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-heading text-lg font-semibold tracking-tight">
          <BrandLogo logoSrc={logoSrc} />
          <span className="truncate">El horno dulce</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" className="gap-2 rounded-full">
            <Link href={accountLink}>
              {isAdmin ? <LayoutDashboard className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
              {accountLabel}
            </Link>
          </Button>
          <CartButton />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
          >
            <Link href={accountLink} aria-label={accountLabel} title={accountLabel}>
              {isAdmin ? <LayoutDashboard className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
            </Link>
          </Button>
          <CartButton compact />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menú">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex h-dvh flex-col overflow-hidden transition duration-300 ease-out">
              <SheetTitle className="sr-only">Menu principal</SheetTitle>
              <SheetDescription className="sr-only">
                Navegacion principal de El horno dulce.
              </SheetDescription>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-14">
                <div className="grid gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(event) => handleMobileLinkClick(event, link.href)}
                    className="rounded-lg px-3 py-3 text-lg font-medium transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={accountLink}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-lg font-medium transition-colors hover:bg-muted"
                >
                  {isAdmin ? <LayoutDashboard className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
                  {accountLabel}
                </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
