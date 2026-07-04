export type RecipeLine = {
  quantity: number;
  costPerUnit: number;
};

export function recipeCost(lines: RecipeLine[]) {
  return lines.reduce((total, line) => total + line.quantity * line.costPerUnit, 0);
}

export function suggestedPriceFromMargin(cost: number, marginPercent?: number | null) {
  if (!marginPercent) return cost;
  const margin = Math.min(Math.max(marginPercent, 0), 95);
  return cost / (1 - margin / 100);
}

export function suggestedPriceFromProfit(cost: number, profitAmount?: number | null) {
  if (!profitAmount) return cost;
  return cost + Math.max(profitAmount, 0);
}

export function roundPrice(value: number) {
  return Math.ceil(value / 100) * 100;
}

export function calculateSuggestedPrice(options: {
  cost: number;
  marginPercent?: number | null;
  profitAmount?: number | null;
}) {
  if (options.profitAmount && options.profitAmount > 0) {
    return roundPrice(suggestedPriceFromProfit(options.cost, options.profitAmount));
  }

  return roundPrice(suggestedPriceFromMargin(options.cost, options.marginPercent));
}

