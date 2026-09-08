import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2000),
  // Who sees a broadcast. Defaults to "only students who exist now" so a new
  // signup doesn't inherit past announcements.
  audience: z.enum(["CURRENT_STUDENTS", "ALL_STUDENTS"]).default("CURRENT_STUDENTS"),
});
