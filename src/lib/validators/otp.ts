import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.email(),
  purpose: z.enum(["SIGNUP", "RESET"]),
});

export const verifyOtpSchema = z.object({
  email: z.email(),
  purpose: z.enum(["SIGNUP", "RESET"]),
  code: z.string().length(6),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(72),
  // Students are minors — a guardian consent (or "student is 18+") checkbox is
  // required. Must be literally true; false/missing fails validation → 400.
  guardianConsent: z.literal(true),
  guardianName: z.string().trim().max(100).optional(),
  guardianContact: z.string().trim().max(100).optional(),
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});
