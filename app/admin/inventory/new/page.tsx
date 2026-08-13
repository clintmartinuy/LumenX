import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/queries/inventory";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">New Product</h1>
      <ProductForm productId={null} categories={categories} />
    </div>
  );
}
