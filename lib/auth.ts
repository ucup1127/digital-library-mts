// lib/auth.ts
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_DAYS = 7;

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Bikin session baru untuk user.
 * Return token yang harus di-set di cookie.
 */
export async function createSession(
  userId: string,
  options?: { userAgent?: string; ipAddress?: string; rememberMe?: boolean }
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const days = options?.rememberMe ? 30 : SESSION_DURATION_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent: options?.userAgent,
      ipAddress: options?.ipAddress,
    },
  });

  return token;
}

/**
 * Set cookie session di response.
 */
export async function setSessionCookie(token: string, rememberMe = false) {
  const cookieStore = await cookies();
  const days = rememberMe ? 30 : SESSION_DURATION_DAYS;

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,           // JS nggak bisa baca
    secure: process.env.NODE_ENV === "production", // HTTPS only di production
    sameSite: "lax",          // CSRF protection
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

/**
 * Hapus cookie session.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ============================================
// GET SESSION
// ============================================

export interface SessionData {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  schoolId: string | null;
  sessionId: string;
}

/**
 * Ambil session dari cookie. Return null kalau nggak ada / expired.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          schoolId: true,
        },
      },
    },
  });

  if (!session) return null;

  // Cek expired
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    schoolId: session.user.schoolId,
    sessionId: session.id,
  };
}

/**
 * Hapus session dari DB.
 */
export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { token } });
}

// ============================================
// GUARDS (untuk API route)
// ============================================

/**
 * Wajib login. Kalau nggak, throw error.
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

/**
 * Wajib admin. Kalau nggak, throw error.
 */
export async function requireAdmin(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

export async function requireSuperAdmin(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  if (session.role !== "SUPER_ADMIN") {
    throw new AuthError("Forbidden — Hanya Super Admin", 403);
  }
  return session;
}

/**
 * Custom error untuk auth.
 */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}