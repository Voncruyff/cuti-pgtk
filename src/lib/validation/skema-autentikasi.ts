import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username wajib diisi")
    .max(100, "Username maksimal 100 karakter")
    .trim(),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .max(100, "Password maksimal 100 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
