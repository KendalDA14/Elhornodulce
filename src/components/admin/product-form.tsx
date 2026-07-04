import type { Product, ProductImage, Category } from "@/generated/prisma/client";
import { createProductAction, updateProductAction } from "@/actions/admin";
import { toNumber } from "@/lib/format";
import { ActionStateForm } from "@/components/admin/action-state-form";
import { ProductImagePicker } from "@/components/admin/product-image-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProductWithImages = Product & { images: ProductImage[] };

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductWithImages;
}) {
  const isEditing = Boolean(product);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar producto" : "Crear producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ActionStateForm action={isEditing ? updateProductAction : createProductAction} className="grid gap-6">
          {product ? <input type="hidden" name="id" value={product.id} /> : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={product?.name || ""} required />
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select name="categoryId" defaultValue={product?.categoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea id="description" name="description" defaultValue={product?.description || ""} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="visibleIngredients">Ingredientes visibles</Label>
            <Textarea
              id="visibleIngredients"
              name="visibleIngredients"
              defaultValue={product?.visibleIngredients || ""}
              placeholder="Ingredientes que vera el cliente"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="estimatedDelivery">Tiempo estimado</Label>
              <Input
                id="estimatedDelivery"
                name="estimatedDelivery"
                defaultValue={product?.estimatedDelivery || "24 a 48 horas"}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priceFinal">Precio final</Label>
              <Input
                id="priceFinal"
                name="priceFinal"
                type="number"
                min="1"
                defaultValue={product ? toNumber(product.priceFinal) : ""}
                required
              />
            </div>
            <ProductImagePicker currentImages={product?.images || []} isEditing={isEditing} />
          </div>

          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="isActive" defaultChecked={product?.isActive ?? true} />
              Activo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="isAvailable" defaultChecked={product?.isAvailable ?? true} />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="isFeatured" defaultChecked={product?.isFeatured ?? false} />
              Producto estrella
            </label>
          </div>

          <div className="flex justify-end">
            <Button>{isEditing ? "Guardar cambios" : "Guardar producto"}</Button>
          </div>
        </ActionStateForm>
      </CardContent>
    </Card>
  );
}
