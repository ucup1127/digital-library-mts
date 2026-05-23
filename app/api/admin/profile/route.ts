// app/api/admin/profile/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const { id, name, email, currentPassword, newPassword } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }
    
    // Cek user
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
        user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email } 
      });
    }
    
    // Ganti password (verifikasi current password)
    if (currentPassword && newPassword) {
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: "Password saat ini salah!" }, { status: 401 });
      }
      
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      
      const updatedUser = await db.user.update({
        where: { id },
        data: { password: newPassword },
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Tidak ada data yang diupdate" }, { status: 400 });
  } catch (error) {
    console.error("Admin profile error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}