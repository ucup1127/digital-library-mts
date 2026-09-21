// app/api/admin/users/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// 🔥 PATCH - Aktifkan / Nonaktifkan user (Soft Delete)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    logger.log("📌 PATCH User - id:", id, "isActive:", isActive);

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: {
        isActive,
        graduatedAt: isActive ? null : new Date(),
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

    logger.log("✅ User status updated - id:", user.id, "isActive:", user.isActive);

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error updating user status:", error);
    return NextResponse.json({ error: "Gagal update status user" }, { status: 500 });
  }
}

// PUT - Update user (edit profile)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, className, password } = body;

    logger.log("📌 PUT User - id:", id);

    if (!name || !email) {
      return NextResponse.json({ error: "Nama dan email wajib diisi" }, { status: 400 });
    }

    // Cek email tidak bentrok dengan user lain
    const existingUser = await db.user.findFirst({
      where: {
        email,
        id: { not: id },
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah digunakan user lain!" }, { status: 400 });
    }

    // Siapkan data update
    const updateData: any = {
      name,
      email,
      role,
      className,
    };

    // Jika password diisi, hash dan update
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    } else if (password && password.length > 0 && password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter!" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
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

    logger.log("✅ User updated - id:", updatedUser.id);

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error updating user:", error);
    return NextResponse.json({ error: "Gagal memperbarui user" }, { status: 500 });
  }
}

// GET - Ambil detail user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        className: true,
        memberId: true,
        isActive: true,
        graduatedAt: true,
        createdAt: true,
        schoolId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error fetching user:", error);
    return NextResponse.json({ error: "Gagal memuat user" }, { status: 500 });
  }
}