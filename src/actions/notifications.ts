"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { flushPendingAdminPushNotifications } from "@/lib/push";
import type { ActionResult } from "@/actions/public";

type BrowserPushSubscription = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export async function saveAdminPushSubscriptionAction(subscription: BrowserPushSubscription): Promise<ActionResult> {
  const admin = await requireAdminAction();
  const endpoint = typeof subscription.endpoint === "string" ? subscription.endpoint : "";
  const p256dh = typeof subscription.keys?.p256dh === "string" ? subscription.keys.p256dh : "";
  const auth = typeof subscription.keys?.auth === "string" ? subscription.keys.auth : "";

  let endpointUrl: URL | null = null;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    endpointUrl = null;
  }

  if (
    !endpointUrl ||
    endpointUrl.protocol !== "https:" ||
    endpoint.length > 512 ||
    !p256dh ||
    p256dh.length > 255 ||
    !auth ||
    auth.length > 255
  ) {
    return { ok: false, message: "No se pudo activar la notificación en este dispositivo." };
  }

  await getPrisma().pushSubscription.upsert({
    where: { endpoint },
    update: {
      adminId: admin.id,
      p256dh,
      auth,
      userAgent: null,
    },
    create: {
      adminId: admin.id,
      endpoint,
      p256dh,
      auth,
      userAgent: null,
    },
  });

  await flushPendingAdminPushNotifications().catch(() => undefined);
  revalidatePath("/admin");
  return { ok: true, message: "Notificaciones activadas en este dispositivo." };
}

export async function removeAdminPushSubscriptionAction(endpoint: string): Promise<ActionResult> {
  const admin = await requireAdminAction();
  if (!endpoint || endpoint.length > 512) {
    return { ok: false, message: "No se encontró la suscripción del dispositivo." };
  }

  await getPrisma().pushSubscription.deleteMany({ where: { endpoint, adminId: admin.id } });
  revalidatePath("/admin");
  return { ok: true, message: "Notificaciones desactivadas en este dispositivo." };
}
