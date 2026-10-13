// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  // ============================================
  // DATABASE
  // ============================================
  DATABASE_URL: z
    .string({ message: "DATABASE_URL wajib diisi" })
    .min(1, "DATABASE_URL wajib diisi")
    .refine(
      (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
      { message: "DATABASE_URL harus PostgreSQL (postgresql:// atau postgres://)" }
    ),

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
    .min(1, "NEXTAUTH_URL wajib diisi")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://"),
      { message: "NEXTAUTH_URL harus format URL valid (http:// atau https://)" }
    ),

  // ============================================
  // REDIS (opsional)
  // ============================================
  REDIS_URL: z
    .string()
    .min(1, "REDIS_URL tidak boleh kosong")
    .refine(
      (val) => val.startsWith("redis://") || val.startsWith("rediss://"),
      { message: "REDIS_URL harus format Redis URL (redis:// atau rediss://)" }
    )
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