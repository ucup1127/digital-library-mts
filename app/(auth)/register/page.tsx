// app/(auth)/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { logger } from "@/lib/logger";

// 🔥 Ketentuan password
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "password1234",
  "12345678", "123456789", "1234567890", "123456",
  "qwerty", "qwerty123", "qwertyuiop",
  "admin", "admin123", "administrator",
  "letmein", "welcome", "welcome123",
  "monkey", "dragon", "master", "iloveyou",
  "abc123", "abc12345", "abcd1234",
  "muhapati", "perpustakaan", "library123",
  "sekolah123", "siswa123", "murid123", "guru123",
  "indonesia", "bismillah",
  "11111111", "00000000", "88888888",
  "1q2w3e4r", "1qaz2wsx",
  "superadmin", "root123",
]);

const PASSWORD_RULES = [
  { key: "length", label: "Minimal 8 karakter", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "Huruf besar (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "Huruf kecil (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", label: "Angka (0-9)", test: (p: string) => /\d/.test(p) },
  { key: "symbol", label: "Simbol (!@#$%^&*)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  {
    key: "notCommon",
    label: "Bukan password umum",
    test: (p: string) => p.length > 0 && !COMMON_PASSWORDS.has(p.toLowerCase()),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [schools, setSchools] = useState([]);

  const [formData, setFormData] = useState({
    nisn: "",
    name: "",
    className: "",
    username: "",
    password: "",
    confirmPassword: "",
    schoolId: "",
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch("/api/public/schools");
        const data = await res.json();
        setSchools(data);
      } catch (error) {
        logger.error("Gagal ambil sekolah:", error);
      }
    };
    fetchSchools();
  }, []);

  const passedRules = PASSWORD_RULES.filter((r) => r.test(formData.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi manual
    if (!/^\d{10}$/.test(formData.nisn)) {
      toast.error("NISN harus 10 digit angka!");
      return;
    }
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error("Nama minimal 2 karakter!");
      return;
    }
    if (!formData.className.trim()) {
      toast.error("Kelas harus diisi!");
      return;
    }
    if (!/^[a-z0-9_]{4,20}$/.test(formData.username)) {
      toast.error("Username 4-20 karakter, huruf kecil/angka/underscore!");
      return;
    }
    if (!formData.schoolId) {
      toast.error("Pilih asal sekolah!");
      return;
    }
    if (passedRules.length < PASSWORD_RULES.length) {
      toast.error("Password belum memenuhi semua ketentuan!");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password tidak cocok!");
      return;
    }
    if (formData.password === formData.username) {
      toast.error("Password tidak boleh sama dengan username!");
      return;
    }
    if (formData.password === formData.nisn) {
      toast.error("Password tidak boleh sama dengan NISN!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      logger.error("Fetch error:", error);
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
      {/* SISI KIRI */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center text-white">
          <div className="mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
                <UserPlus className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/50">
                <span className="text-sm">✨</span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3">Bergabung Sekarang!</h2>
          <p className="text-green-100 text-sm max-w-sm leading-relaxed">
            Daftar sebagai anggota perpustakaan digital dan akses ribuan koleksi buku.
          </p>
        </div>
      </div>

      {/* SISI KANAN */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100/50 p-8 md:p-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-200 mb-4">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  DAFTAR
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Perpustakaan Digital</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">
                  Daftar Anggota
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* NISN */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  NISN (10 digit)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="0012345678"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-gray-400 font-mono"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/\D/g, "") })}
                  required
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Nama lengkap kamu"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-gray-400"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Kelas
                </label>
                <select
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-700"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  <option value="7A">7A</option>
                  <option value="7B">7B</option>
                  <option value="7C">7C</option>
                  <option value="7D">7D</option>
                  <option value="8A">8A</option>
                  <option value="8B">8B</option>
                  <option value="8C">8C</option>
                  <option value="8D">8D</option>
                  <option value="9A">9A</option>
                  <option value="9B">9B</option>
                  <option value="9C">9C</option>
                  <option value="9D">9D</option>
                </select>
              </div>

              {/* Asal Sekolah */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Asal Sekolah
                </label>
                <select
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-700"
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
                <p className="text-[9px] text-gray-400 mt-1">
                  Pilih sesuai sekolah asal kamu
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Username (untuk login)
                </label>
                <input
                  type="text"
                  placeholder="farhan_01"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-gray-400"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  required
                  minLength={4}
                  maxLength={20}
                />
                <p className="text-[9px] text-gray-400 mt-1">
                  4-20 karakter, huruf kecil, angka, underscore
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Buat password kuat"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-gray-400"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Rules */}
                {formData.password && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(formData.password);
                      return (
                        <div
                          key={rule.key}
                          className={`flex items-center gap-1.5 text-[9px] ${
                            passed ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {passed ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {rule.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-gray-400"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[9px] text-red-500 mt-1">Password tidak cocok</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
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

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">Sudah punya akun?</span>
              </div>
            </div>

            <Link
              href="/login/user"
              className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group"
            >
              Masuk ke Perpustakaan
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition">
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}