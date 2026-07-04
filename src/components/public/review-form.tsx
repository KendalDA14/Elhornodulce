"use client";

import { useActionState, useState } from "react";
import { createReviewAction } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimedMessage } from "@/components/ui/timed-message";

const initialState = { ok: false, message: "" };

export function ReviewForm() {
  const [state, formAction, pending] = useActionState(createReviewAction, initialState);
  const [rating, setRating] = useState(5);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border bg-card p-5">
      <div className="grid gap-2">
        <Label>Publicacion</Label>
        <Select name="publishMode" defaultValue="named">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="named">Publicar con nombre</SelectItem>
            <SelectItem value="anonymous">Publicar como anónimo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="customerName">Nombre si deseas publicarlo</Label>
        <Input id="customerName" name="customerName" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rating">Calificacion con estrellas</Label>
        <input type="hidden" name="rating" value={rating} />
        <div className="flex gap-1" role="radiogroup" aria-label="Calificacion">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="text-2xl text-amber-500 transition-transform hover:scale-110"
              onClick={() => setRating(value)}
              aria-label={`${value} estrellas`}
            >
              {value <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="comment">Resena</Label>
        <Textarea id="comment" name="comment" minLength={10} required />
      </div>
      <TimedMessage message={state.message} ok={state.ok} messageKey={state} />
      <Button disabled={pending}>{pending ? "Enviando..." : "Enviar reseña"}</Button>
    </form>
  );
}
