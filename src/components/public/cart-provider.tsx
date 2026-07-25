"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import type { CartItem, PublicProduct } from "@/types/shop";
import { currency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type CartContextValue = {
  items: CartItem[];
  addProduct: (product: PublicProduct, quantity?: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  setQuantity: (productId: string, quantity: number) => void;
  total: number;
  count: number;
};

type CartNotice = {
  name: string;
  imageUrl: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState<CartNotice | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("horno-cart");
    if (!stored) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(JSON.parse(stored) as CartItem[]);
    } catch {
      window.localStorage.removeItem("horno-cart");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("horno-cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const value = useMemo<CartContextValue>(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      total,
      count,
      addProduct(product, quantity = 1) {
        setNotice({ name: product.name, imageUrl: product.imageUrl });
        setItems((current) => {
          const existing = current.find((item) => item.productId === product.id);
          if (existing) {
            return current.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            );
          }

          return [
            ...current,
            {
              productId: product.id,
              name: product.name,
              price: product.priceFinal,
              originalPrice: product.originalPrice,
              discountPercent: product.discountPercent,
              promotionName: product.promotionName,
              imageUrl: product.imageUrl,
              estimatedDelivery: product.estimatedDelivery,
              quantity,
            },
          ];
        });
      },
      removeProduct(productId) {
        setItems((current) => current.filter((item) => item.productId !== productId));
      },
      clearCart() {
        setItems([]);
      },
      setQuantity(productId, quantity) {
        setItems((current) =>
          current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        );
      },
    };
  }, [items]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border bg-background/95 p-2.5 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:min-w-80 sm:translate-x-0"
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
            {notice.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={notice.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <ShoppingBag className="m-3 h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{notice.name}</p>
            <p className="text-xs text-muted-foreground">Agregado al carrito</p>
          </div>
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        </div>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}

export function CartButton({ compact = false }: { compact?: boolean }) {
  const { items, count, total, removeProduct, setQuantity } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "icon" : "default"}
          className={cn("relative gap-2", compact && "h-9 w-9 rounded-full")}
          aria-label={compact ? `Abrir carrito, ${count} productos` : undefined}
        >
          <ShoppingCart className="h-4 w-4" />
          {compact ? null : "Carrito"}
          <span
            className={cn(
              "rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground",
              compact && "absolute -right-2 -top-2 min-w-5 px-1.5",
            )}
          >
            {count}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tu pedido</SheetTitle>
          <SheetDescription className="sr-only">
            Revisa los productos agregados al carrito y continúa al checkout.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aun no agregaste postres.</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="grid grid-cols-[64px_1fr_auto] gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.discountPercent && item.originalPrice && item.originalPrice > item.price ? (
                    <p className="text-xs font-medium text-primary">
                      {currency(item.originalPrice)} a {currency(item.price)} -{item.discountPercent}%
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {currency(item.price)} c/u · Subtotal {currency(item.price * item.quantity)}
                  </p>
                  {item.estimatedDelivery ? (
                    <p className="text-xs text-muted-foreground">Entrega: {item.estimatedDelivery}</p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProduct(item.productId)}
                  aria-label={`Quitar ${item.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
          <Separator />
          <div className="flex items-center justify-between font-semibold">
            <span>Total estimado</span>
            <span>{currency(total)}</span>
          </div>
          <Button asChild className="w-full">
            <a href="/checkout">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ir a pagar
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
