import { z } from "zod";
import { ADMIN_SCOPES } from "@/lib/authz";

// Admin actions on another user's account (PATCH /api/users/[id]).
export const updateUserSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setRole"), role: z.enum(["ADMIN", "STUDENT"]) }),
  z.object({ action: z.literal("setDisabled"), disabled: z.boolean() }),
  // `password` omitted -> the server generates a temporary one and returns it.
  z.object({
    action: z.literal("setPassword"),
    password: z.string().min(8, "8 أحرف على الأقل").max(72).optional(),
  }),
  // Super-admin only: set the target admin's blocked dashboard sections
  // (deny-list). An empty array clears all restrictions.
  z.object({
    action: z.literal("setPermissions"),
    restrictedScopes: z.array(z.enum(ADMIN_SCOPES)).max(ADMIN_SCOPES.length),
  }),
]);
