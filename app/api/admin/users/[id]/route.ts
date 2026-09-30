// app/api/admin/users/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { adminUpdateUserSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";

// ============================================
// PATCH — Aktifkan / Nonaktifkan user (Soft Delete)
// ============================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
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

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      targetType: "USER",
      targetId: user.id,
      targetName: user.email || user.name || user.id,
      changes: { isActive },
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

// ============================================
// PUT — Update user (edit profile)
// ============================================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // 🔥 Validasi pakai Zod
    const parseResult = adminUpdateUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { name, email, role, className, password } = parseResult.data;

    logger.log("📌 PUT User - id:", id);

    // 🔥 Hanya SUPER_ADMIN yang bisa ubah role ke ADMIN atau SUPER_ADMIN
    if (
      (role === "ADMIN" || role === "SUPER_ADMIN") &&
      session.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang bisa mengubah role ke Admin atau Super Admin" },
        { status: 403 }
      );
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

    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
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

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "UPDATE",
      targetType: "USER",
      targetId: updatedUser.id,
      targetName: updatedUser.email || updatedUser.name || updatedUser.id,
      changes: {
        role,
        passwordChanged: !!updateData.password,
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

// ============================================
// GET — Ambil detail user
// ============================================
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