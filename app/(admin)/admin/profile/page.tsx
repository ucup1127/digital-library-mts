// app/(admin)/admin/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit, 
  Save, 
  X,
  LogOut,
  Key,
  CheckCircle,
  Building,
  UserCircle,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  className: string;
  memberId: string;
  createdAt: string;
  schoolId: string;
  schoolName: string;
  schoolLogo: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    className: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem("user_id");
      const name = localStorage.getItem("user_name") || "Admin";
      const email = localStorage.getItem("user_email") || "";
      const role = localStorage.getItem("user_role") || "";
      const schoolId = localStorage.getItem("school_id") || "";
      const schoolName = localStorage.getItem("school_name") || "";
      const schoolLogo = localStorage.getItem("school_logo") || "";
      const memberId = localStorage.getItem("member_id") || "";
      
      let finalSchoolName = schoolName;
      let finalSchoolLogo = schoolLogo;
      
      if (role === "SUPER_ADMIN") {
        const selectedName = localStorage.getItem("selected_school_name");
        const selectedLogo = localStorage.getItem("selected_school_logo") || "";
        if (selectedName) {
          finalSchoolName = selectedName;
          finalSchoolLogo = selectedLogo;
        }
      }
      
      setProfile({
        id: userId || "",
        name: name,
        email: email,
        role: role,
        className: "",
        memberId: memberId,
        createdAt: new Date().toISOString(),
        schoolId: schoolId,
        schoolName: finalSchoolName,
        schoolLogo: finalSchoolLogo,
      });
      
      setFormData({
        name: name,
        email: email,
        className: "",
      });
      
      setLoading(false);
    };
    
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    toast.loading("Menyimpan perubahan...", { id: "save" });
    
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.id,
          name: formData.name,
          email: formData.email,
          className: formData.className,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("✅ Profil berhasil diperbarui!", { id: "save" });
        localStorage.setItem("user_name", formData.name);
        localStorage.setItem("user_email", formData.email);
        
        setProfile(prev => prev ? { ...prev, name: formData.name, email: formData.email } : null);
        setEditMode(false);
      } else {
        toast.error(data.error || "Gagal memperbarui", { id: "save" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "save" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter!");
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Konfirmasi password tidak sesuai!");
      return;
    }
    
    if (!profile) return;
    
    setChangingPassword(true);
    toast.loading("Mengubah password...", { id: "password" });
    
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("✅ Password berhasil diubah!", { id: "password" });
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.error || "Gagal mengubah password", { id: "password" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "password" });
    } finally {
      setChangingPassword(false);
    }
  };

  // 🔥 SWEETALERT KONFIRMASI LOGOUT
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Keluar",
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600">Apakah Anda yakin ingin keluar dari sistem?</p>
          <p class="text-xs text-gray-400 mt-2">Anda harus login kembali untuk mengakses dashboard.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition',
        cancelButton: 'px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition',
      }
    });

    if (result.isConfirmed) {
      try {
        // Panggil API logout — hapus session di DB & clear cookie httpOnly
        await fetch("/api/auth/logout", { method: "POST" });
        
        // Hapus data client
        localStorage.clear();
        sessionStorage.clear();
        
        toast.success("👋 Anda berhasil keluar!");
        
        setTimeout(() => {
          window.location.href = "/login/admin?logout=success";
        }, 500);
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Gagal keluar sistem");
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700";
      case "ADMIN":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin Sekolah";
      default:
        return "User/Siswa";
    }
  };

  const getInitials = () => {
    if (!profile?.name) return "A";
    const parts = profile.name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Gagal memuat profil</p>
        <button
          onClick={() => router.push("/admin")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            Profil Saya
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Kelola informasi akun Anda</p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Edit className="w-4 h-4" />
            Edit Profil
          </button>
        )}
      </div>

      {/* ============================================= */}
      {/* 🔥 CARD PROFIL - LOGO DI BANNER */}
      {/* ============================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Banner - Logo & Nama di area berwarna */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-8 px-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar / Logo */}
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 shadow-xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden flex-shrink-0">
              {profile.schoolLogo ? (
                <img src={profile.schoolLogo} alt={profile.schoolName} className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
            
            {/* Info di banner */}
            <div className="text-center sm:text-left text-white">
              <h2 className="text-2xl font-bold drop-shadow-md">{profile.name}</h2>
              <p className="text-blue-100 text-sm drop-shadow-md flex items-center justify-center sm:justify-start gap-2">
                <Building className="w-4 h-4" />
                {profile.schoolName || "Perpustakaan Digital"}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-medium text-white">
                  {profile.role === "SUPER_ADMIN" ? <Shield className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
                  {getRoleText(profile.role)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-400/30 backdrop-blur-sm rounded-full text-[10px] font-medium text-white">
                  <CheckCircle className="w-3 h-3" />
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Informasi detail di bawah banner */}
        <div className="px-6 py-6">
          {editMode ? (
            /* ========== EDIT MODE ========== */
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    if (profile) {
                      setFormData({
                        name: profile.name,
                        email: profile.email,
                        className: profile.className || "",
                      });
                    }
                  }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ========== VIEW MODE ========== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Nama Lengkap</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{profile.name}</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{profile.email}</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Role</p>
                  <p className="text-sm mt-0.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${getRoleBadge(profile.role)}`}>
                      {profile.role === "SUPER_ADMIN" ? <Shield className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
                      {getRoleText(profile.role)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Sekolah</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-gray-400" />
                    {profile.schoolName || "Belum ditentukan"}
                  </p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Bergabung</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(profile.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                  <p className="text-sm mt-0.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Aktif
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 QUICK ACTIONS */}
      {/* ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-800">Ganti Password</h3>
            <p className="text-[9px] text-gray-400">Perbarui password akun Anda</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition" />
        </button>

        <button
          onClick={handleLogout}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex items-center gap-4 group hover:border-red-200"
        >
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:scale-110 transition">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition">Keluar Sistem</h3>
            <p className="text-[9px] text-gray-400">Logout dari akun Anda</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition" />
        </button>
      </div>

      {/* ============================================= */}
      {/* 🔥 MODAL GANTI PASSWORD */}
      {/* ============================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                Ganti Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password Saat Ini</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password Baru</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-sm font-medium hover:from-amber-700 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-200 disabled:opacity-50"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Ganti Password
                    </>
                  )}
                </button>
              </div>
            </form>
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
    </div>
  );
}