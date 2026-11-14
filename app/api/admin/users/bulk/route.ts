// app/api/admin/users/bulk/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

// ============================================
// PATCH — Bulk Aktifkan / Nonaktifkan
// ============================================
export async function PATCH(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const { ids, isActive } = body;

    // Validasi input
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 user" },
        { status: 400 }
      );
    }
    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }
    if (ids.length > 500) {
      return NextResponse.json(
        { error: "Maksimal 500 user sekaligus" },
        { status: 400 }
      );
    }

    // 🔥 Cek user yang boleh diubah (cegah hapus diri sendiri & cek role)
    const targetUsers = await db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true, schoolId: true, email: true, username: true, name: true },
    });

    const allowedIds = targetUsers
      .filter((u) => {
        // Cegah ubah status akun sendiri
        if (u.id === session.userId) return false;
        // ADMIN tidak boleh ubah ADMIN/SUPER_ADMIN lain
        if (
          session.role !== "SUPER_ADMIN" &&
          (u.role === "ADMIN" || u.role === "SUPER_ADMIN")
        ) {
          return false;
        }
        // ADMIN hanya boleh ubah user di sekolahnya
        if (
          session.role !== "SUPER_ADMIN" &&
          session.schoolId !== u.schoolId
        ) {
          return false;
        }
        return true;
      })
      .map((u) => u.id);

    const skipped = ids.length - allowedIds.length;

    if (allowedIds.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada user yang bisa diubah statusnya" },
        { status: 403 }
      );
    }

    // 🔥 Update massal
    const result = await db.user.updateMany({
      where: { id: { in: allowedIds } },
      data: {
        isActive,
        graduatedAt: isActive ? null : new Date(),
      },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: isActive ? "BULK_ACTIVATE_USER" : "BULK_DEACTIVATE_USER",
      targetType: "USER",
      targetId: allowedIds.join(","),
      targetName: `${allowedIds.length} user`,
      changes: { isActive, count: allowedIds.length, skipped },
    });

    revalidateTag("admin-stats", "max");

    return NextResponse.json({
      success: true,
      updated: result.count,
      skipped,
      message: `${result.count} user berhasil ${
        isActive ? "diaktifkan" : "dinonaktifkan"
      }${skipped > 0 ? `, ${skipped} dilewati` : ""}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Error bulk update user status:", error);
    return NextResponse.json(
      { error: "Gagal update status user massal" },
      { status: 500 }
    );
  }
}