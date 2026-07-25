"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertSameOrigin,
  clearCustomerSession,
  getCustomerSession,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { consumeRateLimit, requestRateLimitKey } from "@/lib/rate-limit";
import type { ActionResult } from "@/actions/public";

export async function logoutCustomerAction() {
  await assertSameOrigin();
  await clearCustomerSession();
  redirect("/login");
}

export async function submitProductRatingAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertSameOrigin();
  const code = String(formData.get("code") || "").trim().toUpperCase().slice(0, 16);
  const rating = Number(formData.get("rating") || 5);
  const comment = String(formData.get("comment") || "").trim();
  const customer = await getCustomerSession();

  if (!customer) return { ok: false, message: "Inicia sesión para calificar." };
  if (!code) return { ok: false, message: "Ingresa la clave corta de compra." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Selecciona de 1 a 5 estrellas." };
  }
  if (comment.length > 600) return { ok: false, message: "El comentario es demasiado largo." };
  const customerRateLimitKey = await requestRateLimitKey("product-rating", customer.id);
  if (!consumeRateLimit(customerRateLimitKey, 12, 60 * 60 * 1000)) {
    return { ok: false, message: "Has enviado varias calificaciones. Inténtalo más tarde." };
  }

  const item = await getPrisma().orderItem.findUnique({
    where: { reviewCode: code },
    include: { order: true },
  });

  if (!item?.productId) return { ok: false, message: "Clave no válida." };
  if (item.order.customerId !== customer.id) {
    return { ok: false, message: "Esta clave no coincide con tu cuenta." };
  }
  if (item.order.orderStatus !== "DELIVERED" || item.order.paymentStatus !== "PAID") {
    return {
      ok: false,
      message: "Podrás calificar este producto cuando el pedido esté pagado y entregado.",
    };
  }

  await getPrisma().productRating.upsert({
    where: { reviewCode: code },
    create: {
      productId: item.productId,
      orderItemId: item.id,
      reviewCode: code,
      customerName: customer.name,
      rating,
      comment: comment || null,
    },
    update: {
      rating,
      comment: comment || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/cuenta");

  return { ok: true, message: "Calificación guardada. Tu reseña ya aparece en el producto." };
}
