"use client";

import { useEffect, useState } from "react";

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
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("all");
  const [totalItems, setTotalItems] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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

  // 🔥 AUTO REFRESH SETIAP 10 DETIK
  useEffect(() => {
    fetchLogs();
    
    if (!isAutoRefresh) return;
    
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [levelFilter, isAutoRefresh]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return <span className="px-2 py-1 text-[9px] font-bold rounded-full bg-red-100 text-red-700">❌ ERROR</span>;
      case "WARNING":
        return <span className="px-2 py-1 text-[9px] font-bold rounded-full bg-yellow-100 text-yellow-700">⚠️ WARNING</span>;
      default:
        return <span className="px-2 py-1 text-[9px] font-bold rounded-full bg-blue-100 text-blue-700">ℹ️ INFO</span>;
    }
  };

  const formatWaktu = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID");
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">System Log</h1>
        <p className="text-xs text-gray-400 mt-1">Catatan error dan aktivitas sistem (Khusus Super Admin)</p>
      </div>

      {/* Filter & Auto Refresh */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600">Filter Level:</label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-[10px] text-gray-600">Auto Refresh (10 detik)</span>
          </label>
          
          <button
            onClick={() => fetchLogs()}
            className="px-3 py-1 text-[9px] bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            🔄 Refresh
          </button>
          
          <div className="text-[9px] text-gray-400">
            Total {totalItems} log | Last update: {lastRefresh.toLocaleTimeString("id-ID")}
          </div>
        </div>
      </div>

      {/* Tabel Log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">Level</th>
                <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">Message</th>
                <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">Path</th>
                <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">User</th>
                <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📭</span>
                      <p className="text-sm">Belum ada log</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      {getLevelBadge(log.level)}
                    </td>
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