import { applyProductionBatchPriceAction } from "@/actions/admin";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { ProductionBatchForm } from "@/components/admin/production-batch-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { currency, toNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const prisma = getPrisma();
  const [products, ingredients] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        costBatches: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 4,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    priceFinal: toNumber(product.priceFinal),
  }));
  const ingredientOptions = ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
    lastPurchasePrice: toNumber(ingredient.lastPurchasePrice),
    lastPurchaseQuantity: toNumber(ingredient.lastPurchaseQuantity),
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Costos</p>
        <h1 className="mt-2 text-3xl font-semibold">Costos de producción</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Guarda cuánto gastaste en un lote y cuántas unidades salieron. El cálculo queda asociado al producto,
          pero el precio publicado no cambia hasta que tú lo apliques.
        </p>
      </div>

      <ProductionBatchForm products={productOptions} ingredients={ingredientOptions} />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Historial por producto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada cálculo queda guardado dentro del producto para comparar costos antes de cambiar precios.
          </p>
        </div>

        <div className="grid gap-5">
          {products.map((product) => {
            const latest = product.costBatches[0];
            return (
              <Card key={product.id}>
                <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{product.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{product.category.name}</p>
                  </div>
                  <div className="grid gap-2 text-sm md:text-right">
                    <span>Precio actual: <strong>{currency(toNumber(product.priceFinal))}</strong></span>
                    <span>
                      Último sugerido:{" "}
                      <strong>{latest ? currency(toNumber(latest.suggestedPrice)) : "Sin cálculo"}</strong>
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {product.costBatches.length ? (
                    <div className="space-y-3">
                      {product.costBatches.map((batch) => (
                        <div key={batch.id} className="rounded-lg border bg-background p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">{batch.name}</h3>
                                <Badge variant="secondary">
                                  {new Intl.DateTimeFormat("es-CR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }).format(batch.createdAt)}
                                </Badge>
                              </div>
                              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                                <span>Total lote: <strong className="text-foreground">{currency(toNumber(batch.totalCost))}</strong></span>
                                <span>Salieron: <strong className="text-foreground">{toNumber(batch.producedQuantity)}</strong></span>
                                <span>Costo unidad: <strong className="text-foreground">{currency(toNumber(batch.costPerUnit))}</strong></span>
                                <span>Sugerido: <strong className="text-foreground">{currency(toNumber(batch.suggestedPrice))}</strong></span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {batch.items.map((item) => (
                                  <Badge key={item.id} variant="outline">
                                    {item.name}: {currency(toNumber(item.totalCost))}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <InlineActionForm action={applyProductionBatchPriceAction} className="min-w-[260px] rounded-lg bg-muted/30 p-3">
                              <input type="hidden" name="batchId" value={batch.id} />
                              <div className="grid gap-2">
                                <label className="text-sm font-medium" htmlFor={`manual-${batch.id}`}>
                                  Precio manual opcional
                                </label>
                                <Input
                                  id={`manual-${batch.id}`}
                                  name="manualPrice"
                                  type="number"
                                  min="0"
                                  placeholder={`Usar sugerido ${currency(toNumber(batch.suggestedPrice))}`}
                                />
                                <Button size="sm">Aplicar precio</Button>
                              </div>
                            </InlineActionForm>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                      Este producto todavía no tiene costos guardados.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
