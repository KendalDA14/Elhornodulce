import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getPrisma().category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Crear producto</h2>
          <p className="text-sm text-muted-foreground">Completa la información pública del postre.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/productos">Volver a productos</Link>
        </Button>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
