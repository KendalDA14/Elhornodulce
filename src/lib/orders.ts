import type { CartItemInput } from "@/types/shop";
import { toNumber } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";

type PricedProduct = {
  id: string;
  name: string;
  priceFinal: unknown;
  originalPrice?: unknown;
  imageUrl?: string | null;
  estimatedDelivery?: string | null;
  isActive: boolean;
  isAvailable: boolean;
};

export function calculateOrderTotals(
  requestedItems: CartItemInput[],
  products: PricedProduct[],
) {
  const lines = requestedItems.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);

    if (!product || !product.isActive || !product.isAvailable) {
      throw new Error("Uno de los productos ya no esta disponible.");
    }

    const unitPrice = toNumber(product.priceFinal);
    const originalUnitPrice = product.originalPrice === undefined ? unitPrice : toNumber(product.originalPrice);
    if (
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(originalUnitPrice) ||
      unitPrice < 0 ||
      originalUnitPrice < 0
    ) {
      throw new Error("El precio de uno de los productos no es válido.");
    }

    return {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl || null,
      estimatedDelivery: product.estimatedDelivery || null,
      unitPrice,
      originalUnitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      lineOriginalTotal: originalUnitPrice * item.quantity,
    };
  });

  const subtotal = lines.reduce((total, line) => total + line.lineOriginalTotal, 0);
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (
    !Number.isFinite(subtotal) ||
    !Number.isFinite(total) ||
    subtotal > 99_999_999 ||
    total > 99_999_999
  ) {
    throw new Error("El total del pedido supera el límite permitido.");
  }

  return {
    lines,
    subtotal,
    discountTotal: Math.max(0, subtotal - total),
    total,
  };
}

export async function nextOrderNumber() {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ maxNumber: bigint | number | null }>>`
    SELECT MAX(CAST(orderNumber AS UNSIGNED)) AS maxNumber
    FROM \`order\`
    WHERE orderNumber REGEXP '^[0-9]+$'
  `;
  let next = Number(rows[0]?.maxNumber || 0) + 1;

  while (true) {
    const value = String(next).padStart(2, "0");
    const existing = await prisma.order.findUnique({ where: { orderNumber: value } });
    if (!existing) return value;
    next += 1;
  }
}
