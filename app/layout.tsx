import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ChromeGate } from "@/components/ChromeGate";

// Poppins is used only for the navbar wordmark.
const poppins = Poppins({
  variable: "--font-poppins-face",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const OG_DEFAULT = {
  url: "/media/site/og-default.png",
  width: 1200,
  height: 630,
  alt: "Russell Smith — The Mortgage Strategist, ALCOVA Mortgage",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://russelldsmith.com"),
  title: {
    default: "Russell Smith — Mortgage Guides & Loan Insights",
    template: "%s — Russell Smith",
  },
  description:
    "Clear, trustworthy mortgage guidance from Russell Smith: VA, USDA, FHA, first-time buyer, construction, and jumbo loan guides.",
  // Default social card. Pages inherit this unless they set their own
  // openGraph (blog posts override images with their hero). og:title /
  // og:description are auto-derived from each page's title/description.
  openGraph: {
    type: "website",
    siteName: "Russell Smith — ALCOVA Mortgage",
    locale: "en_US",
    url: "/",
    images: [OG_DEFAULT],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_DEFAULT.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ChromeGate>
          <SiteHeader />
        </ChromeGate>
        <main id="main" className="flex-1">
          {children}
        </main>
        <ChromeGate>
          <SiteFooter />
        </ChromeGate>
        {/* Ahrefs Web Analytics */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="pK2hhObpJZFKI+oDtQn16w"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
