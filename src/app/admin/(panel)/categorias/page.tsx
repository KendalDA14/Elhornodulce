import {
  createCategoryAction,
  deleteCategoryAction,
  toggleCategoryAction,
  updateCategoryAction,
} from "@/actions/admin";
import { getPrisma } from "@/lib/prisma";
import { ActionStateForm } from "@/components/admin/action-state-form";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

async function getCategories() {
  try {
    return await getPrisma().category.findMany({
      include: { _count: { select: { products: true, promotions: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Categorías</h2>
        <p className="text-sm text-muted-foreground">
          Organiza el catálogo. Si una categoría ya tiene productos, puedes desactivarla sin borrar ventas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionStateForm action={createCategoryAction} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" />
            </div>
            <Button>Guardar</Button>
          </ActionStateForm>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {categories.map((category) => {
          const canDelete = category._count.products === 0 && category._count.promotions === 0;
          return (
            <Card key={category.id}>
              <CardContent className="grid gap-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{category.slug}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {category._count.products} productos - {category._count.promotions} promociones
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <InlineActionForm action={toggleCategoryAction} className="flex">
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="isActive" value={category.isActive ? "false" : "true"} />
                      <Button size="sm" variant="outline">
                        {category.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </InlineActionForm>
                    <InlineActionForm
                      action={deleteCategoryAction}
                      confirmMessage="¿Confirmas eliminar esta categoría?"
                      className="flex"
                    >
                      <input type="hidden" name="id" value={category.id} />
                      <Button size="sm" variant="destructive" disabled={!canDelete}>
                        Eliminar
                      </Button>
                    </InlineActionForm>
                  </div>
                </div>

                <ActionStateForm action={updateCategoryAction} className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="isActive" value={category.isActive ? "true" : "false"} />
                  <div className="grid gap-2">
                    <Label htmlFor={`name-${category.id}`}>Nombre</Label>
                    <Input id={`name-${category.id}`} name="name" defaultValue={category.name} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`description-${category.id}`}>Descripción</Label>
                    <Input id={`description-${category.id}`} name="description" defaultValue={category.description || ""} />
                  </div>
                  <Button variant="secondary">Guardar cambios</Button>
                </ActionStateForm>
              </CardContent>
            </Card>
          );
        })}
        {!categories.length ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">Aún no hay categorías.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
