// app/api/peminjaman-fisik/route.ts (tambahkan filter schoolId)
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Ambil daftar peminjaman dengan filter schoolId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const schoolId = searchParams.get("schoolId");
    
    console.log("📋 GET Peminjaman - schoolId:", schoolId, "status:", status);
    
    // Filter berdasarkan schoolId melalui relasi bukuFisik
    const where: any = {};
    
    if (schoolId) {
      where.bukuFisik = { schoolId };
    }
    
    if (status && status !== "all") {
      where.status = status;
    }
    
    const peminjaman = await db.peminjamanFisik.findMany({
      where,
      include: {
        user: true,
        bukuFisik: true,
      },
      orderBy: { tglPinjam: "desc" },
    });
    
    console.log(`✅ Menemukan ${peminjaman.length} peminjaman`);
    
    return NextResponse.json(peminjaman);
  } catch (error) {
    console.error("Error fetching peminjaman:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - Pinjam buku (tetap sama, tidak perlu schoolId karena dari buku)
export async function POST(request: Request) {
  try {
    const { userId, bukuFisikId } = await request.json();
    
    if (!userId || !bukuFisikId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    
    // Cek user
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    
    // Cek kuota peminjaman aktif (max 2 buku)
    const activeCount = await db.peminjamanFisik.count({
      where: {
        userId,
        status: { in: ["DIPINJAM", "TERLAMBAT"] },
      },
    });
    
    if (activeCount >= 2) {
      return NextResponse.json({ error: "Maksimal pinjam 2 buku sekaligus" }, { status: 400 });
    }
    
    // Cek stok buku
    const buku = await db.bukuFisik.findUnique({
      where: { id: bukuFisikId },
    });
    
    if (!buku) {
      return NextResponse.json({ error: "Buku tidak ditemukan" }, { status: 404 });
    }
    
    if (buku.stokTersedia <= 0) {
      return NextResponse.json({ error: "Stok buku tidak tersedia" }, { status: 400 });
    }
    
    // Hitung tanggal kembali (7 hari dari sekarang)
    const tglKembali = new Date();
    tglKembali.setDate(tglKembali.getDate() + 7);
    
    // Buat peminjaman
    const peminjaman = await db.peminjamanFisik.create({
      data: {
        userId,
        bukuFisikId,
        tglKembali,
        status: "DIPINJAM",
      },
      include: {
        user: true,
        bukuFisik: true,
      },
    });
    
    // Kurangi stok tersedia
    await db.bukuFisik.update({
      where: { id: bukuFisikId },
      data: { stokTersedia: { decrement: 1 } },
    });
    
    return NextResponse.json(peminjaman, { status: 201 });
  } catch (error) {
    console.error("Error creating peminjaman:", error);
    return NextResponse.json({ error: "Gagal meminjam buku" }, { status: 500 });
  }
}

// PUT - Kembalikan buku (tetap sama)
export async function PUT(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID peminjaman diperlukan" }, { status: 400 });
    }
    
    const peminjaman = await db.peminjamanFisik.findUnique({
      where: { id },
      include: { 
        bukuFisik: true,
        user: true,
      },
    });
    
    if (!peminjaman) {
      return NextResponse.json({ error: "Peminjaman tidak ditemukan" }, { status: 404 });
    }
    
    if (peminjaman.status === "DIKEMBALIKAN") {
      return NextResponse.json({ error: "Buku sudah dikembalikan sebelumnya" }, { status: 400 });
    }
    
    // Hitung denda jika terlambat
    let denda = 0;
    const today = new Date();
    const tglKembali = new Date(peminjaman.tglKembali);
    
    today.setHours(0, 0, 0, 0);
    tglKembali.setHours(0, 0, 0, 0);
    
    if (today > tglKembali) {
      const terlambatHari = Math.ceil((today.getTime() - tglKembali.getTime()) / (1000 * 3600 * 24));
      denda = terlambatHari * 1000;
    }
    
    const updated = await db.peminjamanFisik.update({
      where: { id },
      data: {
        tglDikembalikan: new Date(),
        status: "DIKEMBALIKAN",
        denda,
      },
      include: {
        user: true,
        bukuFisik: true,
      },
    });
    
    await db.bukuFisik.update({
      where: { id: peminjaman.bukuFisikId },
      data: { stokTersedia: { increment: 1 } },
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error returning book:", error);
    return NextResponse.json({ error: "Gagal mengembalikan buku" }, { status: 500 });
  }
}