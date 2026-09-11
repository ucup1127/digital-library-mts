// app/(public)/akun/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  User, 
  Mail, 
  BookOpen, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  LogOut,
  Settings,
  UserCircle,
  GraduationCap,
  Wallet,
  ArrowRight,
  Sparkles,
  Lock,
  Edit2,
  X,
  BookMarked,
  Library
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  className: string;
  memberId: string;
  createdAt: string;
}

interface Peminjaman {
  id: string;
  tglPinjam: string;
  tglKembali: string;
  tglDikembalikan: string | null;
  status: string;
  denda: number;
  bukuFisik: {
    judul: string;
    penulis: string;
    barcode: string;
  };
}

export default function AkunPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeLoans, setActiveLoans] = useState<Peminjaman[]>([]);
  const [historyLoans, setHistoryLoans] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    className: "",
  });
  const [submitting, setSubmitting] = useState(false);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userId = localStorage.getItem("user_id");
    
    if (!isLoggedIn || !userId) {
      router.push("/login/user");
      return;
    }
    
    fetchUserData(userId);
    fetchUserLoans(userId);
  }, [router]);

  const fetchUserData = async (userId: string) => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("User tidak ditemukan");
          router.push("/login/user");
        }
        return;
      }
      
      const data = await res.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setUser(data);
      setEditForm({
        name: data.name || "",
        email: data.email || "",
        className: data.className || "",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLoans = async (userId: string) => {
    try {
      const res = await fetch(`/api/peminjaman-fisik?userId=${userId}`);
      const data = await res.json();
      const loans = Array.isArray(data) ? data : [];
      setActiveLoans(loans.filter((l: Peminjaman) => l.status === "DIPINJAM" || l.status === "TERLAMBAT"));
      setHistoryLoans(loans.filter((l: Peminjaman) => l.status === "DIKEMBALIKAN"));
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    toast.loading("Menyimpan perubahan...", { id: "update" });
    
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: editForm.name,
          email: editForm.email,
          className: editForm.className,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("✅ Profil berhasil diperbarui!", { id: "update" });
        setEditMode(false);
        fetchUserData(user.id);
        localStorage.setItem("user_name", editForm.name);
      } else {
        toast.error(data.error || "Gagal memperbarui", { id: "update" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "update" });
    } finally {
      setSubmitting(false);
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
    
    if (!user) return;
    
    setChangingPassword(true);
    toast.loading("Mengubah password...", { id: "password" });
    
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DIPINJAM":
        return <span className="px-2.5 py-0.5 text-[9px] font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Dipinjam</span>;
      case "TERLAMBAT":
        return <span className="px-2.5 py-0.5 text-[9px] font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1 animate-pulse"><AlertCircle className="w-3 h-3" /> Terlambat</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[9px] font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Dikembalikan</span>;
    }
  };

  const getInitials = () => {
    if (!user?.name) return "U";
    const parts = user.name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-gray-500 text-sm">Gagal memuat data user</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-md"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 pt-16">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* ============================================= */}
        {/* 🔥 HEADER */}
        {/* ============================================= */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl flex-shrink-0">
              <span className="text-3xl font-bold text-white">{getInitials()}</span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-blue-100 text-sm">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-blue-100 text-xs">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {user.className || "Belum ada kelas"}
                </span>
                <span className="w-px h-3 bg-white/20"></span>
                <span className="flex items-center gap-1">
                  <BookMarked className="w-3.5 h-3.5" />
                  No. Anggota: {user.memberId || "-"}
                </span>
                <span className="w-px h-3 bg-white/20"></span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Bergabung: {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/30 transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profil
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/30 transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Ganti Password
              </button>
            </div>
          </div>
        </div>

        {/* ============================================= */}
        {/* 🔥 EDIT MODE */}
        {/* ============================================= */}
        {editMode && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Profil
              </h3>
              <button
                onClick={() => {
                  setEditMode(false);
                  if (user) {
                    setEditForm({
                      name: user.name,
                      email: user.email,
                      className: user.className || "",
                    });
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas</label>
                <input
                  type="text"
                  value={editForm.className}
                  onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Contoh: 9A"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    if (user) {
                      setEditForm({
                        name: user.name,
                        email: user.email,
                        className: user.className || "",
                      });
                    }
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================= */}
        {/* 🔥 STATISTIK */}
        {/* ============================================= */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-800">{activeLoans.length + historyLoans.length}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Total Pinjam</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-800">{activeLoans.length}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Aktif</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-800">{historyLoans.length}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Selesai</p>
          </div>
        </div>

        {/* ============================================= */}
        {/* 🔥 PEMINJAMAN AKTIF */}
        {/* ============================================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-gray-800 text-sm">Peminjaman Aktif</h2>
            </div>
            <span className="text-[9px] text-gray-400">{activeLoans.length} buku</span>
          </div>
          <div className="overflow-x-auto">
            {activeLoans.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                <Library className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                Tidak ada peminjaman aktif
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeLoans.map((loan) => {
                  const today = new Date();
                  const tglKembali = new Date(loan.tglKembali);
                  const isLate = today > tglKembali;
                  return (
                    <div key={loan.id} className="px-5 py-4 hover:bg-gray-50 transition">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">{loan.bukuFisik?.judul}</p>
                          <p className="text-[10px] text-gray-400">{loan.bukuFisik?.penulis}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Pinjam: {new Date(loan.tglPinjam).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className={`text-xs font-semibold ${isLate ? "text-red-600" : "text-gray-600"}`}>
                            {isLate ? "⚠️" : "📅"} Kembali: {new Date(loan.tglKembali).toLocaleDateString("id-ID")}
                          </p>
                          {getStatusBadge(isLate ? "TERLAMBAT" : loan.status)}
                          {isLate && (
                            <p className="text-[9px] text-red-500 font-medium">
                              +{Math.ceil((today.getTime() - tglKembali.getTime()) / (1000 * 3600 * 24))} hari terlambat
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================= */}
        {/* 🔥 RIWAYAT PEMINJAMAN */}
        {/* ============================================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-gray-800 text-sm">Riwayat Peminjaman</h2>
            </div>
            <span className="text-[9px] text-gray-400">{historyLoans.length} buku</span>
          </div>
          <div className="overflow-x-auto">
            {historyLoans.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                Belum ada riwayat peminjaman
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {historyLoans.map((loan) => (
                  <div key={loan.id} className="px-5 py-4 hover:bg-gray-50 transition">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{loan.bukuFisik?.judul}</p>
                        <p className="text-[10px] text-gray-400">{loan.bukuFisik?.penulis}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Dipinjam: {new Date(loan.tglPinjam).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-xs text-gray-600">
                          ✅ Dikembalikan: {loan.tglDikembalikan ? new Date(loan.tglDikembalikan).toLocaleDateString("id-ID") : "-"}
                        </p>
                        {loan.denda > 0 ? (
                          <p className="text-xs font-semibold text-orange-600">Denda: Rp{loan.denda.toLocaleString()}</p>
                        ) : (
                          <p className="text-xs text-green-600">Tepat waktu ✅</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 MODAL GANTI PASSWORD */}
      {/* ============================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-200">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Ganti Password</h3>
              <p className="text-xs text-gray-400 mt-1">Masukkan password lama dan password baru</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password Saat Ini</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
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
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    "Ganti Password"
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