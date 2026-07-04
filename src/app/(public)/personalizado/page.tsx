import { CustomRequestForm } from "@/components/public/custom-request-form";

export default function CustomDessertPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_520px]">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Postre personalizado
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Cuéntame qué quieres celebrar</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Envia detalles, cantidad de porciones y una referencia visual si la tienes.
          La solicitud queda pendiente para revisarla y cotizarla.
        </p>
      </div>
      <CustomRequestForm />
    </section>
  );
}

