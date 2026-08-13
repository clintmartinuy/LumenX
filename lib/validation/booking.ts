import { z } from "zod";

const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;

export const bookingWizardSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, "Pick at least one service"),
  productIds: z.array(z.string().uuid()).default([]),
  customerSuppliedParts: z.boolean().default(false),
  vehicleMake: z.string().min(1, "Make is required"),
  vehicleModel: z.string().min(1, "Model is required"),
  vehicleYear: z.coerce.number().int().optional(),
  plateNumber: z.string().optional(),
  scheduledAt: z.string().min(1, "Pick a date and time"),
  fullName: z.string().min(1, "Name is required"),
  phone: z.string().regex(PH_MOBILE, "Enter a valid PH mobile number (09XXXXXXXXX)"),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  notes: z.string().optional(),
});

export type BookingWizardInput = z.infer<typeof bookingWizardSchema>;
export type BookingWizardFormValues = z.input<typeof bookingWizardSchema>;

export const bookingLookupSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
  phoneLast4: z.string().length(4, "Enter the last 4 digits of your phone number"),
});

export type BookingLookupInput = z.infer<typeof bookingLookupSchema>;
