import { redirect } from "next/navigation";
import { getAdminSession, getCustomerSession } from "@/lib/auth";
import { LoginCustomerForm } from "@/components/public/customer-account-forms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [admin, customer] = await Promise.all([getAdminSession(), getCustomerSession()]);
  if (admin) redirect("/admin");
  if (customer) redirect("/cuenta");

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px]">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Mi cuenta</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Entra para ver tus pedidos.
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Guarda tu historial, revisa el estado de tus compras y califica tus postres cuando tengas una clave de pedido.
        </p>
      </div>
      <LoginCustomerForm />
    </section>
  );
}
