import { Trash2 } from "lucide-react";
import { createIngredientAction, deleteIngredientAction, updateIngredientAction } from "@/actions/admin";
import { ActionStateForm } from "@/components/admin/action-state-form";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currency, toNumber } from "@/lib/format";
import { getAdminLists } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const { ingredients } = await getAdminLists();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Compras</p>
        <h1 className="mt-2 text-3xl font-semibold">Ingredientes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Guarda ingredientes que compras con frecuencia. En Costos puedes elegirlos para rellenar precio, cantidad y unidad, pero siempre podrás cambiar esos datos.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Panel de ingredientes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea ingredientes y mantén actualizado el último precio de compra sin salir de esta pantalla.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/20 p-4">
            <h2 className="text-base font-semibold">Nuevo ingrediente</h2>
            <ActionStateForm action={createIngredientAction} className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.8fr_0.7fr_1fr_auto]">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" placeholder="Azúcar, harina..." required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" name="unit" placeholder="kg, unidad" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="purchasePrice">Precio</Label>
                <Input id="purchasePrice" name="purchasePrice" type="number" min="1" placeholder="₡" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input id="quantity" name="quantity" type="number" min="0.001" step="0.001" placeholder="1" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" placeholder="Opcional" />
              </div>
              <Button className="md:self-end">Guardar</Button>
            </ActionStateForm>
          </div>

          <div className="rounded-lg border">
            <div className="flex flex-col gap-1 border-b bg-muted/30 p-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-semibold">Ingredientes guardados</h2>
                <p className="text-sm text-muted-foreground">
                  {ingredients.length} ingrediente{ingredients.length === 1 ? "" : "s"} registrado{ingredients.length === 1 ? "" : "s"}.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Edita una fila y presiona Actualizar.</p>
            </div>

            <div className="hidden grid-cols-[1.3fr_0.7fr_0.85fr_0.75fr_0.9fr_124px_44px] gap-3 border-b bg-background px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground xl:grid">
              <span>Nombre</span>
              <span>Unidad</span>
              <span>Último precio</span>
              <span>Cantidad</span>
              <span>Costo unitario</span>
              <span>Acción</span>
              <span />
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {ingredients.length ? (
                <div className="divide-y">
                  {ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="grid gap-3 p-4 xl:grid-cols-[1.3fr_0.7fr_0.85fr_0.75fr_0.9fr_124px_44px] xl:items-start">
                      <ActionStateForm action={updateIngredientAction} className="contents">
                        <input type="hidden" name="id" value={ingredient.id} />
                        <div className="grid gap-1.5">
                          <Label htmlFor={`name-${ingredient.id}`} className="xl:hidden">Nombre</Label>
                          <Input id={`name-${ingredient.id}`} name="name" defaultValue={ingredient.name} required />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`unit-${ingredient.id}`} className="xl:hidden">Unidad</Label>
                          <Input id={`unit-${ingredient.id}`} name="unit" defaultValue={ingredient.unit} required />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`price-${ingredient.id}`} className="xl:hidden">Último precio</Label>
                          <Input
                            id={`price-${ingredient.id}`}
                            name="purchasePrice"
                            type="number"
                            min="1"
                            defaultValue={toNumber(ingredient.lastPurchasePrice)}
                            required
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`quantity-${ingredient.id}`} className="xl:hidden">Cantidad</Label>
                          <Input
                            id={`quantity-${ingredient.id}`}
                            name="quantity"
                            type="number"
                            min="0.001"
                            step="0.001"
                            defaultValue={toNumber(ingredient.lastPurchaseQuantity)}
                            required
                          />
                        </div>
                        <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                          <span className="text-muted-foreground xl:hidden">Costo unitario: </span>
                          <strong>{currency(toNumber(ingredient.costPerUnit))}</strong>
                          <span className="text-muted-foreground"> / {ingredient.unit}</span>
                        </div>
                        <Button size="sm" className="w-full">Actualizar</Button>
                      </ActionStateForm>

                      <InlineActionForm
                        action={deleteIngredientAction}
                        confirmMessage={`¿Eliminar ${ingredient.name}?`}
                        className="xl:pt-0"
                      >
                        <input type="hidden" name="id" value={ingredient.id} />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Eliminar ${ingredient.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </InlineActionForm>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm text-muted-foreground">
                  Todavía no hay ingredientes guardados.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
