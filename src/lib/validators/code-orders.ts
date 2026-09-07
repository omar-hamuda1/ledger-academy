import { z } from "zod";

export const createCodeOrderSchema = z.object({
  courseId: z.string().min(1),
  studentPhone: z.string().trim().min(6).max(20),
  paymentNote: z.string().trim().min(3).max(500),
});

export const reviewCodeOrderSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("reject"),
    rejectionReason: z.string().trim().max(300).optional(),
  }),
]);
