import Image from "next/image";
import { CartProvider } from "@/components/public/cart-provider";
import { PromotionTicker } from "@/components/public/promotion-ticker";
import { PublicHeaderShell } from "@/components/public/public-header-shell";
import { SmoothProvider } from "@/components/public/smooth-provider";
import { WhatsappFloatingButton } from "@/components/public/whatsapp-floating-button";
import { getPromotionTickerItems } from "@/lib/promotions";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const promotions = await getPromotionTickerItems();
  const hasPromotions = promotions.length > 0;

  return (
    <CartProvider>
      <SmoothProvider>
        <PromotionTicker items={promotions} />
        <div className={hasPromotions ? "pt-8" : undefined}>
          <PublicHeaderShell promoOffset={hasPromotions} />
          <main>{children}</main>
          <WhatsappFloatingButton />
          <footer className="border-t py-8">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 text-sm text-muted-foreground sm:px-6">
              <Image
                src="/brand/logo.jpeg"
                alt="El horno dulce"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex flex-col gap-1">
                <strong className="text-foreground">El horno dulce</strong>
                <span>Postres caseros hechos con mucho amor. Gracias por preferirnos.</span>
                <span>Emprendimiento de Liberia. Envío gratis dentro de Liberia centro.</span>
              </div>
            </div>
          </footer>
        </div>
      </SmoothProvider>
    </CartProvider>
  );
}
