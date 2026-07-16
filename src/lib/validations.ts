import { z } from "zod";

const paymentMethodSchema = z.enum(["SINPE", "CASH"]);

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Indica tu nombre."),
  customerPhone: z.string().min(8, "Indica un teléfono válido."),
  deliveryNotes: z.string().optional(),
  promoCode: z.string().optional(),
  paymentMethod: paymentMethodSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(50),
      }),
    )
    .min(1, "El carrito está vacío."),
});

export const reviewSchema = z.object({
  publishMode: z.enum(["named", "anonymous"]),
  customerName: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10).max(600),
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
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  description: z.string().min(10),
  desiredDate: z.string().min(1),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().min(1),
  description: z.string().min(10),
  visibleIngredients: z.string().optional(),
  estimatedDelivery: z.string().min(2),
  priceFinal: z.coerce.number().positive(),
  isAvailable: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const ingredientSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1),
  purchasePrice: z.coerce.number().positive(),
  quantity: z.coerce.number().positive(),
  notes: z.string().optional(),
});

export const productionBatchSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(2).max(80),
  producedQuantity: z.coerce.number().positive(),
  desiredMarginPercent: z.coerce.number().min(0).max(95).optional().or(z.literal("")),
  desiredProfitAmount: z.coerce.number().min(0).optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const promotionSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
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
  heroEyebrow: z.string().min(2),
  heroTitle: z.string().min(2),
  heroDescription: z.string().min(10),
  heroNotice: z.string().min(10),
  refundPolicy: z.string().min(20),
});

export const orderAdjustmentSchema = z.object({
  orderId: z.string().min(1),
  type: z.enum(["REFUND", "DISCOUNT"]),
  amount: z.coerce.number().positive(),
  reason: z.string().min(8),
});

export const customRequestAdminSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["REVIEWED", "QUOTED", "ACCEPTED", "REJECTED"]),
  price: z.coerce.number().positive().optional().or(z.literal("")),
  paymentMethod: z.enum(["SINPE", "CASH"]).optional(),
  adminNotes: z.string().optional(),
});
