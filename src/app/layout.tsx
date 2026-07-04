import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LandingAnimations } from "@/components/public/landing-animations";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || "3000"}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "El horno dulce",
    template: "%s | El horno dulce",
  },
  description: "Catalogo y pedidos de postres caseros hechos con mucho amor.",
  applicationName: "El horno dulce",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "El horno dulce",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.jpeg", type: "image/jpeg" },
      { url: "/brand/logo.jpeg", type: "image/jpeg" },
    ],
    shortcut: "/icon.jpeg",
    apple: "/icon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-dvh flex-col overscroll-y-contain">
        <TooltipProvider>
          <LandingAnimations>{children}</LandingAnimations>
        </TooltipProvider>
      </body>
    </html>
  );
}
