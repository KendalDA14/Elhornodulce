"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { createProductionBatchAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimedMessage } from "@/components/ui/timed-message";

type ProductOption = {
  id: string;
  name: string;
  priceFinal: number;
};

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  lastPurchasePrice: number;
  lastPurchaseQuantity: number;
};

type CostLine = {
  key: string;
  ingredientId: string;
  itemName: string;
  itemQuantity: string;
  itemUnit: string;
  itemCost: string;
};

const initialState = { ok: false, message: "" };

function newLine(): CostLine {
  return {
    key: crypto.randomUUID(),
    ingredientId: "none",
    itemName: "",
    itemQuantity: "",
    itemUnit: "",
    itemCost: "",
  };
}

export function ProductionBatchForm({
  products,
  ingredients,
}: {
  products: ProductOption[];
  ingredients: IngredientOption[];
}) {
  const [state, action, pending] = useActionState(createProductionBatchAction, initialState);
  const [lines, setLines] = useState<CostLine[]>([newLine(), newLine(), newLine()]);
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.itemCost) > 0 ? Number(line.itemCost) : 0), 0),
    [lines],
  );

  function updateLine(key: string, patch: Partial<CostLine>) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        const ingredient = ingredients.find((item) => item.id === patch.ingredientId);

        if (ingredient) {
          next.itemName = ingredient.name;
          next.itemQuantity = String(ingredient.lastPurchaseQuantity);
          next.itemUnit = ingredient.unit;
          next.itemCost = String(ingredient.lastPurchasePrice);
        }

        return next;
      }),
    );
  }

  return (
    <form action={action} className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-xl font-semibold">Nuevo costo de producción</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Registra lo que gastaste en un lote y cuántas unidades salieron. El precio sugerido queda guardado, pero no cambia el precio publicado.
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-4 text-sm">
          <p className="text-muted-foreground">Costo total escrito</p>
          <p className="mt-1 text-2xl font-semibold">₡{total.toLocaleString("es-CR")}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="productId">Producto</Label>
          <select
            id="productId"
            name="productId"
            required
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Elige un producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - precio actual ₡{product.priceFinal.toLocaleString("es-CR")}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Nombre del lote</Label>
          <Input id="name" name="name" placeholder="Ej. Queques pequeños viernes" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="producedQuantity">Cantidad que salió</Label>
          <Input id="producedQuantity" name="producedQuantity" type="number" min="1" step="1" placeholder="Ej. 7" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="desiredMarginPercent">Margen deseado opcional</Label>
          <Input id="desiredMarginPercent" name="desiredMarginPercent" type="number" min="0" max="95" placeholder="Ej. 50" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="desiredProfitAmount">Ganancia fija opcional por unidad</Label>
          <Input id="desiredProfitAmount" name="desiredProfitAmount" type="number" min="0" placeholder="Ej. 1000" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notas</Label>
          <Input id="notes" name="notes" placeholder="Opcional" />
        </div>
      </div>

      <div className="mt-6 rounded-lg border">
        <div className="grid gap-2 border-b bg-muted/30 p-4 sm:grid-cols-[1.1fr_1fr_0.7fr_0.7fr_0.8fr_44px]">
          <p className="text-sm font-medium">Ingrediente</p>
          <p className="hidden text-sm font-medium sm:block">Nombre</p>
          <p className="hidden text-sm font-medium sm:block">Cantidad</p>
          <p className="hidden text-sm font-medium sm:block">Unidad</p>
          <p className="hidden text-sm font-medium sm:block">Costo</p>
        </div>
        <div className="divide-y">
          {lines.map((line, index) => (
            <div key={line.key} className="grid gap-3 p-4 sm:grid-cols-[1.1fr_1fr_0.7fr_0.7fr_0.8fr_44px]">
              <select
                name="ingredientId"
                value={line.ingredientId}
                onChange={(event) => updateLine(line.key, { ingredientId: event.target.value })}
                className="h-10 rounded-md border bg-background px-3 text-sm"
                aria-label={`Ingrediente ${index + 1}`}
              >
                <option value="none">Costo escrito manualmente</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} - ₡{ingredient.lastPurchasePrice.toLocaleString("es-CR")} / {ingredient.lastPurchaseQuantity} {ingredient.unit}
                  </option>
                ))}
              </select>
              <Input
                name="itemName"
                value={line.itemName}
                onChange={(event) => updateLine(line.key, { itemName: event.target.value })}
                placeholder="Azúcar, harina, huevos..."
              />
              <Input
                name="itemQuantity"
                value={line.itemQuantity}
                onChange={(event) => updateLine(line.key, { itemQuantity: event.target.value })}
                type="number"
                min="0"
                step="0.001"
                placeholder="1"
              />
              <Input
                name="itemUnit"
                value={line.itemUnit}
                onChange={(event) => updateLine(line.key, { itemUnit: event.target.value })}
                placeholder="kg, und, lata"
              />
              <Input
                name="itemCost"
                value={line.itemCost}
                onChange={(event) => updateLine(line.key, { itemCost: event.target.value })}
                type="number"
                min="0"
                step="1"
                placeholder="₡"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Quitar línea"
                disabled={lines.length <= 1}
                onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={() => setLines((current) => [...current, newLine()])}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar otro costo
        </Button>
        <Button disabled={pending}>{pending ? "Guardando..." : "Guardar cálculo"}</Button>
      </div>
      <TimedMessage message={state.message} ok={state.ok} messageKey={state} className="mt-3" />
    </form>
  );
}
