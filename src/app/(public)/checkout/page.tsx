import { sinpeSettings } from "@/lib/settings";
import { getCustomerSession } from "@/lib/auth";
import { CheckoutClient } from "@/components/public/checkout-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;
  const initialPayment = params.payment === "CASH" ? "CASH" : "SINPE";
  const customer = await getCustomerSession();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Checkout</p>
        <h1 className="mt-2 text-4xl font-semibold">Confirmar pedido</h1>
        <p className="mt-4 text-muted-foreground">
          El total se recalcula en servidor usando precio y disponibilidad actuales.
        </p>
      </div>
      <CheckoutClient sinpe={sinpeSettings()} initialPayment={initialPayment} isLoggedIn={Boolean(customer)} />
    </section>
  );
}
