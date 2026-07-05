"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { ActionResult } from "@/actions/public";

export function AdminFlashMessage() {
  const [message, setMessage] = useState<ActionResult | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("adminFlash");
    if (!raw) return;

    window.sessionStorage.removeItem("adminFlash");
    try {
      const parsed = JSON.parse(raw) as ActionResult;
      const showTimeout = window.setTimeout(() => setMessage(parsed), 0);
      const timeout = window.setTimeout(() => setMessage(null), 3000);
      return () => {
        window.clearTimeout(showTimeout);
        window.clearTimeout(timeout);
      };
    } catch {}
  }, []);

  if (!message?.message) return null;

  const Icon = message.ok ? CheckCircle2 : XCircle;

  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-sm ${
        message.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="font-medium">{message.message}</span>
    </div>
  );
}
