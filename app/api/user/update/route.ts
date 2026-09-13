// app/api/user/update/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAuth, AuthError } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth();
    const { id, name, className, email, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID User tidak ditemukan!" }, { status: 400 });
    }

    // 🔥 Cek: user cuma bisa update profil sendiri (kecuali admin)
    if (
      session.role !== "ADMIN" &&
      session.role !== "SUPER_ADMIN" &&
      session.userId !== id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (className !== undefined) updateData.className = className;
    if (email !== undefined) updateData.email = email;

    if (password && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password minimal 6 karakter" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        className: true,
        memberId: true,
        role: true,
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
    console.error("ERROR_UPDATE_USER:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}