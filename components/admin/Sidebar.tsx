// components/admin/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import { 
  LayoutDashboard, 
  BookOpen, 
  Library, 
  FolderTree, 
  Users, 
  RefreshCw, 
  FileText, 
  Images, 
  Info, 
  School, 
  ClipboardList, 
  Settings, 
  LogOut,
  ChevronRight,
  Shield,
  Menu
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
  selectedSchoolId?: string;
  selectedSchoolName?: string;
  onOpenSchoolPicker?: () => void;
}

export default function Sidebar({ 
  userRole = "", 
  selectedSchoolId = "", 
  selectedSchoolName = "",
  onOpenSchoolPicker 
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [role, setRole] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("user_name");
    const roleLocal = localStorage.getItem("user_role");
    const school = localStorage.getItem("school_name");
    const logo = localStorage.getItem("school_logo");
    const id = localStorage.getItem("user_id"); 
    
    if (name) setUserName(name);
    if (roleLocal) setRole(roleLocal);
    if (school) setSchoolName(school);
    if (logo) setSchoolLogo(logo);
    if (id) setUserId(id);
  }, []);

  // Menu untuk semua admin (dengan icon dari lucide-react)
  const menu = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Buku Digital", href: "/admin/buku", icon: BookOpen },
    { name: "Buku Fisik", href: "/admin/buku-fisik", icon: Library },
    { name: "Kategori", href: "/admin/kategori", icon: FolderTree },
    { name: "User", href: "/admin/users", icon: Users },
    { name: "Peminjaman Fisik", href: "/admin/peminjaman-fisik", icon: RefreshCw },
    { name: "Laporan Siswa", href: "/admin/laporan-user", icon: FileText },
    { name: "Galeri", href: "/admin/galeri", icon: Images },
    { name: "Tentang", href: "/admin/tentang", icon: Info },
  ];

  // Menu khusus SUPER_ADMIN
  const superAdminMenu = [
    { name: "Kelola Sekolah", href: "/admin/sekolah", icon: School },
    { name: "Admin Log", href: "/admin/admin-log", icon: ClipboardList },
    { name: "System Log", href: "/admin/system-log", icon: Settings },
  ];

  const allMenu = userRole === "SUPER_ADMIN" 
    ? [...menu, ...superAdminMenu] 
    : menu;

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    if (href === "/admin/buku") {
      return pathname === "/admin/buku" || pathname?.startsWith("/admin/buku/");
    }
    if (href === "/admin/buku-fisik") {
      return pathname === "/admin/buku-fisik" || pathname?.startsWith("/admin/buku-fisik/");
    }
    if (href === "/admin/peminjaman-fisik") {
      return pathname === "/admin/peminjaman-fisik" || pathname?.startsWith("/admin/peminjaman-fisik/");
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logAdminActivity({
        action: "LOGOUT",
        targetType: "ADMIN",
        targetId: userId,
        targetName: userName,
      }).catch(() => {});
      
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      }
      
      localStorage.clear();
      sessionStorage.clear();
      
      window.location.replace("/login/admin");
      
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal keluar sistem");
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const getInitials = () => {
    const parts = userName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const displaySchoolName = userRole === "SUPER_ADMIN" 
    ? (selectedSchoolName || "Pilih Sekolah")
    : (schoolName || "Sekolah");

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {userRole === "SUPER_ADMIN" ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
            ) : schoolLogo ? (
              <img src={schoolLogo} alt={displaySchoolName} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <Library className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-gray-800 truncate">
                {userRole === "SUPER_ADMIN" ? "Super Admin" : displaySchoolName}
              </h2>
              <p className="text-[8px] text-gray-400">Perpustakaan Digital</p>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-4 border-b border-gray-100">
          <Link href="/admin/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">{getInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
              <p className="text-[8px] text-gray-400">
                {userRole === "SUPER_ADMIN" ? "Super Admin" : "Administrator"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" />
          </Link>
        </div>

        {/* Mode Sekolah (SUPER_ADMIN) */}
        {userRole === "SUPER_ADMIN" && (
          <div className="px-3 py-3 mt-1">
            <div className={`rounded-xl p-3 ${selectedSchoolId ? "bg-blue-50 border border-blue-100" : "bg-yellow-50 border border-yellow-100"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-wider text-blue-600">Mode Sekolah</p>
                    <p className="text-[10px] font-medium text-gray-700 truncate max-w-[130px]">
                      {selectedSchoolName || "Belum pilih sekolah"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenSchoolPicker}
                  className="text-[8px] text-blue-600 hover:underline whitespace-nowrap ml-2 font-medium"
                >
                  {selectedSchoolId ? "Ganti" : "Pilih"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        {userRole === "SUPER_ADMIN" && (
          <div className="border-t border-gray-100 my-1" />
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {allMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-400"}`} />
                <span>{item.name}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Modal Konfirmasi Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Konfirmasi Keluar</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin keluar dari sistem?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Keluar...
                    </>
                  ) : (
                    "Ya, Keluar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}