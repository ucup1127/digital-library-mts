// app/(auth)/login/user/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, BookOpen, ArrowRight, Sparkles, ChevronRight, Library, GraduationCap } from "lucide-react";

export default function LoginUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "USER" }),
      });

      const data = await res.json();

    if (res.ok && data.success && data.user.role === "USER") {
      const days = rememberMe ? 30 : 1;
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
      
      document.cookie = `isLoggedIn=true; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `user_role=${data.user.role}; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `user_id=${data.user.id}; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `user_name=${data.user.name || "Pengguna"}; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `school_id=${data.user.schoolId || ""}; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `school_name=${data.user.schoolName || ""}; expires=${expires}; path=/; SameSite=Lax`;
        
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user_name", data.user.name || "Pengguna");
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role);
        localStorage.setItem("school_id", data.user.schoolId || "");
        localStorage.setItem("school_name", data.user.schoolName || "");
        localStorage.setItem("school_slug", data.user.schoolSlug || "");
        localStorage.setItem("school_logo", data.user.schoolLogo || "");
        localStorage.setItem("school_website", data.user.schoolWebsite || "");
        
        toast.success(`Selamat datang, ${data.user.name || "Pengguna"}! 🎉`, {
          duration: 1500,
          position: "top-center",
        });
        
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        toast.error(data.error || "Email atau password salah!", {
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

  return (
    <div className="min-h-screen flex">
      {/* ============================================= */}
      {/* 🔥 SISI KIRI - GAMBAR / GRAFIS */}
      {/* ============================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Konten Kiri */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center text-white">
          {/* Ilustrasi / Grafis */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <Library className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/50">
                <span className="text-sm">📚</span>
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-400/50">
                <span className="text-[10px]">⭐</span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3">Selamat Datang Kembali</h2>
          <p className="text-blue-100 text-sm max-w-sm leading-relaxed">
            Akses ribuan koleksi buku digital dan fisik dari mana saja, kapan saja.
            Perpustakaan di ujung jari Anda.
          </p>

          {/* Statistik */}
          <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">5000+</p>
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">Koleksi</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">1000+</p>
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">Buku Digital</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">2000+</p>
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">Pengguna</p>
            </div>
          </div>

          {/* Quotes */}
          <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 max-w-sm">
            <p className="text-sm italic text-blue-100">
              "Membaca adalah jendela dunia. Mari jelajahi dunia melalui buku."
            </p>
            <p className="text-[10px] text-blue-200 mt-1">— MUHAPATI Library</p>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 SISI KANAN - FORM LOGIN */}
      {/* ============================================= */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="w-full max-w-md">
          {/* Card Form (tanpa backdrop blur agar lebih clean) */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100/50 p-8 md:p-10">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MUHAPATI
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Perpustakaan Digital</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">
                  Masuk sebagai Anggota
                </span>
                <Sparkles className="w-3 h-3 text-blue-400" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/lupa-password"
                    className="text-[10px] text-blue-500 hover:text-blue-600 transition hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
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
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
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
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Perpustakaan
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
                <span className="px-3 bg-white text-gray-400">Belum punya akun?</span>
              </div>
            </div>

            {/* Link Daftar */}
            <Link
              href="/register"
              className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
            >
              Daftar Sekarang
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Admin Link */}
            <div className="mt-4 text-center">
              <Link
                href="/login/admin"
                className="text-xs text-gray-400 hover:text-blue-500 transition inline-flex items-center gap-1 group"
              >
                Login sebagai Admin
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-5">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1"
            >
              ← Kembali ke Beranda
            </Link>
            <span className="text-gray-300 text-xs mx-2">•</span>
            <span className="text-[10px] text-gray-400">© {new Date().getFullYear()} MUHAPATI</span>
          </div>
        </div>
      </div>
    </div>
  );
}