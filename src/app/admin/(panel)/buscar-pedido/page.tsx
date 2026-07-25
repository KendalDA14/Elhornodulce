import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { createOrderAdjustmentAction } from "@/actions/admin";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { currency, toNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function searchOrders(query: string) {
  const term = query.trim().slice(0, 100);
  if (!term) return [];

  try {
    return await getPrisma().order.findMany({
      where: {
        OR: [
          { id: term },
          { orderNumber: { contains: term } },
          { customerPhone: { contains: term } },
          { customerName: { contains: term } },
        ],
      },
      include: {
        items: true,
        sinpeProof: true,
        adjustments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch {
    return [];
  }
}

function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    PROOF_RECEIVED: "Comprobante recibido",
    PAID: "Pagado",
    REJECTED: "Rechazado",
  };
  return labels[status] || status;
}

function orderLabel(status: string) {
  const labels: Record<string, string> = {
    NEW: "Nuevo",
    CONFIRMED: "Confirmado",
    PREPARING: "Preparando",
    READY: "Listo",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };
  return labels[status] || status;
}

export default async function OrderSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; pedido?: string }>;
}) {
  const resolved = await searchParams;
  const query = resolved?.q?.trim() || "";
  const orders = await searchOrders(query);
  const selectedOrder =
    orders.find((order) => order.id === resolved?.pedido) ||
    orders[0] ||
    null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Buscar pedido</h2>
        <p className="text-sm text-muted-foreground">
          Encuentra un pedido por número, teléfono o nombre del cliente.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Número, teléfono o nombre del cliente"
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <Button>Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {query && !orders.length ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">No se encontraron pedidos con ese criterio.</p>
          </CardContent>
        </Card>
      ) : null}

      {orders.length ? (
        <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="overflow-hidden lg:sticky lg:top-5">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">
                {orders.length} resultado{orders.length === 1 ? "" : "s"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Selecciona el pedido que quieres revisar.
              </p>
            </CardHeader>
            <div className="max-h-[360px] overflow-y-auto lg:max-h-[650px]">
              {orders.map((order) => {
                const selected = order.id === selectedOrder?.id;
                const href = `/admin/buscar-pedido?q=${encodeURIComponent(query)}&pedido=${encodeURIComponent(order.id)}#pedido-detalle`;

                return (
                  <Link
                    key={order.id}
                    href={href}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/60",
                      selected && "bg-primary/8",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">Pedido #{order.orderNumber}</p>
                        <span className="shrink-0 text-sm font-medium">{currency(toNumber(order.total))}</span>
                      </div>
                      <p className="truncate text-sm">{order.customerName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {order.customerPhone} · {order.createdAt.toLocaleDateString("es-CR")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </Card>

          {selectedOrder ? (
            <Card id="pedido-detalle" className="scroll-mt-4">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>Pedido #{selectedOrder.orderNumber}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedOrder.customerName} · {selectedOrder.customerPhone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.createdAt.toLocaleString("es-CR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{selectedOrder.paymentMethod === "SINPE" ? "SINPE" : "Efectivo"}</Badge>
                    <Badge
                      variant={
                        selectedOrder.paymentStatus === "PAID"
                          ? "default"
                          : selectedOrder.paymentStatus === "REJECTED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {paymentLabel(selectedOrder.paymentStatus)}
                    </Badge>
                    <Badge variant={selectedOrder.orderStatus === "CANCELLED" ? "destructive" : "outline"}>
                      {orderLabel(selectedOrder.orderStatus)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  <section className="rounded-lg border p-4">
                    <h3 className="text-sm font-semibold">Productos</h3>
                    <div className="mt-3 space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between gap-4 text-sm">
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="shrink-0">{currency(toNumber(item.lineTotal))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
                      <span>Total actual</span>
                      <span>{currency(toNumber(selectedOrder.total))}</span>
                    </div>
                  </section>

                  <section className="rounded-lg border p-4">
                    <h3 className="text-sm font-semibold">Soluciones registradas</h3>
                    <div className="mt-3 space-y-2">
                      {selectedOrder.adjustments.map((adjustment) => (
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
                      {!selectedOrder.adjustments.length ? (
                        <p className="text-sm text-muted-foreground">
                          Este pedido no tiene devoluciones ni descuentos.
                        </p>
                      ) : null}
                    </div>
                  </section>
                </div>

                <InlineActionForm
                  action={createOrderAdjustmentAction}
                  resetOnSuccess
                  confirmMessage="¿Confirmas registrar esta devolución o descuento? Quedará asociado al pedido."
                  className="grid content-start gap-4 rounded-lg border bg-muted/15 p-4"
                >
                  <input type="hidden" name="orderId" value={selectedOrder.id} />
                  <div>
                    <h3 className="font-semibold">Registrar una solución</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      El monto y el motivo se limpiarán después de guardar.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select name="type" defaultValue="REFUND">
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REFUND">Devolución de dinero</SelectItem>
                        <SelectItem value="DISCOUNT">Descuento compensatorio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`amount-${selectedOrder.id}`}>Monto</Label>
                    <Input id={`amount-${selectedOrder.id}`} name="amount" type="number" min="1" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`reason-${selectedOrder.id}`}>Motivo</Label>
                    <Textarea id={`reason-${selectedOrder.id}`} name="reason" minLength={8} required />
                  </div>
                  <Button>Guardar solución</Button>
                </InlineActionForm>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
