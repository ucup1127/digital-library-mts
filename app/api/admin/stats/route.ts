// app/api/admin/stats/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { unstable_cache } from "next/cache";

const getCachedStats = unstable_cache(
  async (schoolId: string | null) => {
    const bookWhere: any = {};
    const userWhere: any = { role: "USER" };

    if (schoolId) {
      bookWhere.schoolId = schoolId;
      userWhere.schoolId = schoolId;
    }

    const peminjamanWhere: any = {};
    if (schoolId) {
      peminjamanWhere.bukuFisik = { schoolId };
    }

    // ========== QUERY PARALEL ==========
    const [
      totalBooks,
      totalUsers,
      totalCategories,
      totalViewsAgg,
      totalBukuFisik,
      activeLoansCount,
      totalDendaBelumBayarAgg,
      loanStatusRaw,
      popularBooks,
      categoryStatsRaw,
    ] = await Promise.all([
      db.book.count({ where: bookWhere }),
      db.user.count({ where: userWhere }),
      db.category.count(),
      db.book.aggregate({ where: bookWhere, _sum: { views: true } }),
      db.bukuFisik.count({ where: schoolId ? { schoolId } : {} }),
      db.peminjamanFisik.count({
        where: { ...peminjamanWhere, status: { in: ["DIPINJAM", "TERLAMBAT"] } },
      }),
      db.peminjamanFisik.aggregate({
        where: { ...peminjamanWhere, status: "DIKEMBALIKAN", denda: { gt: 0 } },
        _sum: { denda: true },
      }),
      db.peminjamanFisik.groupBy({
        by: ["status"],
        where: peminjamanWhere,
        _count: { id: true },
      }),
      db.book.findMany({
        where: bookWhere,
        select: { id: true, title: true, author: true, views: true },
        orderBy: { views: "desc" },
        take: 5,
      }),
      db.bookCategory.groupBy({
        by: ["categoryId"],
        _count: { bookId: true },
        where: { book: bookWhere },
      }),
    ]);

    const totalViews = totalViewsAgg._sum.views || 0;
    const totalBukuFisikDipinjam = activeLoansCount;
    const totalPeminjamanAktif = activeLoansCount;
    const totalDendaBelumBayar = totalDendaBelumBayarAgg._sum.denda || 0;

    // Parse loanStatus
    const loanStatusMap: Record<string, number> = {};
    for (const item of loanStatusRaw) {
      loanStatusMap[item.status] = item._count.id;
    }

    const loanStatus = [
      { name: "Dipinjam", value: loanStatusMap["DIPINJAM"] || 0 },
      { name: "Terlambat", value: loanStatusMap["TERLAMBAT"] || 0 },
      { name: "Dikembalikan", value: loanStatusMap["DIKEMBALIKAN"] || 0 },
    ];

    // ========== MONTHLY STATS — 2 QUERY ==========
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [allBooks, allLoans] = await Promise.all([
      db.book.findMany({
        where: { ...bookWhere, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, views: true },
      }),
      db.peminjamanFisik.findMany({
        where: { ...peminjamanWhere, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyStats = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const isSameMonth = (date: Date) =>
        date.getMonth() === monthIndex && date.getFullYear() === currentYear;

      const booksCount = allBooks.filter((b) => isSameMonth(new Date(b.createdAt))).length;
      const viewsCount = allBooks
        .filter((b) => isSameMonth(new Date(b.createdAt)))
        .reduce((sum, b) => sum + (b.views || 0), 0);
      const loansCount = allLoans.filter((l) => isSameMonth(new Date(l.createdAt))).length;

      monthlyStats.push({
        month: months[monthIndex],
        books: booksCount,
        views: viewsCount,
        loans: loansCount,
      });
    }

    // Category stats
    const categoryIds = categoryStatsRaw.map((c) => c.categoryId);
    const categories = await db.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryStats = categoryStatsRaw.map((cat) => {
      const category = categories.find((c) => c.id === cat.categoryId);
      return {
        name: category?.name || "Unknown",
        count: cat._count.bookId,
      };
    });

    return {
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
    };
  },
  ["admin-stats"],
  { revalidate: 300, tags: ["admin-stats"] }
);

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    const stats = await getCachedStats(schoolId);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
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