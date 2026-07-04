"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { createCustomRequestAction } from "@/actions/public";
import { whatsappUrl } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimedMessage } from "@/components/ui/timed-message";

const initialState = { ok: false, message: "" };

export function CustomRequestForm() {
  const [state, formAction, pending] = useActionState(createCustomRequestAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border bg-card p-5">
      <div className="grid gap-2">
        <Label htmlFor="customerName">Nombre</Label>
        <Input id="customerName" name="customerName" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="customerPhone">Telefono</Label>
        <Input id="customerPhone" name="customerPhone" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Que desea pedir</Label>
        <Textarea
          id="description"
          name="description"
          minLength={10}
          placeholder="Tipo de postre, sabor, tamano, decoracion y ocasion."
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="desiredDate">Fecha en la que lo necesita</Label>
        <Input id="desiredDate" name="desiredDate" type="date" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image">Referencia opcional</Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notas adicionales opcionales</Label>
        <Textarea id="notes" name="notes" />
      </div>
      <TimedMessage message={state.message} ok={state.ok} messageKey={state} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={pending}>{pending ? "Enviando..." : "Enviar solicitud"}</Button>
        <Button asChild variant="secondary">
          <a
            href={whatsappUrl("Hola, quiero consultar sobre un postre personalizado.")}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Consultar WhatsApp
          </a>
        </Button>
      </div>
    </form>
  );
}
