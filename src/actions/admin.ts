"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth";
import { uploadBlobFile } from "@/lib/blob";
import { slugify, toNumber } from "@/lib/format";
import { nextOrderNumber } from "@/lib/orders";
import { getPrisma } from "@/lib/prisma";
import { calculateSuggestedPrice } from "@/lib/pricing";
import {
  categorySchema,
  customRequestAdminSchema,
  ingredientSchema,
  orderAdjustmentSchema,
  productSchema,
  productionBatchSchema,
  promotionSchema,
  siteSettingsSchema,
} from "@/lib/validations";
import type { ActionResult } from "@/actions/public";

function boolFromForm(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function normalizePromotionCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formDataList(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => String(value || "").trim());
}

function csvField(formData: FormData, name: string) {
  return String(formData.get(name) || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function orderedNewUploads(
  uploads: { url: string; path: string }[],
  imageOrder: string[],
  newImageTokens: string[],
) {
  if (!uploads.length) return [];
  if (!imageOrder.length || !newImageTokens.length) return uploads;

  const byToken = new Map(newImageTokens.map((token, index) => [token, uploads[index]]));
  const ordered = imageOrder
    .map((token) => (token.startsWith("new:") ? byToken.get(token.slice(4)) : null))
    .filter((item): item is { url: string; path: string } => Boolean(item));
  const used = new Set(ordered);
  const remaining = uploads.filter((upload) => !used.has(upload));

  return [...ordered, ...remaining];
}

async function uniqueProductSlug(name: string, excludeId?: string) {
  const prisma = getPrisma();
  const baseSlug = slugify(name) || "producto";

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const existing = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

async function generatePromotionCode() {
  const prisma = getPrisma();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
    const code = `HD${random}`.slice(0, 8);
    const existing = await prisma.promotion.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `HD${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function createCategoryAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { ok: false, message: "Categoría inválida." };

  try {
    await getPrisma().category.create({
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        description: parsed.data.description || null,
      },
    });
    revalidatePath("/admin/categorias");
    revalidatePath("/catalogo");
    return { ok: true, message: "Categoría creada." };
  } catch {
    return { ok: false, message: "No se pudo crear la categoría." };
  }
}

export async function updateCategoryAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = categorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success || !parsed.data.id) return { ok: false, message: "Categoría inválida." };

  try {
    await getPrisma().category.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        description: parsed.data.description || null,
        isActive: Boolean(parsed.data.isActive),
      },
    });
    revalidatePath("/admin/categorias");
    revalidatePath("/");
    revalidatePath("/catalogo");
    return { ok: true, message: "Categoría actualizada." };
  } catch {
    return { ok: false, message: "No se pudo actualizar la categoría." };
  }
}

export async function toggleCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive")) === "true";
  if (!id) return { ok: false, message: "Categoría inválida." };

  try {
    await getPrisma().category.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/categorias");
    revalidatePath("/");
    revalidatePath("/catalogo");
    return { ok: true, message: isActive ? "Categoría activada." : "Categoría desactivada." };
  } catch {
    return { ok: false, message: "No se pudo cambiar la categoría." };
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Categoría inválida." };

  try {
    const category = await getPrisma().category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, promotions: true } } },
    });
    if (!category) return { ok: false, message: "Categoría no encontrada." };
    if (category._count.products > 0 || category._count.promotions > 0) {
      return { ok: false, message: "No se puede eliminar: tiene productos o promociones. Puedes desactivarla." };
    }

    await getPrisma().category.delete({ where: { id } });
    revalidatePath("/admin/categorias");
    revalidatePath("/");
    revalidatePath("/catalogo");
    return { ok: true, message: "Categoría eliminada." };
  } catch {
    return { ok: false, message: "No se pudo eliminar la categoría." };
  }
}

export async function createProductAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    visibleIngredients: formData.get("visibleIngredients"),
    estimatedDelivery: formData.get("estimatedDelivery"),
    priceFinal: formData.get("priceFinal"),
    isAvailable: boolFromForm(formData.get("isAvailable")),
    isActive: boolFromForm(formData.get("isActive")),
    isFeatured: boolFromForm(formData.get("isFeatured")),
  });
  if (!parsed.success) return { ok: false, message: "Producto inválido." };

  try {
    const prisma = getPrisma();
    const slug = await uniqueProductSlug(parsed.data.name);
    const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
    const imageOrder = csvField(formData, "imageOrder");
    const newImageTokens = csvField(formData, "newImageTokens");
    const uploaded = await Promise.all(files.map((file) => uploadBlobFile(file, "products")));
    const cleanUploads = orderedNewUploads(
      uploaded.filter((item): item is { url: string; path: string } => Boolean(item)),
      imageOrder,
      newImageTokens,
    );
    const primary = cleanUploads[0] || null;

    if (parsed.data.isFeatured) {
      await prisma.product.updateMany({ data: { isFeatured: false } });
    }

    await prisma.product.create({
      data: {
        name: parsed.data.name,
        slug,
        categoryId: parsed.data.categoryId,
        description: parsed.data.description,
        visibleIngredients: parsed.data.visibleIngredients || null,
        estimatedDelivery: parsed.data.estimatedDelivery,
        priceFinal: parsed.data.priceFinal,
        imageUrl: primary?.url || null,
        imagePath: primary?.path || null,
        isFeatured: parsed.data.isFeatured ?? false,
        isAvailable: parsed.data.isAvailable ?? true,
        isActive: parsed.data.isActive ?? true,
        images: {
          create: cleanUploads.map((item, index) => ({
            url: item.url,
            path: item.path,
            alt: parsed.data.name,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/admin/productos");
    return { ok: true, message: "Producto creado correctamente." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear el producto." };
  }
}

export async function updateProductAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    visibleIngredients: formData.get("visibleIngredients"),
    estimatedDelivery: formData.get("estimatedDelivery"),
    priceFinal: formData.get("priceFinal"),
    isAvailable: boolFromForm(formData.get("isAvailable")),
    isActive: boolFromForm(formData.get("isActive")),
    isFeatured: boolFromForm(formData.get("isFeatured")),
  });
  if (!id || !parsed.success) return { ok: false, message: "Producto inválido." };

  try {
    const prisma = getPrisma();
    const slug = await uniqueProductSlug(parsed.data.name, id);
    const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
    const imageOrder = csvField(formData, "imageOrder");
    const newImageTokens = csvField(formData, "newImageTokens");
    const removedImageIds = csvField(formData, "removedImageIds");
    const uploaded = await Promise.all(files.map((file) => uploadBlobFile(file, "products")));
    const cleanUploads = uploaded.filter((item): item is { url: string; path: string } => Boolean(item));

    if (parsed.data.isFeatured) {
      await prisma.product.updateMany({ where: { id: { not: id } }, data: { isFeatured: false } });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug,
        categoryId: parsed.data.categoryId,
        description: parsed.data.description,
        visibleIngredients: parsed.data.visibleIngredients || null,
        estimatedDelivery: parsed.data.estimatedDelivery,
        priceFinal: parsed.data.priceFinal,
        isAvailable: parsed.data.isAvailable ?? true,
        isActive: parsed.data.isActive ?? true,
        isFeatured: parsed.data.isFeatured ?? false,
      },
      include: { images: true },
    });

    const existingById = new Map(product.images.map((image) => [image.id, image]));
    const newByToken = new Map(newImageTokens.map((token, index) => [token, cleanUploads[index]]));
    const orderedTokens = imageOrder.length
      ? imageOrder
      : [
          ...product.images
            .filter((image) => !removedImageIds.includes(image.id))
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((image) => `existing:${image.id}`),
          ...newImageTokens.map((token) => `new:${token}`),
        ];

    await prisma.$transaction(async (tx) => {
      if (removedImageIds.length) {
        await tx.productImage.deleteMany({
          where: { productId: id, id: { in: removedImageIds } },
        });
      }

      let primaryImage: { url: string; path: string | null } | null = null;
      let sortOrder = 0;

      for (const token of orderedTokens) {
        if (token.startsWith("existing:")) {
          const imageId = token.slice(9);
          const image = existingById.get(imageId);
          if (!image || removedImageIds.includes(imageId)) continue;

          const isPrimary = sortOrder === 0;
          await tx.productImage.update({
            where: { id: imageId },
            data: {
              alt: parsed.data.name,
              isPrimary,
              sortOrder,
            },
          });
          if (isPrimary) primaryImage = { url: image.url, path: image.path };
          sortOrder += 1;
          continue;
        }

        if (token.startsWith("new:")) {
          const upload = newByToken.get(token.slice(4));
          if (!upload) continue;

          const isPrimary = sortOrder === 0;
          await tx.productImage.create({
            data: {
              productId: id,
              url: upload.url,
              path: upload.path,
              alt: parsed.data.name,
              isPrimary,
              sortOrder,
            },
          });
          if (isPrimary) primaryImage = { url: upload.url, path: upload.path };
          sortOrder += 1;
        }
      }

      if (!primaryImage) {
        const fallback = product.images
          .filter((image) => !removedImageIds.includes(image.id))
          .sort((a, b) => a.sortOrder - b.sortOrder)[0];
        if (fallback) {
          primaryImage = { url: fallback.url, path: fallback.path };
        }
      }

      await tx.product.update({
        where: { id },
        data: {
          imageUrl: primaryImage?.url || null,
          imagePath: primaryImage?.path || null,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/admin/productos");
    return { ok: true, message: "Producto actualizado correctamente." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo actualizar el producto." };
  }
}

export async function toggleProductAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const field = String(formData.get("field") || "");
  if (!id || !["isActive", "isAvailable"].includes(field)) {
    return { ok: false, message: "Acción inválida." };
  }

  const product = await getPrisma().product.findUnique({ where: { id } });
  if (!product) return { ok: false, message: "Producto no encontrado." };

  const updated = await getPrisma().product.update({
    where: { id },
    data: field === "isActive" ? { isActive: !product.isActive } : { isAvailable: !product.isAvailable },
  });

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin/productos");
  return {
    ok: true,
    message:
      field === "isAvailable"
        ? `Disponibilidad: ${updated.isAvailable ? "disponible" : "agotado"}.`
        : `Producto ${updated.isActive ? "activado" : "desactivado"}.`,
  };
}

export async function deleteProductAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Producto inválido." };

  try {
    const prisma = getPrisma();
    const salesCount = await prisma.orderItem.count({ where: { productId: id } });
    if (salesCount > 0) {
      return { ok: false, message: "No se puede eliminar: este producto ya tiene ventas." };
    }

    await prisma.promotion.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/admin/productos");
    return { ok: true, message: "Producto eliminado." };
  } catch {
    return { ok: false, message: "No se pudo eliminar el producto." };
  }
}

export async function createIngredientAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    purchasePrice: formData.get("purchasePrice"),
    quantity: formData.get("quantity"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { ok: false, message: "Ingrediente inválido." };

  try {
    const costPerUnit = parsed.data.purchasePrice / parsed.data.quantity;
    await getPrisma().ingredient.create({
      data: {
        name: parsed.data.name,
        unit: parsed.data.unit,
        lastPurchasePrice: parsed.data.purchasePrice,
        lastPurchaseQuantity: parsed.data.quantity,
        costPerUnit,
        purchases: {
          create: {
            purchasePrice: parsed.data.purchasePrice,
            quantity: parsed.data.quantity,
            unit: parsed.data.unit,
            costPerUnit,
            notes: parsed.data.notes || null,
          },
        },
      },
    });

    revalidatePath("/admin/ingredientes");
    return { ok: true, message: "Ingrediente creado." };
  } catch {
    return { ok: false, message: "No se pudo crear el ingrediente." };
  }
}

export async function updateIngredientAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    purchasePrice: formData.get("purchasePrice"),
    quantity: formData.get("quantity"),
    notes: formData.get("notes"),
  });
  if (!id || !parsed.success) return { ok: false, message: "Ingrediente inválido." };

  try {
    const costPerUnit = parsed.data.purchasePrice / parsed.data.quantity;
    await getPrisma().ingredient.update({
      where: { id },
      data: {
        name: parsed.data.name,
        unit: parsed.data.unit,
        lastPurchasePrice: parsed.data.purchasePrice,
        lastPurchaseQuantity: parsed.data.quantity,
        costPerUnit,
        purchases: {
          create: {
            purchasePrice: parsed.data.purchasePrice,
            quantity: parsed.data.quantity,
            unit: parsed.data.unit,
            costPerUnit,
            notes: parsed.data.notes || "Actualización de ingrediente",
          },
        },
      },
    });

    revalidatePath("/admin/ingredientes");
    revalidatePath("/admin/recetas");
    return { ok: true, message: "Ingrediente actualizado." };
  } catch {
    return { ok: false, message: "No se pudo actualizar el ingrediente." };
  }
}

export async function deleteIngredientAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Ingrediente inválido." };

  try {
    const prisma = getPrisma();
    const oldRecipeUses = await prisma.recipeIngredient.count({ where: { ingredientId: id } });
    if (oldRecipeUses > 0) {
      return {
        ok: false,
        message: "No se puede eliminar porque está usado en una receta antigua.",
      };
    }

    await prisma.ingredient.delete({ where: { id } });
    revalidatePath("/admin/ingredientes");
    revalidatePath("/admin/recetas");
    return { ok: true, message: "Ingrediente eliminado." };
  } catch {
    return { ok: false, message: "No se pudo eliminar el ingrediente." };
  }
}

export async function createProductionBatchAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = productionBatchSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    producedQuantity: formData.get("producedQuantity"),
    desiredMarginPercent: formData.get("desiredMarginPercent") || undefined,
    desiredProfitAmount: formData.get("desiredProfitAmount") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Completa el lote correctamente." };
  }

  const ingredientIds = formDataList(formData, "ingredientId");
  const itemNames = formDataList(formData, "itemName");
  const quantities = formDataList(formData, "itemQuantity");
  const units = formDataList(formData, "itemUnit");
  const costs = formDataList(formData, "itemCost");

  try {
    const prisma = getPrisma();
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product) return { ok: false, message: "Producto no encontrado." };

    const selectedIngredientIds = ingredientIds.filter((id) => id && id !== "none");
    const ingredients = selectedIngredientIds.length
      ? await prisma.ingredient.findMany({ where: { id: { in: selectedIngredientIds } } })
      : [];
    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

    const items = costs
      .map((costValue, index) => {
        const totalCost = Number(costValue);
        const ingredientId = ingredientIds[index] && ingredientIds[index] !== "none" ? ingredientIds[index] : null;
        const ingredient = ingredientId ? ingredientById.get(ingredientId) : null;
        const name = itemNames[index] || ingredient?.name || "";
        const quantity = quantities[index] ? Number(quantities[index]) : null;
        const unit = units[index] || ingredient?.unit || null;

        if (!name || !Number.isFinite(totalCost) || totalCost <= 0) return null;

        return {
          ingredientId,
          name,
          quantity: quantity && Number.isFinite(quantity) && quantity > 0 ? quantity : null,
          unit,
          totalCost,
        };
      })
      .filter((item): item is {
        ingredientId: string | null;
        name: string;
        quantity: number | null;
        unit: string | null;
        totalCost: number;
      } => Boolean(item));

    if (!items.length) {
      return { ok: false, message: "Agrega al menos un ingrediente o costo del lote." };
    }

    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const costPerUnit = totalCost / parsed.data.producedQuantity;
    const margin =
      typeof parsed.data.desiredMarginPercent === "number" ? parsed.data.desiredMarginPercent : null;
    const profit =
      typeof parsed.data.desiredProfitAmount === "number" ? parsed.data.desiredProfitAmount : null;
    const suggestedPrice = calculateSuggestedPrice({
      cost: costPerUnit,
      marginPercent: margin,
      profitAmount: profit,
    });

    await prisma.$transaction(async (tx) => {
      await tx.productCostBatch.create({
        data: {
          productId: product.id,
          name: parsed.data.name,
          producedQuantity: parsed.data.producedQuantity,
          totalCost,
          costPerUnit,
          desiredMarginPercent: margin,
          desiredProfitAmount: profit,
          suggestedPrice,
          notes: parsed.data.notes || null,
          items: {
            create: items.map((item) => ({
              ingredientId: item.ingredientId,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              totalCost: item.totalCost,
            })),
          },
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          suggestedPrice,
          desiredMarginPercent: margin,
          desiredProfitAmount: profit,
        },
      });
    });

    revalidatePath("/admin/recetas");
    revalidatePath("/admin/productos");
    return {
      ok: true,
      message: "Costo guardado. El precio del producto no cambió.",
    };
  } catch {
    return { ok: false, message: "No se pudo guardar el costo de producción." };
  }
}

export async function applyProductionBatchPriceAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const batchId = String(formData.get("batchId") || "");
  const manualPrice = Number(formData.get("manualPrice") || 0);
  if (!batchId) return { ok: false, message: "Cálculo inválido." };

  try {
    const prisma = getPrisma();
    const batch = await prisma.productCostBatch.findUnique({ where: { id: batchId } });
    if (!batch) return { ok: false, message: "Cálculo no encontrado." };

    const priceFinal = Number.isFinite(manualPrice) && manualPrice > 0
      ? manualPrice
      : toNumber(batch.suggestedPrice);

    await prisma.product.update({
      where: { id: batch.productId },
      data: {
        priceFinal,
        suggestedPrice: batch.suggestedPrice,
        desiredMarginPercent: batch.desiredMarginPercent,
        desiredProfitAmount: batch.desiredProfitAmount,
      },
    });

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/admin/recetas");
    revalidatePath("/admin/productos");
    return { ok: true, message: "Precio del producto actualizado." };
  } catch {
    return { ok: false, message: "No se pudo aplicar el precio." };
  }
}

async function setPaymentStatusAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdminAction();
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  if (!orderId || !["PENDING", "EN_VALIDACION", "PROOF_RECEIVED", "PAID", "REJECTED"].includes(status)) {
    return { ok: false, message: "Acción inválida." };
  }

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { sinpeProof: true } });
  if (!order) return { ok: false, message: "Pedido no encontrado." };
  if (order.paymentStatus === "PAID") {
    return { ok: false, message: "Este pedido ya esta marcado como pagado." };
  }
  if (order.paymentStatus === "REJECTED") {
    return { ok: false, message: "Este pago ya fue rechazado." };
  }
  if (order.orderStatus === "CANCELLED") {
    return { ok: false, message: "No se puede actualizar el pago de un pedido cancelado." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: status as "PENDING" | "EN_VALIDACION" | "PROOF_RECEIVED" | "PAID" | "REJECTED",
      orderStatus: status === "PAID" && order.orderStatus === "NEW" ? "CONFIRMED" : order.orderStatus,
    },
  });

  if (order.sinpeProof && (status === "PAID" || status === "REJECTED")) {
    await prisma.sinpePaymentProof.update({
      where: { orderId },
      data: {
        reviewedAt: new Date(),
        reviewedById: admin.id,
        rejectionReason: status === "REJECTED" ? "Comprobante rechazado por administración." : null,
      },
    });
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return {
    ok: true,
    message: status === "PAID" ? "Pago marcado como pagado." : "Estado de pago actualizado.",
  };
}

export async function approvePaymentAction(formData: FormData): Promise<ActionResult> {
  formData.set("status", "PAID");
  return setPaymentStatusAction(formData);
}

export async function rejectPaymentAction(formData: FormData): Promise<ActionResult> {
  formData.set("status", "REJECTED");
  return setPaymentStatusAction(formData);
}

export async function markCashPaidAction(formData: FormData): Promise<ActionResult> {
  formData.set("status", "PAID");
  return setPaymentStatusAction(formData);
}

export async function setOrderStatusAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  if (!orderId || !["NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"].includes(status)) {
    return { ok: false, message: "Estado inválido." };
  }

  const order = await getPrisma().order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, message: "Pedido no encontrado." };
  if (order.paymentStatus === "REJECTED" && status === "DELIVERED") {
    return { ok: false, message: "No se puede entregar un pedido con pago rechazado." };
  }
  if (order.orderStatus === "CANCELLED" && status !== "CANCELLED") {
    return { ok: false, message: "Este pedido esta cancelado." };
  }

  await getPrisma().order.update({
    where: { id: orderId },
    data: {
      orderStatus: status as "NEW" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED",
      paymentStatus:
        status === "DELIVERED" && order.paymentStatus !== "REJECTED"
          ? "PAID"
          : order.paymentStatus,
    },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return {
    ok: true,
    message: status === "CANCELLED" ? "Pedido cancelado. No se contará en el panel." : "Estado del pedido actualizado.",
  };
}

export async function moderateReviewAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["APPROVED", "REJECTED"].includes(status)) {
    return { ok: false, message: "Acción inválida." };
  }

  await getPrisma().review.update({
    where: { id },
    data: {
      status: status as "APPROVED" | "REJECTED",
      approvedAt: status === "APPROVED" ? new Date() : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/resenas");
  return {
    ok: true,
    message: status === "APPROVED" ? "Resena aprobada." : "Resena rechazada.",
  };
}

export async function deleteReviewAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Resena invalida." };

  await getPrisma().review.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/resenas");
  return { ok: true, message: "Resena eliminada." };
}

export async function createPromotionAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = promotionSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    useCode: formData.get("useCode"),
    scope: formData.get("scope") || "ALL",
    type: "PERCENTAGE",
    value: formData.get("value"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    productId: formData.get("productId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Promocion invalida." };

  try {
    const selectedProductId = parsed.data.productId && parsed.data.productId !== "none" ? parsed.data.productId : null;
    const selectedCategoryId = parsed.data.categoryId && parsed.data.categoryId !== "none" ? parsed.data.categoryId : null;
    const productId = parsed.data.scope === "PRODUCT" ? selectedProductId : null;
    const categoryId = parsed.data.scope === "CATEGORY" ? selectedCategoryId : null;

    if (parsed.data.scope === "PRODUCT" && !productId) {
      return { ok: false, message: "Elige el producto al que aplica la promoción." };
    }
    if (parsed.data.scope === "CATEGORY" && !categoryId) {
      return { ok: false, message: "Elige la categoría a la que aplica la promoción." };
    }
    const startsAt = new Date(`${parsed.data.startsAt}T00:00:00`);
    const endsAt = new Date(`${parsed.data.endsAt}T23:59:59`);
    if (endsAt < startsAt) {
      return { ok: false, message: "La fecha de fin debe ser posterior o igual a la fecha de inicio." };
    }

    const shouldUseCode = Boolean(parsed.data.useCode);
    const code = shouldUseCode
      ? normalizePromotionCode(parsed.data.code || "") || await generatePromotionCode()
      : null;
    if (code && (code.length < 4 || code.length > 8)) {
      return { ok: false, message: "El código debe tener de 4 a 8 caracteres." };
    }

    await getPrisma().promotion.create({
      data: {
        name: parsed.data.name,
        code,
        type: "PERCENTAGE",
        value: parsed.data.value,
        startsAt,
        endsAt,
        productId,
        categoryId,
      },
    });

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/admin/promociones");
    return { ok: true, message: "Promocion creada." };
  } catch {
    return { ok: false, message: "No se pudo crear la promoción." };
  }
}

export async function deletePromotionAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Promocion invalida." };

  try {
    await getPrisma().promotion.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/admin/promociones");
    return { ok: true, message: "Promocion eliminada." };
  } catch {
    return { ok: false, message: "No se pudo eliminar la promoción." };
  }
}

export async function updateCustomRequestAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const rawPrice = formData.get("price");
  const rawPaymentMethod = formData.get("paymentMethod");
  const rawAdminNotes = formData.get("adminNotes");
  const parsed = customRequestAdminSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    price: rawPrice === null ? undefined : rawPrice,
    paymentMethod: rawPaymentMethod === null ? undefined : rawPaymentMethod,
    adminNotes: rawAdminNotes === null ? undefined : rawAdminNotes,
  });
  if (!parsed.success) return { ok: false, message: "Completa la solicitud correctamente." };

  try {
    const prisma = getPrisma();
    const request = await prisma.customDessertRequest.findUnique({
      where: { id: parsed.data.id },
      include: { order: true },
    });
    if (!request) return { ok: false, message: "Solicitud no encontrada." };

    if (parsed.data.status !== "ACCEPTED") {
      await prisma.customDessertRequest.update({
        where: { id: parsed.data.id },
        data: {
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes || request.adminNotes,
        },
      });
      revalidatePath("/admin/pedidos");
      revalidatePath("/cuenta");
      return { ok: true, message: "Solicitud actualizada." };
    }

    if (request.orderId) {
      return { ok: false, message: "Esta solicitud ya tiene un pedido asociado." };
    }
    const price = typeof parsed.data.price === "number" ? parsed.data.price : 0;
    if (price <= 0 || !parsed.data.paymentMethod) {
      return { ok: false, message: "Para aceptar, indica precio y metodo de pago." };
    }

    const number = await nextOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        customerEmail: request.customerEmail,
        deliveryNotes: parsed.data.adminNotes || request.notes || null,
        subtotal: price,
        discountTotal: 0,
        total: price,
        paymentMethod: parsed.data.paymentMethod,
        paymentStatus: "PENDING",
        orderStatus: "CONFIRMED",
        items: {
          create: {
            productId: null,
            productName: "Pedido personalizado",
            imageUrl: request.imageUrl,
            estimatedDelivery: request.desiredDate ? request.desiredDate.toLocaleDateString("es-CR") : null,
            reviewCode: null,
            unitPrice: price,
            quantity: 1,
            lineTotal: price,
          },
        },
      },
    });

    await prisma.customDessertRequest.update({
      where: { id: parsed.data.id },
      data: {
        status: "ACCEPTED",
        adminNotes: parsed.data.adminNotes || request.adminNotes,
        orderId: order.id,
      },
    });

    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    revalidatePath("/cuenta");
    return { ok: true, message: `Solicitud aceptada. Pedido #${number} creado.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo actualizar la solicitud." };
  }
}

export async function updateSiteSettingsAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = siteSettingsSchema.safeParse({
    heroEyebrow: formData.get("heroEyebrow"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
    heroNotice: formData.get("heroNotice"),
    refundPolicy: formData.get("refundPolicy"),
  });
  if (!parsed.success) return { ok: false, message: "Completa los ajustes correctamente." };

  try {
    const file = formData.get("heroImage");
    const uploaded = file instanceof File && file.size > 0 ? await uploadBlobFile(file, "site") : null;

    await getPrisma().siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...parsed.data,
        heroImageUrl: uploaded?.url || null,
        heroImagePath: uploaded?.path || null,
      },
      update: {
        ...parsed.data,
        ...(uploaded
          ? {
              heroImageUrl: uploaded.url,
              heroImagePath: uploaded.path,
            }
          : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/ajustes");
    return { ok: true, message: "Ajustes actualizados." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudieron guardar los ajustes." };
  }
}

export async function createOrderAdjustmentAction(formData: FormData): Promise<ActionResult> {
  await requireAdminAction();
  const parsed = orderAdjustmentSchema.safeParse({
    orderId: formData.get("orderId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, message: "Completa el registro correctamente." };

  try {
    const order = await getPrisma().order.findUnique({ where: { id: parsed.data.orderId } });
    if (!order) return { ok: false, message: "Pedido no encontrado." };
    if (order.orderStatus === "CANCELLED" && parsed.data.type === "DISCOUNT") {
      return { ok: false, message: "No registres descuentos sobre pedidos cancelados." };
    }

    const amount = Number(parsed.data.amount);
    if (parsed.data.type === "DISCOUNT" && amount >= toNumber(order.total)) {
      return { ok: false, message: "El descuento debe ser menor que el total actual." };
    }

    await getPrisma().$transaction(async (tx) => {
      await tx.orderAdjustment.create({
        data: {
          orderId: parsed.data.orderId,
          type: parsed.data.type,
          amount,
          reason: parsed.data.reason,
        },
      });

      if (parsed.data.type === "DISCOUNT") {
        await tx.order.update({
          where: { id: parsed.data.orderId },
          data: {
            discountTotal: { increment: amount },
            total: { decrement: amount },
          },
        });
      }
    });

    revalidatePath("/admin/buscar-pedido");
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    revalidatePath("/cuenta");
    return {
      ok: true,
      message: parsed.data.type === "REFUND" ? "Devolucion registrada." : "Descuento registrado.",
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo registrar el ajuste." };
  }
}
