"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  removeAdminPushSubscriptionAction,
  saveAdminPushSubscriptionAction,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { TimedMessage } from "@/components/ui/timed-message";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    window.isSecureContext
  );
}

export function PushNotificationControl({ compact = false }: { compact?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const available = isPushSupported() && Boolean(vapidPublicKey);
    if (!available) {
      queueMicrotask(() => setSupported(false));
      return;
    }

    navigator.serviceWorker
      .register("/admin-push-sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setEnabled(Boolean(subscription)))
      .catch(() => {
        setSupported(false);
      });
  }, []);

  function activate() {
    setMessage("");

    startTransition(async () => {
      try {
        if (!isPushSupported() || !vapidPublicKey) {
          setOk(false);
          setMessage("Este navegador no permite notificaciones push aquí.");
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setOk(false);
          setMessage("Permiso de notificaciones rechazado.");
          return;
        }

        const registration = await navigator.serviceWorker.register("/admin-push-sw.js");
        const existing = await registration.pushManager.getSubscription();
        const subscription =
          existing ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          }));

        const result = await saveAdminPushSubscriptionAction(subscription.toJSON());
        setOk(result.ok);
        setMessage(result.message);
        setEnabled(result.ok);
      } catch {
        setOk(false);
        setMessage("No se pudieron activar las notificaciones.");
      }
    });
  }

  function deactivate() {
    setMessage("");

    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/admin-push-sw.js");
        const subscription = await registration?.pushManager.getSubscription();
        const endpoint = subscription?.endpoint || "";

        if (subscription) await subscription.unsubscribe();
        const result = endpoint
          ? await removeAdminPushSubscriptionAction(endpoint)
          : { ok: true, message: "Notificaciones desactivadas." };

        setOk(result.ok);
        setMessage(result.message);
        setEnabled(false);
      } catch {
        setOk(false);
        setMessage("No se pudieron desactivar las notificaciones.");
      }
    });
  }

  if (!supported) {
    return compact ? null : (
      <div className="text-xs text-muted-foreground">
        Notificaciones no disponibles en este navegador.
      </div>
    );
  }

  return (
    <div className={compact ? "grid gap-2" : "relative"}>
      <Button
        type="button"
        variant={enabled ? "secondary" : "outline"}
        size={compact ? "default" : "sm"}
        className={compact ? "w-full justify-start gap-2" : "gap-2"}
        disabled={isPending}
        onClick={enabled ? deactivate : activate}
      >
        {enabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {enabled ? "Quitar notificaciones" : "Activar notificaciones"}
      </Button>
      <TimedMessage
        message={message}
        ok={ok}
        messageKey={message}
        className={compact ? "" : "absolute right-0 top-10 z-20 min-w-64"}
      />
    </div>
  );
}
