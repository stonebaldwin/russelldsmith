import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Poppins is used only for the navbar wordmark.
const poppins = Poppins({
  variable: "--font-poppins-face",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://russelldsmith.com"),
  title: {
    default: "Russell Smith — Mortgage Guides & Loan Insights",
    template: "%s — Russell Smith",
  },
  description:
    "Clear, trustworthy mortgage guidance from Russell Smith: VA, USDA, FHA, first-time buyer, construction, and jumbo loan guides.",
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
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
