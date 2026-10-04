// app/api/auth/login/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSession, setSessionCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema, formatZodError } from "@/lib/validations";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🔥 Validasi input pakai Zod
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { login, password, type, rememberMe } = parseResult.data;

    // 🔥 Cek rate limit
    const ip = getClientIp(request);
    const rateKey = `login:${ip}:${login}`;
    const rateCheck = checkRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

    if (!rateCheck.allowed) {
      logger.log(`🚫 Rate limit exceeded: ${ip} - ${login}`);
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil((rateCheck.retryAfter || 0) / 60)} menit.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter || 60) },
        }
      );
    }

    // 🔥 Cari user berdasarkan tipe login
    let user = null;

    if (type === "user") {
      // Siswa: cari di username, role harus USER
      user = await db.user.findUnique({
        where: { username: login },
      });

      if (!user || user.role !== "USER") {
        return NextResponse.json(
          { error: "Username atau password salah" },
          { status: 401 }
        );
      }
    } else if (type === "admin") {
      // Admin: cari di email ATAU username, role ADMIN/SUPER_ADMIN
      user = await db.user.findFirst({
        where: {
          OR: [{ email: login }, { username: login }],
          role: { in: ["ADMIN", "SUPER_ADMIN"] },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Email/Username atau password salah" },
          { status: 401 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // 🔥 Cek user aktif
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Akun Anda tidak aktif. Hubungi admin." },
        { status: 403 }
      );
    }

    // 🔥 Cek password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: type === "user" ? "Username atau password salah" : "Email/Username atau password salah" },
        { status: 401 }
      );
    }

    // 🔥 Login berhasil — reset rate limit
    resetRateLimit(rateKey);

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
        username: user.username,
        nisn: user.nisn,
        role: user.role,
        memberId: user.memberId,
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