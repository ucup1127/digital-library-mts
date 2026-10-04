// app/api/register/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";
import { registerSchema, formatZodError } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logger.log("Register attempt:", { nisn: body.nisn, username: body.username });

    // 🔥 Validasi pakai Zod
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { nisn, name, className, username, password, schoolId } = parseResult.data;

    // 🔥 Cek NISN sudah terdaftar
    const existingNisn = await db.user.findUnique({ where: { nisn } });
    if (existingNisn) {
      return NextResponse.json(
        { error: "NISN sudah terdaftar" },
        { status: 400 }
      );
    }

    // 🔥 Cek username sudah dipakai (global — siswa + admin)
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username sudah dipakai. Pilih username lain." },
        { status: 400 }
      );
    }

    // 🔥 Cek schoolId valid
    const school = await db.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      logger.log("School not found:", schoolId);
      return NextResponse.json(
        { error: "Sekolah tidak ditemukan" },
        { status: 400 }
      );
    }

    // 🔥 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 Buat user baru (NISN = memberId = barcode)
    const user = await db.user.create({
      data: {
        nisn,
        username,
        name,
        className,
        password: hashedPassword,
        schoolId,
        role: "USER",
        memberId: nisn,     // ← NISN jadi no anggota
        barcode: nisn,      // ← NISN jadi barcode
        email: null,        // ← siswa nggak wajib email
        isActive: true,
      },
    });

    logger.log("User created:", user.id, "NISN:", user.nisn, "username:", user.username);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        nisn: user.nisn,
        username: user.username,
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