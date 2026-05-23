"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import PrintButton from "@/components/ui/PrintButton";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  className: string;
  createdAt: string;
  schoolId: string;
}

interface School {
  id: string;
  name: string;
}

export default function KelolaUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  
  // State untuk SUPER_ADMIN (pilih sekolah)
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  
  const itemsPerPage = 10;
  
  // State untuk modal hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // State untuk modal tambah user
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    className: "",
  });

  // State untuk modal reset password
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Ambil data dari localStorage
  useEffect(() => {
    const id = localStorage.getItem("school_id");
    const role = localStorage.getItem("user_role");
    const email = localStorage.getItem("user_email");
    
    setSchoolId(id);
    setCurrentUserRole(role || "");
    setCurrentUserEmail(email || "");
  }, []);

  // Ambil daftar sekolah (hanya untuk SUPER_ADMIN)
  useEffect(() => {
    if (currentUserRole === "SUPER_ADMIN") {
      fetch("/api/schools")
        .then(res => res.json())
        .then(data => setSchools(data))
        .catch(err => console.error("Gagal ambil sekolah:", err));
    }
  }, [currentUserRole]);

  // Ambil data user
  const fetchUsers = async () => {
    if (!schoolId && currentUserRole !== "SUPER_ADMIN") return;
    
    setLoading(true);
    try {
      let url = `/api/admin/users?page=${currentPage}&limit=${itemsPerPage}&search=${search}`;
      
      // Jika bukan SUPER_ADMIN, kirim schoolId
      if (currentUserRole !== "SUPER_ADMIN") {
        url += `&schoolId=${schoolId}`;
      }
      
      const res = await fetch(url, {
        headers: {
          "x-user-email": currentUserEmail,
        },
      });
      
      const data = await res.json();
      const userList = data.users || [];
      setUsers(userList);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserEmail) {
      fetchUsers();
    }
  }, [currentPage, search, schoolId, currentUserEmail, currentUserRole]);

  // Handle export Excel
  const handleExportExcel = () => {
    let url = "/api/admin/export-user";
    
    if (currentUserRole === "SUPER_ADMIN") {
      if (selectedSchoolId) {
        url += `?schoolId=${selectedSchoolId}`;
      } else {
        toast.error("Pilih sekolah terlebih dahulu untuk export!");
        return;
      }
    } else {
      url += `?schoolId=${schoolId}`;
    }
    
    window.location.href = url;
  };

  // Hapus user
  const handleDeleteClick = (user: User) => {
    setDeletingUser({ 
      id: user.id, 
      name: user.name || user.email, 
      email: user.email,
      role: user.role 
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    
    setDeleting(true);
    toast.loading("Menghapus user...", { id: "delete" });
    
    try {
      const res = await fetch(`/api/admin/users?id=${deletingUser.id}`, { 
        method: "DELETE",
        headers: {
          "x-user-email": currentUserEmail,
        },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await logAdminActivity({
          action: "DELETE",
          targetType: "USER",
          targetId: deletingUser.id,
          targetName: deletingUser.name,
        });
        toast.success(`✅ User "${deletingUser.name}" berhasil dihapus!`, { id: "delete" });
        fetchUsers();
      } else {
        toast.error(data.error || "Gagal menghapus user", { id: "delete" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menghapus user", { id: "delete" });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletingUser(null);
    }
  };

  // Reset password user
  const handleResetClick = (user: User) => {
    setResettingUser({ 
      id: user.id, 
      name: user.name || user.email, 
      email: user.email,
      role: user.role 
    });
    setShowResetModal(true);
    setNewPassword("");
  };

  const handleResetConfirm = async () => {
    if (!resettingUser) return;
    
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return;
    }
    
    setResetting(true);
    toast.loading("Reset password...", { id: "reset" });
    
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": currentUserEmail,
        },
        body: JSON.stringify({
          userId: resettingUser.id,
          newPassword: newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await logAdminActivity({
          action: "UPDATE",
          targetType: "USER",
          targetId: resettingUser.id,
          targetName: resettingUser.name,
          changes: { action: "RESET_PASSWORD" },
        });
        toast.success(`✅ Password "${resettingUser.name}" berhasil direset!`, { id: "reset" });
        setShowResetModal(false);
        setNewPassword("");
      } else {
        toast.error(data.error || "Gagal reset password", { id: "reset" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "reset" });
    } finally {
      setResetting(false);
    }
  };

  // Tambah user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nama harus diisi!");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email harus diisi!");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password minimal 6 karakter!");
      return;
    }
    
    // 🔥 SUPER_ADMIN harus pilih sekolah
    if (currentUserRole === "SUPER_ADMIN" && !selectedSchoolId) {
      toast.error("Pilih sekolah terlebih dahulu!");
      return;
    }
    
    setSubmitting(true);
    toast.loading("Menyimpan user...", { id: "save" });
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": currentUserEmail,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          className: formData.className,
          schoolId: currentUserRole === "SUPER_ADMIN" ? selectedSchoolId : schoolId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await logAdminActivity({
          action: "CREATE",
          targetType: "USER",
          targetId: data.id,
          targetName: formData.name,
          changes: { email: formData.email, role: formData.role, className: formData.className },
        });
        toast.success("✅ User berhasil ditambahkan!", { id: "save" });
        setShowAddModal(false);
        setFormData({ name: "", email: "", password: "", role: "USER", className: "" });
        setSelectedSchoolId("");
        fetchUsers();
      } else {
        toast.error(data.error || "Gagal menambah user", { id: "save" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "save" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
        return "Admin";
      default:
        return "User";
    }
  };

  // Cek apakah user bisa dihapus/direset oleh admin biasa
  const canManageUser = (userRole: string) => {
    if (currentUserRole === "SUPER_ADMIN") return true;
    if (currentUserRole === "ADMIN") {
      // Admin biasa hanya bisa manage user biasa
      return userRole === "USER";
    }
    return false;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Kelola Pengguna</h1>
          <p className="text-xs text-gray-400 mt-1">
            {currentUserRole === "SUPER_ADMIN" 
              ? "Manajemen akun untuk semua sekolah" 
              : "Manajemen akun siswa di sekolah Anda"}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <PrintButton 
            title="Daftar Pengguna"
            data={users}
            columns={[
              { header: "Nama", accessor: "name" },
              { header: "Email", accessor: "email" },
              { header: "Role", accessor: "role" },
              { header: "Kelas", accessor: "className" },
            ]}
          />
          
          {/* Tombol Export Excel */}
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
          >
            📥 Export Excel
          </button>
          
          {/* Tombol Tambah User */}
          <button
            onClick={() => setShowAddModal(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            + Tambah User
          </button>
        </div>
      </div>

      {/* Pilihan Sekolah untuk SUPER_ADMIN */}
      {currentUserRole === "SUPER_ADMIN" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <label className="text-xs font-semibold text-gray-700 min-w-[100px]">
              Filter Berdasarkan Sekolah:
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white flex-1"
            >
              <option value="">-- Semua Sekolah --</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSelectedSchoolId("");
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs text-gray-500 hover:text-blue-600 transition"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div className="text-xs text-gray-500">
            Menampilkan {users.length} dari {totalItems} user
          </div>
        </div>
      </div>

      {/* Tabel User */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">👥</span>
                      <p className="text-sm">Belum ada user</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="text-blue-600 text-xs font-medium hover:underline"
                      >
                        + Tambah User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 text-sm">{user.name || "-"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-1 text-[9px] font-medium rounded-full ${getRoleBadge(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-500 text-sm">{user.className || "-"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Tombol Reset Password - hanya jika bisa manage */}
                        {canManageUser(user.role) && (
                          <button
                            onClick={() => handleResetClick(user)}
                            className="px-2 py-1 text-[10px] font-medium text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 transition"
                            title="Reset Password"
                          >
                            🔑 Reset
                          </button>
                        )}
                        {/* Tombol Hapus - hanya jika bisa manage */}
                        {canManageUser(user.role) && (
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition"
                            title="Hapus User"
                          >
                            Hapus
                          </button>
                        )}
                        {!canManageUser(user.role) && (
                          <span className="text-[9px] text-gray-400 italic">Tidak bisa dikelola</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                ← Sebelumnya
              </button>
              <div className="flex gap-1">
                {(() => {
                  const pages = [];
                  let start = Math.max(1, currentPage - 2);
                  let end = Math.min(totalPages, start + 4);
                  
                  if (end - start < 4) {
                    start = Math.max(1, end - 4);
                  }
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  
                  return pages.map((pageNum) => (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg transition ${
                        pageNum === currentPage
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ));
                })()}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👤</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hapus User?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus user <span className="font-semibold">"{deletingUser.name}"</span>?
              </p>
              <p className="text-xs text-red-500 mt-2">Tindakan ini tidak dapat dibatalkan!</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetModal(false)}></div>
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔑</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
              <p className="text-sm text-gray-500 mt-2">
                Reset password untuk user <span className="font-semibold">"{resettingUser.name}"</span>
              </p>
              <div className="mt-4 text-left">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setNewPassword("");
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetConfirm}
                  disabled={resetting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2"
                >
                  {resetting ? "Memproses..." : "Reset Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">👤</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tambah User</h3>
              <p className="text-xs text-gray-400">
                {currentUserRole === "SUPER_ADMIN" 
                  ? "Input data user baru untuk sekolah tertentu" 
                  : "Input data user baru untuk sekolah Anda"}
              </p>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Pilihan Sekolah - HANYA untuk SUPER_ADMIN */}
              {currentUserRole === "SUPER_ADMIN" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pilih Sekolah <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">-- Pilih Sekolah --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-gray-400 mt-1">
                    User akan terdaftar di sekolah yang dipilih
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Fauzi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  disabled={currentUserRole === "ADMIN"}
                >
                  <option value="USER">User Biasa</option>
                  {currentUserRole === "SUPER_ADMIN" && (
                    <option value="ADMIN">Admin Sekolah</option>
                  )}
                  {currentUserRole === "SUPER_ADMIN" && (
                    <option value="SUPER_ADMIN">Super Admin</option>
                  )}
                </select>
                {currentUserRole === "ADMIN" && (
                  <p className="text-[9px] text-gray-400 mt-1">
                    Admin hanya bisa menambahkan user biasa
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 9A"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedSchoolId("");
                    setFormData({ name: "", email: "", password: "", role: "USER", className: "" });
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}