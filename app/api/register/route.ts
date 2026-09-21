// app/api/register/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";
import { generateMemberId } from "@/lib/member-id";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 🔥 JANGAN log body — bocor password!
    logger.log("Register attempt:", { email: body.email, schoolId: body.schoolId });

    const { name, email, password, schoolId } = body;

    // Validasi lengkap
    const errors = [];
    if (!email) errors.push("Email harus diisi");
    if (!password) errors.push("Password harus diisi");
    if (!schoolId) errors.push("Sekolah harus dipilih");
    if (password && password.length < 6) errors.push("Password minimal 6 karakter");

    if (errors.length > 0) {
      logger.log("Validation errors:", errors);
      return NextResponse.json(
        { error: errors.join(", ") },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.log("Email already exists:", email);
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Cek apakah schoolId valid
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      logger.log("School not found:", schoolId);
      return NextResponse.json(
        { error: "Sekolah tidak ditemukan" },
        { status: 400 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 Generate memberId — pakai helper
    const memberId = await generateMemberId(schoolId);

    // Buat user baru
    const user = await db.user.create({
      data: {
        name: name || "",
        email,
        password: hashedPassword,
        schoolId,
        role: "USER",
        memberId,
        barcode: memberId,
      },
    });

    logger.log("User created:", user.id, "memberId:", user.memberId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        memberId: user.memberId,
      },
    });
  } catch (error) {
    logger.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
}