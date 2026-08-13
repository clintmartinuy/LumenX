import { describe, expect, it } from "vitest";
import {
  addCentavos,
  centavos,
  centavosToPesos,
  formatCentavos,
  multiplyCentavos,
  parsePesosInput,
  pesosToCentavos,
  splitByWeight,
  subtractCentavos,
} from "@/lib/money";

describe("centavos", () => {
  it("accepts integers", () => {
    expect(centavos(450000)).toBe(450000);
  });

  it("rejects non-integers", () => {
    expect(() => centavos(450000.5)).toThrow();
  });
});

describe("pesosToCentavos / centavosToPesos", () => {
  it("converts pesos to centavos", () => {
    expect(pesosToCentavos(4500)).toBe(450000);
    expect(pesosToCentavos(0)).toBe(0);
  });

  it("rounds fractional centavos to the nearest whole centavo", () => {
    // 10.005 pesos -> 1000.5 centavos -> rounds to 1001
    expect(pesosToCentavos(10.005)).toBe(1001);
    // 10.004 pesos -> 1000.4 centavos -> rounds to 1000
    expect(pesosToCentavos(10.004)).toBe(1000);
  });

  it("round-trips through centavosToPesos", () => {
    expect(centavosToPesos(pesosToCentavos(1250.75))).toBe(1250.75);
  });
});

describe("formatCentavos", () => {
  it("formats as PHP currency in en-PH locale", () => {
    expect(formatCentavos(centavos(450000))).toBe("₱4,500.00");
  });

  it("formats zero and negative amounts", () => {
    expect(formatCentavos(centavos(0))).toBe("₱0.00");
    expect(formatCentavos(centavos(-50000))).toBe("-₱500.00");
  });

  it("formats sub-peso centavo amounts", () => {
    expect(formatCentavos(centavos(1))).toBe("₱0.01");
  });
});

describe("parsePesosInput", () => {
  it("parses plain numeric strings", () => {
    expect(parsePesosInput("1500")).toBe(150000);
  });

  it("strips currency symbols and thousands separators", () => {
    expect(parsePesosInput("₱1,500.50")).toBe(150050);
  });

  it("parses negative amounts", () => {
    expect(parsePesosInput("-200")).toBe(-20000);
  });

  it("throws on unparseable input", () => {
    expect(() => parsePesosInput("abc")).toThrow();
    expect(() => parsePesosInput("")).toThrow();
  });
});

describe("addCentavos / subtractCentavos / multiplyCentavos", () => {
  it("adds a list of amounts", () => {
    expect(addCentavos(centavos(100), centavos(200), centavos(300))).toBe(600);
  });

  it("adds zero amounts", () => {
    expect(addCentavos()).toBe(0);
  });

  it("subtracts", () => {
    expect(subtractCentavos(centavos(500), centavos(200))).toBe(300);
  });

  it("multiplies and rounds to the nearest centavo", () => {
    expect(multiplyCentavos(centavos(1000), 1.5)).toBe(1500);
    expect(multiplyCentavos(centavos(333), 0.1)).toBe(33); // 33.3 -> 33
  });
});

describe("splitByWeight", () => {
  it("splits evenly when the amount divides cleanly", () => {
    expect(splitByWeight(centavos(1000), [1, 1])).toEqual([500, 500]);
  });

  it("assigns the leftover centavo to the largest-weight share (§9.9 example)", () => {
    // 4 partners at 40/30/20/10, distributing PHP 100,000.01 = 10,000,001 centavos.
    const shares = splitByWeight(centavos(10_000_001), [40, 30, 20, 10]);
    expect(shares).toEqual([4_000_001, 3_000_000, 2_000_000, 1_000_000]);
    expect(shares.reduce((sum, s) => sum + s, 0)).toBe(10_000_001);
  });

  it("always sums exactly to the original amount regardless of remainder size", () => {
    const amount = centavos(1_000_007);
    const shares = splitByWeight(amount, [33, 33, 34]);
    expect(shares.reduce((sum, s) => sum + s, 0)).toBe(amount);
  });

  it("returns an empty array for no weights", () => {
    expect(splitByWeight(centavos(1000), [])).toEqual([]);
  });

  it("throws when total weight is not positive", () => {
    expect(() => splitByWeight(centavos(1000), [0, 0])).toThrow();
  });
});
