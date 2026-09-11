// app/(admin)/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatsChart from "@/components/admin/StatsChart";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Library, 
  FolderTree, 
  Users, 
  Eye, 
  RefreshCw, 
  BookMarked, 
  Wallet, 
  CheckCircle,
  TrendingUp,
  Calendar,
  Award,
  ArrowRight,
  Sparkles,
  Clock,
  School
} from "lucide-react";

interface DashboardData {
  totalBooks: number;
  totalUsers: number;
  totalCategories: number;
  totalViews: number;
  totalBukuFisik: number;
  totalBukuFisikDipinjam: number;
  totalPeminjamanAktif: number;
  totalDendaBelumBayar: number;
  popularBooks: any[];
  monthlyStats: { month: string; books: number; views: number; loans: number }[];
  categoryStats: { name: string; count: number }[];
  loanStatus: { name: string; value: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [greeting, setGreeting] = useState("");
  
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    setCurrentDate(formattedDate);
    
    const hour = now.getHours();
    if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 15) setGreeting("Selamat Siang");
    else if (hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("user_role") || "";
    const school = localStorage.getItem("school_name") || "";
    const name = localStorage.getItem("user_name") || "Admin";
    
    if (isLoggedIn !== "true" || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      router.push("/login/admin");
      return;
    }
    
    setUserRole(role);
    setSchoolName(school);
    setUserName(name);
    
    if (role === "SUPER_ADMIN") {
      const savedSchoolId = localStorage.getItem("selected_school_id") || "";
      const savedSchoolName = localStorage.getItem("selected_school_name") || "";
      setSelectedSchoolId(savedSchoolId);
      setSelectedSchoolName(savedSchoolName);
    } else {
      const schoolId = localStorage.getItem("school_id") || "";
      const schoolNameLocal = localStorage.getItem("school_name") || "";
      setSelectedSchoolId(schoolId);
      setSelectedSchoolName(schoolNameLocal);
    }
  }, [router]);

  useEffect(() => {
    const handleSchoolChange = (event: any) => {
      const newSchoolId = event.detail?.schoolId;
      const newSchoolName = event.detail?.schoolName;
      if (newSchoolId) {
        setSelectedSchoolId(newSchoolId);
        setSelectedSchoolName(newSchoolName);
        fetchDashboard(newSchoolId);
      }
    };
    
    window.addEventListener("schoolChanged", handleSchoolChange);
    return () => window.removeEventListener("schoolChanged", handleSchoolChange);
  }, []);

  const fetchDashboard = async (schoolId: string) => {
    if (!schoolId && userRole === "SUPER_ADMIN") {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let url = "/api/admin/stats";
      const params = new URLSearchParams();
      
      if (userRole === "SUPER_ADMIN" && schoolId) {
        params.append("schoolId", schoolId);
      } else if (userRole === "ADMIN") {
        const adminSchoolId = localStorage.getItem("school_id") || "";
        params.append("schoolId", adminSchoolId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchoolId || userRole === "ADMIN") {
      fetchDashboard(selectedSchoolId);
    } else if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
      setLoading(false);
    }
  }, [selectedSchoolId, userRole]);

  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">{greeting}, {userName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">{currentDate}</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-8 text-center">
          <School className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-yellow-700">Belum Memilih Sekolah</h2>
          <p className="text-sm text-yellow-600 mt-1">
            Silakan pilih sekolah terlebih dahulu dari dropdown di pojok kanan atas atau dari sidebar.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat dashboard...</p>
        </div>
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
    { title: "Buku Digital", value: data.totalBooks, icon: BookOpen, color: "from-blue-500 to-blue-600", link: "/admin/buku", bg: "bg-blue-50" },
    { title: "Buku Fisik", value: data.totalBukuFisik || 0, icon: Library, color: "from-indigo-500 to-indigo-600", link: "/admin/buku-fisik", bg: "bg-indigo-50" },
    { title: "Kategori", value: data.totalCategories, icon: FolderTree, color: "from-green-500 to-green-600", link: "/admin/kategori", bg: "bg-green-50" },
    { title: "Pengguna", value: data.totalUsers, icon: Users, color: "from-purple-500 to-purple-600", link: "/admin/users", bg: "bg-purple-50" },
    { title: "Dilihat", value: data.totalViews, icon: Eye, color: "from-orange-500 to-orange-600", bg: "bg-orange-50" },
  ];

  const loanStats = [
    { title: "Peminjaman Aktif", value: data.totalPeminjamanAktif || 0, icon: RefreshCw, color: "from-amber-500 to-amber-600", link: "/admin/peminjaman-fisik", bg: "bg-amber-50" },
    { title: "Buku Dipinjam", value: data.totalBukuFisikDipinjam || 0, icon: BookMarked, color: "from-rose-500 to-rose-600", link: "/admin/peminjaman-fisik", bg: "bg-rose-50" },
    { title: "Total Denda", value: data.totalDendaBelumBayar || 0, icon: Wallet, color: "from-red-500 to-red-600", bg: "bg-red-50" },
    { title: "Buku Tersedia", value: (data.totalBukuFisik || 0) - (data.totalBukuFisikDipinjam || 0), icon: CheckCircle, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
  ];

  const monthlyData = data.monthlyStats || [];
  const categoryData = data.categoryStats || [];
  const loanStatusData = data.loanStatus || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {greeting} 👋
            {userRole === "SUPER_ADMIN" && selectedSchoolName && (
              <span className="text-gray-500 text-lg ml-1">• {selectedSchoolName}</span>
            )}
            {userRole !== "SUPER_ADMIN" && schoolName && (
              <span className="text-gray-500 text-lg ml-1">• {schoolName}</span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Selamat datang kembali, {userName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {currentDate}
          </p>
        </div>
      </div>

      {/* Stat Cards - Baris 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.link || "#"}
            className={`${stat.bg} rounded-xl p-4 transition hover:shadow-md ${stat.link ? "cursor-pointer" : "cursor-default"} group`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-xl font-bold text-gray-800 mt-0.5">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stat Cards - Baris 2 (Peminjaman) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Statistik Peminjaman Buku Fisik</span>
          <Link href="/admin/peminjaman-fisik" className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5">
            Kelola <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loanStats.map((stat) => (
            <Link
              key={stat.title}
              href={stat.link || "#"}
              className={`${stat.bg} rounded-xl p-4 transition hover:shadow-md ${stat.link ? "cursor-pointer" : "cursor-default"} group`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsChart 
          data={monthlyData}
          type="bar"
          title="📊 Buku & Peminjaman per Bulan"
          dataKey="books"
          secondaryDataKey="loans"
          nameKey="month"
        />
        
        <StatsChart 
          data={categoryData}
          type="pie"
          title="🥧 Distribusi Kategori Buku Digital"
          dataKey="count"
          nameKey="name"
        />
      </div>

      {/* Grafik Aktivitas Membaca & Status Peminjaman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsChart 
          data={monthlyData}
          type="line"
          title="📈 Tren Aktivitas Membaca"
          dataKey="views"
          nameKey="month"
        />
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Status Peminjaman Buku Fisik
          </h3>
          {loanStatusData.filter(s => s.value > 0).length > 0 ? (
            <StatsChart 
              data={loanStatusData}
              type="pie"
              title=""
              dataKey="value"
              nameKey="name"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Belum ada data peminjaman
            </div>
          )}
        </div>
      </div>

      {/* Buku Populer */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-800">Buku Digital Terpopuler</h2>
          </div>
          <Link href="/admin/buku" className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div>
          {data.popularBooks.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Belum ada data buku
            </div>
          ) : (
            data.popularBooks.map((book, idx) => (
              <div key={book.id} className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-gray-300"}`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{book.title}</p>
                    <p className="text-[9px] text-gray-400">{book.author}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">{book.views}</p>
                  <p className="text-[8px] text-gray-400">dilihat</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <QuickAction href="/admin/buku/tambah" title="Tambah Buku Digital" icon={BookOpen} color="blue" />
        <QuickAction href="/admin/buku-fisik" title="Kelola Buku Fisik" icon={Library} color="indigo" />
        <QuickAction href="/admin/peminjaman-fisik" title="Peminjaman" icon={RefreshCw} color="amber" />
        <QuickAction href="/admin/kategori" title="Kelola Kategori" icon={FolderTree} color="green" />
        <QuickAction href="/admin/settings" title="Backup DB" icon={Sparkles} color="purple" />
      </div>
    </div>
  );
}

// Komponen Quick Action
function QuickAction({ href, title, icon: Icon, color, isExternal = false }: { 
  href: string; 
  title: string; 
  icon: any; 
  color: string;
  isExternal?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  const className = `p-3 rounded-xl ${colors[color] || colors.blue} transition-all text-center group hover:shadow-md active:scale-95`;
  
  const content = (
    <>
      <Icon className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
      <p className="text-[8px] font-semibold uppercase tracking-wider mt-1 leading-tight">{title}</p>
    </>
  );
  
  if (isExternal) {
    return <a href={href} className={className}>{content}</a>;
  }
  
  return <Link href={href} className={className}>{content}</Link>;
}