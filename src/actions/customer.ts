"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearCustomerSession,
  assertSameOrigin,
  getCustomerSession,
  hashPassword,
} from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import type { ActionResult } from "@/actions/public";

export async function registerCustomerAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertSameOrigin();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (name.length < 2) return { ok: false, message: "Indica tu nombre." };
  if (name.length > 60) return { ok: false, message: "Usa un nombre mas corto." };
  if (name.includes("@")) return { ok: false, message: "Usa tu nombre sin correo electronico." };
  if (password.length < 6) return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
  if (password !== confirm) return { ok: false, message: "Las contraseñas no coinciden." };

  try {
    await getPrisma().customerUser.create({
      data: { name, passwordHash: await hashPassword(password) },
    });
    return { ok: true, message: "Te has registrado con éxito. Ahora puedes iniciar sesión." };
  } catch {
    return { ok: false, message: "No se pudo crear la cuenta. Prueba con otro nombre." };
  }
}

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
  if (item.order.customerName.toLowerCase() !== customer.name.toLowerCase() && item.order.customerId !== customer.id) {
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
