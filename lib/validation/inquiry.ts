import { z } from "zod";

const PH_MOBILE = /^(09\d{9}|\+639\d{9})$/;

export const inquirySchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  phone: z.string().regex(PH_MOBILE, "Enter a valid PH mobile number (09XXXXXXXXX)"),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  customerType: z.enum(["b2c", "b2b"]),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  productSku: z.string().optional(),
  // Honeypot: must stay empty. Real visitors never see or fill this field.
  companyWebsite: z.string().max(0).optional().or(z.literal("")),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
