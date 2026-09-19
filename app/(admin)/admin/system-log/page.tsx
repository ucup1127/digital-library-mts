// app/(admin)/admin/system-log/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Settings,
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react";

interface SystemLog {
  id: string;
  level: string;
  message: string;
  stack: string | null;
  path: string | null;
  method: string | null;
  userEmail: string | null;
  createdAt: string;
}

export default function SystemLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("all");
  const [totalItems, setTotalItems] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Cek role — cuma SUPER_ADMIN
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
    try {
      const res = await fetch(`/api/system-log?level=${levelFilter}&limit=50`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalItems(data.pagination?.totalItems || 0);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    if (!isAutoRefresh) return;

    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [levelFilter, isAutoRefresh]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-red-100 text-red-700 rounded-full">
            <AlertCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-yellow-100 text-yellow-700 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-blue-100 text-blue-700 rounded-full">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  const formatWaktu = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID");
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
          <Settings className="w-6 h-6 text-purple-600" />
          System Log
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Catatan error dan aktivitas sistem (Khusus Super Admin)
        </p>
      </div>

      {/* Filter & Auto Refresh */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-700">Filter Level:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="all">Semua Level</option>
              <option value="ERROR">ERROR</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-xs text-gray-600">Auto Refresh (10s)</span>
            </label>

            <button
              onClick={() => fetchLogs()}
              className="px-3 py-2 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition flex items-center gap-1.5 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>

            <div className="text-[10px] text-gray-400">
              Total {totalItems} log | Update: {lastRefresh.toLocaleTimeString("id-ID")}
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
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Path</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Settings className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada log</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">{getLevelBadge(log.level)}</td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-700 max-w-md line-clamp-2">{log.message}</p>
                      {log.stack && (
                        <details className="mt-1">
                          <summary className="text-[9px] text-gray-400 cursor-pointer">Detail error</summary>
                          <pre className="text-[8px] text-red-500 mt-1 p-2 bg-red-50 rounded overflow-x-auto">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        {log.path && <code className="text-[9px] text-gray-500">{log.path}</code>}
                        {log.method && <span className="text-[8px] text-gray-400">{log.method}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[10px] text-gray-500">{log.userEmail || "System"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[10px] text-gray-400">{formatWaktu(log.createdAt)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}