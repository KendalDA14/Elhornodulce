import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/admin-header";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/productos", label: "Productos", icon: "products" },
  { href: "/admin/categorias", label: "Categorías", icon: "categories" },
  { href: "/admin/ingredientes", label: "Ingredientes", icon: "ingredients" },
  { href: "/admin/recetas", label: "Costos", icon: "recipes" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/admin/buscar-pedido", label: "Buscar pedido", icon: "search" },
  { href: "/admin/promociones", label: "Promociones", icon: "promotions" },
  { href: "/admin/resenas", label: "Reseñas", icon: "reviews" },
  { href: "/admin/ajustes", label: "Ajustes", icon: "settings" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader adminEmail={admin.email} nav={nav} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
