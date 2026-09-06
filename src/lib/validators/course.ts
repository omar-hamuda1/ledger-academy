import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric segments separated by single hyphens (no leading/trailing/consecutive hyphens)"
    ),
  description: z.string().min(1),
  grade: z.string().min(1).max(100).optional(),
  price: z.number().nonnegative().optional(),
  isPublished: z.boolean().optional(),
});

export const updateCourseSchema = z.object({
  price: z.number().nonnegative(),
  isPublished: z.boolean().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  grade: z.string().min(1).max(100).optional(),
  thumbnailUrl: z.string().url().or(z.literal("")).optional(),
});
