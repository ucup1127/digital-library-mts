// app/(auth)/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, BookOpen, ArrowRight, Sparkles, ChevronRight, Library, UserPlus, GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [schools, setSchools] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    schoolId: "",
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch("/api/public/schools");
        const data = await res.json();
        console.log("Schools loaded:", data);
        setSchools(data);
      } catch (error) {
        console.error("Gagal ambil sekolah:", error);
      }
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nama lengkap harus diisi!");
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("Email harus diisi!");
      return;
    }
    
    if (!formData.schoolId) {
      toast.error("Pilih asal sekolah Anda!");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password tidak cocok!");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          schoolId: formData.schoolId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("🎉 Registrasi berhasil! Silakan login.", {
          duration: 3000,
          position: "top-center",
        });
        setTimeout(() => {
          router.push("/login/user");
        }, 1500);
      } else {
        toast.error(data.error || "Registrasi gagal", {
          duration: 3000,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Terjadi kesalahan koneksi", {
        duration: 3000,
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ============================================= */}
      {/* 🔥 SISI KIRI - GAMBAR / GRAFIS */}
      {/* ============================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600">
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
          {/* Ilustrasi */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <UserPlus className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/50">
                <span className="text-sm">✨</span>
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-400/50">
                <span className="text-[10px]">📚</span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3">Bergabung Sekarang!</h2>
          <p className="text-green-100 text-sm max-w-sm leading-relaxed">
            Daftar sebagai anggota perpustakaan digital dan akses ribuan koleksi buku dari mana saja.
          </p>

          {/* Statistik */}
          <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">5000+</p>
              <p className="text-[9px] text-green-200 uppercase tracking-wider">Koleksi</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">1000+</p>
              <p className="text-[9px] text-green-200 uppercase tracking-wider">Buku Digital</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold">2000+</p>
              <p className="text-[9px] text-green-200 uppercase tracking-wider">Pengguna Aktif</p>
            </div>
          </div>

          {/* Quotes */}
          <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 max-w-sm">
            <p className="text-sm italic text-green-100">
              "Bergabunglah dengan komunitas pembaca dan jelajahi dunia melalui buku."
            </p>
            <p className="text-[10px] text-green-200 mt-1">— MUHAPATI Library</p>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 SISI KANAN - FORM REGISTER */}
      {/* ============================================= */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100/50 p-8 md:p-10">
            {/* Logo & Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-200 mb-4">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  MUHAPATI
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Perpustakaan Digital</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-3 h-3 text-green-400" />
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">
                  Daftar Anggota
                </span>
                <Sparkles className="w-3 h-3 text-green-400" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alamat Email
                </label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Asal Sekolah
                </label>
                <select
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-700"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Sekolah --</option>
                  {schools.map((school: any) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    Daftar Sekarang
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
                <span className="px-3 bg-white text-gray-400">Sudah punya akun?</span>
              </div>
            </div>

            {/* Link Login */}
            <Link
              href="/login/user"
              className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
            >
              Masuk ke Perpustakaan
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Admin Link */}
            <div className="mt-4 text-center">
              <Link
                href="/login/admin"
                className="text-xs text-gray-400 hover:text-green-500 transition inline-flex items-center gap-1 group"
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