"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock, Upload } from "lucide-react";
import {
  createSinpeOrderWhatsappAction,
  createSinpeOrderWithProofAction,
} from "@/actions/public";
import type { CheckoutDraft } from "@/components/public/checkout-client";
import { currency } from "@/lib/format";
import { whatsappUrl } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreatedOrder = {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: "SINPE" | "CASH";
  customerName: string;
};

type SinpePaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: CheckoutDraft;
  deadlineAt: number;
  total: number;
  sinpeNumber: string;
  holder: string;
  instructions: string;
  onExpired: () => void;
  onOrderConfirmed: (order: CreatedOrder, message: string) => void;
};

function appendDraft(formData: FormData, draft: CheckoutDraft) {
  formData.set("customerName", draft.customerName);
  formData.set("customerPhone", draft.customerPhone);
  formData.set("deliveryNotes", draft.deliveryNotes);
  formData.set("promoCode", draft.promoCode);
  formData.set("paymentMethod", "SINPE");
  formData.set("items", draft.items);
}

export function SinpePaymentModal({
  open,
  onOpenChange,
  draft,
  deadlineAt,
  total,
  sinpeNumber,
  holder,
  instructions,
  onExpired,
  onOrderConfirmed,
}: SinpePaymentModalProps) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)));
  const [message, setMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isComplete) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining <= 0) {
        onExpired();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadlineAt, isComplete, onExpired]);

  const time = useMemo(() => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const remaining = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remaining}`;
  }, [seconds]);

  function finish(order: CreatedOrder, resultMessage: string) {
    setIsComplete(true);
    setSeconds(0);
    setMessage(resultMessage);
    onOrderConfirmed(order, resultMessage);
    setShowThanks(true);
    window.setTimeout(() => {
      router.push("/");
    }, 6000);
  }

  function submitProof(formData: FormData) {
    if (seconds <= 0) {
      onExpired();
      return;
    }

    setMessage("");
    appendDraft(formData, draft);
    startTransition(async () => {
      const result = await createSinpeOrderWithProofAction(formData);
      setMessage(result.message);
      if (result.ok && result.data) finish(result.data, result.message);
    });
  }

  function sendByWhatsapp() {
    if (seconds <= 0) {
      onExpired();
      return;
    }

    const formData = new FormData();
    appendDraft(formData, draft);
    startTransition(async () => {
      const result = await createSinpeOrderWhatsappAction(formData);
      setMessage(result.message);
      if (result.ok && result.data) {
        window.open(
          whatsappUrl(
            `Hola, soy ${draft.customerName}. Hice el pedido #${result.data.orderNumber} por un total de ${currency(
              result.data.total,
            )}. Quiero enviar el comprobante SINPE.`,
          ),
          "_blank",
          "noopener,noreferrer",
        );
        finish(result.data, result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pago por SINPE</DialogTitle>
          <DialogDescription>
            El pedido se registrará cuando subas el comprobante o confirmes que lo enviarás por WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Número SINPE</span>
              <strong>{sinpeNumber}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Titular</span>
              <strong>{holder}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto total</span>
              <strong>{currency(total)}</strong>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {isComplete ? "Tiempo detenido" : "Tiempo restante"}
            </span>
            <span className="font-mono text-lg">{time}</span>
          </div>
          {showThanks ? (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Gracias por tu pedido.</p>
                <p>Te enviaremos al inicio en un momento.</p>
              </div>
            </div>
          ) : null}
          <p className="text-sm leading-6 text-muted-foreground">{instructions}</p>
          <form action={submitProof} className="grid gap-3">
            <Label htmlFor="proof">Comprobante</Label>
            <Input id="proof" name="proof" type="file" accept="image/*" required disabled={isComplete} />
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button disabled={isPending || isComplete || seconds <= 0}>
              <Upload className="mr-2 h-4 w-4" />
              {isPending ? "Confirmando..." : "Ya realicé el SINPE"}
            </Button>
          </form>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || isComplete || seconds <= 0}
            onClick={sendByWhatsapp}
          >
            Enviar comprobante por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
