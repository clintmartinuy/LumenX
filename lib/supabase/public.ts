import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Plain anon-key client with no cookie/session handling — safe to call from anywhere,
// including build-time contexts (generateStaticParams, sitemap.ts) where next/headers'
// cookies() would throw for being outside a request scope. Use this for any query that
// doesn't depend on the visitor's session (the entire public catalog: products,
// categories, services, stock status, fitments — none of it is session-scoped).
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
