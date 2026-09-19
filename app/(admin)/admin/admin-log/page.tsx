// app/(admin)/admin/admin-log/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  FileText,
  X,
  Filter,
} from "lucide-react";

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

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.user) {
          router.push("/login/admin");
          return;
        }

        if (data.user.role !== "SUPER_ADMIN") {
          toast.error("Akses ditolak. Hanya Super Admin!");
          router.push("/admin");
        }
      } catch (error) {
        console.error("Error checking role:", error);
        router.push("/login/admin");
      }
    };

    checkRole();
  }, [router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin-log?action=${actionFilter}&targetType=${targetFilter}&page=${currentPage}&limit=${itemsPerPage}`
      );
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
      case "CREATE": return "bg-green-100 text-green-700";
      case "UPDATE": return "bg-blue-100 text-blue-700";
      case "DELETE": return "bg-red-100 text-red-700";
      case "LOGIN": return "bg-purple-100 text-purple-700";
      case "LOGOUT": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <Plus className="w-3 h-3" />;
      case "UPDATE": return <Edit className="w-3 h-3" />;
      case "DELETE": return <Trash2 className="w-3 h-3" />;
      case "LOGIN": return <LogIn className="w-3 h-3" />;
      case "LOGOUT": return <LogOut className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-600" />
          Log Aktivitas Admin
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Catatan semua aktivitas admin (Khusus Super Admin)
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Filter Aksi</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="all">Semua Aksi</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Filter Target</label>
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="all">Semua Target</option>
              <option value="BOOK">Buku</option>
              <option value="USER">User</option>
              <option value="CATEGORY">Kategori</option>
              <option value="SCHOOL">Sekolah</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full px-4 py-2.5 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-700 font-medium text-center">
              Total {totalItems} log
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Log */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nama Target</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada aktivitas admin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium rounded-full ${getActionBadge(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-gray-800">{log.adminName}</p>
                      <p className="text-[9px] text-gray-400">{log.adminEmail}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-600">{log.targetType}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-700">{log.targetName || "-"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[10px] text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("id-ID")}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[9px] font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
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
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Detail Aktivitas
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-b border-gray-100 pb-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Admin</label>
                  <p className="text-sm text-gray-800 mt-1 font-medium">{selectedLog.adminName}</p>
                  <p className="text-xs text-gray-400">{selectedLog.adminEmail}</p>
                </div>
                <div className="border-b border-gray-100 pb-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                  <p className="text-sm text-gray-800 mt-1">{selectedLog.adminRole}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-b border-gray-100 pb-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</label>
                  <p className="text-sm text-gray-800 mt-1">{selectedLog.action}</p>
                </div>
                <div className="border-b border-gray-100 pb-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Target</label>
                  <p className="text-sm text-gray-800 mt-1">{selectedLog.targetType}</p>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nama Target</label>
                <p className="text-sm text-gray-800 mt-1">{selectedLog.targetName || "-"}</p>
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Perubahan Data</label>
                  <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-3 rounded-xl overflow-auto max-h-48 border border-gray-100">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Waktu</label>
                <p className="text-sm text-gray-800 mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition"
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