import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStoreProvider } from "@/store/app-store";
import { CpsStoreProvider } from "@/lib/cps/store";
import { ToastHost } from "@/components/layout/ToastHost";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/** Resolves to the Vercel deployment URL in production, localhost in dev —
 *  so social previews work without setting a single environment variable. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Noor ERP — Noor IT Solutions",
    template: "%s · Noor ERP",
  },
  description:
    "Central Procurement, Purchase and Inventory management — a Noor IT Solutions product.",
  applicationName: "Noor ERP",
  authors: [{ name: "Noor IT Solutions" }],
  keywords: [
    "ERP",
    "Central Procurement System",
    "Purchase Management",
    "Inventory Management",
    "Noor IT Solutions",
  ],
  openGraph: {
    type: "website",
    siteName: "Noor ERP",
    title: "Noor ERP — Noor IT Solutions",
    description:
      "Unit requisition to consolidated purchase order: simple, controlled and traceable central procurement.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Noor IT Solutions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noor ERP — Noor IT Solutions",
    description: "Central Procurement, Purchase and Inventory management.",
    images: ["/og.png"],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#08090d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppStoreProvider>
          <CpsStoreProvider>{children}</CpsStoreProvider>
          <ToastHost />
        </AppStoreProvider>
      </body>
    </html>
  );
}
