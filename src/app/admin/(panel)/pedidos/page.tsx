import Link from "next/link";
import {
  approvePaymentAction,
  markCashPaidAction,
  rejectPaymentAction,
  setOrderStatusAction,
  updateCustomRequestAction,
} from "@/actions/admin";
import { currency, toNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

async function getOrders() {
  try {
    return await getPrisma().order.findMany({
      include: {
        items: true,
        sinpeProof: true,
        adjustments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ createdAt: "desc" }, { orderNumber: "desc" }],
      take: 80,
    });
  } catch {
    return [];
  }
}

async function getCustomRequests() {
  try {
    return await getPrisma().customDessertRequest.findMany({
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch {
    return [];
  }
}

function customStatusLabel(status: string) {
  const labels: Record<string, string> = {
    NEW: "Nueva",
    REVIEWED: "Revisada",
    QUOTED: "Cotizada",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
  };
  return labels[status] || status;
}

type Orders = Awaited<ReturnType<typeof getOrders>>;
type Order = Orders[number];
type CustomRequests = Awaited<ReturnType<typeof getCustomRequests>>;
type CustomRequest = CustomRequests[number];
type MethodFilter = "todos" | "sinpe" | "efectivo";

const workflow = [
  { value: "NEW", label: "Nuevo" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "PREPARING", label: "Preparando" },
  { value: "READY", label: "Listo" },
  { value: "DELIVERED", label: "Entregado" },
] as const;

const nextStep: Record<string, { status: string; label: string } | null> = {
  NEW: { status: "CONFIRMED", label: "Confirmar pedido" },
  CONFIRMED: { status: "PREPARING", label: "Marcar preparando" },
  PREPARING: { status: "READY", label: "Marcar listo" },
  READY: { status: "DELIVERED", label: "Marcar entregado" },
  DELIVERED: null,
  CANCELLED: null,
};

function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    EN_VALIDACION: "En validación",
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

function tabLabel(label: string, count: number) {
  return `${label} (${count})`;
}

function applyMethodFilter(orders: Orders, method: MethodFilter) {
  if (method === "sinpe") return orders.filter((order) => order.paymentMethod === "SINPE");
  if (method === "efectivo") return orders.filter((order) => order.paymentMethod === "CASH");
  return orders;
}

function groupOrders(orders: Orders) {
  return {
    pendientes: orders.filter(
      (order) =>
        order.orderStatus === "NEW" &&
        order.paymentStatus !== "PAID" &&
        order.paymentStatus !== "REJECTED",
    ),
    confirmados: orders.filter(
      (order) =>
        order.paymentStatus === "PAID" &&
        (order.orderStatus === "NEW" || order.orderStatus === "CONFIRMED"),
    ),
    preparando: orders.filter((order) => order.paymentStatus === "PAID" && order.orderStatus === "PREPARING"),
    listos: orders.filter((order) => order.paymentStatus === "PAID" && order.orderStatus === "READY"),
    entregados: orders.filter((order) => order.paymentStatus === "PAID" && order.orderStatus === "DELIVERED"),
    rechazados: orders.filter((order) => order.paymentStatus === "REJECTED"),
    cancelados: orders.filter((order) => order.orderStatus === "CANCELLED"),
  };
}

function OrderCards({ orders }: { orders: Orders }) {
  if (!orders.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">No hay pedidos en esta sección</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-6 text-muted-foreground">Cuando exista movimiento, aparecerá aquí.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function RejectedCustomRequestCard({ request }: { request: CustomRequest }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
      <CardContent className="grid gap-3 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{request.customerName}</p>
              <Badge variant="destructive">{customStatusLabel(request.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{request.customerPhone}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.description}</p>
            {request.notes ? <p className="mt-2 text-sm text-muted-foreground">Notas: {request.notes}</p> : null}
          </div>
          {request.imageUrl ? (
            <Button asChild size="sm" variant="outline" className="w-full md:w-auto">
              <a href={request.imageUrl} target="_blank" rel="noreferrer">Ver referencia</a>
            </Button>
          ) : null}
        </div>
        <p className="rounded-lg bg-background/70 p-3 text-sm text-muted-foreground">
          Esta solicitud fue rechazada y ya no muestra acciones de aceptacion.
        </p>
      </CardContent>
    </Card>
  );
}

function RejectedCards({ orders, requests }: { orders: Orders; requests: CustomRequests }) {
  if (!orders.length && !requests.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">No hay pedidos en esta seccion</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-6 text-muted-foreground">Cuando exista movimiento, aparecera aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      {requests.map((request) => (
        <RejectedCustomRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

function WorkflowBar({ status }: { status: string }) {
  const activeIndex = workflow.findIndex((step) => step.value === status);

  return (
    <div className="flex flex-wrap gap-2">
      {workflow.map((step, index) => {
        const isActive = step.value === status;
        const isDone = activeIndex > index;
        return (
          <span
            key={step.value}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : isDone
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
        );
      })}
    </div>
  );
}

function NextStepButton({ order }: { order: Order }) {
  const step = nextStep[order.orderStatus];
  const disabled =
    !step ||
    order.paymentStatus !== "PAID" ||
    order.orderStatus === "CANCELLED";

  if (!step) return null;

  return (
    <InlineActionForm action={setOrderStatusAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="status" value={step.status} />
      <Button size="sm" disabled={disabled}>
        {step.label}
      </Button>
    </InlineActionForm>
  );
}

function CancelOrderButton({ order }: { order: Order }) {
  const disabled =
    order.orderStatus === "CANCELLED" ||
    order.orderStatus === "DELIVERED" ||
    order.paymentStatus === "REJECTED";

  if (disabled) return null;

  return (
    <InlineActionForm
      action={setOrderStatusAction}
      confirmMessage="Confirmas cancelar este pedido?"
      className="flex flex-wrap gap-2"
    >
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="status" value="CANCELLED" />
      <Button size="sm" variant="outline">
        Cancelar
      </Button>
    </InlineActionForm>
  );
}

function OrderCard({ order }: { order: Order }) {
  const paymentLocked =
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "REJECTED" ||
    order.orderStatus === "CANCELLED";

  return (
    <Card className="shadow-sm">
      <CardContent className="grid gap-5 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold">Pedido #{order.orderNumber}</h3>
              <Badge variant={order.paymentStatus === "PAID" ? "default" : order.paymentStatus === "REJECTED" ? "destructive" : "secondary"}>
                {paymentLabel(order.paymentStatus)}
              </Badge>
              <Badge variant={order.orderStatus === "CANCELLED" ? "destructive" : "outline"}>
                {orderLabel(order.orderStatus)}
              </Badge>
            </div>
            <WorkflowBar status={order.orderStatus} />
            <p className="text-sm text-muted-foreground">
              {order.createdAt.toLocaleString("es-CR")} - {order.paymentMethod === "SINPE" ? "SINPE" : "Efectivo"}
            </p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{currency(toNumber(order.total))}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
          <section className="rounded-lg border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold">Cliente</h4>
            <p className="mt-2 font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            {order.deliveryNotes ? <p className="mt-3 text-sm text-muted-foreground">{order.deliveryNotes}</p> : null}
          </section>

          <section className="rounded-lg border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold">Productos</h4>
            <div className="mt-2 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="text-sm">
                  <span className="font-medium">
                    {item.quantity}x {item.productName}
                  </span>
                  <div className="text-muted-foreground">{currency(toNumber(item.lineTotal))}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold">Comprobante</h4>
            {order.sinpeProof?.proofUrl ? (
              <div className="mt-3 space-y-3">
                {order.sinpeProof.proofUrl.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.sinpeProof.proofUrl}
                    alt={`Comprobante ${order.orderNumber}`}
                    className="h-32 w-full rounded-lg object-cover"
                  />
                ) : null}
                <Button asChild variant="outline" size="sm">
                  <a href={order.sinpeProof.proofUrl} target="_blank" rel="noreferrer">
                    Ver comprobante
                  </a>
                </Button>
              </div>
            ) : order.sinpeProof?.sentByWhatsapp ? (
              <p className="mt-2 text-sm text-muted-foreground">
                El cliente indicó que enviará el comprobante por WhatsApp.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Sin comprobante registrado.</p>
            )}
          </section>
        </div>

        {order.adjustments.length ? (
          <section className="rounded-lg border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold">Devoluciones y descuentos</h4>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {order.adjustments.map((adjustment) => (
                <div key={adjustment.id} className="rounded-md bg-background p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {adjustment.type === "REFUND" ? "Devolución" : "Descuento"}
                    </span>
                    <span>{currency(toNumber(adjustment.amount))}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{adjustment.reason}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 border-t pt-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <NextStepButton order={order} />
            <CancelOrderButton order={order} />
          </div>

          {!paymentLocked ? (
            <div className="flex flex-wrap gap-2">
              {order.paymentMethod === "CASH" ? (
              <InlineActionForm action={markCashPaidAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="orderId" value={order.id} />
                <Button size="sm">
                  Marcar efectivo pagado y confirmar
                </Button>
              </InlineActionForm>
            ) : (
              <>
                <InlineActionForm action={approvePaymentAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button size="sm">
                    Aprobar pago y confirmar
                  </Button>
                </InlineActionForm>
                <InlineActionForm action={rejectPaymentAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button size="sm" variant="destructive">
                    Rechazar pago
                  </Button>
                </InlineActionForm>
              </>
            )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function methodHref(method: MethodFilter) {
  if (method === "sinpe") return "/admin/pedidos?metodo=sinpe";
  if (method === "efectivo") return "/admin/pedidos?metodo=efectivo";
  return "/admin/pedidos";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ metodo?: string }>;
}) {
  const [orders, requests, resolvedSearchParams] = await Promise.all([
    getOrders(),
    getCustomRequests(),
    searchParams,
  ]);
  const method: MethodFilter =
    resolvedSearchParams?.metodo === "sinpe"
      ? "sinpe"
      : resolvedSearchParams?.metodo === "efectivo"
        ? "efectivo"
        : "todos";
  const filteredOrders = applyMethodFilter(orders, method);
  const grouped = groupOrders(filteredOrders);
  const activeRequests = requests.filter((request) => request.status !== "REJECTED");
  const rejectedRequests = requests.filter((request) => request.status === "REJECTED");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pedidos</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Control por etapas: pendiente, confirmado, preparando, listo y entregado. Ordenado por fecha y hora.
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {(["todos", "sinpe", "efectivo"] as MethodFilter[]).map((item) => (
              <Button key={item} asChild size="sm" variant={method === item ? "default" : "outline"} className="shrink-0">
                <Link href={methodHref(item)}>
                  {item === "todos" ? "Todos" : item === "sinpe" ? "SINPE" : "Efectivo"}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="pendientes" className="space-y-4">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex h-auto w-max min-w-full justify-start gap-1 p-1">
            <TabsTrigger className="shrink-0 px-3 py-2 text-xs sm:text-sm" value="pendientes">
              {tabLabel("Pendientes", grouped.pendientes.length)}
            </TabsTrigger>
            <TabsTrigger className="shrink-0 px-3 py-2 text-xs sm:text-sm" value="confirmados">
              {tabLabel("Confirmados", grouped.confirmados.length)}
            </TabsTrigger>
            <TabsTrigger className="shrink-0 px-3 py-2 text-xs sm:text-sm" value="preparando">
              {tabLabel("Preparando", grouped.preparando.length)}
            </TabsTrigger>
            <TabsTrigger className="shrink-0 px-3 py-2 text-xs sm:text-sm" value="listos">
              {tabLabel("Listos", grouped.listos.length)}
            </TabsTrigger>
            <TabsTrigger className="shrink-0 px-3 py-2 text-xs sm:text-sm" value="entregados">
              {tabLabel("Entregados", grouped.entregados.length)}
            </TabsTrigger>
            <TabsTrigger className="shrink-0 px-3 py-2 text-xs sm:text-sm" value="rechazados">
              {tabLabel("Rechazados", grouped.rechazados.length + rejectedRequests.length)}
            </TabsTrigger>
            <TabsTrigger className="shrink-0 px-3 py-2 text-xs sm:text-sm" value="cancelados">
              {tabLabel("Cancelados", grouped.cancelados.length)}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="pendientes"><OrderCards orders={grouped.pendientes} /></TabsContent>
        <TabsContent value="confirmados"><OrderCards orders={grouped.confirmados} /></TabsContent>
        <TabsContent value="preparando"><OrderCards orders={grouped.preparando} /></TabsContent>
        <TabsContent value="listos"><OrderCards orders={grouped.listos} /></TabsContent>
        <TabsContent value="entregados"><OrderCards orders={grouped.entregados} /></TabsContent>
        <TabsContent value="rechazados">
          <RejectedCards orders={grouped.rechazados} requests={rejectedRequests} />
        </TabsContent>
        <TabsContent value="cancelados"><OrderCards orders={grouped.cancelados} /></TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos personalizados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {activeRequests.map((request) => (
            <div key={request.id} className="grid gap-4 rounded-lg border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{request.customerName}</p>
                    <Badge variant={request.status === "REJECTED" ? "destructive" : "secondary"}>
                      {customStatusLabel(request.status)}
                    </Badge>
                    {request.order ? <Badge>Pedido #{request.order.orderNumber}</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{request.customerPhone}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.description}</p>
                  {request.notes ? <p className="mt-2 text-sm text-muted-foreground">Notas: {request.notes}</p> : null}
                </div>
                {request.imageUrl ? (
                  <Button asChild size="sm" variant="outline" className="w-full md:w-auto">
                    <a href={request.imageUrl} target="_blank" rel="noreferrer">Ver referencia</a>
                  </Button>
                ) : null}
              </div>

              {request.order ? (
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  Esta solicitud ya fue convertida en pedido y sigue el flujo normal de pedidos.
                </p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                  <InlineActionForm action={updateCustomRequestAction} className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="ACCEPTED" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor={`price-${request.id}`}>Precio acordado</Label>
                        <Input id={`price-${request.id}`} name="price" type="number" min="1" required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Metodo de pago</Label>
                        <Select name="paymentMethod" defaultValue="CASH">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Efectivo</SelectItem>
                            <SelectItem value="SINPE">SINPE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea name="adminNotes" placeholder="Notas internas o acuerdo con la clienta." />
                    <Button>Aceptar y crear pedido</Button>
                  </InlineActionForm>

                  <div className="grid content-start gap-2 rounded-lg border bg-muted/20 p-3">
                    <InlineActionForm action={updateCustomRequestAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="status" value="REVIEWED" />
                      <Button size="sm" variant="outline" disabled={request.status === "REVIEWED"}>
                        Marcar revisada
                      </Button>
                    </InlineActionForm>
                    <InlineActionForm action={updateCustomRequestAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="status" value="QUOTED" />
                      <Button size="sm" variant="outline" disabled={request.status === "QUOTED"}>
                        Marcar cotizada
                      </Button>
                    </InlineActionForm>
                    <InlineActionForm
                      action={updateCustomRequestAction}
                      confirmMessage="Confirmas rechazar esta solicitud?"
                      className="flex flex-wrap gap-2"
                    >
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <Button size="sm" variant="destructive" disabled={request.status === "REJECTED"}>
                        Rechazar
                      </Button>
                    </InlineActionForm>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!activeRequests.length ? <p className="text-sm text-muted-foreground">No hay solicitudes personalizadas activas.</p> : null}

          {false ? (
            <section className="mt-2 grid gap-3 border-t pt-4">
              <h3 className="font-semibold">Solicitudes rechazadas</h3>
              {rejectedRequests.map((request) => (
                <div key={request.id} className="grid gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{request.customerName}</p>
                        <Badge variant="destructive">{customStatusLabel(request.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.customerPhone}</p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.description}</p>
                      {request.notes ? <p className="mt-2 text-sm text-muted-foreground">Notas: {request.notes}</p> : null}
                    </div>
                    {request.imageUrl ? (
                      <Button asChild size="sm" variant="outline" className="w-full md:w-auto">
                        <a href={request.imageUrl} target="_blank" rel="noreferrer">Ver referencia</a>
                      </Button>
                    ) : null}
                  </div>
                  <p className="rounded-lg bg-background/70 p-3 text-sm text-muted-foreground">
                    Esta solicitud fue rechazada y ya no muestra acciones de aceptación.
                  </p>
                </div>
              ))}
            </section>
          ) : null}
        </CardContent>
      </Card>

      {false ? (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes rechazadas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {rejectedRequests.map((request) => (
              <div key={request.id} className="grid gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{request.customerName}</p>
                      <Badge variant="destructive">{customStatusLabel(request.status)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.customerPhone}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.description}</p>
                    {request.notes ? <p className="mt-2 text-sm text-muted-foreground">Notas: {request.notes}</p> : null}
                  </div>
                  {request.imageUrl ? (
                    <Button asChild size="sm" variant="outline" className="w-full md:w-auto">
                      <a href={request.imageUrl} target="_blank" rel="noreferrer">Ver referencia</a>
                    </Button>
                  ) : null}
                </div>
                <p className="rounded-lg bg-background/70 p-3 text-sm text-muted-foreground">
                  Esta solicitud fue rechazada y ya no muestra acciones de aceptacion.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
