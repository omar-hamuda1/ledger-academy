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
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});
