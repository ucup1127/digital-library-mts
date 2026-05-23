// app/api/login/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();
    
    console.log("Login attempt:", { email, role });
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password harus diisi" }, { status: 400 });
    }
    
    const user = await db.user.findUnique({ 
      where: { email },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 401 });
    }
    
    // Verifikasi password
    let isPasswordValid = false;
    
    if (user.password.startsWith("$2b$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = user.password === password;
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      }
    }
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password salah!" }, { status: 401 });
    }
    
    // Cek role
    if (role === "ADMIN") {
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Akses ditolak. Bukan halaman ADMIN." }, { status: 403 });
      }
    } else if (role && user.role !== role) {
      return NextResponse.json({ error: `Akses ditolak. Bukan halaman ${role}.` }, { status: 403 });
    }
    
    // ✅ PERBAIKAN: Kirim schoolName dan schoolLogo yang benar
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId || "",
        schoolName: user.school?.name || "",  // ← Ambil dari relasi school
        schoolSlug: user.school?.slug || "",
        schoolLogo: user.school?.logo || "",  // ← Ambil dari relasi school
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}