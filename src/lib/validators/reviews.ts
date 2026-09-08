import { z } from "zod";

export const upsertReviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(1000).optional(),
});

export const moderateReviewSchema = z.object({ hidden: z.boolean() });
