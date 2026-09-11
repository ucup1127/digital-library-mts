// app/api/admin/stats/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    
    console.log("📊 Dashboard Stats - schoolId:", schoolId);
    
    // Filter untuk books, users, dll
    const bookWhere: any = {};
    const userWhere: any = { role: "USER" };
    
    if (schoolId) {
      bookWhere.schoolId = schoolId;
      userWhere.schoolId = schoolId;
    }
    
    // Total Buku Digital
    const totalBooks = await db.book.count({ where: bookWhere });
    
    // Total User (siswa)
    const totalUsers = await db.user.count({ where: userWhere });
    
    // Total Kategori (semua, tidak perlu filter schoolId karena kategori global)
    const totalCategories = await db.category.count();
    
    // Total Views
    const totalViewsAgg = await db.book.aggregate({
      where: bookWhere,
      _sum: { views: true },
    });
    const totalViews = totalViewsAgg._sum.views || 0;
    
    // ========== STATISTIK BUKU FISIK ==========
    const bukuFisikWhere: any = {};
    if (schoolId) {
      bukuFisikWhere.schoolId = schoolId;
    }
    
    const totalBukuFisik = await db.bukuFisik.count({ where: bukuFisikWhere });
    
    // Peminjaman dengan filter (join ke bukuFisik untuk filter schoolId)
    const peminjamanWhere: any = {};
    if (schoolId) {
      peminjamanWhere.bukuFisik = { schoolId };
    }
    
    const totalBukuFisikDipinjam = await db.peminjamanFisik.count({
      where: {
        ...peminjamanWhere,
        status: { in: ["DIPINJAM", "TERLAMBAT"] },
      },
    });
    
    const totalPeminjamanAktif = await db.peminjamanFisik.count({
      where: {
        ...peminjamanWhere,
        status: { in: ["DIPINJAM", "TERLAMBAT"] },
      },
    });
    
    const totalDendaBelumBayarAgg = await db.peminjamanFisik.aggregate({
      where: {
        ...peminjamanWhere,
        status: "DIKEMBALIKAN",
        denda: { gt: 0 },
      },
      _sum: { denda: true },
    });
    const totalDendaBelumBayar = totalDendaBelumBayarAgg._sum.denda || 0;
    
    // Status peminjaman
    const dipinjam = await db.peminjamanFisik.count({
      where: { ...peminjamanWhere, status: "DIPINJAM" },
    });
    const terlambat = await db.peminjamanFisik.count({
      where: { ...peminjamanWhere, status: "TERLAMBAT" },
    });
    const dikembalikan = await db.peminjamanFisik.count({
      where: { ...peminjamanWhere, status: "DIKEMBALIKAN" },
    });
    
    const loanStatus = [
      { name: "Dipinjam", value: dipinjam },
      { name: "Terlambat", value: terlambat },
      { name: "Dikembalikan", value: dikembalikan },
    ];
    
    // Monthly stats (6 bulan terakhir)
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const currentMonth = new Date().getMonth();
    const monthlyStats = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      const year = new Date().getFullYear();
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      
      const booksCount = await db.book.count({
        where: {
          ...bookWhere,
          createdAt: { gte: startDate, lte: endDate },
        },
      });
      
      const viewsCount = await db.book.aggregate({
        where: {
          ...bookWhere,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { views: true },
      });
      
      const loansCount = await db.peminjamanFisik.count({
        where: {
          ...peminjamanWhere,
          createdAt: { gte: startDate, lte: endDate },
        },
      });
      
      monthlyStats.push({
        month: monthName,
        books: booksCount,
        views: viewsCount._sum.views || 0,
        loans: loansCount,
      });
    }
    
    // Buku populer
    const popularBooks = await db.book.findMany({
      where: bookWhere,
      select: { id: true, title: true, author: true, views: true },
      orderBy: { views: "desc" },
      take: 5,
    });
    
    // Kategori stats
    const categoryStatsRaw = await db.bookCategory.groupBy({
      by: ["categoryId"],
      _count: { bookId: true },
      where: {
        book: bookWhere,
      },
    });
    
    const categoryIds = categoryStatsRaw.map(c => c.categoryId);
    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
    });
    
    const categoryStats = categoryStatsRaw.map(cat => {
      const category = categories.find(c => c.id === cat.categoryId);
      return {
        name: category?.name || "Unknown",
        count: cat._count.bookId,
      };
    });
    
    return NextResponse.json({
      totalBooks,
      totalUsers,
      totalCategories,
      totalViews,
      totalBukuFisik,
      totalBukuFisikDipinjam,
      totalPeminjamanAktif,
      totalDendaBelumBayar,
      loanStatus,
      monthlyStats,
      popularBooks,
      categoryStats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        totalBooks: 0,
        totalUsers: 0,
        totalCategories: 0,
        totalViews: 0,
        totalBukuFisik: 0,
        totalBukuFisikDipinjam: 0,
        totalPeminjamanAktif: 0,
        totalDendaBelumBayar: 0,
        loanStatus: [],
        monthlyStats: [],
        popularBooks: [],
        categoryStats: [],
      },
      { status: 500 }
    );
  }
}