import { createHmac, timingSafeEqual } from "crypto";

// §7.2: verify X-Hub-Signature-256 via HMAC-SHA256 over the *raw* request body — must be
// called with the raw text, before any JSON.parse. Pure function (the secret is a
// parameter, not read from env here), so no "server-only" guard — that would break direct
// unit testing under Vitest for no real benefit, since there's no secret embedded in this
// module to leak if it were ever bundled client-side.
export function verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}
