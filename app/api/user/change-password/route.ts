// app/api/user/change-password/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const { id, currentPassword, newPassword } = await request.json();
    
    if (!id || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }
    
    // Cek user
    const user = await db.user.findUnique({ where: { id } });
    
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    
    // Verifikasi password lama (plain text dulu, nanti ganti bcrypt)
    if (user.password !== currentPassword) {
      return NextResponse.json({ error: "Password saat ini salah!" }, { status: 401 });
    }
    
    // Update password
    const updatedUser = await db.user.update({
      where: { id },
      data: { password: newPassword },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Gagal mengubah password" }, { status: 500 });
  }
}