// components/admin/SchoolSwitcher.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface School {
  id: string;
  name: string;
  logo?: string;
  website?: string;
}

export default function SchoolSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "";
    setUserRole(role);
    
    if (role === "SUPER_ADMIN") {
      fetchSchools();
      
      // Ambil sekolah terakhir yang dipilih dari localStorage
      const savedSchoolId = localStorage.getItem("selected_school_id");
      if (savedSchoolId) {
        // Set selected school nanti setelah fetch selesai
      }
    }
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      setSchools(data);
      
      // Coba ambil dari localStorage
      const savedSchoolId = localStorage.getItem("selected_school_id");
      if (savedSchoolId && data.find((s: School) => s.id === savedSchoolId)) {
        const school = data.find((s: School) => s.id === savedSchoolId);
        setSelectedSchool(school);
        localStorage.setItem("selected_school_id", school.id);
        localStorage.setItem("selected_school_name", school.name);
        localStorage.setItem("selected_school_logo", school.logo || "");
        localStorage.setItem("selected_school_website", school.website || "");
      } else if (data.length > 0) {
        setSelectedSchool(data[0]);
        localStorage.setItem("selected_school_id", data[0].id);
        localStorage.setItem("selected_school_name", data[0].name);
        localStorage.setItem("selected_school_logo", data[0].logo || "");
        localStorage.setItem("selected_school_website", data[0].website || "");
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setSelectedSchool(school);
      
      // 🔥 Simpan semua data sekolah ke localStorage
      localStorage.setItem("selected_school_id", school.id);
      localStorage.setItem("selected_school_name", school.name);
      localStorage.setItem("selected_school_logo", school.logo || "");
      localStorage.setItem("selected_school_website", school.website || "");
      
      // 🔥 Trigger event untuk update seluruh halaman
      window.dispatchEvent(new CustomEvent("schoolChanged", { 
        detail: { 
          schoolId: school.id,
          schoolName: school.name,
          schoolLogo: school.logo || "",
          schoolWebsite: school.website || ""
        } 
      }));
      
      // Optional: reload page to reset all states
      // window.location.reload();
    }
  };

  // Hanya tampil untuk SUPER_ADMIN
  if (userRole !== "SUPER_ADMIN") return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
        <span className="text-xs">🏫</span>
        <select
          value={selectedSchool?.id || ""}
          onChange={(e) => handleSchoolChange(e.target.value)}
          className="bg-transparent text-xs font-medium text-gray-700 focus:outline-none cursor-pointer max-w-[180px] truncate"
        >
          <option value="" disabled>Pilih Sekolah</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}