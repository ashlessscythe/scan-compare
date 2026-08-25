import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Normalize email the same way registration persists it. */
export function normalizeRegisterEmail(email: string): string {
  return email.toLowerCase();
}
