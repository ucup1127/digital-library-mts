// app/api/auth/login/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSession, setSessionCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 5;             // 5 percobaan
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 menit

export async function POST(request: Request) {
  try {
    const { email, password, role, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // 🔥 Cek rate limit — IP + email
    const ip = getClientIp(request);
    const rateKey = `login:${ip}:${email.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

    if (!rateCheck.allowed) {
      logger.log(`🚫 Rate limit exceeded: ${ip} - ${email}`);
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil((rateCheck.retryAfter || 0) / 60)} menit.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfter || 60),
          },
        }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Cek role
    if (role === "ADMIN" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Bukan admin." },
        { status: 403 }
      );
    }

    if (role === "USER" && user.role !== "USER") {
      return NextResponse.json(
        { error: "Akses ditolak. Bukan user." },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // 🔥 Login berhasil — reset rate limit
    resetRateLimit(rateKey);

    // Bikin session
    const token = await createSession(user.id, {
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress: ip,
      rememberMe: !!rememberMe,
    });

    await setSessionCookie(token, !!rememberMe);

    // Ambil data sekolah
    let schoolData = null;
    if (user.schoolId) {
      schoolData = await db.school.findUnique({
        where: { id: user.schoolId },
        select: { id: true, name: true, slug: true, logo: true, website: true },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: schoolData?.name || "",
        schoolSlug: schoolData?.slug || "",
        schoolLogo: schoolData?.logo || "",
        schoolWebsite:
          schoolData?.website ||
          "https://mtsmuhammadiyahpatikraja.sch.id",
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}