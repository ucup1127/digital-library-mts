// app/(admin)/admin/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Ambil data user dari localStorage
  useEffect(() => {
    const name = localStorage.getItem("user_name");
    const email = localStorage.getItem("user_email");
    
    setFormData({
      name: name || "",
      email: email || "",
    });
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nama tidak boleh kosong!");
      return;
    }
    
    setIsLoading(true);
    toast.loading("Menyimpan perubahan...", { id: "profile" });
    
    try {
      const userId = localStorage.getItem("user_id");
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          name: formData.name,
          email: formData.email,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("user_name", formData.name);
        localStorage.setItem("user_email", formData.email);
        
        toast.success("✅ Profil berhasil diperbarui!", { id: "profile" });
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.error || "Gagal memperbarui profil", { id: "profile" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Password baru tidak cocok!");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return;
    }
    
    setIsChangingPassword(true);
    toast.loading("Mengubah password...", { id: "password" });
    
    try {
      const userId = localStorage.getItem("user_id");
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("🔒 Password berhasil diubah!", { id: "password" });
        
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.error || "Gagal mengubah password", { id: "password" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "password" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profil Admin</h1>
        <p className="text-xs text-gray-400 mt-1">Kelola informasi akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Edit Profil */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">
                  {formData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Informasi Profil</h2>
                <p className="text-[8px] text-gray-400">Ubah nama dan email Anda</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleProfileUpdate} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Nama Anda"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="email@example.com"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                "💾 Simpan Perubahan"
              )}
            </button>
          </form>
        </div>

        {/* Form Ganti Password */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center shadow-md">
                <span className="text-lg">🔒</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Ganti Password</h2>
                <p className="text-[8px] text-gray-400">Perbarui password akun Anda</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Password Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition pr-10"
                  placeholder="Masukkan password lama"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                >
                  {showCurrentPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition pr-10"
                  placeholder="Minimal 6 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition pr-10"
                  placeholder="Ulangi password baru"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isChangingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengubah...
                </>
              ) : (
                "🔐 Ubah Password"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Tips Keamanan */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <h3 className="text-sm font-bold text-blue-800">Tips Keamanan</h3>
            <p className="text-xs text-blue-600 mt-1">
              • Gunakan password yang kuat dan unik<br />
              • Jangan bagikan password dengan siapapun<br />
              • Ganti password secara berkala untuk keamanan akun Anda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}