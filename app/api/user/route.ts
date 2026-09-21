// app/api/user/route.ts
// FUNGSI: Untuk user biasa (siswa) mengelola profilnya sendiri
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// PATCH - Update profil user sendiri (nama, email, kelas)
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const { id, name, className, email } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID User tidak ditemukan!" }, { status: 400 });
    }

    // 🔥 Cek: user cuma bisa update profil sendiri
    if (session.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (className !== undefined) updateData.className = className;
    if (email !== undefined) updateData.email = email;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        className: true,
        memberId: true,
        // ❌ password TIDAK di-select
      },
    });

    return NextResponse.json({
      message: "Profil berhasil diperbarui!",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("ERROR_UPDATE_USER:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}

// PUT - Ganti password user sendiri
export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    const { id, currentPassword, newPassword } = await request.json();

    if (!id || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 🔥 Cek: user cuma bisa ganti password sendiri
    if (session.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // 🔥 Verifikasi pakai bcrypt
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Password saat ini salah!" }, { status: 401 });
    }

    // 🔥 Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password berhasil diubah!" });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Change password error:", error);
    return NextResponse.json({ error: "Gagal mengubah password" }, { status: 500 });
  }
}