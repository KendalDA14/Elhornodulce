import { redirect } from "next/navigation";
import { getAdminSession, getCustomerSession } from "@/lib/auth";
import { RegisterCustomerForm } from "@/components/public/customer-account-forms";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const [admin, customer] = await Promise.all([getAdminSession(), getCustomerSession()]);
  if (admin) redirect("/admin");
  if (customer) redirect("/cuenta");

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px]">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Registro opcional</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Crea una cuenta simple para seguir tus pedidos.
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Solo pedimos nombre y contraseña. El checkout como invitado sigue funcionando para quienes no
          quieran registrarse.
        </p>
      </div>
      <RegisterCustomerForm />
    </section>
  );
}
