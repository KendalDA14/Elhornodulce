"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/settings";

export function WhatsappFloatingButton() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      setHidden(current < lastY && current > 90);
      lastY = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappUrl("Hola, quiero consultar sobre los postres de El horno dulce.")}
      target="_blank"
      rel="noreferrer"
      className={`fixed bottom-4 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
        hidden ? "translate-y-24" : "translate-y-0"
      }`}
      aria-label="Consultar por WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
