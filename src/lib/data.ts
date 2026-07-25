import { getPrisma } from "@/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { currency, toNumber } from "@/lib/format";
import {
  applyBestPromotion,
  getActivePromotions,
  type PromotionForPricing,
} from "@/lib/promotions";
import type {
  DashboardMetric,
  ProductSalesMetric,
  PublicCategory,
  PublicProduct,
  PublicReview,
} from "@/types/shop";

const defaultSiteSettings = {
  id: "default",
  heroImageUrl: null as string | null,
  heroImagePath: null as string | null,
  heroEyebrow: "Postres caseros en Liberia",
  heroTitle: "El horno dulce",
  heroDescription:
    "Postres hechos en lotes pequeños, con catálogo listo para pedir y opciones personalizadas para celebraciones.",
  heroNotice:
    "Algunos postres están disponibles para entrega inmediata. También preparamos pedidos especiales con 24 a 48 horas de anticipación.",
  aboutImageUrl: null as string | null,
  aboutImagePath: null as string | null,
  aboutEyebrow: "Desde Liberia",
  aboutTitle: "Postres caseros para compartir",
  aboutDescription:
    "El horno dulce nació en Liberia para compartir postres caseros hechos en pequeños lotes. Preparamos por encargo y también ofrecemos opciones listas cuando hay disponibilidad.",
  refundReviewText:
    "Revisamos tu número de pedido, comprobante y detalles del caso para entender bien qué ocurrió.",
  refundReplacementText:
    "Si aplica, coordinamos una solución justa: reposición del producto o un descuento compensatorio.",
  refundPartialText:
    "Cuando sea la mejor opción, valoramos una devolución parcial según el caso y el estado del pedido.",
  refundPolicy:
    "Las devoluciones se revisan caso por caso. Si el pedido presenta un problema atribuible a la preparación o entrega coordinada, se puede ofrecer reposición, descuento o devolución parcial según corresponda. Los pedidos personalizados no se cancelan una vez iniciada la preparación.",
};

export async function getSiteSettings() {
  try {
    const settings = await getPrisma().siteSettings.findUnique({ where: { id: "default" } });
    if (!settings) return defaultSiteSettings;

    return {
      ...settings,
      heroEyebrow:
        settings.heroEyebrow.trim().toLowerCase() === "horneado por encargo"
          ? defaultSiteSettings.heroEyebrow
          : settings.heroEyebrow,
      heroNotice:
        settings.heroNotice.trim() ===
        "Algunos postres pueden estar disponibles para entrega inmediata. Los pedidos por encargo se preparan con tiempo estimado de 24 a 48 horas."
          ? defaultSiteSettings.heroNotice
          : settings.heroNotice,
      aboutEyebrow: settings.aboutEyebrow || defaultSiteSettings.aboutEyebrow,
      aboutTitle: settings.aboutTitle || defaultSiteSettings.aboutTitle,
      aboutDescription: settings.aboutDescription || defaultSiteSettings.aboutDescription,
      refundReviewText: settings.refundReviewText || defaultSiteSettings.refundReviewText,
      refundReplacementText:
        settings.refundReplacementText || defaultSiteSettings.refundReplacementText,
      refundPartialText:
        settings.refundPartialText || settings.refundPolicy || defaultSiteSettings.refundPartialText,
    };
  } catch {
    return defaultSiteSettings;
  }
}

function publicProduct(product: {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  images: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
  visibleIngredients: string | null;
  estimatedDelivery: string;
  isFeatured: boolean;
  ratings?: { id: string; customerName: string; rating: number; comment: string | null }[];
  priceFinal: unknown;
  isAvailable: boolean;
  category: { name: string; slug: string };
}, promotions: PromotionForPricing[] = []): PublicProduct {
  const images = product.images.length
    ? product.images
    : product.imageUrl
      ? [{ id: `${product.id}-main`, url: product.imageUrl, alt: product.name, isPrimary: true }]
      : [];
  const primary = images.find((image) => image.isPrimary) || images[0];
  const pricing = applyBestPromotion(product, promotions);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    imageUrl: primary?.url || product.imageUrl,
    images,
    visibleIngredients: product.visibleIngredients,
    estimatedDelivery: product.estimatedDelivery,
    isFeatured: product.isFeatured,
    averageRating: product.ratings?.length
      ? product.ratings.reduce((sum, item) => sum + item.rating, 0) / product.ratings.length
      : 5,
    ratingCount: product.ratings?.length || 0,
    productReviews:
      product.ratings
        ?.filter((item) => item.comment?.trim())
        .map((item) => ({
          id: item.id,
          customerName: item.customerName,
          rating: item.rating,
          comment: item.comment,
        })) || [],
    originalPrice: pricing.originalPrice,
    discountPercent: pricing.discountPercent,
    promotionName: pricing.promotionName,
    promotionEndsAt: pricing.promotionEndsAt?.toISOString() || null,
    priceFinal: pricing.finalPrice,
    isAvailable: product.isAvailable,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
  };
}

export async function getFeaturedProducts(): Promise<PublicProduct[]> {
  try {
    const products = await getPrisma().product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        ratings: { orderBy: { createdAt: "desc" }, take: 100 },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const promotions = await getActivePromotions();
    return products.map((product) => publicProduct(product, promotions));
  } catch {
    return [];
  }
}

