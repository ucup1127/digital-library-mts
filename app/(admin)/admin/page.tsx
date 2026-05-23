// app/(admin)/admin/page.tsx (tambahkan chart di dashboard)

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatsChart from "@/components/admin/StatsChart";
import toast from "react-hot-toast";

interface DashboardData {
  totalBooks: number;
  totalUsers: number;
  totalCategories: number;
  totalViews: number;
  popularBooks: any[];
  monthlyStats: { month: string; books: number; views: number }[];
  categoryStats: { name: string; count: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // Set tanggal
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    setCurrentDate(formattedDate);

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("user_role");
    const school = localStorage.getItem("school_name") || "";
    const name = localStorage.getItem("user_name") || "Admin";
    
    if (isLoggedIn !== "true" || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      router.push("/login/admin");
      return;
    }
    
    setUserRole(role || "");
    setSchoolName(school);
    setUserName(name);
    
    const fetchDashboard = async () => {
      try {
        const endpoint = role === "SUPER_ADMIN" 
          ? "/api/admin/stats?all=true" 
          : `/api/admin/stats?schoolId=${localStorage.getItem("school_id")}`;
        
        const res = await fetch(endpoint);
        const dashboardData = await res.json();
        setData(dashboardData);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Gagal memuat data dashboard</p>
      </div>
    );
  }

  const stats = [
    { title: "Total Buku", value: data.totalBooks, icon: "📚", color: "from-blue-500 to-blue-600", link: "/admin/buku", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Total Kategori", value: data.totalCategories, icon: "🏷️", color: "from-green-500 to-green-600", link: "/admin/kategori", bg: "bg-green-50 dark:bg-green-900/20" },
    { title: "Total Pengguna", value: data.totalUsers, icon: "👥", color: "from-purple-500 to-purple-600", link: "/admin/users", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { title: "Total Dilihat", value: data.totalViews, icon: "👁️", color: "from-orange-500 to-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
  ];

  // Data untuk chart (contoh, nanti ambil dari API)
  const monthlyData = data.monthlyStats || [
    { month: "Jan", books: 4, views: 120 },
    { month: "Feb", books: 6, views: 180 },
    { month: "Mar", books: 8, views: 250 },
    { month: "Apr", books: 5, views: 190 },
    { month: "Mei", books: 10, views: 320 },
    { month: "Jun", books: 7, views: 210 },
  ];

  const categoryData = data.categoryStats || [
    { name: "Agama", count: 5 },
    { name: "Sains", count: 8 },
    { name: "Matematika", count: 6 },
    { name: "Bahasa", count: 4 },
    { name: "Sejarah", count: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header dengan Tanggal di Kanan */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Dashboard
            {schoolName && <span className="text-gray-500 dark:text-gray-400 text-lg ml-2">• {schoolName}</span>}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Selamat datang kembali, {userName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{currentDate}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.link || "#"}
            className={`${stat.bg} rounded-xl p-4 transition hover:shadow-md ${stat.link ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-lg shadow-sm`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Buku per Bulan */}
        <StatsChart 
          data={monthlyData}
          type="bar"
          title="📊 Buku & Aktivitas per Bulan"
          dataKey="books"
          nameKey="month"
        />
        
        {/* Grafik Distribusi Kategori */}
        <StatsChart 
          data={categoryData}
          type="pie"
          title="🥧 Distribusi Kategori"
          dataKey="count"
          nameKey="name"
        />
      </div>

      {/* Grafik Aktivitas Membaca */}
      <div className="grid grid-cols-1 gap-6">
        <StatsChart 
          data={monthlyData}
          type="line"
          title="📈 Tren Aktivitas Membaca"
          dataKey="views"
          nameKey="month"
        />
      </div>

      {/* Buku Populer */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">📖 Buku Terpopuler</h2>
            <p className="text-[9px] text-gray-400 dark:text-gray-500">Berdasarkan jumlah dilihat</p>
          </div>
          <Link href="/admin/buku" className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline">
            Lihat Semua →
          </Link>
        </div>
        <div>
          {data.popularBooks.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
              Belum ada data buku
            </div>
          ) : (
            data.popularBooks.map((book, idx) => (
              <div key={book.id} className="px-5 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6">#{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{book.title}</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">{book.author}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{book.views}</p>
                  <p className="text-[8px] text-gray-400 dark:text-gray-500">dilihat</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/admin/buku/tambah" title="Tambah Buku" icon="📖" color="blue" />
        <QuickAction href="/admin/kategori" title="Kelola Kategori" icon="🏷️" color="green" />
        <QuickAction href="/admin/buku/import" title="Import Excel" icon="📥" color="purple" />
        <QuickAction href="/api/admin/backup" title="Backup DB" icon="💾" color="orange" isExternal />
      </div>
    </div>
  );
}

// Komponen Quick Action
function QuickAction({ href, title, icon, color, isExternal = false }: { 
  href: string; 
  title: string; 
  icon: string; 
  color: string;
  isExternal?: boolean;
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40",
  };

  const className = `p-4 rounded-xl ${colors[color]} transition-all text-center group`;
  
  if (isExternal) {
    return (
      <a href={href} className={className}>
        <div className="text-xl mb-1 group-hover:scale-110 transition">{icon}</div>
        <p className="text-[8px] font-bold uppercase tracking-wider">{title}</p>
      </a>
    );
  }
  
  return (
    <Link href={href} className={className}>
      <div className="text-xl mb-1 group-hover:scale-110 transition">{icon}</div>
      <p className="text-[8px] font-bold uppercase tracking-wider">{title}</p>
    </Link>
  );
}