"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, getCustomerSession } from "@/lib/auth";
import { uploadBlobFile } from "@/lib/blob";
import { shortCode } from "@/lib/format";
import { calculateOrderTotals, nextOrderNumber } from "@/lib/orders";
import { getPrisma } from "@/lib/prisma";
import { sendAdminPushNotification } from "@/lib/push";
import {
  applyBestPromotion,
  getActivePromotionByCode,
  getActivePromotions,
  promotionAppliesToProduct,
  promotionScopeLabel,
} from "@/lib/promotions";
import { sinpeSettings } from "@/lib/settings";
import {
  checkoutSchema,
  customRequestSchema,
  reviewSchema,
} from "@/lib/validations";

export type ActionResult<T = unknown> = {
  ok: boolean;
  message: string;
  data?: T;
};

type CreatedOrderData = {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: "SINPE" | "CASH";
  customerName: string;
};

function isAcceptedImage(file: File) {
  const safeName = file.name.toLowerCase();
  const hasImageType = file.type.startsWith("image/");
  const hasImageExtension = /\.(png|jpe?g|webp|gif|avif|heic|heif)$/i.test(safeName);
  return hasImageType && hasImageExtension;
}

function parseCheckoutFormData(formData: FormData) {
  const rawItems = String(formData.get("items") || "[]");
  let parsedItems: unknown = [];
  try {
    parsedItems = JSON.parse(rawItems) as unknown;
  } catch {
    return { ok: false as const, message: "El carrito no se pudo leer." };
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    deliveryNotes: formData.get("deliveryNotes"),
    promoCode: formData.get("promoCode"),
    paymentMethod: formData.get("paymentMethod"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message || "Datos inválidos." };
  }

  return { ok: true as const, data: parsed.data };
}

async function getCheckoutTotals(formData: FormData) {
  const parsed = parseCheckoutFormData(formData);
  if (!parsed.ok) return parsed;

  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.items.map((item) => item.productId) } },
    select: {
      id: true,
      categoryId: true,
      name: true,
      priceFinal: true,
      imageUrl: true,
      estimatedDelivery: true,
      isActive: true,
      isAvailable: true,
    },
  });
  const visiblePromotions = await getActivePromotions();
  const requestedCode = parsed.data.promoCode?.trim().toUpperCase();
  const codePromotion = requestedCode ? await getActivePromotionByCode(requestedCode) : null;
  if (requestedCode && !codePromotion) {
    return { ok: false as const, message: "El codigo de descuento no existe o no esta vigente." };
  }
  const codeEligibleProducts = codePromotion
    ? products.filter((product) => promotionAppliesToProduct(codePromotion, product))
    : [];
  if (codePromotion && !codeEligibleProducts.length) {
    return {
      ok: false as const,
      message: `Este codigo solo aplica para ${promotionScopeLabel(codePromotion)}.`,
    };
  }

  const promotions = codePromotion ? [...visiblePromotions, codePromotion] : visiblePromotions;
  let codeUsedProductCount = 0;
  const pricedProducts = products.map((product) => {
    const pricing = applyBestPromotion(product, promotions);
    if (codePromotion && pricing.promotionId === codePromotion.id) {
      codeUsedProductCount += 1;
    }
    return {
      ...product,
      priceFinal: pricing.finalPrice,
      originalPrice: pricing.originalPrice,
    };
  });

  let totals;
  try {
    totals = calculateOrderTotals(parsed.data.items, pricedProducts);
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "No se pudo calcular el pedido.",
    };
  }

  return {
    ok: true as const,
    data: {
      checkout: parsed.data,
      totals,
      appliedCode: codePromotion?.code || null,
      codeScope: codePromotion ? promotionScopeLabel(codePromotion) : null,
      codeEligibleProductCount: codeEligibleProducts.length,
      codeUsedProductCount,
    },
  };
}

