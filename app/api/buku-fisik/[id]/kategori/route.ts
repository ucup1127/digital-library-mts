// app/api/buku-fisik/[id]/kategori/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { bukuFisikKategoriSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";

// GET - Ambil kategori buku fisik
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const kategoriBuku = await db.bukuFisikKategori.findMany({
      where: { bukuFisikId: id },
      include: { kategori: true },
    });
    
    return NextResponse.json(kategoriBuku);
  } catch (error) {
    logger.error("Error fetching kategori:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // 🔥 Validasi pakai Zod
    const parseResult = bukuFisikKategoriSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { kategoriIds } = parseResult.data;

    // Hapus kategori lama
    await db.bukuFisikKategori.deleteMany({
      where: { bukuFisikId: id },
    });

    // Tambah kategori baru
    if (kategoriIds && kategoriIds.length > 0) {
      await db.bukuFisikKategori.createMany({
        data: kategoriIds.map((kategoriId) => ({
          bukuFisikId: id,
          kategoriId,
        })),
      });
    }

    // 🔥 Log aktivitas
    const buku = await db.bukuFisik.findUnique({
      where: { id },
      select: { id: true, judul: true },
    });

    if (buku) {
      await logAdminActivityServer({
        action: "UPDATE_KATEGORI",
        targetType: "BUKU_FISIK",
        targetId: buku.id,
        targetName: buku.judul,
        changes: { kategoriCount: kategoriIds.length },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error updating kategori:", error);
    return NextResponse.json({ error: "Gagal update kategori" }, { status: 500 });
  }
}

// PUT - Update kategori (sama seperti POST)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params });
}