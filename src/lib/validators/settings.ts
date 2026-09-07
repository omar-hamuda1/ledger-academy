import { z } from "zod";

export const updateSiteSettingsSchema = z.object({
  studentsCount: z.number().int().nonnegative(),
  satisfactionRate: z.number().int().min(0).max(100),
  contactEmail: z.email(),
  contactPhone: z.string().min(1).max(30),
  showBreakEvenTool: z.boolean(),
  showSwotTool: z.boolean(),
  announcement: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v.length > 0 ? v : null)),
  announcementActive: z.boolean(),
  paymentInstructions: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => (v.length > 0 ? v : null)),
});
