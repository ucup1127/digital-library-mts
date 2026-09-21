// app/api/login/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    logger.log("Login attempt:", { email, role });

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // 🔥 Cek role yang diminta sesuai
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

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // 🔥 Ambil data sekolah
    let schoolData = null;
    if (user.schoolId) {
      schoolData = await db.school.findUnique({
        where: { id: user.schoolId },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          website: true,
        },
      });
    }

    // Siapkan response
    const userData: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    // 🔥 Tambahkan data sekolah jika ada
    if (schoolData) {
      userData.schoolName = schoolData.name || "";
      userData.schoolSlug = schoolData.slug || "";
      userData.schoolLogo = schoolData.logo || "";
      userData.schoolWebsite =
        schoolData.website || "https://mtsmuhammadiyahpatikraja.sch.id";
    } else {
      userData.schoolName = "";
      userData.schoolSlug = "";
      userData.schoolLogo = "";
      userData.schoolWebsite = "https://mtsmuhammadiyahpatikraja.sch.id";
    }

    logger.log("✅ Login success:", userData.email, "Role:", userData.role);

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    logger.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}