async function createConfirmedOrder(
  formData: FormData,
  options?: {
    proof?: { url: string; path: string } | null;
    sentByWhatsapp?: boolean;
  },
): Promise<ActionResult<CreatedOrderData>> {
  const priced = await getCheckoutTotals(formData);
  if (!priced.ok) return priced;
  const parsed = priced.data.checkout;
  const totals = priced.data.totals;

  try {
    const prisma = getPrisma();
    const number = await nextOrderNumber();
    const settings = sinpeSettings();
    const customer = await getCustomerSession();

    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        customerName: parsed.customerName,
        customerPhone: parsed.customerPhone,
        customerEmail: null,
        customerId: customer?.id || null,
        deliveryNotes: parsed.deliveryNotes || null,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        total: totals.total,
        paymentMethod: parsed.paymentMethod,
        paymentStatus: parsed.paymentMethod === "SINPE" ? "EN_VALIDACION" : "PENDING",
        orderStatus: "NEW",
        items: {
          create: totals.lines.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            imageUrl: line.imageUrl,
            estimatedDelivery: line.estimatedDelivery,
            reviewCode: shortCode(),
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
        },
        sinpeProof:
          parsed.paymentMethod === "SINPE"
            ? {
                create: {
                  holderName: settings.holder,
                  sinpeNumber: settings.number,
                  expectedAmount: totals.total,
                  proofUrl: options?.proof?.url || null,
                  proofPath: options?.proof?.path || null,
                  uploadedAt: options?.proof ? new Date() : null,
                  sentByWhatsapp: Boolean(options?.sentByWhatsapp),
                  whatsappSentAt: options?.sentByWhatsapp ? new Date() : null,
                },
              }
            : undefined,
      },
    });

    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");

    await sendAdminPushNotification({
      title:
        parsed.paymentMethod === "SINPE"
          ? options?.proof
            ? "Comprobante SINPE recibido"
            : "Pedido SINPE pendiente"
          : "Nuevo pedido en efectivo",
      body: `Pedido #${number} de ${parsed.customerName} por ${new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0,
      }).format(totals.total)}.`,
      url: "/admin/pedidos",
      tag: `order-${order.id}`,
    }).catch(() => undefined);

    return {
      ok: true,
      message: "Pedido realizado con éxito. Me comunicaré contigo lo más pronto posible.",
      data: {
        orderId: order.id,
        orderNumber: number,
        total: totals.total,
        paymentMethod: parsed.paymentMethod,
        customerName: parsed.customerName,
      },
    };
  } catch (error) {
    console.error("[checkout/create-order]", error);
    return {
      ok: false,
      message: "No se pudo crear el pedido.",
    };
  }
}

export async function createOrderAction(formData: FormData): Promise<ActionResult<CreatedOrderData>> {
  await assertSameOrigin();
  const parsed = parseCheckoutFormData(formData);
  if (!parsed.ok) return parsed;
  if (parsed.data.paymentMethod === "SINPE") {
    return {
      ok: false,
      message: "Confirma el SINPE subiendo el comprobante o indicando que lo enviarás por WhatsApp.",
    };
  }

  return createConfirmedOrder(formData);
}

export async function previewCheckoutTotalsAction(formData: FormData): Promise<ActionResult<{
  subtotal: number;
  discountTotal: number;
  total: number;
  appliedCode: string | null;
}>> {
  await assertSameOrigin();
  try {
    const priced = await getCheckoutTotals(formData);
    if (!priced.ok) return priced;
    return {
      ok: true,
      message: priced.data.appliedCode
        ? priced.data.codeUsedProductCount === 0
          ? `El codigo ${priced.data.appliedCode} es valido para ${priced.data.codeScope}, pero ya hay un mejor descuento activo.`
          : priced.data.codeEligibleProductCount === priced.data.totals.lines.length
          ? `Codigo ${priced.data.appliedCode} aplicado.`
          : `Codigo ${priced.data.appliedCode} aplicado solo para ${priced.data.codeScope}.`
        : "Total actualizado.",
      data: {
        subtotal: priced.data.totals.subtotal,
        discountTotal: priced.data.totals.discountTotal,
        total: priced.data.totals.total,
        appliedCode: priced.data.appliedCode,
      },
    };
  } catch {
    return {
      ok: false,
      message: "No se pudo validar el codigo.",
    };
  }
}

