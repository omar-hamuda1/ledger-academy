import { z } from "zod";

export const createLessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1).max(200),
  videoUrl: z.string().url().optional().or(z.literal("")),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  contentHtml: z.string().optional().or(z.literal("")),
  order: z.number().int().positive().optional(),
});

export const createResourceSchema = z.object({
  lessonId: z.string().min(1),
  label: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  fileType: z.string().min(1).max(20),
});
