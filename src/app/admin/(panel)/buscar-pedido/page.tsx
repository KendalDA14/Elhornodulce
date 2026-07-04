import { Search } from "lucide-react";
import { createOrderAdjustmentAction } from "@/actions/admin";
import { currency, toNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

async function searchOrders(query: string) {
  if (!query.trim()) return [];

  try {
    return await getPrisma().order.findMany({
      where: {
        OR: [
          { id: query },
          { orderNumber: { contains: query } },
          { customerPhone: { contains: query } },
          { customerName: { contains: query } },
        ],
      },
      include: {
        items: true,
        sinpeProof: true,
        adjustments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  } catch {
    return [];
  }
}

export default async function OrderSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolved = await searchParams;
  const query = resolved?.q?.trim() || "";
  const orders = await searchOrders(query);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Buscar pedido</h2>
        <p className="text-sm text-muted-foreground">
          Busca por número, id interno, teléfono o nombre para resolver problemas de clientes.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={query} placeholder="Ej. 01, teléfono o nombre" className="pl-9" />
            </div>
            <Button>Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {query && !orders.length ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">No encontré pedidos con ese criterio.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Pedido #{order.orderNumber}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.customerName} · {order.customerPhone} · {order.createdAt.toLocaleString("es-CR")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{order.paymentMethod === "SINPE" ? "SINPE" : "Efectivo"}</Badge>
                  <Badge variant={order.paymentStatus === "PAID" ? "default" : order.paymentStatus === "REJECTED" ? "destructive" : "secondary"}>
                    {order.paymentStatus}
                  </Badge>
                  <Badge variant={order.orderStatus === "CANCELLED" ? "destructive" : "outline"}>
                    {order.orderStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold">Productos</h3>
                  <div className="mt-3 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 text-sm">
                        <span>{item.quantity}x {item.productName}</span>
                        <span>{currency(toNumber(item.lineTotal))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
                    <span>Total</span>
                    <span>{currency(toNumber(order.total))}</span>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold">Ajustes registrados</h3>
                  <div className="mt-3 space-y-2">
                    {order.adjustments.map((adjustment) => (
                      <div key={adjustment.id} className="rounded-md bg-muted/40 p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="font-medium">
                            {adjustment.type === "REFUND" ? "Devolución" : "Descuento"}
                          </span>
                          <span>{currency(toNumber(adjustment.amount))}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{adjustment.reason}</p>
                      </div>
                    ))}
                    {!order.adjustments.length ? (
                      <p className="text-sm text-muted-foreground">Sin devoluciones ni descuentos registrados.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <InlineActionForm
                action={createOrderAdjustmentAction}
                confirmMessage="¿Confirmas registrar esta devolución o descuento? Este registro quedará asociado al pedido."
                className="grid content-start gap-4 rounded-lg border p-4"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <h3 className="font-semibold">Registrar solución</h3>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select name="type" defaultValue="REFUND">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REFUND">Devolución de dinero</SelectItem>
                      <SelectItem value="DISCOUNT">Descuento compensatorio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`amount-${order.id}`}>Monto</Label>
                  <Input id={`amount-${order.id}`} name="amount" type="number" min="1" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`reason-${order.id}`}>Motivo</Label>
                  <Textarea id={`reason-${order.id}`} name="reason" minLength={8} required />
                </div>
                <Button>Guardar registro</Button>
              </InlineActionForm>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
