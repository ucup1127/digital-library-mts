// app/api/admin/profile/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function PUT(request: Request) {
  try {
    const session = await requireAdmin();
    const { id, name, email, currentPassword, newPassword } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    // 🔥 Cek: admin cuma bisa update profil sendiri
    if (session.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await db.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Update profil (name & email)
    if (name && email && !newPassword) {
      const updatedUser = await db.user.update({
        where: { id },
        data: { name, email },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
        },
      });
    }

    // Ganti password (verifikasi pakai bcrypt)
    if (currentPassword && newPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password saat ini salah!" }, { status: 401 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password minimal 6 karakter" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tidak ada data yang diupdate" }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Admin profile error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}