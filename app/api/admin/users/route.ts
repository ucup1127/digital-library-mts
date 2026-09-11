// app/api/admin/users/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    
    console.log("📥 GET Users - schoolId:", schoolId, "status:", status);
    
    const where: any = {};
    
    // 🔥 Filter berdasarkan status
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    } else {
      // Default: tampilkan yang aktif saja
      where.isActive = true;
    }
    
    if (schoolId && schoolId !== "") {
      where.schoolId = schoolId;
      where.role = { not: "SUPER_ADMIN" };
    }
    
    if (role && role !== "") {
      where.role = role;
    }
    
    if (search && search !== "") {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { memberId: { contains: search, mode: "insensitive" } },
      ];
    }
    
    const totalItems = await db.user.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    
    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        className: true,
        createdAt: true,
        schoolId: true,
        memberId: true,
        barcode: true,
        isActive: true,
        graduatedAt: true,
      },
    });
    
    console.log(`✅ Menemukan ${users.length} user dari total ${totalItems}`);
    
    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalPages,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { users: [], pagination: { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, name, role, className, schoolId } = await request.json();
    
    console.log("📝 MEMBUAT USER BARU:", { email, name, role, schoolId });
    
    if (!email || !password || !schoolId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar!" }, { status: 400 });
    }
    
    // 🔥 Generate memberId otomatis
    const lastUser = await db.user.findFirst({
      where: { schoolId },
      orderBy: { memberId: "desc" },
    });
    
    let memberId = "MTS001";
    if (lastUser && lastUser.memberId) {
      const lastNumber = parseInt(lastUser.memberId.replace(/\D/g, ""));
      const newNumber = lastNumber + 1;
      memberId = `MTS${String(newNumber).padStart(3, "0")}`;
    }
    
    console.log(`📌 Generated memberId: ${memberId}`);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "USER",
        className: className || "",
        schoolId,
        memberId,
        barcode: memberId, // barcode = memberId
        isActive: true, // 🔥 User baru aktif
      },
    });
    
    console.log("✅ USER BERHASIL DIBUAT:", user.id, "memberId:", user.memberId);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Gagal menambah user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";
    
    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }
    
    console.log("🗑️ DELETE User - id:", id, "permanent:", permanent);
    
    // 🔥 Jika permanent = true, hapus permanen
    if (permanent) {
      await db.user.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "User dihapus permanen" });
    }
    
    // 🔥 Soft delete: nonaktifkan user
    const user = await db.user.update({
      where: { id },
      data: {
        isActive: false,
        graduatedAt: new Date(),
      },
    });
    
    console.log("✅ User dinonaktifkan:", user.id);
    
    return NextResponse.json({ 
      success: true, 
      message: "User berhasil dinonaktifkan",
      user 
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json({ error: "Gagal menonaktifkan user" }, { status: 500 });
  }
}