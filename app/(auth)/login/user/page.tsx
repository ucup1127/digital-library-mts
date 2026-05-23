// app/(auth)/login/user/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginUserPage() {
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
        body: JSON.stringify({ email, password, role: "USER" }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user.role === "USER") {
        // ✅ SIMPAN SEMUA DATA KE LOCALSTORAGE
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user_name", data.user.name || "Pengguna");
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_role", data.user.role);
        localStorage.setItem("school_id", data.user.schoolId);
        localStorage.setItem("school_name", data.user.schoolName);
        localStorage.setItem("school_slug", data.user.schoolSlug);
        
        toast.success(`Selamat datang, ${data.user.name || "Pengguna"}! 🎉`, {
          duration: 1500,
          position: "top-center",
        });
        
        // Redirect ke beranda
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
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600">MUHPATHLIB</h1>
          <p className="text-gray-500 text-sm">Masuk sebagai Anggota Perpustakaan</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button 
            disabled={isLoading} 
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Masuk ke Perpustakaan"}
          </button>
        </form>
        <Link href="/register" className="block text-center mt-4 text-sm text-blue-600 hover:underline">
          Belum punya akun? Daftar
        </Link>
        <Link href="/login/admin" className="block text-center mt-2 text-sm text-gray-400 hover:underline">
          Login sebagai Admin →
        </Link>
        <Link href="/" className="block text-center mt-2 text-sm text-gray-400 hover:underline">
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}