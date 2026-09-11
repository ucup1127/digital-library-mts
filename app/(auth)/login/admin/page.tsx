// app/(auth)/login/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import { Eye, EyeOff, Shield, ArrowRight, Sparkles, ChevronRight, Lock, Users, BookOpen } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // State untuk modal pilih sekolah (untuk SUPER_ADMIN)
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string; logo?: string }[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [searchSchool, setSearchSchool] = useState("");
  const [loadingSchools, setLoadingSchools] = useState(false);

  // 🔥 Bersihkan cookie saat halaman login dimuat
  useEffect(() => {
    const logout = searchParams.get("logout");
    if (logout === "success") {
      toast.success("Anda berhasil keluar dari sistem", {
        duration: 3000,
        position: "top-center",
        icon: "👋",
      });
    }
    
    document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'school_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'school_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'selected_school_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'selected_school_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_name");
    localStorage.removeItem("selected_school_id");
    localStorage.removeItem("selected_school_name");
  }, [searchParams]);

  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      setSchools(data);
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast.error("Gagal memuat daftar sekolah");
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSelectSchool = (schoolId: string, schoolName: string) => {
    setSelectedSchoolId(schoolId);
    setSelectedSchoolName(schoolName);
  };

  const confirmSchoolSelection = async () => {
    if (!selectedSchoolId) {
      toast.error("Silakan pilih sekolah terlebih dahulu!");
      return;
    }
    
    localStorage.setItem("selected_school_id", selectedSchoolId);
    localStorage.setItem("selected_school_name", selectedSchoolName);
    
    const days = rememberMe ? 30 : 1;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    
    document.cookie = `selected_school_id=${selectedSchoolId}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `selected_school_name=${selectedSchoolName}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `isLoggedIn=true; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `user_role=SUPER_ADMIN; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `user_id=${tempUserData?.id || ""}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `user_name=${tempUserData?.name || "Super Admin"}; expires=${expires}; path=/; SameSite=Lax`;
    
    toast.success(`Mode Sekolah: ${selectedSchoolName}`);
    setShowSchoolPicker(false);
    window.location.href = "/admin";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "ADMIN" }),
      });

      const data = await res.json();

      if (res.ok && data.success && (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN")) {
        
        const days = rememberMe ? 30 : 1;
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        
        document.cookie = `isLoggedIn=true; expires=${expires}; path=/; SameSite=Lax`;
        document.cookie = `user_role=${data.user.role}; expires=${expires}; path=/; SameSite=Lax`;
        document.cookie = `user_id=${data.user.id}; expires=${expires}; path=/; SameSite=Lax`;
        document.cookie = `user_name=${data.user.name || "Admin"}; expires=${expires}; path=/; SameSite=Lax`;
        
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user_name", data.user.name || "Admin");
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role);
        
        if (data.user.role === "SUPER_ADMIN") {
          localStorage.removeItem("school_id");
          localStorage.removeItem("school_name");
          localStorage.removeItem("school_slug");
          localStorage.removeItem("school_logo");
          localStorage.removeItem("selected_school_id");
          localStorage.removeItem("selected_school_name");
          
          document.cookie = 'school_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'school_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'selected_school_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'selected_school_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          await logAdminActivity({
            action: "LOGIN",
            targetType: "ADMIN",
            targetId: data.user.id,
            targetName: data.user.name || "Super Admin",
          });
          
          toast.success(`✅ Login berhasil! Selamat datang, Super Admin`, {
            duration: 1500,
            position: "top-center",
          });
          
          await fetchSchools();
          setTempUserData(data.user);
          setShowSchoolPicker(true);
        } 
        else if (data.user.role === "ADMIN") {
          localStorage.setItem("school_id", data.user.schoolId || "");
          localStorage.setItem("school_name", data.user.schoolName || "");
          localStorage.setItem("school_slug", data.user.schoolSlug || "");
          localStorage.setItem("school_logo", data.user.schoolLogo || "");
          localStorage.setItem("school_website", data.user.schoolWebsite || "");
          
          document.cookie = `school_id=${data.user.schoolId || ""}; expires=${expires}; path=/; SameSite=Lax`;
          document.cookie = `school_name=${data.user.schoolName || ""}; expires=${expires}; path=/; SameSite=Lax`;
          
          await logAdminActivity({
            action: "LOGIN",
            targetType: "ADMIN",
            targetId: data.user.id,
            targetName: data.user.name || "Admin",
          });
          
          toast.success(`Selamat datang, ${data.user.name || "Admin"}! 🎉`, {
            duration: 1500,
            position: "top-center",
          });
          
          setTimeout(() => {
            window.location.href = "/admin";
          }, 1000);
        }
      } else {
        toast.error(data.error || "Login gagal. Periksa email dan password Anda.", {
          duration: 3000,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchSchool.toLowerCase())
  );

  return (
    <div className="min-h-screen flex">
      {/* ============================================= */}
      {/* 🔥 SISI KIRI - GAMBAR / GRAFIS (UNGU/INDIGO) */}
      {/* ============================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center text-white">
          <div className="mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <Shield className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/50">
                <span className="text-sm">🔐</span>
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-400/50">
                <span className="text-[10px]">⭐</span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3">Panel Administrator</h2>
          <p className="text-indigo-100 text-sm max-w-sm leading-relaxed">
            Kelola perpustakaan digital dengan mudah. Akses fitur manajemen buku, user, dan laporan.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">📚</p>
              <p className="text-[9px] text-indigo-200 uppercase tracking-wider">Buku</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">👥</p>
              <p className="text-[9px] text-indigo-200 uppercase tracking-wider">User</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">📊</p>
              <p className="text-[9px] text-indigo-200 uppercase tracking-wider">Laporan</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 max-w-sm">
            <p className="text-sm italic text-indigo-100">
              "Kelola perpustakaan dengan lebih efisien dan profesional."
            </p>
            <p className="text-[10px] text-indigo-200 mt-1">— MUHAPATI Admin</p>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 SISI KANAN - FORM LOGIN ADMIN */}
      {/* ============================================= */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100/50 p-8 md:p-10">
            {/* Logo & Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  MUHAPATI
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Perpustakaan Digital</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">
                  Admin Panel
                </span>
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Admin
                </label>
                <input
                  type="email"
                  placeholder="admin@sekolah.sch.id"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition">
                    Ingat saya
                  </span>
                </label>
                <span className="text-[10px] text-gray-400">🔒 Aman & Terenkripsi</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">Bukan admin?</span>
              </div>
            </div>

            {/* Link User */}
            <Link
              href="/login/user"
              className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
            >
              Login sebagai Pengguna
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-indigo-500 transition inline-flex items-center gap-1 group"
              >
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-5">
            <span className="text-[10px] text-gray-400">© {new Date().getFullYear()} MUHAPATI • Admin Panel</span>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 MODAL PILIH SEKOLAH (SUPER_ADMIN) */}
      {/* ============================================= */}
      {showSchoolPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-800">Pilih Sekolah</h2>
                <p className="text-[9px] text-gray-400">Pilih sekolah yang akan dikelola</p>
              </div>
              <button 
                onClick={() => {
                  setShowSchoolPicker(false);
                  window.location.href = "/admin";
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
              {loadingSchools ? (
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
                    className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 transition flex items-center gap-3 ${
                      selectedSchoolId === school.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">
                      🏫
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{school.name}</p>
                      <p className="text-[8px] text-gray-400">ID: {school.id.slice(0, 8)}...</p>
                    </div>
                    {selectedSchoolId === school.id && (
                      <span className="text-indigo-600 text-sm">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={confirmSchoolSelection}
                disabled={!selectedSchoolId}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Masuk ke Dashboard
              </button>
              <p className="text-[8px] text-gray-400 text-center mt-2">
                Anda bisa mengganti sekolah kapan saja dari sidebar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}