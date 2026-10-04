// app/api/admin/users/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createUserSchema, formatZodError } from "@/lib/validations";
import { generateMemberId } from "@/lib/member-id";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

// ============================================
// GET — Ambil daftar user
// ============================================
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

    const where: any = {};

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
        { username: { contains: search, mode: "insensitive" } },
        { nisn: { contains: search, mode: "insensitive" } },
        { memberId: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [totalItems, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          nisn: true,
          role: true,
          className: true,
          createdAt: true,
          schoolId: true,
          memberId: true,
          barcode: true,
          isActive: true,
          graduatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      users,
      pagination: { currentPage: page, pageSize: limit, totalPages, totalItems },
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

// ============================================
// POST — Tambah user baru
// ============================================
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const parseResult = createUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { email, username, nisn, password, name, role, className, schoolId } = parseResult.data;

    // 🔥 Hanya SUPER_ADMIN yang bisa bikin ADMIN atau SUPER_ADMIN
    if ((role === "ADMIN" || role === "SUPER_ADMIN") && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya Super Admin yang bisa membuat Admin atau Super Admin" },
        { status: 403 }
      );
    }

    // 🔥 ADMIN hanya bisa bikin user di sekolahnya sendiri
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Tidak bisa menambah user di sekolah lain" },
        { status: 403 }
      );
    }

    // 🔥 Cek username unik (global)
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username sudah dipakai!" }, { status: 400 });
    }

    // 🔥 Cek email unik (kalau ada)
    if (email && email !== "") {
      const existingEmail = await db.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ error: "Email sudah terdaftar!" }, { status: 400 });
      }
    }

    // 🔥 Cek NISN unik (kalau role USER + ada NISN)
    if (role === "USER" && nisn && nisn !== "") {
      const existingNisn = await db.user.findUnique({ where: { nisn } });
      if (existingNisn) {
        return NextResponse.json({ error: "NISN sudah terdaftar!" }, { status: 400 });
      }
    }

    // 🔥 Tentukan memberId
    let memberId: string;
    if (role === "USER" && nisn) {
      memberId = nisn; // siswa: NISN
    } else {
      memberId = await generateMemberId(schoolId); // admin: generate
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email: email && email !== "" ? email : null,
        username,
        nisn: role === "USER" && nisn ? nisn : null,
        password: hashedPassword,
        name: name || "",
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
        username: true,
        nisn: true,
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

    await logAdminActivityServer({
      action: "CREATE",
      targetType: "USER",
      targetId: user.id,
      targetName: user.username || user.email || user.id,
      changes: { role: user.role },
    });

    revalidateTag("admin-stats", "max");

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating user:", error);
    return NextResponse.json({ error: "Gagal menambah user" }, { status: 500 });
  }
}

// ============================================
// DELETE — Hapus / nonaktifkan user
// ============================================
export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, name: true, role: true, schoolId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (targetUser.id === session.userId) {
      return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
    }

    if (session.role !== "SUPER_ADMIN" && (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Hanya Super Admin yang bisa menghapus Admin atau Super Admin" },
        { status: 403 }
      );
    }

    if (session.role !== "SUPER_ADMIN" && session.schoolId !== targetUser.schoolId) {
      return NextResponse.json({ error: "Tidak bisa menghapus user dari sekolah lain" }, { status: 403 });
    }

    const displayName = targetUser.username || targetUser.email || targetUser.name || targetUser.id;

    if (permanent) {
      await db.user.delete({ where: { id } });

      await logAdminActivityServer({
        action: "DELETE",
        targetType: "USER",
        targetId: targetUser.id,
        targetName: displayName,
        changes: { role: targetUser.role, permanent: true },
      });

      revalidateTag("admin-stats", "max");
      return NextResponse.json({ success: true, message: "User dihapus permanen" });
    }

    const user = await db.user.update({
      where: { id },
      data: { isActive: false, graduatedAt: new Date() },
    });

    await logAdminActivityServer({
      action: "DEACTIVATE_USER",
      targetType: "USER",
      targetId: user.id,
      targetName: displayName,
      changes: { role: user.role, permanent: false },
    });

    revalidateTag("admin-stats", "max");

    return NextResponse.json({ success: true, message: "User berhasil dinonaktifkan", user });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error deactivating user:", error);
    return NextResponse.json({ error: "Gagal menonaktifkan user" }, { status: 500 });
  }
}