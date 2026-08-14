import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Condensed geometric sans for headings (§11) — distinct from the body/UI sans so
// headlines read as intentional display type, not just bigger body text.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "LumenX PH", template: "%s" },
  description: "High-wattage automotive lighting — sales, installation, and parts.",
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoPartsStore",
  name: "LumenX PH",
  url: SITE_URL,
  address: {
    "@type": "PostalAddress",
    addressRegion: "Dagupan City, Urdaneta City & Metro Manila",
    addressCountry: "PH",
  },
  areaServed: "PH",
  telephone: "+63 923 523 1726",
  sameAs: ["https://www.facebook.com/LumenxPH"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
