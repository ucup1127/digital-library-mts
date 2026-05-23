import { db } from "@/lib/db";
import Link from "next/link";
import ActivityClient from "@/components/admin/ActivityClient";
import PrintButton from "@/components/ui/PrintButton";

export default async function LaporanAktivitasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; user?: string; date?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const actionFilter = params.action || "";
  const userFilter = params.user || "";
  const dateFilter = params.date || "";
  const itemsPerPage = 10;

  // Build where clause (TANPA FILTER SEKOLAH DULU, nanti difilter di frontend)
  const where: any = {};

  if (actionFilter) where.action = actionFilter;
  if (userFilter) {
    where.userEmail = { contains: userFilter, mode: "insensitive" };
  }
  if (dateFilter) {
    const startDate = new Date(dateFilter);
    const endDate = new Date(dateFilter);
    endDate.setDate(endDate.getDate() + 1);
    where.createdAt = { gte: startDate, lt: endDate };
  }

  // Get total count for pagination
  const totalActivities = await db.visitorLog.count({ where });
  const totalPages = Math.ceil(totalActivities / itemsPerPage);

  // Get activities with pagination
  const activities = await db.visitorLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  });

  // Get statistics (SEMUA DATA, nanti difilter di frontend)
  const [
    totalViews,
    totalReads,
    totalSearches,
    totalUniqueUsers,
    todayActivities,
    topBooks,
  ] = await Promise.all([
    db.visitorLog.count(),
    db.visitorLog.count({ where: { action: "READ" } }),
    db.visitorLog.count({ where: { action: "SEARCH" } }),
    db.visitorLog.groupBy({ by: ["userEmail"], _count: { id: true } }).then((res: any) => res.length),
    db.visitorLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    db.visitorLog.groupBy({
      by: ["bookTitle"],
      _count: { id: true },
      where: { bookTitle: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Activity by hour
  let activityByHour: any[] = [];
  try {
    activityByHour = await db.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as count
      FROM "VisitorLog"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour ASC
    `;
  } catch (error) {
    console.error("Error fetching activity by hour:", error);
    activityByHour = [];
  }

  // Get unique actions for filter dropdown
  const uniqueActions = await db.visitorLog.groupBy({
    by: ["action"],
    orderBy: { action: "asc" },
  });

  const stats = [
    { title: "Total Aktivitas", value: totalViews, icon: "📊", color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
    { title: "Membaca Buku", value: totalReads, icon: "📖", color: "from-green-500 to-green-600", bg: "bg-green-50" },
    { title: "Pencarian", value: totalSearches, icon: "🔍", color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
    { title: "User Aktif", value: totalUniqueUsers, icon: "👥", color: "from-orange-500 to-orange-600", bg: "bg-orange-50" },
    { title: "Hari Ini", value: todayActivities, icon: "✨", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
    { title: "Total Buku", value: await db.book.count(), icon: "📚", color: "from-rose-500 to-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Laporan Aktivitas</h1>
          <p className="text-xs text-gray-400 mt-1">Monitor seluruh aktivitas pengguna</p>
        </div>
        <div className="flex gap-3">
          <PrintButton title="Laporan Aktivitas Perpustakaan" />
          <a 
            href="/api/admin/export-laporan-excel"
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-green-700 transition flex items-center gap-1"
          >
            📊 Export Excel
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <div key={stat.title} className={`${stat.bg} rounded-xl p-3 transition hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-xl font-bold text-gray-800 mt-0.5">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-sm shadow-sm`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Books & Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Books Accessed */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">📖 Buku Paling Sering Diakses</h2>
            <p className="text-[9px] text-gray-400">Berdasarkan jumlah akses</p>
          </div>
          <div className="p-4">
            {topBooks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-xs text-gray-400">Belum ada data aktivitas</p>
                <p className="text-[9px] text-gray-300 mt-1">Ajak pengguna untuk membaca buku!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topBooks.map((book, idx) => (
                  <div key={book.bookTitle} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>
                      <span className="text-xs font-medium text-gray-700 line-clamp-1">{book.bookTitle}</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">{book._count.id} kali</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity by Hour */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">⏰ Jam Aktif Pengguna</h2>
            <p className="text-[9px] text-gray-400">7 hari terakhir</p>
          </div>
          <div className="p-4">
            {activityByHour.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">⏰</div>
                <p className="text-xs text-gray-400">Belum ada data aktivitas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(activityByHour as any[]).map((item) => {
                  const hour = parseInt(item.hour);
                  const count = parseInt(item.count);
                  const maxCount = Math.max(...(activityByHour as any[]).map((h: any) => parseInt(h.count)));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const hourName = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
                  
                  return (
                    <div key={hour}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-600">{hourName}</span>
                        <span className="text-gray-400">{count} aktivitas</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activities Table with Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">📋 Log Aktivitas Detail</h2>
          <p className="text-[9px] text-gray-400">Semua aktivitas pengguna</p>
        </div>
        
        <ActivityClient 
          initialActivities={activities}
          totalPages={totalPages}
          currentPage={currentPage}
          totalItems={totalActivities}
          actions={uniqueActions}
          searchParams={{
            action: actionFilter,
            user: userFilter,
            date: dateFilter,
          }}
        />
      </div>
    </div>
  );
}