import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifySignature } from "@/lib/messenger/verify";

const APP_SECRET = "test-app-secret";

function sign(body: string, secret: string = APP_SECRET): string {
  return "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

describe("verifySignature", () => {
  it("accepts a correctly signed body", () => {
    const body = JSON.stringify({ object: "page", entry: [] });
    expect(verifySignature(body, sign(body), APP_SECRET)).toBe(true);
  });

  it("rejects a bad signature (§13 Phase 7: returns 401)", () => {
    const body = JSON.stringify({ object: "page", entry: [] });
    expect(verifySignature(body, "sha256=" + "0".repeat(64), APP_SECRET)).toBe(false);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const body = JSON.stringify({ object: "page", entry: [] });
    expect(verifySignature(body, sign(body, "wrong-secret"), APP_SECRET)).toBe(false);
  });

  it("rejects a signature for a mutated body", () => {
    const original = JSON.stringify({ object: "page", entry: [] });
    const tampered = JSON.stringify({ object: "page", entry: [{ injected: true }] });
    expect(verifySignature(tampered, sign(original), APP_SECRET)).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    const body = "{}";
    expect(verifySignature(body, null, APP_SECRET)).toBe(false);
    expect(verifySignature(body, "not-a-real-header", APP_SECRET)).toBe(false);
    expect(verifySignature(body, "sha1=abcd", APP_SECRET)).toBe(false);
  });
});
