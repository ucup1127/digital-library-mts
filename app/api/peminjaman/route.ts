// app/api/peminjaman/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Ambil daftar peminjaman user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "all";
    
    if (!userId) {
      return NextResponse.json({ error: "UserId diperlukan" }, { status: 400 });
    }
    
    const where: any = { userId };
    if (status !== "all") {
      where.status = status;
    }
    
    const peminjaman = await db.peminjaman.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverUrl: true,
          }
        }
      },
      orderBy: { tglPinjam: "desc" }
    });
    
    // Hitung sisa hari
    const today = new Date();
    const formatted = peminjaman.map(p => {
      const tglKembali = new Date(p.tglKembali);
      const sisaHari = Math.ceil((tglKembali.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const isTerlambat = sisaHari < 0 && p.status === "DIPINJAM";
      
      return {
        ...p,
        sisaHari,
        isTerlambat,
        status: isTerlambat ? "TERLAMBAT" : p.status
      };
    });
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching peminjaman:", error);
    return NextResponse.json({ error: "Gagal memuat peminjaman" }, { status: 500 });
  }
}

// POST - Pinjam buku
export async function POST(request: Request) {
  try {
    const { userId, bookId } = await request.json();
    
    if (!userId || !bookId) {
      return NextResponse.json({ error: "UserId dan BookId diperlukan" }, { status: 400 });
    }
    
    // Cek apakah user sudah pinjam 2 buku
    const activeLoans = await db.peminjaman.count({
      where: {
        userId,
        status: "DIPINJAM"
      }
    });
    
    if (activeLoans >= 2) {
      return NextResponse.json({ error: "Maksimal pinjam 2 buku" }, { status: 400 });
    }
    
    // Cek apakah buku sedang dipinjam user lain
    const bookLoaned = await db.peminjaman.findFirst({
      where: {
        bookId,
        status: "DIPINJAM"
      }
    });
    
    if (bookLoaned) {
      return NextResponse.json({ error: "Buku sedang dipinjam" }, { status: 400 });
    }
    
    // Hitung tanggal kembali (2 hari dari sekarang)
    const tglKembali = new Date();
    tglKembali.setDate(tglKembali.getDate() + 2);
    
    const peminjaman = await db.peminjaman.create({
      data: {
        userId,
        bookId,
        tglKembali,
      },
      include: {
        book: true,
        user: true
      }
    });
    
    return NextResponse.json(peminjaman, { status: 201 });
  } catch (error) {
    console.error("Error creating peminjaman:", error);
    return NextResponse.json({ error: "Gagal meminjam buku" }, { status: 500 });
  }
}

// PUT - Kembalikan buku
export async function PUT(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "Id peminjaman diperlukan" }, { status: 400 });
    }
    
    const peminjaman = await db.peminjaman.findUnique({
      where: { id },
      include: { book: true }
    });
    
    if (!peminjaman) {
      return NextResponse.json({ error: "Peminjaman tidak ditemukan" }, { status: 404 });
    }
    
    // Hitung denda jika terlambat
    let denda = 0;
    const today = new Date();
    const tglKembali = new Date(peminjaman.tglKembali);
    
    if (today > tglKembali) {
      const terlambatHari = Math.ceil((today.getTime() - tglKembali.getTime()) / (1000 * 3600 * 24));
      denda = terlambatHari * 1000; // Rp1000 per hari
    }
    
    const updated = await db.peminjaman.update({
      where: { id },
      data: {
        tglDikembalikan: today,
        status: "DIKEMBALIKAN",
        denda,
      }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error returning book:", error);
    return NextResponse.json({ error: "Gagal mengembalikan buku" }, { status: 500 });
  }
}