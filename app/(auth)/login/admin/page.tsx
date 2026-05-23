// app/(auth)/login/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const logout = searchParams.get("logout");
    if (logout === "success") {
      toast.success("Anda berhasil keluar dari sistem", {
        duration: 3000,
        position: "top-center",
        icon: "👋",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "ADMIN" }), // ✅ Tetap kirim role ADMIN
      });

      const data = await res.json();

      // ✅ PERBAIKAN: Cek apakah user bisa akses halaman admin (ADMIN atau SUPER_ADMIN)
      if (res.ok && data.success && (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN")) {
        await logAdminActivity({
          action: "LOGIN",
          targetType: "ADMIN",
          targetId: data.user.id,
          targetName: data.user.name,
        });
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user_name", data.user.name || "Admin");
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role);
        localStorage.setItem("school_id", data.user.schoolId);
        localStorage.setItem("school_name", data.user.schoolName);
        localStorage.setItem("school_slug", data.user.schoolSlug);
        localStorage.setItem("school_logo", data.user.schoolLogo || "");
        
        const roleText = data.user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin";
        toast.success(`Selamat datang, ${roleText}! 🎉`, {
          duration: 1500,
          position: "top-center",
        });
        
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">
            MUHPATH<span className="text-blue-600">ADMIN</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Login ke Dashboard Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login/user" className="text-xs text-gray-400 hover:text-blue-600 transition">
            ← Login sebagai Pengguna Biasa
          </Link>
        </div>
        <div className="mt-2 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-blue-600 transition">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}