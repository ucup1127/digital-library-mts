// app/api/peminjaman-fisik/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth, requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createPeminjamanSchema, returnPeminjamanSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

// GET - Ambil daftar peminjaman
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const schoolId = searchParams.get("schoolId");
    const status = searchParams.get("status");

    const where: any = {};

    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      where.userId = session.userId;
    } else if (userId) {
      where.userId = userId;
    }

    if (schoolId) {
      where.bukuFisik = { schoolId };
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const peminjaman = await db.peminjamanFisik.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            memberId: true,
            className: true,
          },
        },
        bukuFisik: {
          select: {
            id: true,
            judul: true,
            penulis: true,
            barcode: true,
          },
        },
      },
      orderBy: { tglPinjam: "desc" },
    });

    return NextResponse.json(peminjaman);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Error fetching peminjaman:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - Pinjam buku fisik
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const parseResult = createPeminjamanSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { userId, bukuFisikId } = parseResult.data;

    const peminjaman = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User tidak ditemukan");

      const activeCount = await tx.peminjamanFisik.count({
        where: {
          userId,
          status: { in: ["DIPINJAM", "TERLAMBAT"] },
        },
      });

      if (activeCount >= 2) {
        throw new Error("Maksimal pinjam 2 buku sekaligus");
      }

      const updateResult = await tx.bukuFisik.updateMany({
        where: {
          id: bukuFisikId,
          stokTersedia: { gt: 0 },
        },
        data: { stokTersedia: { decrement: 1 } },
      });

      if (updateResult.count === 0) {
        const buku = await tx.bukuFisik.findUnique({
          where: { id: bukuFisikId },
        });
        if (!buku) throw new Error("Buku tidak ditemukan");
        throw new Error("Stok buku tidak tersedia");
      }

      const tglKembali = new Date();
      tglKembali.setDate(tglKembali.getDate() + 7);

      return await tx.peminjamanFisik.create({
        data: {
          userId,
          bukuFisikId,
          tglKembali,
          status: "DIPINJAM",
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, memberId: true, className: true },
          },
          bukuFisik: {
            select: { id: true, judul: true, penulis: true, barcode: true },
          },
        },
      });
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "CREATE_PEMINJAMAN",
      targetType: "PEMINJAMAN",
      targetId: peminjaman.id,
      targetName: `${peminjaman.bukuFisik.judul} - ${peminjaman.user.name}`,
    });

    // 🔥 Invalidate cache
    revalidateTag("admin-stats", "max");

    return NextResponse.json(peminjaman, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      const status = error.message === "Forbidden" ? 403 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    logger.error("Error creating peminjaman:", error);
    return NextResponse.json({ error: "Gagal meminjam buku" }, { status: 500 });
  }
}

// PUT - Kembalikan buku fisik
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const parseResult = returnPeminjamanSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { id } = parseResult.data;

    const updated = await db.$transaction(async (tx) => {
      const peminjaman = await tx.peminjamanFisik.findUnique({
        where: { id },
        include: {
          bukuFisik: { select: { id: true, judul: true } },
          user: { select: { id: true, name: true } },
        },
      });

      if (!peminjaman) throw new Error("Peminjaman tidak ditemukan");
      if (peminjaman.status === "DIKEMBALIKAN") {
        throw new Error("Buku sudah dikembalikan sebelumnya");
      }

      let denda = 0;
      const today = new Date();
      const tglKembali = new Date(peminjaman.tglKembali);
      today.setHours(0, 0, 0, 0);
      tglKembali.setHours(0, 0, 0, 0);

      if (today > tglKembali) {
        const terlambatHari = Math.ceil(
          (today.getTime() - tglKembali.getTime()) / (1000 * 3600 * 24)
        );
        denda = terlambatHari * 1000;
      }

      const updatedPeminjaman = await tx.peminjamanFisik.update({
        where: { id },
        data: {
          tglDikembalikan: new Date(),
          status: "DIKEMBALIKAN",
          denda,
        },
        include: {
          user: { select: { id: true, name: true, email: true, memberId: true } },
          bukuFisik: { select: { id: true, judul: true, penulis: true, barcode: true } },
        },
      });

      await tx.bukuFisik.update({
        where: { id: peminjaman.bukuFisikId },
        data: { stokTersedia: { increment: 1 } },
      });

      return updatedPeminjaman;
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "RETURN_PEMINJAMAN",
      targetType: "PEMINJAMAN",
      targetId: updated.id,
      targetName: `${updated.bukuFisik.judul} - ${updated.user.name}`,
      changes: { denda: updated.denda },
    });

    // 🔥 Invalidate cache
    revalidateTag("admin-stats", "max");

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      const status = error.message === "Forbidden" ? 403 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    logger.error("Error returning book:", error);
    return NextResponse.json({ error: "Gagal mengembalikan buku" }, { status: 500 });
  }
}