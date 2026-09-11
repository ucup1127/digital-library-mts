// app/(admin)/admin/laporan-aktivitas/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Aktivitas {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetName: string;
  changes: any;
  createdAt: string;
}

export default function LaporanAktivitasPage() {
  const [activities, setActivities] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [10, 20, 50, 100];
  
  // State untuk modal perubahan
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Aktivitas | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "";
    setUserRole(role);
    
    if (role === "SUPER_ADMIN") {
      const savedSchoolId = localStorage.getItem("selected_school_id") || "";
      const savedSchoolName = localStorage.getItem("selected_school_name") || "";
      setSelectedSchoolId(savedSchoolId);
      setSelectedSchoolName(savedSchoolName);
    } else {
      const schoolId = localStorage.getItem("school_id") || "";
      const schoolName = localStorage.getItem("school_name") || "";
      setSelectedSchoolId(schoolId);
      setSelectedSchoolName(schoolName);
    }
  }, []);

  useEffect(() => {
    const handleSchoolChange = (event: any) => {
      const newSchoolId = event.detail?.schoolId;
      const newSchoolName = event.detail?.schoolName;
      if (newSchoolId) {
        setSelectedSchoolId(newSchoolId);
        setSelectedSchoolName(newSchoolName);
        setCurrentPage(1);
      }
    };
    
    window.addEventListener("schoolChanged", handleSchoolChange);
    return () => window.removeEventListener("schoolChanged", handleSchoolChange);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterAction, filterDate, search, pageSize]);

  useEffect(() => {
    if (selectedSchoolId || (userRole === "SUPER_ADMIN" && !selectedSchoolId)) {
      fetchActivities();
    }
  }, [selectedSchoolId, currentPage, filterAction, filterDate, search, pageSize]);

  const fetchActivities = async () => {
    if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
      setActivities([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    
    if (!selectedSchoolId) {
      setActivities([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      params.append("schoolId", selectedSchoolId);
      if (filterAction) params.append("action", filterAction);
      if (filterDate) params.append("date", filterDate);
      if (search) params.append("search", search);
      
      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      const data = await res.json();
      
      setActivities(data.activities || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Gagal memuat data aktivitas");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedSchoolId) {
      toast.error("Pilih sekolah terlebih dahulu");
      return;
    }
    
    const params = new URLSearchParams();
    params.append("schoolId", selectedSchoolId);
    if (filterAction) params.append("action", filterAction);
    if (filterDate) params.append("date", filterDate);
    if (search) params.append("search", search);
    
    window.location.href = `/api/admin/export-activity-logs?${params.toString()}`;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <span className="px-2 py-0.5 text-[8px] font-medium bg-green-100 text-green-700 rounded-full">➕ CREATE</span>;
      case "UPDATE":
        return <span className="px-2 py-0.5 text-[8px] font-medium bg-blue-100 text-blue-700 rounded-full">✏️ UPDATE</span>;
      case "DELETE":
        return <span className="px-2 py-0.5 text-[8px] font-medium bg-red-100 text-red-700 rounded-full">🗑️ DELETE</span>;
      case "LOGIN":
        return <span className="px-2 py-0.5 text-[8px] font-medium bg-purple-100 text-purple-700 rounded-full">🔐 LOGIN</span>;
      case "LOGOUT":
        return <span className="px-2 py-0.5 text-[8px] font-medium bg-gray-100 text-gray-700 rounded-full">🚪 LOGOUT</span>;
      case "OVERDUE":
        return <span className="px-2 py-0.5 text-[8px] font-medium bg-orange-100 text-orange-700 rounded-full">⚠️ OVERDUE</span>;
      default:
        return <span className="px-2 py-0.5 text-[8px] font-medium bg-gray-100 text-gray-700 rounded-full">{action}</span>;
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case "BOOK": return "📖";
      case "USER": return "👤";
      case "CATEGORY": return "🏷️";
      case "SCHOOL": return "🏫";
      case "PEMINJAMAN": return "🔄";
      default: return "📄";
    }
  };

  const formatChanges = (changes: any) => {
    if (!changes) return null;
    
    // Coba parse jika string
    let data = changes;
    if (typeof changes === "string") {
      try {
        data = JSON.parse(changes);
      } catch {
        return changes;
      }
    }
    
    return data;
  };

  const hasChanges = (changes: any) => {
    const formatted = formatChanges(changes);
    return formatted && Object.keys(formatted).length > 0;
  };

  const openChangesModal = (activity: Aktivitas) => {
    setSelectedActivity(activity);
    setShowChangesModal(true);
  };

  // Jika SUPER_ADMIN belum pilih sekolah
  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Laporan Aktivitas</h1>
            <p className="text-xs text-gray-400 mt-1">Log aktivitas admin di perpustakaan</p>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-8 text-center">
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Laporan Aktivitas Admin</h1>
          <p className="text-xs text-gray-400 mt-1">
            Log aktivitas admin di perpustakaan
            {selectedSchoolName && <span className="text-blue-600 ml-1">- {selectedSchoolName}</span>}
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition flex items-center gap-2"
        >
          📥 Export Excel
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cari</label>
            <input
              type="text"
              placeholder="Nama admin atau target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Filter Aksi</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">-- Semua Aksi --</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Filter Tanggal</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tampilkan</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} data</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Aktivitas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500">Waktu</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500">Admin</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500">Aksi</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500">Target</th>
                <th className="px-4 py-3 text-center text-[9px] font-semibold text-gray-500">Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              )}
              
              {!loading && activities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📋</span>
                      <p className="text-sm">Belum ada aktivitas</p>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-600">{new Date(activity.createdAt).toLocaleDateString("id-ID")}</p>
                    <p className="text-[9px] text-gray-400">{new Date(activity.createdAt).toLocaleTimeString("id-ID")}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-800">{activity.adminName}</p>
                    <p className="text-[9px] text-gray-400">{activity.adminEmail}</p>
                  </td>
                  <td className="px-4 py-3">{getActionBadge(activity.action)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{getTargetIcon(activity.targetType)}</span>
                      <div>
                        <p className="text-xs text-gray-800">{activity.targetName || "-"}</p>
                        <p className="text-[8px] text-gray-400">{activity.targetType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasChanges(activity.changes) ? (
                      <button
                        onClick={() => openChangesModal(activity)}
                        className="px-2 py-1 text-[9px] font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                      >
                        👁️ Lihat
                      </button>
                    ) : (
                      <span className="text-[9px] text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-[9px] text-gray-500">
              Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} aktivitas
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-[9px] font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition">← Sebelumnya</button>
              <span className="px-3 py-1 text-[9px] font-medium text-gray-600">Halaman {currentPage} dari {totalPages}</span>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-[9px] font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition">Selanjutnya →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Lihat Perubahan */}
      {showChangesModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Detail Perubahan</h3>
              <button onClick={() => setShowChangesModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="mb-3">
                <p className="text-[9px] text-gray-400">Aksi</p>
                <p className="text-sm font-medium text-gray-800">{selectedActivity.action}</p>
              </div>
              <div className="mb-3">
                <p className="text-[9px] text-gray-400">Target</p>
                <p className="text-sm text-gray-800">{selectedActivity.targetName || "-"}</p>
                <p className="text-[9px] text-gray-400">{selectedActivity.targetType}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 mb-2">Data yang Berubah</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                    {(() => {
                      const changes = formatChanges(selectedActivity.changes);
                      if (!changes) return "Tidak ada data perubahan";
                      return JSON.stringify(changes, null, 2);
                    })()}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowChangesModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}