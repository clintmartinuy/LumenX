import type { NextConfig } from "next";

// Supabase Storage serves public objects from the project's own domain
// (${SUPABASE_URL}/storage/v1/object/public/...) — allow next/image to optimize from there.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
