import { z } from "zod";

export const specEntrySchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const fitmentEntrySchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  yearFrom: z.coerce.number().int().optional(),
  yearTo: z.coerce.number().int().optional(),
});

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  specs: z.array(specEntrySchema).default([]),
  retailPricePesos: z.coerce.number().nonnegative("Must be 0 or more"),
  wholesalePricePesos: z.coerce.number().nonnegative().optional().or(z.literal("")),
  installFeePesos: z.coerce.number().nonnegative().default(0),
  warrantyMonths: z.coerce.number().int().nonnegative().default(6),
  reorderPoint: z.coerce.number().int().nonnegative().default(3),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  fitments: z.array(fitmentEntrySchema).default([]),
});

// z.coerce fields make the schema's *input* type (pre-parse, what RHF/useForm manages)
// differ from its *output* type (post-parse, what Server Actions receive) — ProductInput
// is the output type; ProductFormValues is the input type useForm should be generic over
// (see components/admin/product-form.tsx for how the two are wired together).
export type ProductInput = z.infer<typeof productSchema>;
export type ProductFormValues = z.input<typeof productSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  movementType: z.enum(["adjustment_in", "adjustment_out", "damage_out", "return_in", "demo_out"]),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type StockAdjustmentFormValues = z.input<typeof stockAdjustmentSchema>;

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantityOrdered: z.coerce.number().int().positive(),
  unitCostPesos: z.coerce.number().nonnegative(),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  orderDate: z.string().min(1),
  shippingCostPesos: z.coerce.number().nonnegative().default(0),
  otherCostsPesos: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one line item"),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderFormValues = z.input<typeof purchaseOrderSchema>;

export const receiveLineSchema = z.object({
  itemId: z.string().uuid(),
  quantityReceivedNow: z.coerce.number().int().nonnegative(),
});

export const receivePurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  lines: z.array(receiveLineSchema).min(1),
});

export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
