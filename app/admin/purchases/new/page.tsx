import { PurchaseOrderForm } from "@/components/admin/purchase-order-form";
import { getAllProductsForSelect, getSuppliers } from "@/lib/queries/inventory";

export default async function NewPurchaseOrderPage() {
  const [suppliers, products] = await Promise.all([getSuppliers(), getAllProductsForSelect()]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">New Purchase Order</h1>
      <PurchaseOrderForm suppliers={suppliers} products={products} />
    </div>
  );
}
