"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { centavos, formatCentavos, parsePesosInput } from "@/lib/money";
import { completeSale, searchCustomersAction } from "@/lib/pos/actions";
import type { SaleLineItemInput } from "@/lib/validation/pos";

type Product = {
  id: string;
  sku: string;
  name: string;
  retail_price: number;
  wholesale_price: number | null;
  category_id: string | null;
  quantityOnHand: number;
};
type Service = { id: string; name: string; base_price: number };
type Category = { id: string; name: string };
type Customer = { id: string; full_name: string; phone: string | null; customer_type: "b2c" | "b2b" };
type CartLine = SaleLineItemInput & { key: string; name: string };
type StaffRole = "owner" | "admin" | "staff" | "viewer";

const PAYMENT_METHODS = ["cash", "gcash", "bank_transfer", "maya", "mixed"] as const;

export function PosTerminal({
  products,
  services,
  categories,
  role,
}: {
  products: Product[];
  services: Service[];
  categories: Category[];
  role: StaffRole;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tier, setTier] = useState<"retail" | "wholesale">("retail");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [discountPesos, setDiscountPesos] = useState("0");
  const [discountReason, setDiscountReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [amountTenderedPesos, setAmountTenderedPesos] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ saleNumber: string } | null>(null);

  const canWholesale = role === "owner" || role === "admin";
  const canOverride = role === "owner" || role === "admin";

  const filteredProducts = products.filter((p) => {
    if (categoryId && p.category_id !== categoryId) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function addProduct(p: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.itemType === "product" && l.productId === p.id);
      const unitPrice = tier === "wholesale" && p.wholesale_price ? p.wholesale_price : p.retail_price;
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        { key: `p-${p.id}`, itemType: "product", productId: p.id, name: p.name, quantity: 1, unitPrice, lineDiscount: 0 },
      ];
    });
  }

  function addService(s: Service) {
    setCart((prev) => {
      const existing = prev.find((l) => l.itemType === "service" && l.serviceId === s.id);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        { key: `s-${s.id}`, itemType: "service", serviceId: s.id, name: s.name, quantity: 1, unitPrice: s.base_price, lineDiscount: 0 },
      ];
    });
  }

  function updateQty(key: string, quantity: number) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l)));
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity * l.unitPrice - l.lineDiscount, 0),
    [cart],
  );
  const discountAmount = discountPesos ? parsePesosInput(discountPesos) : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const amountPaid = amountTenderedPesos ? parsePesosInput(amountTenderedPesos) : 0;
  const change = Math.max(0, amountPaid - total);

  const oversoldLines = cart.filter((l) => {
    if (l.itemType !== "product") return false;
    const product = products.find((p) => p.id === l.productId);
    return product ? l.quantity > product.quantityOnHand : false;
  });

  async function runCustomerSearch(q: string) {
    setCustomerQuery(q);
    if (q.length < 2) {
      setCustomerResults([]);
      return;
    }
    const results = await searchCustomersAction(q);
    setCustomerResults(results as Customer[]);
  }

  function onCompleteSale() {
    setError(null);
    if (cart.length === 0) {
      setError("Cart is empty.");
      return;
    }
    if (oversoldLines.length > 0 && !canOverride) {
      setError("A line exceeds available stock. Ask an admin to override.");
      return;
    }

    startTransition(async () => {
      const result = await completeSale({
        customerId: customer?.id ?? null,
        pricingTier: tier,
        items: cart.map((line) => ({
          itemType: line.itemType,
          productId: line.productId,
          serviceId: line.serviceId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineDiscount: line.lineDiscount,
        })),
        discountAmount,
        discountReason: discountReason || undefined,
        taxAmount: 0,
        paymentMethod,
        paymentReference: paymentReference || undefined,
        amountPaid: Math.min(amountPaid, total) || total,
        overrideOversell: oversoldLines.length > 0,
        overrideReason: oversoldLines.length > 0 ? "POS override by " + role : undefined,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setReceipt({ saleNumber: result.saleNumber });
      setCart([]);
      setCustomer(null);
      setDiscountPesos("0");
      setDiscountReason("");
      setAmountTenderedPesos("");
      router.refresh();
    });
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-sm space-y-4 rounded-md border p-6 text-center">
        <h2 className="font-semibold">Sale completed</h2>
        <p className="text-2xl font-mono">{receipt.saleNumber}</p>
        <Button onClick={() => setReceipt(null)}>New sale</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search product or SKU..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button size="sm" variant={!categoryId ? "default" : "outline"} onClick={() => setCategoryId(null)}>
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={categoryId === c.id ? "default" : "outline"}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              className="rounded-md border p-3 text-left text-sm hover:bg-muted"
            >
              <p className="font-medium">{p.name}</p>
              <p className="text-muted-foreground text-xs font-mono">{p.sku}</p>
              <p className="mt-1 font-semibold">
                {formatCentavos(centavos(tier === "wholesale" && p.wholesale_price ? p.wholesale_price : p.retail_price))}
              </p>
              <p className="text-muted-foreground text-xs">{p.quantityOnHand} on hand</p>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Services</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => addService(s)}
                className="rounded-md border p-3 text-left text-sm hover:bg-muted"
              >
                <p className="font-medium">{s.name}</p>
                <p className="mt-1 font-semibold">{formatCentavos(centavos(s.base_price))}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Customer</p>
          {customer ? (
            <div className="flex items-center justify-between rounded-md border px-2 py-1 text-sm">
              <span>{customer.full_name}</span>
              <button onClick={() => setCustomer(null)} className="text-muted-foreground text-xs">
                change
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Input
                placeholder="Search by name or phone..."
                value={customerQuery}
                onChange={(e) => runCustomerSearch(e.target.value)}
              />
              {customerResults.length > 0 ? (
                <div className="max-h-32 overflow-y-auto rounded-md border">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      className="block w-full px-2 py-1 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setCustomer(c);
                        setCustomerResults([]);
                      }}
                    >
                      {c.full_name} {c.phone ? `(${c.phone})` : ""}
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="text-muted-foreground text-xs">Leave blank for a walk-in cash sale.</p>
            </div>
          )}
        </div>

        {canWholesale ? (
          <div className="flex gap-2 text-sm">
            <Button size="sm" variant={tier === "retail" ? "default" : "outline"} onClick={() => setTier("retail")}>
              Retail
            </Button>
            <Button size="sm" variant={tier === "wholesale" ? "default" : "outline"} onClick={() => setTier("wholesale")}>
              Wholesale
            </Button>
          </div>
        ) : null}

        <div className="space-y-1">
          {cart.map((line) => (
            <div key={line.key} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex-1">
                <p>{line.name}</p>
                <p className="text-muted-foreground text-xs">{formatCentavos(centavos(line.unitPrice))} each</p>
              </div>
              <Input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateQty(line.key, Number(e.target.value))}
                className="h-7 w-14"
              />
              <button onClick={() => removeLine(line.key)} className="text-destructive text-xs">
                ✕
              </button>
            </div>
          ))}
          {cart.length === 0 ? <p className="text-muted-foreground text-sm">Cart is empty.</p> : null}
        </div>

        {oversoldLines.length > 0 ? (
          <p className="text-destructive text-xs">
            {oversoldLines.length} line(s) exceed on-hand stock.{" "}
            {canOverride ? "You can override as admin/owner." : "Ask an admin to override."}
          </p>
        ) : null}

        <div className="space-y-2 border-t pt-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCentavos(centavos(subtotal))}</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Discount (PHP)"
              className="h-7"
              value={discountPesos}
              onChange={(e) => setDiscountPesos(e.target.value)}
            />
            <Input
              placeholder="Reason"
              className="h-7"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
            />
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCentavos(centavos(total))}</span>
          </div>
        </div>

        <div className="space-y-2">
          <select
            className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as (typeof PAYMENT_METHODS)[number])}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {paymentMethod === "gcash" ? (
            <Input
              placeholder="GCash reference number"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          ) : null}
          <Input
            placeholder="Amount tendered (PHP)"
            value={amountTenderedPesos}
            onChange={(e) => setAmountTenderedPesos(e.target.value)}
          />
          {amountPaid > 0 ? (
            <p className="text-muted-foreground text-xs">Change: {formatCentavos(centavos(change))}</p>
          ) : null}
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <Button className="w-full" disabled={isPending || cart.length === 0} onClick={onCompleteSale}>
          {isPending ? "Processing..." : `Charge ${formatCentavos(centavos(total))}`}
        </Button>
      </div>
    </div>
  );
}
