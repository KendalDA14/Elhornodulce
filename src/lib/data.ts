import { getPrisma } from "@/lib/prisma";
import {
  sampleCategories,
  sampleDashboardMetrics,
  sampleProducts,
  sampleReviews,
  sampleSalesMetrics,
} from "@/lib/sample-data";
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

export const defaultSiteSettings = {
  id: "default",
  heroImageUrl: null as string | null,
  heroImagePath: null as string | null,
  heroEyebrow: "Horneado por encargo",
  heroTitle: "El horno dulce",
  heroDescription:
    "Postres hechos en lotes pequeños, con catálogo listo para pedir y opciones personalizadas para celebraciones.",
  heroNotice:
    "Algunos postres pueden estar disponibles para entrega inmediata. Los pedidos por encargo se preparan con tiempo estimado de 24 a 48 horas.",
  refundPolicy:
    "Las devoluciones se revisan caso por caso. Si el pedido presenta un problema atribuible a la preparación o entrega coordinada, se puede ofrecer reposición, descuento o devolución parcial según corresponda. Los pedidos personalizados no se cancelan una vez iniciada la preparación.",
};

export async function getSiteSettings() {
  try {
    const settings = await getPrisma().siteSettings.findUnique({ where: { id: "default" } });
    return settings || defaultSiteSettings;
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
  category: { name: string };
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
  };
}

export async function getFeaturedProducts(): Promise<PublicProduct[]> {
  try {
    const products = await getPrisma().product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        ratings: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const promotions = await getActivePromotions();
    return products.length ? products.map((product) => publicProduct(product, promotions)) : sampleProducts;
  } catch {
    return sampleProducts;
  }
}

export async function getCatalog(): Promise<PublicCategory[]> {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
            ratings: { orderBy: { createdAt: "desc" } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const promotions = await getActivePromotions();
    const mapped = categories
      .filter((category) => category.products.length > 0)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        products: category.products.map((product) =>
          publicProduct({ ...product, category: { name: category.name } }, promotions),
        ),
      }));

    return mapped.length ? mapped : sampleCategories;
  } catch {
    return sampleCategories;
  }
}

export async function getApprovedReviews(): Promise<PublicReview[]> {
  try {
    const reviews = await getPrisma().review.findMany({
      where: { status: "APPROVED" },
      orderBy: { approvedAt: "desc" },
      take: 6,
    });

    return reviews.length
      ? reviews.map((review) => ({
          id: review.id,
          customerName: review.isAnonymous ? "Anonimo" : review.customerName || "Anonimo",
          rating: review.rating,
          comment: review.comment,
        }))
      : sampleReviews;
  } catch {
    return sampleReviews;
  }
}

export async function getStarProduct(): Promise<PublicProduct | null> {
  try {
    const product = await getPrisma().product.findFirst({
      where: { isActive: true, isAvailable: true, isFeatured: true },
      include: {
        category: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        ratings: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    const promotions = await getActivePromotions();
    return product ? publicProduct(product, promotions) : sampleProducts.find((item) => item.isFeatured) || sampleProducts[0] || null;
  } catch {
    return sampleProducts.find((item) => item.isFeatured) || sampleProducts[0] || null;
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
      metrics: sampleDashboardMetrics,
      best: sampleSalesMetrics,
      slow: sampleSalesMetrics,
    };
  }
}

export async function getAdminLists() {
  try {
    const prisma = getPrisma();
    const [categories, products, ingredients] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.product.findMany({
        include: { category: true, recipe: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    ]);

    return { categories, products, ingredients };
  } catch {
    return { categories: [], products: [], ingredients: [] };
  }
}
