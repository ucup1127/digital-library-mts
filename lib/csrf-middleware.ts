// lib/csrf-middleware.ts
import { NextResponse } from "next/server";
import { verifyCsrfToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

/**
 * 🔥 Wrapper untuk endpoint POST/PUT/PATCH/DELETE
 * Verifikasi CSRF token sebelum lanjut
 *
 * Contoh:
 * export async function POST(request: Request) {
 *   const csrfError = await requireCsrf(request);
 *   if (csrfError) return csrfError;
 *   // ... sisa handler
 * }
 */
export async function requireCsrf(request: Request): Promise<NextResponse | null> {
  try {
    const valid = await verifyCsrfToken(request);
    if (!valid) {
      logger.warn("🚫 CSRF validation failed");
      return NextResponse.json(
        { error: "CSRF token tidak valid. Refresh halaman dan coba lagi." },
        { status: 403 }
      );
    }
    return null;
  } catch (error) {
    logger.error("CSRF check error:", error);
    return NextResponse.json(
      { error: "Gagal verifikasi CSRF token" },
      { status: 500 }
    );
  }
}