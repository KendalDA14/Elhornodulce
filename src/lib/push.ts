import webPush from "web-push";
import { getPrisma } from "@/lib/prisma";

export type AdminPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function pushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@horno.local";

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function configureWebPush() {
  const config = pushConfig();
  if (!config) return false;

  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

async function deliverAdminPushNotification(notification: {
  id: string;
  title: string;
  body: string;
  url: string;
  tag: string;
}) {
  if (!configureWebPush()) return false;

  const prisma = getPrisma();
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { admin: { isActive: true } },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (!subscriptions.length) return false;

  const message = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
    tag: notification.tag,
    icon: "/brand/logo.jpeg",
    badge: "/icon.jpeg",
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          message,
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        }
        throw error;
      }
    }),
  );

  const delivered = results.some((result) => result.status === "fulfilled");
  await prisma.adminNotification.update({
    where: { id: notification.id },
    data: {
      attempts: { increment: 1 },
      ...(delivered ? { deliveredAt: new Date() } : {}),
    },
  });

  return delivered;
}

export async function sendAdminPushNotification(payload: AdminPushPayload) {
  const prisma = getPrisma();
  const notification = await prisma.adminNotification.create({
    data: {
      title: payload.title,
      body: payload.body,
      url: payload.url || "/admin",
      tag: payload.tag || "admin-event",
    },
  });

  await deliverAdminPushNotification(notification).catch(() => undefined);
}

export async function flushPendingAdminPushNotifications() {
  const prisma = getPrisma();

  for (let batch = 0; batch < 20; batch += 1) {
    const pending = await prisma.adminNotification.findMany({
      where: { deliveredAt: null },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    if (!pending.length) return;

    let deliveredInBatch = false;
    for (const notification of pending) {
      const delivered = await deliverAdminPushNotification(notification).catch(() => false);
      deliveredInBatch = deliveredInBatch || delivered;
    }

    if (!deliveredInBatch) return;
  }
}
