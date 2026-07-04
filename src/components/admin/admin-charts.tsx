"use client";

import type { ProductSalesMetric } from "@/types/shop";
import { currency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  primary: "#c2185b",
  chocolate: "#735247",
  cream: "#f7ead8",
  border: "#eadcca",
  text: "#2b1a17",
  muted: "#7a625b",
};

type ChartRow = ProductSalesMetric & {
  shortName: string;
  share: number;
};

export function AdminCharts({
  best,
}: {
  best: ProductSalesMetric[];
  slow: ProductSalesMetric[];
}) {
  const rows = normalizeRows(best);
  const totalRevenue = rows.reduce((sum, item) => sum + item.total, 0);
  const totalUnits = rows.reduce((sum, item) => sum + item.quantity, 0);
  const top = rows[0];
  const second = rows[1];
  const recommendation = top
    ? second
      ? `${top.name} aporta ${Math.round(top.share)}% de los ingresos.`
      : `${top.name} concentra las ventas registradas.`
    : "Aún no hay ventas suficientes para comparar productos.";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden border-[#eadcca] bg-[#fffaf1] shadow-md">
          <CardHeader className="gap-2 pb-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl text-[#2b1a17]">Ventas por producto</CardTitle>
              <p className="text-sm text-[#7a625b]">Comparación clara por ingresos y unidades vendidas.</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-[#7a625b]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Ingresos
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#735247]" />
                Unidades
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] min-w-0 w-full">
              <ComposedChart
                data={rows}
                margin={{ top: 18, right: 8, bottom: 8, left: 0 }}
                responsive
                style={{ width: "100%", height: "100%" }}
              >
                <CartesianGrid vertical={false} stroke={COLORS.border} />
                <XAxis
                  dataKey="shortName"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: COLORS.muted, fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="revenue"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₡${Math.round(Number(value) / 1000)}k`}
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <YAxis yAxisId="units" orientation="right" hide domain={[0, "dataMax + 1"]} />
                <Tooltip content={<SalesTooltip />} cursor={{ fill: "rgba(196, 24, 91, 0.06)" }} />
                <Bar
                  yAxisId="revenue"
                  dataKey="total"
                  fill={COLORS.primary}
                  radius={[10, 10, 4, 4]}
                  barSize={72}
                >
                  <LabelList dataKey="total" position="top" formatter={(value: unknown) => currency(Number(value))} />
                </Bar>
                <Line
                  yAxisId="units"
                  type="monotone"
                  dataKey="quantity"
                  stroke={COLORS.chocolate}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fffaf1", stroke: COLORS.chocolate }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </div>
            <p className="mt-3 inline-flex rounded-lg border border-[#efd8c3] bg-[#fff6ec] px-4 py-2 text-sm font-semibold text-primary">
              {recommendation}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[#eadcca] bg-[#fffaf1] shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-[#2b1a17]">Participación de ventas</CardTitle>
            <p className="text-sm text-[#7a625b]">Distribución del total vendido.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
              <div className="relative h-[190px] min-w-0 w-full">
                <PieChart responsive style={{ width: "100%", height: "100%" }}>
                  <Pie
                    data={rows}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={0}
                    stroke="none"
                  >
                    {rows.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index % 2 === 0 ? COLORS.primary : COLORS.chocolate}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<SalesTooltip compact />} />
                </PieChart>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-xs font-semibold text-[#7a625b]">Total</p>
                    <p className="text-xl font-bold text-[#2b1a17]">{currency(totalRevenue)}</p>
                    <p className="text-xs text-[#7a625b]">{totalUnits} uds</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {rows.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: index % 2 === 0 ? COLORS.primary : COLORS.chocolate }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#2b1a17]">{item.name}</p>
                      <p className="text-xs text-[#7a625b]">{currency(item.total)}</p>
                    </div>
                    <strong className="text-[#2b1a17]">{Math.round(item.share)}%</strong>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-[#efd8c3] bg-[#fff6ec] px-4 py-2 text-sm font-semibold text-[#735247]">
              {second ? `Recomendación: impulsar ${second.name} con promoción.` : "Registra más ventas para obtener recomendaciones."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#eadcca] bg-[#fffaf1] shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-[#2b1a17]">Productos más vendidos</CardTitle>
          <p className="text-sm text-[#7a625b]">Ordenados por unidades vendidas.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((item, index) => (
            <RankingRow
              key={item.name}
              item={item}
              maxQuantity={Math.max(...rows.map((row) => row.quantity), 1)}
              color={index % 2 === 0 ? COLORS.primary : COLORS.chocolate}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeRows(data: ProductSalesMetric[]): ChartRow[] {
  const rows = data.length
    ? data
    : [{ name: "Sin ventas registradas", quantity: 0, total: 0 }];
  const totalRevenue = Math.max(rows.reduce((sum, item) => sum + item.total, 0), 1);

  return rows.slice(0, 6).map((item) => ({
    ...item,
    shortName: shortLabel(item.name),
    share: item.total > 0 ? (item.total / totalRevenue) * 100 : 0,
  }));
}

function shortLabel(value: string) {
  const words = value.split(" ");
  if (value.length <= 18) return value;
  return words.length > 1 ? `${words[0]} ${words[1]}` : value.slice(0, 18);
}

function RankingRow({
  item,
  maxQuantity,
  color,
}: {
  item: ChartRow;
  maxQuantity: number;
  color: string;
}) {
  const width = `${Math.max(5, (item.quantity / maxQuantity) * 100)}%`;

  return (
    <div className="grid gap-2 sm:grid-cols-[260px_1fr_auto] sm:items-center">
      <div>
        <p className="font-semibold text-[#2b1a17]">{item.name}</p>
        <p className="text-sm text-[#7a625b]">{currency(item.total)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#efe4d3]">
        <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
      </div>
      <p className="text-sm font-bold text-[#2b1a17]">{item.quantity} uds</p>
    </div>
  );
}

function SalesTooltip({
  active,
  payload,
  compact = false,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartRow; dataKey?: string; value?: number }>;
  compact?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-[#eadcca] bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-[#2b1a17]">{row.name}</p>
      <p className="text-[#7a625b]">Ingresos: {currency(row.total)}</p>
      {!compact ? <p className="text-[#7a625b]">Unidades: {row.quantity}</p> : null}
      <p className="text-primary">{Math.round(row.share)}% del total</p>
    </div>
  );
}
