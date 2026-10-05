// app/api/user/change-password/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { changePasswordSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // 🔥 Validasi pakai Zod
    const parseResult = changePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { id, currentPassword, newPassword } = parseResult.data;

    // 🔥 Cek: user cuma bisa ganti password sendiri
    if (session.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await db.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // 🔥 Verifikasi pakai bcrypt — BUKAN plain text
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      logger.log("❌ Change password gagal - password lama salah:", user.email);
      return NextResponse.json(
        { error: "Password saat ini salah!" },
        { status: 401 }
      );
    }

    // 🔥 Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

        // 🔥 Log user activity — change password
    await db.userActivityLog.create({
      data: {
        userId: user.id,
        schoolId: session.schoolId,
        action: "CHANGE_PASSWORD",
        description: "Password berhasil diubah",
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    }).catch(() => {});

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "CHANGE_PASSWORD",
      targetType: "USER",
      targetId: user.id,
      targetName: user.email ?? "",
      changes: { self: true },
    });

    logger.log("✅ Password berhasil diubah - id:", user.id);

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Change password error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah password" },
      { status: 500 }
    );
  }
}