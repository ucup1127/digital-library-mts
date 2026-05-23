// app/api/admin/users/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// Helper untuk mendapatkan user yang login dari session/localStorage
async function getCurrentUser(request: Request) {
  // Dari header atau cookie (sederhananya, kita pakai header)
  const email = request.headers.get("x-user-email");
  if (!email) return null;
  
  return await db.user.findUnique({
    where: { email },
    select: { id: true, role: true, schoolId: true }
  });
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    let where: any = {};
    
    // 🔥 AUTHORIZATION LOGIC
    if (currentUser.role === "SUPER_ADMIN") {
      // SUPER_ADMIN bisa lihat SEMUA user
      // tidak perlu filter schoolId
    } else if (currentUser.role === "ADMIN") {
      // ADMIN biasa hanya bisa lihat user di SEKOLAHNYA SENDIRI
      // dan TIDAK BISA lihat SUPER_ADMIN atau ADMIN lain
      where.schoolId = currentUser.schoolId;
      where.role = "USER"; // ❌ HANYA USER biasa!
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Filter search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    
    const total = await db.user.count({ where });
    
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        className: true,
        createdAt: true,
        schoolId: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
      currentUserRole: currentUser.role,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ 
      users: [], 
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { email, password, name, role, className, schoolId } = await request.json();
    
    // Validasi
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }
    
    // 🔥 AUTHORIZATION LOGIC untuk CREATE
    let targetSchoolId = schoolId;
    let targetRole = role || "USER";
    
    if (currentUser.role === "SUPER_ADMIN") {
      // SUPER_ADMIN bisa buat user untuk SEKOLAH MANAPUN
      if (!targetSchoolId) {
        return NextResponse.json({ error: "Pilih sekolah terlebih dahulu!" }, { status: 400 });
      }
      // SUPER_ADMIN bisa buat USER, ADMIN, atau SUPER_ADMIN lain
    } 
    else if (currentUser.role === "ADMIN") {
      // ADMIN biasa HANYA bisa buat USER biasa
      targetSchoolId = currentUser.schoolId;
      targetRole = "USER"; // ❌ TIDAK BISA buat ADMIN!
      
      if (role && role !== "USER") {
        return NextResponse.json({ 
          error: "Anda tidak memiliki izin untuk membuat role ADMIN atau SUPER_ADMIN" 
        }, { status: 403 });
      }
    }
    else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Cek email sudah ada
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: targetRole,
        className: className || null,
        schoolId: targetSchoolId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        className: true,
        createdAt: true,
        schoolId: true,
      },
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Gagal menambah user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    }
    
    // Ambil user yang mau dihapus
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { id: true, role: true, schoolId: true }
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    
    // 🔥 AUTHORIZATION LOGIC untuk DELETE
    if (currentUser.role === "SUPER_ADMIN") {
      // SUPER_ADMIN bisa hapus siapa saja
    } 
    else if (currentUser.role === "ADMIN") {
      // ADMIN biasa HANYA bisa hapus USER biasa di sekolahnya
      if (targetUser.role !== "USER") {
        return NextResponse.json({ error: "Tidak bisa menghapus admin atau super admin" }, { status: 403 });
      }
      if (targetUser.schoolId !== currentUser.schoolId) {
        return NextResponse.json({ error: "Tidak bisa menghapus user dari sekolah lain" }, { status: 403 });
      }
    }
    else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    await db.user.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Gagal hapus user" }, { status: 500 });
  }
}