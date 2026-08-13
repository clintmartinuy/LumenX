import { z } from "zod";

export const saleLineItemSchema = z.object({
  itemType: z.enum(["product", "service", "custom"]),
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(), // centavos
  lineDiscount: z.number().int().nonnegative().default(0),
});

export type SaleLineItemInput = z.infer<typeof saleLineItemSchema>;

export const completeSaleSchema = z.object({
  customerId: z.string().uuid().nullable(),
  pricingTier: z.enum(["retail", "wholesale"]),
  items: z.array(saleLineItemSchema).min(1, "Add at least one item to the cart"),
  discountAmount: z.number().int().nonnegative().default(0),
  discountReason: z.string().optional(),
  taxAmount: z.number().int().nonnegative().default(0),
  paymentMethod: z.enum(["cash", "gcash", "bank_transfer", "maya", "mixed"]),
  paymentReference: z.string().optional(),
  amountPaid: z.number().int().nonnegative(),
  bookingId: z.string().uuid().optional(),
  notes: z.string().optional(),
  overrideOversell: z.boolean().default(false),
  overrideReason: z.string().optional(),
});

export type CompleteSaleInput = z.infer<typeof completeSaleSchema>;
