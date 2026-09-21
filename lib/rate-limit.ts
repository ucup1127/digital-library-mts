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