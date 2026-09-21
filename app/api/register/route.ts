// app/api/register/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";
import { generateMemberId } from "@/lib/member-id";
import { registerSchema, formatZodError } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logger.log("Register attempt:", { email: body.email, schoolId: body.schoolId });

    // 🔥 Validasi pakai Zod
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { name, email, password, schoolId } = parseResult.data;

    // Cek email sudah terdaftar
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.log("Email already exists:", email);
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Cek schoolId valid
    const school = await db.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      logger.log("School not found:", schoolId);
      return NextResponse.json(
        { error: "Sekolah tidak ditemukan" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate memberId
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