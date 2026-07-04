import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutCustomerAction } from "@/actions/customer";
import { getCustomerSession } from "@/lib/auth";
import { currency, toNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { ProductRatingForm } from "@/components/public/customer-account-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCustomerSession();

  if (!customer) {
    redirect("/login");
  }

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const orders = await getPrisma().order.findMany({
    where: { OR: [{ customerId: customer.id }, { customerName: customer.name }] },
    include: {
      items: true,
      adjustments: { orderBy: { createdAt: "desc" } },
      customRequest: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const monthProducts = orders
    .filter((order) => order.createdAt >= startOfMonth)
    .reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Hola, {customer.name}</h1>
          <p className="mt-2 text-muted-foreground">Productos comprados este mes: {monthProducts}</p>
        </div>
        <form action={logoutCustomerAction}>
          <Button variant="outline">Cerrar sesión</Button>
        </form>
      </div>
      <div className="mb-6">
        <Button asChild variant="secondary">
          <Link href="/catalogo">Seguir comprando</Link>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Historial de pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders.length ? (
              orders.map((order) => (
                <div key={order.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong>Pedido #{order.orderNumber}</strong>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{order.orderStatus}</Badge>
                        <Badge variant={order.paymentStatus === "PAID" ? "default" : "secondary"}>
                          Pago: {order.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-lg font-semibold">{currency(toNumber(order.total))}</span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {order.items.map((item) => (
                      <p key={item.id}>
                        {item.quantity}x {item.productName}
                        {item.reviewCode ? ` - Clave: ${item.reviewCode}` : ""}
                      </p>
                    ))}
                  </div>

                  {order.customRequest ? (
                    <p className="mt-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                      Pedido personalizado: {order.customRequest.status}
                      {order.customRequest.adminNotes ? ` - ${order.customRequest.adminNotes}` : ""}
                    </p>
                  ) : null}

                  {order.adjustments.length ? (
                    <div className="mt-3 space-y-2 rounded-md border p-3 text-sm">
                      <p className="font-medium">Soluciones registradas</p>
                      {order.adjustments.map((adjustment) => (
                        <div key={adjustment.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                          <div className="flex justify-between gap-3">
                            <span>{adjustment.type === "REFUND" ? "Devolucion" : "Descuento compensatorio"}</span>
                            <span>{currency(toNumber(adjustment.amount))}</span>
                          </div>
                          <p className="mt-1 text-muted-foreground">{adjustment.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aun no hay pedidos asociados a esta cuenta.</p>
            )}
          </CardContent>
        </Card>
        <ProductRatingForm />
      </div>
    </section>
  );
}
