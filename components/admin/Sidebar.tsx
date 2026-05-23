// components/admin/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import NotificationBell from "@/components/admin/NotificationBell";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("user_name");
    const role = localStorage.getItem("user_role");
    const school = localStorage.getItem("school_name");
    const logo = localStorage.getItem("school_logo");
    const id = localStorage.getItem("user_id"); 
    if (name) setUserName(name);
    if (role) setUserRole(role);
    if (school) setSchoolName(school);
    if (logo) setSchoolLogo(logo);
    if (id) setUserId(id);
  }, []);

  // Menu untuk semua admin
  const menu = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Kelola Buku", href: "/admin/buku", icon: "📚" },
    { name: "Kelola Kategori", href: "/admin/kategori", icon: "📂" },
    { name: "Kelola User", href: "/admin/users", icon: "👥" },
    { name: "Laporan Aktivitas", href: "/admin/laporan-aktivitas", icon: "📋" },
  ];

  // ✅ Menu khusus SUPER_ADMIN
  const superAdminMenu = [
    { name: "Kelola Sekolah", href: "/admin/sekolah", icon: "🏫" },
    { name: "Admin Log", href: "/admin/admin-log", icon: "📋" },
    { name: "System Log", href: "/admin/system-log", icon: "📜" },
    { name: "Pengaturan", href: "/admin/settings", icon: "⚙️" },
  ];

  const allMenu = userRole === "SUPER_ADMIN" 
    ? [...menu, ...superAdminMenu] 
    : menu;

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
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
      });
      localStorage.clear();
      toast.success("👋 Anda berhasil keluar!");
      setTimeout(() => {
        router.push("/login/admin");
      }, 1000);
    } catch (error) {
      toast.error("Gagal keluar sistem");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const getInitials = () => {
    const parts = userName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 shadow-sm flex flex-col dark:bg-gray-900 dark:border-gray-700">
        {/* Header dengan Notification Bell */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userRole === "SUPER_ADMIN" ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                SA
              </div>
            ) : schoolLogo ? (
              <img src={schoolLogo} alt={schoolName} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                {schoolName.charAt(0).toUpperCase() || "S"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">
                {userRole === "SUPER_ADMIN" ? "Super Admin" : (schoolName || "Sekolah")}
              </h2>
              <p className="text-[8px] text-gray-400 dark:text-gray-500">Perpustakaan Digital</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Profile Section */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <Link href="/admin/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">{getInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{userName}</p>
              <p className="text-[8px] text-gray-400 dark:text-gray-500">
                {userRole === "SUPER_ADMIN" ? "Super Admin" : "Administrator"}
              </p>
            </div>
            <span className="text-gray-400 text-xs group-hover:text-blue-600 transition">⚙️</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {allMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive(item.href)
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
          >
            <span className="text-base">🚪</span>
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Modal Konfirmasi Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚪</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Konfirmasi Keluar</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Apakah Anda yakin ingin keluar dari sistem?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? "Keluar..." : "Ya, Keluar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}