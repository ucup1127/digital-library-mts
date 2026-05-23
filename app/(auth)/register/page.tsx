// app/(auth)/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
        const res = await fetch("/api/schools");
        const data = await res.json();
        console.log("Schools loaded:", data); // ✅ Debug
        setSchools(data);
      } catch (error) {
        console.error("Gagal ambil sekolah:", error);
      }
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi frontend
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
    
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      schoolId: formData.schoolId,
    };
    
    console.log("Sending payload:", payload); // ✅ Debug
    
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      console.log("Response:", data); // ✅ Debug
      
      if (res.ok) {
        toast.success("Registrasi berhasil! Silakan login.");
        setTimeout(() => {
          router.push("/login/user");
        }, 1500);
      } else {
        toast.error(data.error || "Registrasi gagal");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600">MUHPATHLIB</h1>
          <p className="text-gray-500 text-sm">Daftar Anggota Perpustakaan Digital</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nama Lengkap"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <select
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.schoolId}
            onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
            required
          >
            <option value="">Pilih Asal Sekolah</option>
            {schools.map((school: any) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          
          <input
            type="password"
            placeholder="Password (minimal 6 karakter)"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          
          <input
            type="password"
            placeholder="Konfirmasi Password"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>
        
        <Link href="/login/user" className="block text-center mt-4 text-sm text-blue-600 hover:underline">
          Sudah punya akun? Masuk
        </Link>
        <Link href="/" className="block text-center mt-2 text-sm text-gray-400 hover:underline">
          ← Kembali
        </Link>
      </div>
    </div>
  );
}