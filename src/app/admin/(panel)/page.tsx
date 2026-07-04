import { getAdminDashboard } from "@/lib/data";
import { AdminCharts } from "@/components/admin/admin-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, CalendarDays, ClipboardList, ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();
  const icons = [BadgeDollarSign, CalendarDays, ClipboardList, ReceiptText];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Ventas, pagos pendientes y rendimiento de productos.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric, index) => {
          const Icon = icons[index] || ClipboardList;
          return (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p>
            </CardContent>
          </Card>
          );
        })}
      </div>
      <AdminCharts best={dashboard.best} slow={dashboard.slow} />
    </div>
  );
}
