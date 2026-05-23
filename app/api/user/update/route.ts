// app/api/user/update/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"; // ✅ Tambahkan bcrypt

export async function PATCH(req: Request) {
  try {
    const { id, name, className, email, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID User tidak ditemukan!" }, { status: 400 });
    }

    // Siapkan data yang akan diupdate
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (className !== undefined) updateData.className = className;
    if (email !== undefined) updateData.email = email;

    // ✅ Jika user mengisi password baru, HASH dulu dengan bcrypt
    if (password && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10); // ✅ Hash password
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      message: "Profil berhasil diperbarui!", 
      user: updatedUser 
    });
  } catch (error: any) {
    console.error("ERROR_UPDATE_USER:", error.message);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}