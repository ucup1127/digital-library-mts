// app/(admin)/admin/admin-log/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface AdminLog {
  id: string;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  targetType: string;
  targetName: string | null;
  changes: any;
  createdAt: string;
}

export default function AdminLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const itemsPerPage = 20;

  // Cek role (hanya SUPER_ADMIN)
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "SUPER_ADMIN") {
      toast.error("Akses ditolak. Hanya Super Admin!");
      router.push("/admin");
    }
  }, [router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-log?action=${actionFilter}&targetType=${targetFilter}&page=${currentPage}&limit=${itemsPerPage}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Gagal memuat log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetFilter, currentPage]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      case "LOGIN":
        return "bg-purple-100 text-purple-700";
      case "LOGOUT":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return "➕";
      case "UPDATE": return "✏️";
      case "DELETE": return "🗑️";
      case "LOGIN": return "🔐";
      case "LOGOUT": return "🚪";
      default: return "📌";
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Log Aktivitas Admin</h1>
        <p className="text-xs text-gray-400 mt-1">Catatan semua aktivitas admin (Khusus Super Admin)</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-medium text-gray-600">Filter Aksi:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">Semua Aksi</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>

          <span className="text-xs font-medium text-gray-600 ml-2">Target:</span>
          <select
            value={targetFilter}
            onChange={(e) => {
              setTargetFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">Semua Target</option>
            <option value="BOOK">Buku</option>
            <option value="USER">User</option>
            <option value="CATEGORY">Kategori</option>
            <option value="SCHOOL">Sekolah</option>
          </select>

          <div className="text-xs text-gray-500 ml-auto">
            Total {totalItems} log
          </div>
        </div>
      </div>

      {/* Tabel Log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Nama Target</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-4 py-3 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📋</span>
                      <p className="text-sm">Belum ada aktivitas admin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium rounded-full ${getActionBadge(log.action)}`}>
                        {getActionIcon(log.action)} {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{log.adminName}</p>
                        <p className="text-[9px] text-gray-400">{log.adminEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{log.targetType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{log.targetName || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2 py-1 text-[9px] font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Detail Aktivitas</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Admin</label>
                  <p className="text-sm text-gray-700">{selectedLog.adminName}</p>
                  <p className="text-xs text-gray-400">{selectedLog.adminEmail}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Role</label>
                  <p className="text-sm text-gray-700">{selectedLog.adminRole}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Aksi</label>
                  <p className="text-sm text-gray-700">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Target</label>
                  <p className="text-sm text-gray-700">{selectedLog.targetType}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500">Nama Target</label>
                <p className="text-sm text-gray-700">{selectedLog.targetName || "-"}</p>
              </div>
              
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500">Perubahan Data</label>
                  <pre className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded-lg overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-gray-500">Waktu</label>
                <p className="text-sm text-gray-700">
                  {new Date(selectedLog.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}