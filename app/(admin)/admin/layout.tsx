// app/(admin)/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [searchSchool, setSearchSchool] = useState("");

  useEffect(() => {
    const checkAuthAndMaintenance = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const role = localStorage.getItem("user_role") || "";
      
      setUserRole(role);
      
      try {
        const res = await fetch("/api/settings?key=maintenance_mode");
        const data = await res.json();
        setIsMaintenance(data.value === "true");
      } catch (error) {
        console.error("Error checking maintenance:", error);
      }
      
      if (isLoggedIn === "true" && (role === "ADMIN" || role === "SUPER_ADMIN")) {
        setIsAuthenticated(true);
        
        if (role === "SUPER_ADMIN") {
          const savedSchoolId = localStorage.getItem("selected_school_id");
          const savedSchoolName = localStorage.getItem("selected_school_name");
          
          if (savedSchoolId && savedSchoolName) {
            setSelectedSchoolId(savedSchoolId);
            setSelectedSchoolName(savedSchoolName);
          } else {
            fetchSchools();
            setShowSchoolPicker(true);
          }
        }
      } else {
        router.push("/login/admin");
      }
      
      setIsChecking(false);
    };
    
    checkAuthAndMaintenance();
  }, [router]);

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
    
    window.dispatchEvent(new CustomEvent("schoolChanged", { 
      detail: { schoolId, schoolName } 
    }));
    
    setShowSchoolPicker(false);
    setSearchSchool("");
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchSchool.toLowerCase())
  );

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <Sidebar 
        userRole={userRole}
        selectedSchoolId={selectedSchoolId}
        selectedSchoolName={selectedSchoolName}
        onOpenSchoolPicker={() => {
          fetchSchools();
          setShowSchoolPicker(true);
        }}
      />
      <main className="flex-1 ml-64 p-8 min-h-screen bg-gray-50">
        {userRole === "SUPER_ADMIN" && selectedSchoolName && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex justify-between items-center">
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
              className="text-[10px] text-blue-600 hover:underline"
            >
              Ganti Sekolah
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Modal Pilih Sekolah untuk SUPER_ADMIN */}
      {showSchoolPicker && userRole === "SUPER_ADMIN" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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
                <div className="p-8 text-center text-gray-400">Tidak ada sekolah ditemukan</div>
              ) : (
                filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSelectSchool(school.id, school.name)}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm">🏫</div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{school.name}</p>
                      <p className="text-[8px] text-gray-400">ID: {school.id.slice(0, 8)}...</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}