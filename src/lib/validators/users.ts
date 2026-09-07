import { z } from "zod";

// Admin actions on another user's account (PATCH /api/users/[id]).
export const updateUserSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setRole"), role: z.enum(["ADMIN", "STUDENT"]) }),
  z.object({ action: z.literal("setDisabled"), disabled: z.boolean() }),
]);
