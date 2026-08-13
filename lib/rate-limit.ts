import "server-only";

// In-memory, per-instance rate limiting — adequate for a single-shop MVP's public form
// traffic. Won't share state across multiple serverless instances; revisit with a shared
// store (e.g. Upstash) if that becomes a real gap.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
