import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CakeSlice, HeartHandshake, Star } from "lucide-react";
import { getApprovedReviews, getFeaturedProducts, getSiteSettings, getStarProduct } from "@/lib/data";
import { currency } from "@/lib/format";
import { FeaturedProductFilter } from "@/components/public/featured-product-filter";
import { RefundPolicyAccordion } from "@/components/public/refund-policy-accordion";
import { ReviewForm } from "@/components/public/review-form";
import { StarProductSection } from "@/components/public/star-product-section";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [products, reviews, starProduct, settings] = await Promise.all([
    getFeaturedProducts(),
    getApprovedReviews(),
    getStarProduct(),
    getSiteSettings(),
  ]);
  const heroProduct = products[0];
  const heroImageUrl = settings.heroImageUrl || heroProduct?.imageUrl;
  const lowestPrice = products.length
    ? Math.min(...products.map((product) => product.priceFinal))
    : null;

  return (
    <>
      <section
        data-hero-section
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-b"
      >
        {heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-hero-image
            src={heroImageUrl}
            alt={settings.heroTitle}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-[115%] w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,255,255,0.78),rgba(255,255,255,0.34))]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-16 sm:px-6">
          <div className="max-w-2xl space-y-6">
            <p data-hero className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
              {settings.heroEyebrow}
            </p>
            <h1 data-hero className="text-5xl font-semibold tracking-tight sm:text-7xl">
              {settings.heroTitle}
            </h1>
            <p data-hero className="max-w-xl text-lg leading-8 text-muted-foreground">
              {settings.heroDescription}
            </p>
            <p data-hero className="max-w-xl rounded-lg border bg-white/85 p-3 text-sm font-medium text-rose-900">
              {settings.heroNotice}
            </p>
            <p data-hero className="inline-flex w-fit max-w-full rounded-full border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs font-semibold text-rose-950 shadow-sm sm:rounded-lg sm:p-3 sm:text-sm">
              <span className="sm:hidden">Liberia centro: envío gratis</span>
              <span className="hidden sm:inline">
                Somos un emprendimiento de Liberia. Envío gratis dentro de Liberia centro.
              </span>
            </p>
            <div data-hero className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/catalogo">
                  Ver catálogo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/personalizado">Pedir personalizado</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
        {[
          { icon: CakeSlice, title: "Catálogo activo", text: "Productos con disponibilidad clara." },
          { icon: HeartHandshake, title: "Pagos simples", text: "SINPE o efectivo, sin tarjetas." },
          { icon: Star, title: "Reseñas", text: "Opiniones publicadas de nuestros clientes." },
        ].map((item) => (
          <div data-reveal key={item.title} className="rounded-lg border bg-card p-5">
            <item.icon className="h-5 w-5 text-rose-700" />
            <h2 className="mt-4 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden border-y border-rose-100 bg-rose-50/60">
        <div className="relative mx-auto flex min-h-40 max-w-7xl items-center justify-center px-4 py-7 sm:px-6 md:min-h-52 md:py-9">
          <div
            data-decor-left
            className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 opacity-35 sm:left-10 sm:opacity-60 md:static md:translate-y-0 md:opacity-85"
            aria-hidden="true"
          >
            <Image
              src="/decor/suspiro-corazones.png"
              alt=""
              width={190}
              height={120}
              className="h-auto w-24 sm:w-32 lg:w-44"
            />
          </div>
          <div data-reveal className="relative z-10 mx-auto max-w-3xl px-10 text-center sm:px-16 md:px-10">
            <p className="text-lg font-medium leading-relaxed text-foreground sm:text-2xl">
              Hecho con amor,
              <br />
              <span className="inline-block">ingredientes de calidad y el toque casero</span>
              <br />
              <span className="font-semibold text-rose-500">que te encanta.</span>
            </p>
          </div>
          <div
            data-decor-right
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 opacity-35 sm:right-10 sm:opacity-60 md:static md:translate-y-0 md:opacity-85"
            aria-hidden="true"
          >
            <Image
              src="/decor/manga-pastelera.png"
              alt=""
              width={190}
              height={120}
              className="h-auto w-24 sm:w-32 lg:w-44"
            />
          </div>
        </div>
      </section>

      <StarProductSection product={starProduct} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div data-reveal className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Recomendados
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Postres destacados</h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {lowestPrice ? `Desde ${currency(lowestPrice)}` : "Pronto tendremos productos disponibles."}
          </p>
        </div>
        <div data-reveal>
          <FeaturedProductFilter products={products} />
        </div>
      </section>

      <section id="resenas" className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px]">
          <div data-reveal>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Reseñas</p>
            <h2 className="mt-2 text-3xl font-semibold">Lo que dicen los clientes</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {reviews.length ? (
                reviews.map((review) => (
                  <blockquote key={review.id} className="rounded-lg border bg-card p-5">
                    <div className="text-sm text-amber-600">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                    <footer className="mt-4 font-medium">{review.customerName}</footer>
                  </blockquote>
                ))
              ) : (
                <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground sm:col-span-2">
                  Aún no hay reseñas publicadas.
                </div>
              )}
            </div>
          </div>
          <div data-reveal>
            <ReviewForm />
          </div>
        </div>
      </section>

      <section id="devoluciones" className="scroll-mt-28 mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div data-reveal className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Políticas</p>
            <h2 className="mt-2 text-3xl font-semibold">Devoluciones y soluciones</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Si algo no sale como esperabas, revisamos el caso con el número de pedido y el comprobante disponible.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-5">
            <RefundPolicyAccordion refundPolicy={settings.refundPolicy} />
          </div>
        </div>
      </section>
    </>
  );
}
