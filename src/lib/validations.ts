import { z } from "zod";

const paymentMethodSchema = z.enum(["SINPE", "CASH"]);

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Indica tu nombre.").max(80, "Usa un nombre más corto."),
    customerPhone: z
      .string()
      .trim()
      .min(8, "Indica un teléfono válido.")
      .max(24, "Indica un teléfono válido.")
      .regex(/^[+()\d\s-]+$/, "Indica un teléfono válido."),
    deliveryNotes: z.string().trim().max(800, "Las notas son demasiado largas.").optional(),
    promoCode: z.string().trim().max(32, "El código es demasiado largo.").optional(),
    paymentMethod: paymentMethodSchema,
    items: z
      .array(
        z.object({
          productId: z.string().min(1).max(191),
          quantity: z.number().int().positive().max(50),
        }),
      )
      .min(1, "El carrito está vacío.")
      .max(30, "El carrito tiene demasiados productos."),
  })
  .superRefine((value, ctx) => {
    const productIds = new Set<string>();
    for (const [index, item] of value.items.entries()) {
      if (productIds.has(item.productId)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "El carrito contiene productos duplicados.",
        });
      }
      productIds.add(item.productId);
    }
  });

export const reviewSchema = z.object({
  publishMode: z.enum(["named", "anonymous"]),
  customerName: z.string().trim().max(80, "Usa un nombre más corto.").optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(600),
}).superRefine((value, ctx) => {
  if (value.publishMode === "named" && !value.customerName?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["customerName"],
      message: "Indica tu nombre o publícalo como anónimo.",
    });
  }
});

export const customRequestSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: z.string().trim().min(8).max(24).regex(/^[+()\d\s-]+$/),
  description: z.string().trim().min(10).max(1_500),
  desiredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00`)), "Fecha inválida."),
  notes: z.string().trim().max(800).optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().min(1).max(191),
  description: z.string().trim().min(10).max(5_000),
  visibleIngredients: z.string().trim().max(2_000).optional(),
  estimatedDelivery: z.string().trim().min(2).max(120),
  priceFinal: z.coerce.number().positive().max(99_999_999),
  isAvailable: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1_000).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const ingredientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  unit: z.string().trim().min(1).max(40),
  purchasePrice: z.coerce.number().positive().max(99_999_999),
  quantity: z.coerce.number().positive().max(99_999_999),
  notes: z.string().trim().max(800).optional(),
});

export const productionBatchSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(2).max(80),
  producedQuantity: z.coerce.number().positive().max(99_999_999),
  desiredMarginPercent: z.coerce.number().min(0).max(95).optional().or(z.literal("")),
  desiredProfitAmount: z.coerce.number().min(0).max(99_999_999).optional().or(z.literal("")),
  notes: z.string().trim().max(800).optional(),
});

export const promotionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(8).optional(),
  useCode: z.coerce.boolean().optional(),
  scope: z.enum(["ALL", "CATEGORY", "PRODUCT"]).default("ALL"),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).default("PERCENTAGE"),
  value: z.coerce.number().int().min(1).max(100),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
});

export const siteSettingsSchema = z.object({
  heroEyebrow: z.string().trim().min(2).max(120),
  heroTitle: z.string().trim().min(2).max(160),
  heroDescription: z.string().trim().min(10).max(1_000),
  heroNotice: z.string().trim().min(10).max(1_000),
  aboutEyebrow: z.string().trim().min(2).max(120),
  aboutTitle: z.string().trim().min(3).max(160),
  aboutDescription: z.string().trim().min(20).max(2_000),
  refundReviewText: z.string().trim().min(20).max(2_000),
  refundReplacementText: z.string().trim().min(20).max(2_000),
  refundPartialText: z.string().trim().min(20).max(2_000),
  refundPolicy: z.string().trim().min(20).max(5_000),
});

export const orderAdjustmentSchema = z.object({
  orderId: z.string().min(1),
  type: z.enum(["REFUND", "DISCOUNT"]),
  amount: z.coerce.number().positive().max(99_999_999),
  reason: z.string().trim().min(8).max(1_000),
});

export const customRequestAdminSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["REVIEWED", "QUOTED", "ACCEPTED", "REJECTED"]),
  price: z.coerce.number().positive().max(99_999_999).optional().or(z.literal("")),
  paymentMethod: z.enum(["SINPE", "CASH"]).optional(),
  adminNotes: z.string().trim().max(1_500).optional(),
});