export async function createSinpeOrderWithProofAction(formData: FormData): Promise<ActionResult<CreatedOrderData>> {
  await assertSameOrigin();
  const file = formData.get("proof");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Sube el comprobante del SINPE." };
  }
  if (!isAcceptedImage(file)) {
    return { ok: false, message: "El comprobante debe ser una imagen." };
  }

  try {
    formData.set("paymentMethod", "SINPE");
    const uploaded = await uploadBlobFile(file, "sinpe/pending");
    if (!uploaded) return { ok: false, message: "No se pudo subir el archivo." };

    const result = await createConfirmedOrder(formData, { proof: uploaded });
    return result.ok
      ? {
          ...result,
          message: "Tu comprobante fue recibido. El pedido queda en validación y me comunicaré contigo lo más pronto posible.",
        }
      : result;
  } catch {
    return {
      ok: false,
      message: "No se pudo crear el pedido con comprobante.",
    };
  }
}

export async function createSinpeOrderWhatsappAction(formData: FormData): Promise<ActionResult<CreatedOrderData>> {
  await assertSameOrigin();
  try {
    formData.set("paymentMethod", "SINPE");
    const result = await createConfirmedOrder(formData, { sentByWhatsapp: true });
    return result.ok
      ? {
          ...result,
          message: "Pedido realizado con éxito. Cuando reciba el comprobante por WhatsApp, validaré el pago.",
        }
      : result;
  } catch {
    return {
      ok: false,
      message: "No se pudo crear el pedido por WhatsApp.",
    };
  }
}

export async function createReviewAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertSameOrigin();
  const parsed = reviewSchema.safeParse({
    publishMode: formData.get("publishMode"),
    customerName: formData.get("customerName"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) return { ok: false, message: "Completa la reseña correctamente." };

  try {
    await getPrisma().review.create({
      data: {
        customerName: parsed.data.publishMode === "anonymous" ? null : parsed.data.customerName?.trim() || null,
        isAnonymous: parsed.data.publishMode === "anonymous",
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });
    revalidatePath("/admin/resenas");
    await sendAdminPushNotification({
      title: "Nueva reseña pendiente",
      body: "Hay una reseña esperando aprobación.",
      url: "/admin/resenas",
      tag: "review-pending",
    }).catch(() => undefined);
    return { ok: true, message: "Gracias. Tu reseña quedó pendiente de aprobación." };
  } catch {
    return { ok: false, message: "No se pudo guardar la reseña." };
  }
}

export async function createCustomRequestAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await assertSameOrigin();
  const parsed = customRequestSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    description: formData.get("description"),
    desiredDate: formData.get("desiredDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { ok: false, message: "Completa la solicitud correctamente." };

  try {
    const file = formData.get("image");
    const uploaded = file instanceof File && file.size > 0 ? await uploadBlobFile(file, "custom-requests") : null;

    await getPrisma().customDessertRequest.create({
      data: {
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: null,
        description: parsed.data.description,
        desiredDate: parsed.data.desiredDate ? new Date(parsed.data.desiredDate) : null,
        notes: parsed.data.notes || null,
        imageUrl: uploaded?.url || null,
        imagePath: uploaded?.path || null,
      },
    });

    revalidatePath("/admin/pedidos");
    await sendAdminPushNotification({
      title: "Nueva solicitud personalizada",
      body: `${parsed.data.customerName} envió una solicitud de postre personalizado.`,
      url: "/admin/pedidos",
      tag: "custom-request",
    }).catch(() => undefined);
    return { ok: true, message: "Solicitud enviada. Te contactaremos por WhatsApp para cotizar." };
  } catch {
    return {
      ok: false,
      message: "No se pudo enviar la solicitud.",
    };
  }
}
