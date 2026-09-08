import { z } from "zod";

export const createCodeOrderSchema = z.object({
  courseId: z.string().min(1),
  studentPhone: z.string().trim().min(6).max(20),
  // InstaPay reference (المرجع). Digits only after stripping spaces/dashes the
  // student may paste from the receipt; 8–20 covers InstaPay (12) + variants.
  paymentReference: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .refine((s) => /^\d{8,20}$/.test(s), "رقم العملية غير صالح — يجب أن يكون أرقامًا فقط."),
  paymentNote: z.string().trim().max(500).optional(),
  // The object key returned by POST /api/uploads/payment-proof.
  paymentProofKey: z.string().min(1).max(300),
});

export const reviewCodeOrderSchema = z.discriminatedUnion("action", [
  // `verified` = the admin has confirmed the transfer landed in the account
  // (checked the InstaPay reference + amount). Required, so approval can't
  // happen without that assertion, and the audit log can record it.
  z.object({ action: z.literal("approve"), verified: z.literal(true) }),
  z.object({
    action: z.literal("reject"),
    rejectionReason: z.string().trim().max(300).optional(),
  }),
]);
