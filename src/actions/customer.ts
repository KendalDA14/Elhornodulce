"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertSameOrigin,
  clearCustomerSession,
  getCustomerSession,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/actions/public";

export async function logoutCustomerAction() {
  await assertSameOrigin();
  await clearCustomerSession();
  redirect("/login");
}

export async function submitProductRatingAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertSameOrigin();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const rating = Number(formData.get("rating") || 5);
  const comment = String(formData.get("comment") || "").trim();
  const customer = await getCustomerSession();

  if (!customer) return { ok: false, message: "Inicia sesión para calificar." };
  if (!code) return { ok: false, message: "Ingresa la clave corta de compra." };
  if (rating < 1 || rating > 5) return { ok: false, message: "Selecciona de 1 a 5 estrellas." };

  const item = await getPrisma().orderItem.findUnique({
    where: { reviewCode: code },
    include: { order: true },
  });

  if (!item?.productId) return { ok: false, message: "Clave no válida." };
  if (item.order.customerId !== customer.id) {
    return { ok: false, message: "Esta clave no coincide con tu cuenta." };
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
