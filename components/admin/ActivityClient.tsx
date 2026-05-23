"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Activity {
  id: string;
  userEmail: string | null;
  action: string;
  bookTitle: string | null;
  createdAt: string | Date;
  schoolId: string | null;
}

interface ActivityClientProps {
  initialActivities: Activity[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  actions: any[];
  searchParams: { action: string; user: string; date: string };
}

export default function ActivityClient({ 
  initialActivities, 
  totalPages, 
  currentPage, 
  totalItems, 
  actions, 
  searchParams 
}: ActivityClientProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("");
  const [userSchoolId, setUserSchoolId] = useState<string>("");
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>(initialActivities);

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "";
    const schoolId = localStorage.getItem("school_id") || "";
    setUserRole(role);
    setUserSchoolId(schoolId);
  }, []);

  // Filter activities berdasarkan role
  useEffect(() => {
    if (userRole === "ADMIN" && userSchoolId) {
      const filtered = initialActivities.filter(act => act.schoolId === userSchoolId);
      setFilteredActivities(filtered);
    } else {
      setFilteredActivities(initialActivities);
    }
  }, [initialActivities, userRole, userSchoolId]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as any);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/admin/laporan-aktivitas?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams as any);
    params.set("page", page.toString());
    router.push(`/admin/laporan-aktivitas?${params.toString()}`);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "READ":
        return <span className="px-2 py-0.5 text-[8px] font-bold rounded-full bg-green-100 text-green-700">📖 Baca</span>;
      case "SEARCH":
        return <span className="px-2 py-0.5 text-[8px] font-bold rounded-full bg-purple-100 text-purple-700">🔍 Cari</span>;
      default:
        return <span className="px-2 py-0.5 text-[8px] font-bold rounded-full bg-gray-100 text-gray-600">{action}</span>;
    }
  };

  const formatWaktu = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayActivities = filteredActivities;
  const displayTotalItems = userRole === "ADMIN" ? filteredActivities.length : totalItems;

  return (
    <div>
      {/* Filter Bar */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={searchParams.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Semua Aksi</option>
            {actions.map((action: any) => (
              <option key={action.action} value={action.action}>
                {action.action === "READ" ? "📖 Membaca" : action.action === "SEARCH" ? "🔍 Pencarian" : action.action}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Cari user..."
            value={searchParams.user}
            onChange={(e) => handleFilterChange("user", e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="date"
            value={searchParams.date}
            onChange={(e) => handleFilterChange("date", e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <button
            onClick={() => {
              handleFilterChange("action", "");
              handleFilterChange("user", "");
              handleFilterChange("date", "");
            }}
            className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">User</th>
              <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">Aktivitas</th>
              <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">Konten</th>
              <th className="px-5 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayActivities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📭</span>
                    <p className="text-sm">Belum ada aktivitas</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-gray-800">{activity.userEmail || "Guest"}</p>
                  </td>
                  <td className="px-5 py-3">
                    {getActionBadge(activity.action)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs text-gray-600 line-clamp-1">{activity.bookTitle || "-"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-[10px] text-gray-400">
                      {formatWaktu(activity.createdAt)}
                    </p>
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
          <div className="text-[10px] text-gray-400">
            Total: {displayTotalItems} data
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              ← Prev
            </button>
            <span className="px-3 py-1 text-xs">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}