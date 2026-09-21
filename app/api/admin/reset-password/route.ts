// app/api/admin/reset-password/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // 🔥 Ambil user dari session — bukan header yang bisa dipalsukan
    const currentUser = await requireAdmin();

    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Ambil target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, schoolId: true },
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
      // ADMIN cuma bisa reset password USER biasa di sekolahnya
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