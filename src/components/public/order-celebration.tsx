"use client";

import { CheckCircle2, Sparkles } from "lucide-react";

const confetti = [
  { left: "10%", delay: "0s", color: "bg-rose-400" },
  { left: "22%", delay: "0.18s", color: "bg-amber-300" },
  { left: "35%", delay: "0.08s", color: "bg-pink-300" },
  { left: "50%", delay: "0.28s", color: "bg-rose-500" },
  { left: "64%", delay: "0.12s", color: "bg-amber-200" },
  { left: "78%", delay: "0.34s", color: "bg-pink-400" },
  { left: "90%", delay: "0.2s", color: "bg-rose-300" },
];

export function OrderCelebration({ orderNumber }: { orderNumber: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 px-5 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 overflow-hidden" aria-hidden="true">
        {confetti.map((piece) => (
          <span
            key={`${piece.left}-${piece.delay}`}
            className={`order-confetti absolute top-[-1rem] h-3 w-2 rounded-sm ${piece.color}`}
            style={{ left: piece.left, animationDelay: piece.delay }}
          />
        ))}
      </div>
      <div className="order-celebration-card w-full max-w-md rounded-2xl border border-rose-200 bg-card p-7 text-center shadow-xl sm:p-9">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <div className="mt-5 flex items-center justify-center gap-2 text-rose-700">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Pedido recibido</span>
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-rose-950">Gracias por tu pedido</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Tu pedido #{orderNumber} fue registrado. Nos comunicaremos contigo lo más pronto posible.
        </p>
        <p className="mt-5 text-xs font-medium text-rose-700">Volviendo al inicio...</p>
      </div>
    </div>
  );
}
