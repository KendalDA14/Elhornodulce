import { createPromotionAction, deletePromotionAction } from "@/actions/admin";
import { getAdminLists } from "@/lib/data";
import { getPrisma } from "@/lib/prisma";
import { ActionStateForm } from "@/components/admin/action-state-form";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function getPromotions() {
  try {
    return await getPrisma().promotion.findMany({
      include: { product: true, category: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function PromotionsPage() {
  const [{ products, categories }, promotions] = await Promise.all([getAdminLists(), getPromotions()]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear promoción</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionStateForm action={createPromotionAction} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Código opcional</Label>
              <Input id="code" name="code" placeholder="Se genera si lo dejas vacío" className="uppercase" />
            </div>
            <label className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3 text-sm md:col-span-2">
              <input type="checkbox" name="useCode" value="true" className="h-4 w-4 accent-primary" />
              Crear como promoción con código. No se mostrará en la barra pública.
            </label>
            <div className="grid gap-2">
              <Label htmlFor="value">Descuento (%)</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min="1"
                max="100"
                step="1"
                placeholder="Ej. 50"
                required
              />
              <p className="text-xs text-muted-foreground">Elige un porcentaje entre 1 y 100.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startsAt">Inicio</Label>
              <Input id="startsAt" name="startsAt" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endsAt">Fin</Label>
              <Input id="endsAt" name="endsAt" type="date" required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Alcance</Label>
              <Select name="scope" defaultValue="ALL">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los productos</SelectItem>
                  <SelectItem value="CATEGORY">Una categoría</SelectItem>
                  <SelectItem value="PRODUCT">Un producto especifico</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si eliges todos, aplica a todo el carrito. Si eliges categoría o producto, aplica solo a esos productos.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Producto</Label>
              <Select name="productId" defaultValue="none">
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select name="categoryId" defaultValue="none">
                <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground md:col-span-2">
              Para alcance por producto, elige un producto. Para alcance por categoría, elige una categoría. Para todos los productos, deja ambos en ninguno.
            </p>
            <Button className="md:col-span-2">Guardar promoción</Button>
          </ActionStateForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Promociones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Visibilidad</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Alcance</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell>{promotion.name}</TableCell>
                  <TableCell>{promotion.code || "-"}</TableCell>
                  <TableCell>{promotion.code ? "Oculta con código" : "Visible en web"}</TableCell>
                  <TableCell>{String(promotion.value)}%</TableCell>
                  <TableCell>{promotion.product?.name || promotion.category?.name || "Todos los productos"}</TableCell>
                  <TableCell>
                    {promotion.startsAt.toLocaleDateString("es-CR")} - {promotion.endsAt.toLocaleDateString("es-CR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <InlineActionForm action={deletePromotionAction} className="inline-flex flex-wrap justify-end gap-2">
                      <input type="hidden" name="id" value={promotion.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        Eliminar
                      </Button>
                    </InlineActionForm>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
