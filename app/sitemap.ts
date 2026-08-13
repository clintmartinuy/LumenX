import type { MetadataRoute } from "next";
import { getAllActiveProductSlugs } from "@/lib/queries/catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllActiveProductSlugs();

  const staticRoutes = ["", "/products", "/services", "/book", "/contact", "/faq"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = slugs.map((slug) => ({
    url: `${SITE_URL}/products/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes];
}
