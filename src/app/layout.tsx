import type { Metadata } from "next";
import { LandingAnimations } from "@/components/public/landing-animations";
import { TooltipProvider } from "@/components/ui/tooltip";
import { absoluteSiteUrl, siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | El horno dulce",
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/brand/logo.jpeg",
        width: 1600,
        height: 1600,
        alt: `Logo de ${siteName}`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
    images: ["/brand/logo.jpeg"],
  },
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
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
};

const businessPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: siteName,
      alternateName: "El Horno Dulce",
      description: siteDescription,
      inLanguage: "es-CR",
    },
    {
      "@type": "Bakery",
      "@id": `${siteUrl}/#business`,
      name: siteName,
      url: `${siteUrl}/`,
      description: siteDescription,
      logo: {
        "@type": "ImageObject",
        url: absoluteSiteUrl("/brand/logo.jpeg"),
        width: 1600,
        height: 1600,
      },
      image: absoluteSiteUrl("/brand/logo.jpeg"),
      ...(businessPhone ? { telephone: `+${businessPhone}` } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: "Liberia",
        addressRegion: "Guanacaste",
        addressCountry: "CR",
      },
      areaServed: {
        "@type": "City",
        name: "Liberia, Guanacaste",
      },
      paymentAccepted: ["SINPE", "Efectivo"],
      currenciesAccepted: "CRC",
      priceRange: "₡",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full scroll-smooth antialiased">
      <body className="flex min-h-dvh flex-col overscroll-y-contain">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <TooltipProvider>
          <LandingAnimations>{children}</LandingAnimations>
        </TooltipProvider>
      </body>
    </html>
  );
}
