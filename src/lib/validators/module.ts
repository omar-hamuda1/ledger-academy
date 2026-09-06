import { z } from "zod";

export const createModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
});
