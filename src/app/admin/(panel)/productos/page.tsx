import Link from "next/link";
import { Edit, Plus, Power, Store, Trash2 } from "lucide-react";
import { deleteProductAction, toggleProductAction } from "@/actions/admin";
import { getAdminLists } from "@/lib/data";
import { currency, toNumber } from "@/lib/format";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { products } = await getAdminLists();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Productos</h2>
          <p className="text-sm text-muted-foreground">
            Administra catalogo, precios, disponibilidad e imagenes.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Crear producto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden shadow-sm">
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[96px_1fr_auto] lg:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-lg bg-muted">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Store className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant={product.isAvailable ? "default" : "secondary"}>
                    {product.isAvailable ? "Disponible" : "Agotado"}
                  </Badge>
                  {product.isFeatured ? <Badge variant="outline">Estrella</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{product.category.name}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="font-medium">{currency(toNumber(product.priceFinal))}</span>
                  <span className="text-muted-foreground">Entrega: {product.estimatedDelivery}</span>
                  <span className="text-muted-foreground">Imagenes: {product.images.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/productos/${product.id}/editar`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <InlineActionForm action={toggleProductAction} className="flex flex-wrap justify-end gap-2">
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="field" value="isAvailable" />
                  <Button size="sm" variant="secondary">
                    <Power className="mr-2 h-4 w-4" />
                    {product.isAvailable ? "Marcar agotado" : "Marcar disponible"}
                  </Button>
                </InlineActionForm>
                <InlineActionForm action={deleteProductAction} className="flex flex-wrap justify-end gap-2">
                  <input type="hidden" name="id" value={product.id} />
                  <Button size="sm" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </InlineActionForm>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!products.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/productos/nuevo">Crear el primer producto</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
