// app/api/admin/reset-password/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { resetPasswordSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";

export async function POST(request: Request) {
  try {
    const currentUser = await requireAdmin();
    const body = await request.json();

    // 🔥 Validasi pakai Zod
    const parseResult = resetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { userId, newPassword } = parseResult.data;

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, schoolId: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // 🔥 AUTHORIZATION LOGIC
    if (currentUser.role === "SUPER_ADMIN") {
      // SUPER_ADMIN bisa reset password siapa saja
    } else if (currentUser.role === "ADMIN") {
      if (targetUser.role !== "USER") {
        return NextResponse.json(
          { error: "Tidak bisa reset password admin atau super admin" },
          { status: 403 }
        );
      }
      if (targetUser.schoolId !== currentUser.schoolId) {
        return NextResponse.json(
          { error: "Tidak bisa reset password user dari sekolah lain" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "RESET_PASSWORD",
      targetType: "USER",
      targetId: targetUser.id,
      targetName: targetUser.email || targetUser.id,
      changes: { role: targetUser.role },
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil direset",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Gagal reset password" },
      { status: 500 }
    );
  }
}