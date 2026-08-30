import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStoreProvider } from "@/store/app-store";
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
    default: "Smart ERP — Smart Global IT",
    template: "%s · Smart ERP",
  },
  description:
    "Purchase and Inventory management for manufacturing — a Smart Global IT product.",
  applicationName: "Smart ERP",
  authors: [{ name: "Smart Global IT" }],
  keywords: ["ERP", "Purchase Management", "Inventory Management", "Smart Global IT"],
  openGraph: {
    type: "website",
    siteName: "Smart ERP",
    title: "Smart ERP — Smart Global IT",
    description:
      "Procurement and inventory under one control tower: requisition to award, gate receiving to a clean three-way match.",
    url: "/",
    images: [{ url: "/company-logo.jpeg", width: 512, height: 512, alt: "Smart Global IT" }],
  },
  twitter: {
    card: "summary",
    title: "Smart ERP — Smart Global IT",
    description: "Purchase and Inventory management for manufacturing.",
    images: ["/company-logo.jpeg"],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#eb6834",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppStoreProvider>
          {children}
          <ToastHost />
        </AppStoreProvider>
      </body>
    </html>
  );
}
