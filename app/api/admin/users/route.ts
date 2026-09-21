// app/api/admin/users/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    logger.log("📥 GET Users - schoolId:", schoolId, "status:", status);

    const where: any = {};

    // 🔥 Filter berdasarkan status
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    } else {
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

    logger.log(`✅ Menemukan ${users.length} user dari total ${totalItems}`);

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error fetching users:", error);
    return NextResponse.json(
      { users: [], pagination: { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    const { email, password, name, role, className, schoolId } = await request.json();

    // 🔥 Jangan log password
    logger.log("📝 Membuat user baru - email:", email, "role:", role, "schoolId:", schoolId);

    if (!email || !password || !schoolId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 🔥 BATASI ROLE — cegah bikin SUPER_ADMIN
    if (role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Tidak bisa membuat Super Admin" },
        { status: 403 }
      );
    }

    // 🔥 Cuma SUPER_ADMIN yang bisa bikin ADMIN
    if (role === "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya Super Admin yang bisa membuat Admin" },
        { status: 403 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar!" }, { status: 400 });
    }

    // 🔥 Generate memberId otomatis — robust
    const allUsers = await db.user.findMany({
      where: {
        schoolId,
        memberId: { not: null },
      },
      select: { memberId: true },
    });

    let maxNumber = 0;
    for (const u of allUsers) {
      if (u.memberId) {
        const num = parseInt(u.memberId.replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const newNumber = maxNumber + 1;
    let memberId = `MTS${String(newNumber).padStart(3, "0")}`;

    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      const existing = await db.user.findFirst({
        where: { memberId, schoolId },
        select: { id: true },
      });

      if (!existing) break;

      attempts++;
      memberId = `MTS${String(newNumber + attempts).padStart(3, "0")}`;
    }

    logger.log(`📌 Generated memberId: ${memberId}`);

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
        barcode: memberId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        className: true,
        schoolId: true,
        memberId: true,
        barcode: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.log("✅ User berhasil dibuat - id:", user.id, "memberId:", user.memberId);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating user:", error);
    return NextResponse.json({ error: "Gagal menambah user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    logger.log("🗑️ DELETE User - id:", id, "permanent:", permanent);

    if (permanent) {
      await db.user.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "User dihapus permanen" });
    }

    const user = await db.user.update({
      where: { id },
      data: {
        isActive: false,
        graduatedAt: new Date(),
      },
    });

    logger.log("✅ User dinonaktifkan - id:", user.id);

    return NextResponse.json({
      success: true,
      message: "User berhasil dinonaktifkan",
      user,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error deactivating user:", error);
    return NextResponse.json({ error: "Gagal menonaktifkan user" }, { status: 500 });
  }
}