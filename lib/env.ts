// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  // ============================================
  // DATABASE
  // ============================================
  DATABASE_URL: z
    .string({ message: "DATABASE_URL wajib diisi" })
    .url("DATABASE_URL harus format URL valid")
    .startsWith("postgresql://", "DATABASE_URL harus PostgreSQL"),

  // ============================================
  // BACKUP & CRON
  // ============================================
  BACKUP_SECRET_TOKEN: z
    .string({ message: "BACKUP_SECRET_TOKEN wajib diisi" })
    .min(16, "BACKUP_SECRET_TOKEN minimal 16 karakter"),

  CRON_SECRET: z
    .string({ message: "CRON_SECRET wajib diisi" })
    .min(16, "CRON_SECRET minimal 16 karakter"),

  // ============================================
  // NEXTAUTH
  // ============================================
  NEXTAUTH_URL: z
    .string({ message: "NEXTAUTH_URL wajib diisi" })
    .url("NEXTAUTH_URL harus format URL valid"),

  // ============================================
  // REDIS (opsional)
  // ============================================
  REDIS_URL: z
    .string()
    .url("REDIS_URL harus format URL valid")
    .optional(),

  // ============================================
  // NODE ENV
  // ============================================
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Parse & validasi
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `  ❌ ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `\n\n🚨 ENV VALIDATION GAGAL:\n${errors}\n\nCek file .env kamu.\n`
  );
}

export const env = parsed.data;

// Type-safe env
export type Env = z.infer<typeof envSchema>;