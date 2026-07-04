"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Boxes,
  ClipboardList,
  FolderTree,
  Menu,
  MessageSquareText,
  Package,
  Search,
  Settings,
  Tags,
  UserCircle,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { logoutAdminAction } from "@/actions/auth";
import { PushNotificationControl } from "@/components/admin/push-notification-control";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
};

const iconMap = {
  dashboard: BarChart3,
  products: Package,
  categories: FolderTree,
  ingredients: Boxes,
  recipes: Utensils,
  orders: ClipboardList,
  search: Search,
  promotions: Tags,
  reviews: MessageSquareText,
  settings: Settings,
} as const;

export function AdminHeader({ adminEmail, nav }: { adminEmail: string; nav: AdminNavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/brand/logo.jpeg"
            alt="El horno dulce"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">Sesión: {adminEmail}</p>
            <h1 className="truncate text-xl font-semibold">Panel El horno dulce</h1>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <PushNotificationControl />
          <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
            <UserCircle className="h-4 w-4" />
            <span>Admin</span>
          </div>
          <form action={logoutAdminAction}>
            <Button variant="outline">Salir</Button>
          </form>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menú admin">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex h-dvh flex-col overflow-hidden transition duration-300 ease-out">
            <SheetTitle className="sr-only">Menu de administracion</SheetTitle>
            <SheetDescription className="sr-only">
              Navegacion principal del panel administrativo.
            </SheetDescription>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-14">
              <div className="grid gap-2">
              <div className="mb-2 flex items-center gap-2 rounded-lg border p-3 text-sm">
                <UserCircle className="h-5 w-5" />
                <div className="min-w-0">
                  <p className="font-medium">Admin</p>
                  <p className="truncate text-muted-foreground">{adminEmail}</p>
                </div>
              </div>
              <PushNotificationControl compact />
              {nav.map((item) => (
                <AdminNavLink key={item.href} item={item} onClick={() => setOpen(false)} />
              ))}
              <form action={logoutAdminAction} className="pt-3">
                <Button variant="outline" className="w-full">Salir</Button>
              </form>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <nav className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6 md:flex">
        {nav.map((item) => (
          <Button key={item.href} asChild variant="ghost" size="sm">
            <Link href={item.href} className="gap-2">
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </header>
  );
}

function NavIcon({ name }: { name: string }) {
  const Icon = iconMap[name as keyof typeof iconMap] || BookOpen;
  return <Icon className="h-4 w-4" />;
}

function AdminNavLink({ item, onClick }: { item: AdminNavItem; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
        <NavIcon name={item.icon} />
      </span>
      {item.label}
    </Link>
  );
}
