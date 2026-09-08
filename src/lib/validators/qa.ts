import { z } from "zod";

export const askSchema = z.object({ body: z.string().trim().min(3).max(2000) });
export const answerSchema = z.object({ body: z.string().trim().min(1).max(4000) });
