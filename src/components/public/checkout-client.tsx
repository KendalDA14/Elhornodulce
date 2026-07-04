"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { MessageCircle, TicketPercent, UserCircle } from "lucide-react";
import { previewCheckoutTotalsAction } from "@/actions/public";
import { currency } from "@/lib/format";
import { useCart } from "@/components/public/cart-provider";
import { SinpePaymentModal } from "@/components/public/sinpe-payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TimedMessage } from "@/components/ui/timed-message";

type CheckoutClientProps = {
  sinpe: {
    number: string;
    holder: string;
    instructions: string;
  };
  initialPayment: "SINPE" | "CASH";
  isLoggedIn: boolean;
};

export type CheckoutDraft = {
  customerName: string;
  customerPhone: string;
  deliveryNotes: string;
  promoCode: string;
  items: string;
};

type CreatedOrder = {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: "SINPE" | "CASH";
  customerName: string;
};

type PendingSinpe = {
  draft: CheckoutDraft;
  deadlineAt: number;
};

export function CheckoutClient({ sinpe, initialPayment, isLoggedIn }: CheckoutClientProps) {
  const { items, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"SINPE" | "CASH">(initialPayment);
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [discountPreview, setDiscountPreview] = useState<{
    subtotal: number;
    discountTotal: number;
    total: number;
    appliedCode: string | null;
  } | null>(null);
  const [pendingSinpe, setPendingSinpe] = useState<PendingSinpe | null>(null);
  const [sinpeOpen, setSinpeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const serverItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    [items],
  );

  function buildDraft(formData: FormData): CheckoutDraft {
    return {
      customerName: String(formData.get("customerName") || "").trim(),
      customerPhone: String(formData.get("customerPhone") || "").trim(),
      deliveryNotes: String(formData.get("deliveryNotes") || "").trim(),
      promoCode: String(formData.get("promoCode") || "").trim().toUpperCase(),
      items: JSON.stringify(serverItems),
    };
  }

  function appendDraft(formData: FormData, draft: CheckoutDraft, method: "SINPE" | "CASH") {
    formData.set("customerName", draft.customerName);
    formData.set("customerPhone", draft.customerPhone);
    formData.set("deliveryNotes", draft.deliveryNotes);
    formData.set("promoCode", draft.promoCode);
    formData.set("paymentMethod", method);
    formData.set("items", draft.items);
  }

  function previewDiscount(form: HTMLFormElement) {
    if (!items.length) {
      setMessage("Tu carrito está vacío.");
      return;
    }

    const formData = new FormData(form);
    const draft = buildDraft(formData);
    const previewFormData = new FormData();
    appendDraft(previewFormData, draft, paymentMethod);

    setMessage("");
    startTransition(async () => {
      const result = await previewCheckoutTotalsAction(previewFormData);
      setMessage(result.message);
      setDiscountPreview(result.ok && result.data ? result.data : null);
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setCreatedOrder(null);

    if (!items.length) {
      setMessage("Tu carrito está vacío.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const draft = buildDraft(formData);
    if (draft.promoCode && discountPreview?.appliedCode !== draft.promoCode) {
      setMessage("Presiona Aplicar para validar el código antes de confirmar.");
      return;
    }

    if (paymentMethod === "SINPE") {
      const existingDeadline = pendingSinpe && pendingSinpe.deadlineAt > Date.now() ? pendingSinpe.deadlineAt : null;
      setPendingSinpe({
        draft,
        deadlineAt: existingDeadline || Date.now() + 5 * 60 * 1000,
      });
      setSinpeOpen(true);
      return;
    }

    const cashFormData = new FormData();
    appendDraft(cashFormData, draft, "CASH");
    cashFormData.set("intent", "cash");

    startTransition(async () => {
      const response = await fetch("/api/checkout/order", {
        method: "POST",
        body: cashFormData,
      });
      const result = (await response.json()) as {
        ok: boolean;
        message: string;
        data?: CreatedOrder;
      };
      setMessage(result.message);
      if (result.ok && result.data) {
        setCreatedOrder(result.data);
        clearCart();
      }
    });
  }

  const displayTotal = discountPreview?.total ?? total;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Datos del pedido</CardTitle>
          </CardHeader>
          <CardContent>
            {!isLoggedIn ? (
              <div className="mb-4 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <UserCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Puedes comprar sin cuenta. Si te registras, podrás seguir tu pedido, ver tu historial y recibir descuentos exclusivos.{" "}
                    <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
                      Crear cuenta opcional
                    </Link>
                  </p>
                </div>
              </div>
            ) : null}

            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">Nombre</Label>
                <Input id="customerName" name="customerName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerPhone">Teléfono</Label>
                <Input id="customerPhone" name="customerPhone" required />
              </div>
              <div className="grid gap-2">
                <Label>Método de pago</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as "SINPE" | "CASH")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINPE">SINPE manual</SelectItem>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliveryNotes">Notas</Label>
                <Textarea id="deliveryNotes" name="deliveryNotes" placeholder="Dirección, hora ideal o detalles." />
              </div>
              <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
                <Label htmlFor="promoCode">Código de descuento</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="promoCode"
                    name="promoCode"
                    placeholder="Ej. HD7K2A"
                    className="uppercase"
                    onChange={() => setDiscountPreview(null)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isPending || items.length === 0}
                    onClick={(event) => {
                      const form = event.currentTarget.form;
                      if (form) previewDiscount(form);
                    }}
                  >
                    <TicketPercent className="mr-2 h-4 w-4" />
                    Aplicar
                  </Button>
                </div>
              </div>
              <TimedMessage message={message} ok={Boolean(createdOrder)} messageKey={message} />
              {createdOrder ? (
                <Button asChild variant="secondary">
                  <a
                    href={`https://wa.me/50670104855?text=${encodeURIComponent(
                      `Hola, hice el pedido #${createdOrder.orderNumber} por un total de ${currency(
                        createdOrder.total,
                      )}. Quiero coordinar por WhatsApp.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar por WhatsApp
                  </a>
                </Button>
              ) : null}
              <Button disabled={isPending || items.length === 0}>
                {isPending
                  ? "Confirmando..."
                  : paymentMethod === "SINPE"
                    ? "Continuar al pago SINPE"
                    : "Confirmar pedido en efectivo"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-4 text-sm">
                  <span>
                    {item.quantity} x {item.name}
                  </span>
                  <span>{currency(item.price * item.quantity)}</span>
                </div>
              ))
            )}
            <Separator />
            {discountPreview && discountPreview.discountTotal > 0 ? (
              <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{currency(discountPreview.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-primary">
                  <span>Descuento{discountPreview.appliedCode ? ` (${discountPreview.appliedCode})` : ""}</span>
                  <span>-{currency(discountPreview.discountTotal)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{currency(displayTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      {pendingSinpe ? (
        <SinpePaymentModal
          open={sinpeOpen}
          onOpenChange={setSinpeOpen}
          draft={pendingSinpe.draft}
          deadlineAt={pendingSinpe.deadlineAt}
          total={displayTotal}
          sinpeNumber={sinpe.number}
          holder={sinpe.holder}
          instructions={sinpe.instructions}
          onExpired={() => {
            setSinpeOpen(false);
            setPendingSinpe(null);
            setMessage("El tiempo para este pago SINPE terminó. Confirma el pedido de nuevo para generar otro tiempo.");
          }}
          onOrderConfirmed={(order, resultMessage) => {
            setCreatedOrder(order);
            setMessage(resultMessage);
            clearCart();
          }}
        />
      ) : null}
    </>
  );
}
