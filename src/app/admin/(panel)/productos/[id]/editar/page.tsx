import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    getPrisma().category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    getPrisma().product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Editar producto</h2>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/productos">Volver a productos</Link>
        </Button>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
