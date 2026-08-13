import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    streetAddress: "123 EDSA",
    addressLocality: "Quezon City",
    addressRegion: "Metro Manila",
    addressCountry: "PH",
  },
  telephone: "+63 917 000 1234",
  sameAs: ["https://www.facebook.com/LumenxPH"],
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "15:00" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
