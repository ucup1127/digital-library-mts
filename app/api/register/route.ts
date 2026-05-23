// app/api/register/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"; // ✅ Tambahkan bcrypt

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received body:", body);
    
    const { name, email, password, schoolId } = body;
    
    // Validasi lengkap
    const errors = [];
    if (!email) errors.push("Email harus diisi");
    if (!password) errors.push("Password harus diisi");
    if (!schoolId) errors.push("Sekolah harus dipilih");
    if (password && password.length < 6) errors.push("Password minimal 6 karakter");
    
    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }
    
    // Cek apakah email sudah terdaftar
    const existingUser = await db.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log("Email already exists:", email);
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    
    // Cek apakah schoolId valid
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });
    
    if (!school) {
      console.log("School not found:", schoolId);
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 400 });
    }
    
    // ✅ Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Buat user baru dengan password terhash
    const user = await db.user.create({
      data: {
        name: name || "",
        email,
        password: hashedPassword, // ✅ Simpan hash, bukan plain text
        schoolId,
        role: "USER",
      },
    });
    
    console.log("User created:", user.id);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Register error detail:", error.message);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
}