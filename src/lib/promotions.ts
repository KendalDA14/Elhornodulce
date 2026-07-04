import { toNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import type { PromotionTickerItem } from "@/types/shop";

export type PromotionForPricing = {
  id: string;
  name: string;
  code: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: unknown;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  productId: string | null;
  categoryId: string | null;
  product?: { name: string } | null;
  category?: { name: string } | null;
};

export type PromotionPricing = {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercent: number | null;
  promotionId: string | null;
  promotionName: string | null;
  promotionEndsAt: Date | null;
};

export function isPromotionActive(promotion: PromotionForPricing, now = new Date()) {
  return promotion.isActive && promotion.startsAt <= now && promotion.endsAt >= now;
}

export function promotionAppliesToProduct(
  promotion: PromotionForPricing,
  product: { id: string; categoryId: string },
) {
  if (promotion.productId) return promotion.productId === product.id;
  if (promotion.categoryId) return promotion.categoryId === product.categoryId;
  return true;
}

export function promotionScopeLabel(promotion: PromotionForPricing) {
  if (promotion.productId) return promotion.product?.name || "el producto seleccionado";
  if (promotion.categoryId) return promotion.category?.name || "la categoria seleccionada";
  return "todos los productos";
}

export function applyBestPromotion(
  product: { id: string; categoryId: string; priceFinal: unknown },
  promotions: PromotionForPricing[],
): PromotionPricing {
  const originalPrice = toNumber(product.priceFinal);
  const activeMatches = promotions.filter((promotion) => promotionAppliesToProduct(promotion, product));

  const best = activeMatches.reduce<PromotionPricing>(
    (current, promotion) => {
      const value = toNumber(promotion.value);
      const discountAmount =
        promotion.type === "PERCENTAGE"
          ? originalPrice * Math.min(Math.max(value, 1), 100) / 100
          : Math.min(value, originalPrice);
      const finalPrice = Math.max(0, originalPrice - discountAmount);

      if (discountAmount <= current.discountAmount) return current;

      return {
        originalPrice,
        finalPrice,
        discountAmount,
        discountPercent:
          promotion.type === "PERCENTAGE"
            ? Math.round(Math.min(Math.max(value, 1), 100))
            : Math.round((discountAmount / originalPrice) * 100),
        promotionId: promotion.id,
        promotionName: promotion.name,
        promotionEndsAt: promotion.endsAt,
      };
    },
    {
      originalPrice,
      finalPrice: originalPrice,
      discountAmount: 0,
      discountPercent: null,
      promotionId: null,
      promotionName: null,
      promotionEndsAt: null,
    },
  );

  return best;
}

export async function getActivePromotions(now = new Date()): Promise<PromotionForPricing[]> {
  try {
    return await getPrisma().promotion.findMany({
      where: {
        isActive: true,
        code: null,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getActivePromotionByCode(code: string, now = new Date()): Promise<PromotionForPricing | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  try {
    return await getPrisma().promotion.findFirst({
      where: {
        code: normalized,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        product: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function getPromotionTickerItems(now = new Date()): Promise<PromotionTickerItem[]> {
  try {
    const promotions = await getPrisma().promotion.findMany({
      where: {
        isActive: true,
        code: null,
        type: "PERCENTAGE",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        product: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { endsAt: "asc" },
      take: 8,
    });

    return promotions.map((promotion) => ({
      id: promotion.id,
      name: promotion.name,
      discountPercent: Math.round(Math.min(Math.max(toNumber(promotion.value), 1), 100)),
      scope: promotion.product?.name || promotion.category?.name || "todos los postres",
      endsAt: promotion.endsAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