export const getCatalogPage = unstable_cache(async function getCatalogPage(
  page: number,
  perPage: number,
) {
  try {
    const prisma = getPrisma();
    const where = {
      isActive: true,
      category: { isActive: true },
    };
    const [categories, totalProducts, products, promotions] = await Promise.all([
      prisma.category.findMany({
        where: {
          isActive: true,
          products: { some: { isActive: true } },
        },
        select: { id: true, name: true, slug: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
          ratings: { orderBy: { createdAt: "desc" }, take: 100 },
        },
        orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      getActivePromotions(),
    ]);

    return {
      categories,
      totalProducts,
      products: products.map((product) => publicProduct(product, promotions)),
    };
  } catch {
    return { categories: [], totalProducts: 0, products: [] as PublicProduct[] };
  }
}, ["public-catalog-page"], { revalidate: 30, tags: ["public-catalog"] });

export const getProductBySlug = cache(async function getProductBySlug(
  slug: string,
): Promise<PublicProduct | null> {
  try {
    const product = await getPrisma().product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        ratings: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });

    if (!product) return null;

    const promotions = await getActivePromotions();
    return publicProduct(product, promotions);
  } catch {
    return null;
  }
});

export const getCategoryBySlug = cache(async function getCategoryBySlug(
  slug: string,
): Promise<PublicCategory | null> {
  try {
    const category = await getPrisma().category.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
            ratings: { orderBy: { createdAt: "desc" }, take: 100 },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!category || category.products.length === 0) return null;

    const promotions = await getActivePromotions();
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      products: category.products.map((product) =>
        publicProduct(
          {
            ...product,
            category: { name: category.name, slug: category.slug },
          },
          promotions,
        ),
      ),
    };
  } catch {
    return null;
  }
});

export async function getApprovedReviews(): Promise<PublicReview[]> {
  try {
    const reviews = await getPrisma().review.findMany({
      where: { status: "APPROVED" },
      orderBy: { approvedAt: "desc" },
      take: 6,
    });

    return reviews.map((review) => ({
      id: review.id,
      customerName: review.isAnonymous ? "Anonimo" : review.customerName || "Anonimo",
      rating: review.rating,
      comment: review.comment,
    }));
  } catch {
    return [];
  }
}

export async function getStarProduct(): Promise<PublicProduct | null> {
  try {
    const product = await getPrisma().product.findFirst({
      where: { isActive: true, isAvailable: true, isFeatured: true },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        ratings: { orderBy: { createdAt: "desc" }, take: 100 },
      },
      orderBy: { createdAt: "asc" },
    });

    const promotions = await getActivePromotions();
    return product ? publicProduct(product, promotions) : null;
  } catch {
    return null;
  }
}

export async function getAdminDashboard(): Promise<{
  metrics: DashboardMetric[];
  best: ProductSalesMetric[];
  slow: ProductSalesMetric[];
}> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidClosedWhere = {
      OR: [{ paymentStatus: "PAID" as const }, { orderStatus: "DELIVERED" as const }],
      paymentStatus: { not: "REJECTED" as const },
      orderStatus: { not: "CANCELLED" as const },
    };
    const [orders, monthlyOrders, pendingProofs] = await Promise.all([
      getPrisma().order.findMany({
        where: paidClosedWhere,
        include: { items: true, adjustments: true },
      }),
      getPrisma().order.findMany({
        where: { ...paidClosedWhere, createdAt: { gte: startOfMonth } },
        include: { items: true, adjustments: true },
      }),
      getPrisma().sinpePaymentProof.count({
        where: { uploadedAt: { not: null }, reviewedAt: null },
      }),
    ]);

    const netOrderTotal = (order: (typeof orders)[number]) => {
      const refunds = order.adjustments
        .filter((adjustment) => adjustment.type === "REFUND")
        .reduce((sum, adjustment) => sum + toNumber(adjustment.amount), 0);
      return Math.max(0, toNumber(order.total) - refunds);
    };
    const totalSales = orders.reduce((total, order) => total + netOrderTotal(order), 0);
    const monthlySales = monthlyOrders.reduce((total, order) => total + netOrderTotal(order), 0);
    const newOrders = await getPrisma().order.count({ where: { orderStatus: "NEW" } });
    const productMap = new Map<string, ProductSalesMetric>();
    orders.flatMap((order) => order.items).forEach((item) => {
      const current = productMap.get(item.productName) || { name: item.productName, quantity: 0, total: 0 };
      current.quantity += item.quantity;
      current.total += toNumber(item.lineTotal);
      productMap.set(item.productName, current);
    });
    const productMetrics = [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    return {
      metrics: [
        { label: "Ventas totales", value: currency(totalSales), helper: "Pedidos pagados o entregados." },
        { label: "Ventas del mes", value: currency(monthlySales), helper: "Pedidos del mes pagados o entregados." },
        { label: "Pedidos nuevos", value: String(newOrders), helper: "Requieren revision." },
        { label: "Comprobantes pendientes", value: String(pendingProofs), helper: "SINPE manual." },
      ],
      best: productMetrics,
      slow: [...productMetrics].reverse(),
    };
  } catch {
    return {
      metrics: [
        { label: "Ventas totales", value: currency(0), helper: "Sin ventas registradas." },
        { label: "Ventas del mes", value: currency(0), helper: "Sin ventas registradas este mes." },
        { label: "Pedidos nuevos", value: "0", helper: "Sin pedidos pendientes." },
        { label: "Comprobantes pendientes", value: "0", helper: "SINPE manual." },
      ],
      best: [],
      slow: [],
    };
  }
}

export async function getAdminProducts() {
  try {
    return await getPrisma().product.findMany({
      include: {
        category: { select: { name: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getAdminIngredients() {
  try {
    return await getPrisma().ingredient.findMany({ orderBy: { name: "asc" } });
  } catch {
    return [];
  }
}

export async function getPromotionOptions() {
  try {
    const prisma = getPrisma();
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      }),
    ]);

    return { categories, products };
  } catch {
    return { categories: [], products: [] };
  }
}
