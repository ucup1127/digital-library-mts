// app/api/auth/login/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, role, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
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

    // Bikin session
    const token = await createSession(user.id, {
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}