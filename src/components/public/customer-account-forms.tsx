"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useActionState, useState } from "react";
import { submitProductRatingAction } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimedMessage } from "@/components/ui/timed-message";
import { Textarea } from "@/components/ui/textarea";

const initialState = { ok: false, message: "" };

type FormMessage = {
  ok: boolean;
  message: string;
};

export function RegisterCustomerForm() {
  const [state, setState] = useState<FormMessage>(initialState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState(initialState);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        password: formData.get("password"),
        confirm: formData.get("confirm"),
      }),
    });
    const result = (await response.json()) as FormMessage;

    setState(result);
    setPending(false);

    if (result.ok) {
      window.setTimeout(() => window.location.assign("/login"), 1800);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/brand/logo.jpeg"
          alt="El horno dulce"
          width={88}
          height={88}
          className="h-[88px] w-[88px] rounded-full object-cover shadow-sm"
          priority
        />
        <h1 className="mt-4 text-2xl font-semibold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu cuenta es opcional y sirve para ver pedidos e historial.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-name">Nombre</Label>
        <Input id="register-name" name="name" autoComplete="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-password">Contraseña</Label>
        <Input id="register-password" name="password" type="password" autoComplete="new-password" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="register-confirm">Confirmar contraseña</Label>
        <Input id="register-confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <TimedMessage message={state.message} ok={state.ok} messageKey={state} />
      <Button disabled={pending}>{pending ? "Creando cuenta..." : "Registrarme"}</Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}

export function LoginCustomerForm() {
  const [state, setState] = useState<{ error?: string }>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({});

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: formData.get("identifier"),
        password: formData.get("password"),
      }),
    });
    const result = (await response.json()) as { ok: boolean; message?: string; redirectTo?: string };

    setPending(false);

    if (result.ok && result.redirectTo) {
      window.location.assign(result.redirectTo);
      return;
    }

    setState({ error: result.message || "No se pudo iniciar sesión." });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/brand/logo.jpeg"
          alt="El horno dulce"
          width={88}
          height={88}
          className="h-[88px] w-[88px] rounded-full object-cover shadow-sm"
          priority
        />
        <h1 className="mt-4 text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Usa tu nombre y contraseña para entrar a tu cuenta.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-identifier">Nombre</Label>
        <Input id="login-identifier" name="identifier" autoComplete="username" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <TimedMessage message={state.error} ok={false} messageKey={state} />
      <Button disabled={pending}>{pending ? "Entrando..." : "Entrar"}</Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}

export function ProductRatingForm() {
  const [state, action, pending] = useActionState(submitProductRatingAction, initialState);
  const [rating, setRating] = useState(5);

  return (
    <form action={action} className="grid gap-3 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">Calificar producto comprado</h2>
      <p className="text-sm text-muted-foreground">
        Usa la clave corta que se genera en tu pedido. La calificación inicia en 5 estrellas.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="rating-code">Clave corta</Label>
        <Input id="rating-code" name="code" placeholder="ABC123" required />
      </div>
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" aria-label="Calificación del producto">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="text-2xl text-amber-500"
            onClick={() => setRating(value)}
            aria-label={`${value} estrella${value === 1 ? "" : "s"}`}
          >
            {value <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rating-comment">Comentario opcional</Label>
        <Textarea id="rating-comment" name="comment" />
      </div>
      <TimedMessage message={state.message} ok={state.ok} messageKey={state} />
      <Button disabled={pending}>Guardar calificación</Button>
    </form>
  );
}
