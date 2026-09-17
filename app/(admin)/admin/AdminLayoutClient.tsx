// app/(admin)/admin/AdminLayoutClient.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import IdleLogout from "@/components/IdleLogout";
import { Menu } from "lucide-react";

export interface AdminUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  schoolId: string | null;
  schoolName: string;
  schoolLogo: string;
  schoolWebsite: string;
}

interface Props {
  user: AdminUser;
  isMaintenance: boolean;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ user, isMaintenance, children }: Props) {
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [searchSchool, setSearchSchool] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user.role === "SUPER_ADMIN") {
      const savedId = localStorage.getItem("selected_school_id") || "";
      const savedName = localStorage.getItem("selected_school_name") || "";
      setSelectedSchoolId(savedId);
      setSelectedSchoolName(savedName);
    }
  }, [user.role]);

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      setSchools(data);
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const handleSelectSchool = (schoolId: string, schoolName: string) => {
    localStorage.setItem("selected_school_id", schoolId);
    localStorage.setItem("selected_school_name", schoolName);
    setSelectedSchoolId(schoolId);
    setSelectedSchoolName(schoolName);

    window.dispatchEvent(
      new CustomEvent("schoolChanged", {
        detail: { schoolId, schoolName },
      })
    );

    setShowSchoolPicker(false);
    setSearchSchool("");
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchSchool.toLowerCase())
  );

  return (
    <IdleLogout>
      <div className="flex min-h-screen bg-gray-50">
        {/* 🔥 Sidebar — terima isOpen & onClose */}
        <Sidebar
          user={user}
          selectedSchoolId={selectedSchoolId}
          selectedSchoolName={selectedSchoolName}
          onOpenSchoolPicker={() => {
            fetchSchools();
            setShowSchoolPicker(true);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* 🔥 Main content — margin 0 di mobile, ml-64 di desktop */}
        <div className="flex-1 lg:ml-64 min-h-screen bg-gray-50">
          {/* 🔥 Header mobile — hamburger button */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-sm text-gray-800 truncate">
              {user.role === "SUPER_ADMIN" ? "Super Admin" : (user.schoolName || "Admin Panel")}
            </h1>
          </div>

          {/* 🔥 Content — padding responsive */}
          <main className="p-4 lg:p-8">
            {/* Banner mode sekolah (SUPER_ADMIN) */}
            {user.role === "SUPER_ADMIN" && selectedSchoolName && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 lg:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏫</span>
                  <p className="text-xs text-blue-700">
                    <strong>Mode Sekolah:</strong> {selectedSchoolName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    fetchSchools();
                    setShowSchoolPicker(true);
                  }}
                  className="text-[10px] text-blue-600 hover:underline text-left sm:text-right"
                >
                  Ganti Sekolah
                </button>
              </div>
            )}
            {children}
          </main>
        </div>

        {/* Modal Pilih Sekolah untuk SUPER_ADMIN */}
        {showSchoolPicker && user.role === "SUPER_ADMIN" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">Pilih Sekolah</h2>
                <button
                  onClick={() => {
                    setShowSchoolPicker(false);
                    setSearchSchool("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-4">
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={searchSchool}
                  onChange={(e) => setSearchSchool(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto max-h-96">
                {schools.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></div>
                    <p className="text-xs text-gray-400 mt-2">Memuat data sekolah...</p>
                  </div>
                ) : filteredSchools.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Tidak ada sekolah ditemukan
                  </div>
                ) : (
                  filteredSchools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => handleSelectSchool(school.id, school.name)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm">
                        🏫
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {school.name}
                        </p>
                        <p className="text-[8px] text-gray-400">
                          ID: {school.id.slice(0, 8)}...
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </IdleLogout>
  );
}