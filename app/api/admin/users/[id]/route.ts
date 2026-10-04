// app/api/admin/users/[id]/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { adminUpdateUserSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

// ============================================
// PATCH — Aktifkan / Nonaktifkan
// ============================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive, graduatedAt: isActive ? null : new Date() },
      select: {
        id: true, email: true, username: true, nisn: true, name: true, role: true,
        className: true, schoolId: true, memberId: true, barcode: true,
        isActive: true, createdAt: true,
      },
    });

    await logAdminActivityServer({
      action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      targetType: "USER",
      targetId: user.id,
      targetName: user.username || user.email || user.name || user.id,
      changes: { isActive },
    });

    revalidateTag("admin-stats", "max");
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
// PUT — Update user
// ============================================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const parseResult = adminUpdateUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { name, email, username, nisn, role, className, password } = parseResult.data;

    if ((role === "ADMIN" || role === "SUPER_ADMIN") && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya Super Admin yang bisa mengubah role ke Admin atau Super Admin" },
        { status: 403 }
      );
    }

    // Cek username bentrok (kalau diisi)
    if (username && username !== "") {
      const existingUsername = await db.user.findFirst({
        where: { username, id: { not: id } },
      });
      if (existingUsername) {
        return NextResponse.json({ error: "Username sudah dipakai user lain!" }, { status: 400 });
      }
    }

    // Cek email bentrok (kalau diisi)
    if (email && email !== "") {
      const existingEmail = await db.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email sudah digunakan user lain!" }, { status: 400 });
      }
    }

    // Cek NISN bentrok (kalau diisi)
    if (nisn && nisn !== "") {
      const existingNisn = await db.user.findFirst({
        where: { nisn, id: { not: id } },
      });
      if (existingNisn) {
        return NextResponse.json({ error: "NISN sudah dipakai user lain!" }, { status: 400 });
      }
    }

    const updateData: any = {
      name,
      email: email && email !== "" ? email : null,
      role,
      className,
    };

    if (username && username !== "") {
      updateData.username = username;
    }

    if (role === "USER" && nisn && nisn !== "") {
      updateData.nisn = nisn;
      updateData.memberId = nisn;
      updateData.barcode = nisn;
    }

    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, username: true, nisn: true, name: true, role: true,
        className: true, schoolId: true, memberId: true, barcode: true,
        isActive: true, createdAt: true,
      },
    });

    await logAdminActivityServer({
      action: "UPDATE",
      targetType: "USER",
      targetId: updatedUser.id,
      targetName: updatedUser.username || updatedUser.email || updatedUser.id,
      changes: { role, passwordChanged: !!updateData.password },
    });

    revalidateTag("admin-stats", "max");
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
// GET — Detail user
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
        id: true, name: true, email: true, username: true, nisn: true, role: true,
        className: true, memberId: true, isActive: true, graduatedAt: true,
        createdAt: true, schoolId: true,
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