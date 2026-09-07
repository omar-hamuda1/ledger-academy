import { z } from "zod";
import { MAX_BATCH } from "@/lib/prepaid-codes";

export const generatePrepaidCodesSchema = z.object({
  courseId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_BATCH),
});

export const redeemPrepaidCodeSchema = z.object({
  code: z.string().min(1).max(64),
  // Optional: set when redeeming from a specific course page so a code for a
  // different course is rejected up front instead of silently enrolling
  // elsewhere.
  courseId: z.string().min(1).optional(),
});
