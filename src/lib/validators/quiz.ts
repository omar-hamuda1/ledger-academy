import { z } from "zod";

export const createQuizSchema = z.object({
  lessonId: z.string().min(1),
});

// PATCH /api/quizzes/[id] — currently just the optional countdown. 1 min – 3 h,
// or null to remove the timer.
export const updateQuizSchema = z.object({
  timeLimitSec: z.number().int().min(60).max(3 * 60 * 60).nullable(),
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
  // Present for a timed quiz — an HMAC start token from the quiz page or
  // POST /api/quizzes/[id]/start. Ignored for untimed quizzes.
  startToken: z.string().optional(),
});

// Bulk-import questions into a lesson's quiz from an uploaded CSV. The CSV
// itself is parsed + validated by src/lib/exam-import.ts; this just guards the
// envelope. 512 KB is ~10x a 200-row Arabic file.
export const bulkQuestionsSchema = z.object({
  lessonId: z.string().min(1),
  csv: z.string().min(1).max(512 * 1024),
  mode: z.enum(["append", "replace"]).default("append"),
});
