import { z } from "zod";

export const createQuizSchema = z.object({
  lessonId: z.string().min(1),
});

export const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const createQuestionSchema = z
  .object({
    text: z.string().min(1).max(500),
    options: z.array(optionSchema).min(2).max(6),
    correctId: z.string().min(1),
  })
  .refine((data) => data.options.some((o) => o.id === data.correctId), {
    message: "correctId must match one of the option ids",
    path: ["correctId"],
  });

export const submitAttemptSchema = z.object({
  answers: z.record(z.string(), z.string()),
});
