// lib/rate-limit.ts
import { logger } from "@/lib/logger";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// 🔥 In-memory store — cukup untuk single server
const attempts = new Map<string, RateLimitRecord>();

// 🧹 Bersihkan entry lama setiap 10 menit
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
      if (record.resetAt < now) {
        attempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: number;
  retryAfter?: number; // detik
}

/**
 * Cek rate limit untuk key tertentu.
 *
 * @param key — identifier unik (misal: `login:${ip}:${email}`)
 * @param limit — jumlah maksimum percobaan
 * @param windowMs — durasi window (ms)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const record = attempts.get(key);

  // Kalau nggak ada record atau udah expired — reset
  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
    };
  }

  // Kalau udah lewat limit
  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }

  // Increment
  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
  };
}

/**
 * Reset rate limit untuk key tertentu (misal setelah login berhasil).
 */
export function resetRateLimit(key: string) {
  attempts.delete(key);
}

/**
 * Dapatkan IP client dari request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ============================================
// 🔥 ACCOUNT LOCKOUT
// ============================================
import { db } from "@/lib/db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

/**
 * Cek apakah akun terkunci karena gagal login berulang
 */
export async function checkAccountLockout(userId: string): Promise<{
  locked: boolean;
  retryAfter?: number;
  failedCount?: number;
}> {
  try {
    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);

    const failedCount = await db.userActivityLog.count({
      where: {
        userId,
        action: "LOGIN_FAILED",
        createdAt: { gte: windowStart },
      },
    });

    if (failedCount < MAX_FAILED_ATTEMPTS) {
      return { locked: false, failedCount };
    }

    // Cari log gagal paling lama untuk hitung kapan unlock
    const oldestFail = await db.userActivityLog.findFirst({
      where: {
        userId,
        action: "LOGIN_FAILED",
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    if (!oldestFail) {
      return { locked: false, failedCount };
    }

    const unlockAt = new Date(
      oldestFail.createdAt.getTime() + LOCKOUT_WINDOW_MINUTES * 60 * 1000
    );
    const retryAfter = Math.ceil((unlockAt.getTime() - Date.now()) / 1000);

    if (retryAfter > 0) {
      return { locked: true, retryAfter, failedCount };
    }

    return { locked: false, failedCount };
  } catch {
    return { locked: false };
  }
}

/**
 * Reset lockout — hapus log LOGIN_FAILED user setelah login sukses
 */
export async function resetAccountLockout(userId: string) {
  try {
    await db.userActivityLog.deleteMany({
      where: {
        userId,
        action: "LOGIN_FAILED",
      },
    });
  } catch {
    // silent
  }
}