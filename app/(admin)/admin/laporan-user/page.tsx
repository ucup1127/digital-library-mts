// app/(admin)/admin/laporan-user/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  FileText, Download, Search, Calendar, User, BookOpen, Eye, 
  ChevronLeft, ChevronRight, Users, Clock, Activity, Mail, Globe, 
  FileSpreadsheet, ListFilter
} from "lucide-react";

interface AktivitasUser {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string | null; // 🔥 Pakai ini
  action: string;
  bookTitle: string;
  bookId: string;
  createdAt: string;
  ipAddress: string;
}

interface Stats {
  uniqueUsers: number;
  uniqueBooks: number;
  todayCount: number;
}

export default function LaporanUserPage() {
  const [activities, setActivities] = useState<AktivitasUser[]>([]);
  const [stats, setStats] = useState<Stats>({ uniqueUsers: 0, uniqueBooks: 0, todayCount: 0 });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // 🔥 State untuk debounce
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100];
  
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "";
    setUserRole(role);
    
    if (role === "SUPER_ADMIN") {
      setSelectedSchoolId(localStorage.getItem("selected_school_id") || "");
      setSelectedSchoolName(localStorage.getItem("selected_school_name") || "");
    } else {
      setSelectedSchoolId(localStorage.getItem("school_id") || "");
      setSelectedSchoolName(localStorage.getItem("school_name") || "");
    }
  }, []);

  useEffect(() => {
    const handleSchoolChange = (event: any) => {
      if (event.detail?.schoolId) {
        setSelectedSchoolId(event.detail.schoolId);
        setSelectedSchoolName(event.detail.schoolName);
        setCurrentPage(1);
      }
    };
    window.addEventListener("schoolChanged", handleSchoolChange);
    return () => window.removeEventListener("schoolChanged", handleSchoolChange);
  }, []);

  // 🔥 EFEK DEBOUNCE (200ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [filterDate, pageSize]);

  useEffect(() => {
    if (selectedSchoolId) fetchActivities();
  }, [selectedSchoolId, currentPage, filterDate, debouncedSearch, pageSize]);

  const fetchActivities = async () => {
    if (!selectedSchoolId) {
      setActivities([]); setTotalItems(0); setTotalPages(1); setLoading(false); return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        schoolId: selectedSchoolId,
        excludeSuperAdmin: "true"
      });
      
      if (filterDate) { params.append("start", filterDate); params.append("end", filterDate); }
      if (debouncedSearch) params.append("search", debouncedSearch); // Gunakan debouncedSearch
      
      const res = await fetch(`/api/admin/laporan-user?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      setActivities(data.activities || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
      
      if (data.stats) setStats(data.stats); // 🔥 Set statistik dari API
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Gagal memuat data aktivitas");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedSchoolId) { toast.error("Pilih sekolah terlebih dahulu"); return; }
    setExporting(true);
    toast.loading("Menyiapkan file Excel...", { id: "export" });
    
    try {
      const params = new URLSearchParams({ schoolId: selectedSchoolId, excludeSuperAdmin: "true" });
      if (filterDate) { params.append("start", filterDate); params.append("end", filterDate); }
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      const response = await fetch(`/api/admin/export-laporan-user?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-aktivitas-siswa-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("File Excel berhasil didownload!", { id: "export" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengexport data", { id: "export" });
    } finally {
      setExporting(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "VIEW_BOOK": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-medium bg-blue-100 text-blue-700 rounded-full"><Eye className="w-3 h-3" /> VIEW</span>;
      case "READ_BOOK": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-medium bg-green-100 text-green-700 rounded-full"><BookOpen className="w-3 h-3" /> READ</span>;
      case "DOWNLOAD": return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-medium bg-purple-100 text-purple-700 rounded-full"><Download className="w-3 h-3" /> DOWNLOAD</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-medium bg-gray-100 text-gray-700 rounded-full">{action}</span>;
    }
  };

  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" /> Laporan Aktivitas Siswa
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Log aktivitas baca siswa di perpustakaan</p>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-8 text-center">
          <div className="text-5xl mb-3">🏫</div>
          <h2 className="text-lg font-semibold text-yellow-700">Belum Memilih Sekolah</h2>
          <p className="text-sm text-yellow-600 mt-1">Silakan pilih sekolah terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" /> Laporan Aktivitas Siswa
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Log aktivitas baca siswa di perpustakaan
            {selectedSchoolName && <span className="text-green-600 ml-1">- {selectedSchoolName}</span>}
          </p>
        </div>
        <button onClick={handleExportExcel} disabled={exporting} className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition flex items-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50">
          {exporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Memproses...</> : <><FileSpreadsheet className="w-4 h-4" /> Export Excel</>}
        </button>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Total Aktivitas</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{totalItems.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"><Activity className="w-4 h-4 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Hari Ini</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.todayCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><Clock className="w-4 h-4 text-green-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Pengguna Unik</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.uniqueUsers}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center"><Users className="w-4 h-4 text-purple-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Buku Dibaca</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.uniqueBooks}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><BookOpen className="w-4 h-4 text-amber-600" /></div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cari</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Email siswa atau judul buku..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Filter Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tampilkan</label>
            <div className="relative">
              <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white appearance-none">
                {pageSizeOptions.map(size => <option key={size} value={size}>{size} data</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Aktivitas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Aktivitas</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Buku</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-400 text-sm font-medium">Memuat data...</p></div></td></tr>
              ) : activities.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3"><FileText className="w-12 h-12 text-gray-300" /><p className="text-gray-400 text-sm">Belum ada aktivitas siswa</p></div></td></tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition group">
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />{new Date(activity.createdAt).toLocaleDateString("id-ID")}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{new Date(activity.createdAt).toLocaleTimeString("id-ID")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {/* 🔥 Tampilkan userName, kalau kosong pakai Email, kalau kosong juga "Guest" */}
                        {activity.userName || activity.userEmail || "Guest"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{getActionBadge(activity.action)}</td>
                    <td className="px-4 py-3"><p className="text-xs text-gray-800 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-gray-400" />{activity.bookTitle || "-"}</p></td>
                    <td className="px-4 py-3"><p className="text-[9px] text-gray-400 font-mono flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" />{activity.ipAddress || "-"}</p></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-[9px] text-gray-500">Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} aktivitas</div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-[9px] font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Sebelumnya</button>
              <span className="px-3 py-1.5 text-[9px] font-medium text-gray-600">Halaman {currentPage} dari {totalPages}</span>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-[9px] font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition flex items-center gap-1">Selanjutnya <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}