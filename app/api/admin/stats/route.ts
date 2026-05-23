// app/api/admin/stats/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const all = searchParams.get("all") === "true";
    
    console.log("Stats request:", { schoolId, all });
    
    let totalBooks, totalUsers, totalCategories, totalViews, popularBooks;
    let monthlyStats: any[] = [];
    let categoryStats: any[] = [];
    
    if (all) {
      // SUPER_ADMIN: data dari semua sekolah
      [totalBooks, totalUsers, totalCategories, totalViews, popularBooks] = await Promise.all([
        db.book.count(),
        db.user.count(),
        db.category.count(),
        db.book.aggregate({ _sum: { views: true } }),
        db.book.findMany({
          orderBy: { views: 'desc' },
          take: 5,
          select: { id: true, title: true, author: true, views: true }
        }),
      ]);
      
      // Ambil statistik bulanan untuk chart (6 bulan terakhir)
      const monthlyRaw = await db.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
          EXTRACT(MONTH FROM DATE_TRUNC('month', "createdAt")) as month_num,
          COUNT(*) as books,
          COALESCE(SUM(views), 0) as views
        FROM "Book"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `;
      
      monthlyStats = (monthlyRaw as any[]).map((stat: any) => ({
        month: stat.month,
        books: Number(stat.books),
        views: Number(stat.views)
      }));
      
      // Ambil statistik kategori
      const categoryRaw = await db.category.findMany({
        include: {
          books: true
        },
        take: 6
      });
      
      categoryStats = categoryRaw.map((cat: any) => ({
        name: cat.name,
        count: cat.books.length
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
    } else if (schoolId) {
      // Admin biasa: filter berdasarkan sekolah
      [totalBooks, totalUsers, totalCategories, totalViews, popularBooks] = await Promise.all([
        db.book.count({ where: { schoolId } }),
        db.user.count({ where: { schoolId } }),
        db.category.count(),
        db.book.aggregate({ where: { schoolId }, _sum: { views: true } }),
        db.book.findMany({
          where: { schoolId },
          orderBy: { views: 'desc' },
          take: 5,
          select: { id: true, title: true, author: true, views: true }
        }),
      ]);
      
      // Ambil statistik bulanan untuk chart (6 bulan terakhir) - filter by school
      const monthlyRaw = await db.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
          EXTRACT(MONTH FROM DATE_TRUNC('month', "createdAt")) as month_num,
          COUNT(*) as books,
          COALESCE(SUM(views), 0) as views
        FROM "Book"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        AND "schoolId" = ${schoolId}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `;
      
      monthlyStats = (monthlyRaw as any[]).map((stat: any) => ({
        month: stat.month,
        books: Number(stat.books),
        views: Number(stat.views)
      }));
      
      // Ambil statistik kategori - filter by school
      const booksWithCategories = await db.book.findMany({
        where: { schoolId },
        include: {
          categories: {
            include: { category: true }
          }
        }
      });
      
      // Hitung jumlah buku per kategori
      const categoryMap = new Map<string, number>();
      for (const book of booksWithCategories) {
        for (const bc of book.categories) {
          const catName = bc.category.name;
          categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
        }
      }
      
      categoryStats = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } else {
      return NextResponse.json({ error: "SchoolId diperlukan" }, { status: 400 });
    }
    
    // Jika tidak ada data monthly, buat data dummy agar chart tetap tampil
    if (monthlyStats.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
      monthlyStats = months.map(month => ({
        month,
        books: 0,
        views: 0
      }));
    }
    
    // Jika tidak ada data kategori, beri data kosong
    if (categoryStats.length === 0) {
      categoryStats = [{ name: "Belum ada data", count: 0 }];
    }
    
    return NextResponse.json({
      totalBooks,
      totalUsers,
      totalCategories: totalCategories || 0,
      totalViews: totalViews._sum?.views || 0,
      popularBooks: popularBooks || [],
      monthlyStats,
      categoryStats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    // Return data kosong tapi tetap valid
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
    const monthlyStats = months.map(month => ({
      month,
      books: 0,
      views: 0
    }));
    
    return NextResponse.json({ 
      error: "Gagal memuat statistik",
      totalBooks: 0,
      totalUsers: 0,
      totalCategories: 0,
      totalViews: 0,
      popularBooks: [],
      monthlyStats,
      categoryStats: [{ name: "Belum ada data", count: 0 }]
    }, { status: 500 });
  }
}