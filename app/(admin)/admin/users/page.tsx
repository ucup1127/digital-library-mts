// app/(admin)/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { logAdminActivity } from "@/lib/admin-log";
import PrintButton from "@/components/ui/PrintButton";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  GraduationCap,
  BadgeCheck,
  UserCircle,
  Shield,
  School,
  X,
  Save,
  Sparkles,
  AlertCircle,
  UserX,
  UserCheck,
  Key,
 Download,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  className: string;
  memberId: string;
  isActive: boolean;
  graduatedAt: string | null;
  createdAt: string;
  schoolId: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [userRole, setUserRole] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 15, 20, 50];
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    className: "",
  });
  
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    className: "",
    password: "",
  });

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "";
    const email = localStorage.getItem("user_email") || "";
    
    setUserRole(role);
    setCurrentUserEmail(email);
    
    if (role === "SUPER_ADMIN") {
      const savedSchoolId = localStorage.getItem("selected_school_id") || "";
      const savedSchoolName = localStorage.getItem("selected_school_name") || "";
      setSelectedSchoolId(savedSchoolId);
      setSelectedSchoolName(savedSchoolName);
    } else {
      const schoolId = localStorage.getItem("school_id") || "";
      const schoolName = localStorage.getItem("school_name") || "";
      setSelectedSchoolId(schoolId);
      setSelectedSchoolName(schoolName);
    }
  }, []);

  useEffect(() => {
    const handleSchoolChange = (event: any) => {
      const newSchoolId = event.detail?.schoolId;
      const newSchoolName = event.detail?.schoolName;
      if (newSchoolId) {
        setSelectedSchoolId(newSchoolId);
        setSelectedSchoolName(newSchoolName);
        setCurrentPage(1);
      }
    };
    
    window.addEventListener("schoolChanged", handleSchoolChange);
    return () => window.removeEventListener("schoolChanged", handleSchoolChange);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterStatus, pageSize, selectedSchoolId]);

  useEffect(() => {
    if (selectedSchoolId || (userRole === "SUPER_ADMIN" && !selectedSchoolId)) {
      fetchUsers();
    }
  }, [selectedSchoolId, currentPage, search, filterRole, filterStatus, pageSize]);

  const fetchUsers = async () => {
    if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
      setUsers([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    
    if (!selectedSchoolId) {
      setUsers([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      if (search) params.append("search", search);
      if (filterRole) params.append("role", filterRole);
      
      if (filterStatus === "active") {
        params.append("status", "active");
      } else if (filterStatus === "inactive") {
        params.append("status", "inactive");
      }
      
      params.append("schoolId", selectedSchoolId);
      
      const url = `/api/admin/users?${params.toString()}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
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
    
    setSubmitting(true);
    toast.loading("Menyimpan user...", { id: "save" });
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          className: formData.className,
          schoolId: selectedSchoolId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("✅ User berhasil ditambahkan!", { id: "save" });
        setShowAddModal(false);
        setFormData({ name: "", email: "", password: "", role: "USER", className: "" });
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

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSubmitting(true);
    toast.loading("Menyimpan perubahan...", { id: "edit" });
    
    try {
      const body: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        className: editForm.className,
      };
      
      if (editForm.password && editForm.password.length >= 6) {
        body.password = editForm.password;
      }
      
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("✅ User berhasil diperbarui!", { id: "edit" });
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || "Gagal memperbarui", { id: "edit" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "edit" });
    } finally {
      setSubmitting(false);
    }
  };

  // SWEETALERT - KONFIRMASI NONAKTIFKAN
  const handleDeactivate = async (user: User) => {
    const result = await Swal.fire({
      title: `Nonaktifkan User?`,
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600">Anda akan menonaktifkan:</p>
          <p class="font-semibold text-gray-800 text-base mt-1">${user.name}</p>
          <p class="text-xs text-gray-400">${user.email} • ${user.memberId || "-"}</p>
          <hr class="my-3">
          <p class="text-xs text-orange-600">⚠️ User tidak akan bisa login sampai diaktifkan kembali</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Nonaktifkan",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg',
        cancelButton: 'px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg',
      }
    });

    if (result.isConfirmed) {
      const toastId = toast.loading("Menonaktifkan user...");
      
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        });
        
        toast.dismiss(toastId);
        
        if (res.ok) {
          Swal.fire({
            title: "✅ Berhasil!",
            text: `User "${user.name}" berhasil dinonaktifkan.`,
            icon: "success",
            confirmButtonColor: "#3b82f6",
            confirmButtonText: "OK",
            timer: 2000,
            timerProgressBar: true,
          });
          fetchUsers();
        } else {
          toast.error("Gagal menonaktifkan user");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.dismiss(toastId);
        toast.error("Terjadi kesalahan");
      }
    }
  };

  // SWEETALERT - KONFIRMASI AKTIFKAN
  const handleActivate = async (user: User) => {
    const result = await Swal.fire({
      title: `Aktifkan User?`,
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600">Anda akan mengaktifkan kembali:</p>
          <p class="font-semibold text-gray-800 text-base mt-1">${user.name}</p>
          <p class="text-xs text-gray-400">${user.email} • ${user.memberId || "-"}</p>
          <hr class="my-3">
          <p class="text-xs text-green-600">✅ User akan bisa login kembali ke sistem</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Aktifkan",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg',
        cancelButton: 'px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg',
      }
    });

    if (result.isConfirmed) {
      const toastId = toast.loading("Mengaktifkan user...");
      
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
        
        toast.dismiss(toastId);
        
        if (res.ok) {
          Swal.fire({
            title: "✅ Berhasil!",
            text: `User "${user.name}" berhasil diaktifkan kembali.`,
            icon: "success",
            confirmButtonColor: "#3b82f6",
            confirmButtonText: "OK",
            timer: 2000,
            timerProgressBar: true,
          });
          fetchUsers();
        } else {
          toast.error("Gagal mengaktifkan user");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.dismiss(toastId);
        toast.error("Terjadi kesalahan");
      }
    }
  };

  // SWEETALERT - KONFIRMASI HAPUS PERMANEN
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    const result = await Swal.fire({
      title: "⚠️ Hapus Permanen?",
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600">Anda akan menghapus <strong>PERMANEN</strong>:</p>
          <p class="font-semibold text-red-600 text-base mt-1">${deletingUser.name}</p>
          <p class="text-xs text-gray-400">${deletingUser.email}</p>
          <hr class="my-3">
          <p class="text-xs text-red-600 font-bold">⚠️ Tindakan ini TIDAK DAPAT DIBATALKAN!</p>
          <p class="text-xs text-gray-500">Data user akan hilang permanen dari database.</p>
        </div>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus Permanen",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg',
        cancelButton: 'px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg',
      }
    });

    if (result.isConfirmed) {
      setDeleting(true);
      const toastId = toast.loading("Menghapus user permanen...");
      
      try {
        const res = await fetch(`/api/admin/users?id=${deletingUser.id}&permanent=true`, {
          method: "DELETE",
        });
        
        toast.dismiss(toastId);
        
        if (res.ok) {
          Swal.fire({
            title: "🗑️ Terhapus!",
            text: `User "${deletingUser.name}" berhasil dihapus permanen.`,
            icon: "success",
            confirmButtonColor: "#3b82f6",
            confirmButtonText: "OK",
            timer: 2000,
            timerProgressBar: true,
          });
          setShowDeleteModal(false);
          setDeletingUser(null);
          fetchUsers();
        } else {
          toast.error("Gagal menghapus user");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.dismiss(toastId);
        toast.error("Terjadi kesalahan");
      } finally {
        setDeleting(false);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-purple-100 text-purple-700";
      case "ADMIN": return "bg-blue-100 text-blue-700";
      default: return "bg-green-100 text-green-700";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "Super Admin";
      case "ADMIN": return "Admin Sekolah";
      default: return "User/Siswa";
    }
  };
  const handleExportExcel = async () => {
    try {
      toast.loading("Menyiapkan file Excel...", { id: "export" });

      const params = new URLSearchParams();
      if (selectedSchoolId) params.append("schoolId", selectedSchoolId);
      if (search) params.append("search", search);
      if (filterRole) params.append("role", filterRole);
      if (filterStatus) params.append("status", filterStatus);

      const res = await fetch(`/api/admin/export-user?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Download file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daftar-user-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("✅ Export berhasil!", { id: "export" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal export data", { id: "export" });
    }
  };

  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kelola User</h1>
            <p className="text-xs text-gray-400 mt-1">Manajemen akun pengguna perpustakaan</p>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-8 text-center">
          <div className="text-5xl mb-3">🏫</div>
          <h2 className="text-lg font-semibold text-yellow-700">Belum Memilih Sekolah</h2>
          <p className="text-sm text-yellow-600 mt-1">Silakan pilih sekolah terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  if (!selectedSchoolId && userRole !== "SUPER_ADMIN") {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Kelola User
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manajemen akun pengguna perpustakaan
            {selectedSchoolName && (
              <span className="text-purple-600 ml-1">- {selectedSchoolName}</span>
            )}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <PrintButton 
            title="Daftar User"
            data={users}
            columns={[
              { header: "Nama", accessor: "name" },
              { header: "Email", accessor: "email" },
              { header: "Role", accessor: "role" },
              { header: "Kelas", accessor: "className" },
              { header: "No Anggota", accessor: "memberId" },
              { header: "Status", accessor: "isActive" },
            ]}
          />
          
          {/* 🔥 Tombol Export Excel */}
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition flex items-center gap-2 shadow-lg shadow-green-200"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-lg shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            Tambah User
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cari User</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nama, email, atau nomor anggota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Filter Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">-- Semua Role --</option>
              <option value="ADMIN">Admin Sekolah</option>
              <option value="USER">User/Siswa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Filter Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">-- Semua Status --</option>
              <option value="active">✅ Aktif</option>
              <option value="inactive">❌ Nonaktif</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tampilkan</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} data</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabel User */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">No Anggota</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada user</p>
                      <button onClick={() => setShowAddModal(true)} className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Tambah User
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition group">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {user.name || "-"}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-500 text-sm flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {user.email}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role === "SUPER_ADMIN" ? <Shield className="w-3 h-3" /> : user.role === "ADMIN" ? <UserCircle className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-500 text-sm flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                      {user.className || "-"}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-500 text-sm font-mono flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                      {user.memberId || "-"}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-medium bg-green-100 text-green-700 rounded-full">
                        <BadgeCheck className="w-3 h-3" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-medium bg-red-100 text-red-700 rounded-full">
                        <UserX className="w-3 h-3" />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setViewingUser(user);
                          setShowViewModal(true);
                        }}
                        className="p-1.5 text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition group-hover:scale-110"
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setEditForm({
                            name: user.name || "",
                            email: user.email,
                            role: user.role,
                            className: user.className || "",
                            password: "",
                          });
                          setShowEditModal(true);
                        }}
                        className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition group-hover:scale-110"
                        title="Edit User"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {user.isActive ? (
                        <button
                          onClick={() => handleDeactivate(user)}
                          className="p-1.5 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition group-hover:scale-110"
                          title="Nonaktifkan"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user)}
                          className="p-1.5 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition group-hover:scale-110"
                          title="Aktifkan"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {user.email !== currentUserEmail && (
                        <button
                          onClick={() => {
                            setDeletingUser({ id: user.id, name: user.name || user.email, email: user.email, role: user.role });
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition group-hover:scale-110"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-gray-500">
              Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} user
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                Sebelumnya
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition flex items-center gap-1"
              >
                Selanjutnya
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== MODAL TAMBAH USER ========== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Tambah User
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition" required />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition" required />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <input type="password" placeholder="Minimal 6 karakter" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition" required />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                  <option value="USER">User/Siswa</option>
                  {userRole === "SUPER_ADMIN" && <option value="ADMIN">Admin Sekolah</option>}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kelas (Opsional)</label>
                <input type="text" placeholder="Contoh: 9A" value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition" />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200 disabled:opacity-50">
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL EDIT USER ========== */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit User
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" required />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="USER">User/Siswa</option>
                  {userRole === "SUPER_ADMIN" && <option value="ADMIN">Admin Sekolah</option>}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kelas</label>
                <input type="text" value={editForm.className} onChange={(e) => setEditForm({ ...editForm, className: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-amber-600 mb-1.5">Reset Password (Opsional)</label>
                <input type="password" placeholder="Kosongkan jika tidak ingin mengganti password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition" />
                <p className="text-[9px] text-gray-400 mt-1">Isi password baru jika ingin mereset password user</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50">
                  {submitting ? (
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
          </div>
        </div>
      )}

      {/* ========== MODAL HAPUS PERMANEN ========== */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Permanen?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus <strong>PERMANEN</strong> user <strong>"{deletingUser.name}"</strong>?
              </p>
              <p className="text-xs text-red-500 mt-2">⚠️ Tindakan ini TIDAK DAPAT DIBATALKAN! Data akan hilang permanen.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</button>
                <button onClick={handleDeleteUser} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus Permanen"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL LIHAT USER ========== */}
      {showViewModal && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-600" />
                Detail User
              </h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
                <p className="text-sm text-gray-800 mt-1 font-medium">{viewingUser.name || "-"}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                <p className="text-sm text-gray-800 mt-1">{viewingUser.email}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                <p className="text-sm mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadge(viewingUser.role)}`}>
                    {viewingUser.role === "SUPER_ADMIN" ? <Shield className="w-3 h-3" /> : viewingUser.role === "ADMIN" ? <UserCircle className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {getRoleText(viewingUser.role)}
                  </span>
                </p>
              </div>
              
              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kelas</label>
                <p className="text-sm text-gray-800 mt-1">{viewingUser.className || "-"}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nomor Anggota</label>
                <p className="text-sm text-gray-800 mt-1 font-mono">{viewingUser.memberId || "-"}</p>
              </div>
              
              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                <p className="text-sm mt-1">
                  {viewingUser.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      <BadgeCheck className="w-3 h-3" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      <UserX className="w-3 h-3" />
                      Nonaktif
                    </span>
                  )}
                </p>
              </div>
              
              <div className="border-b border-gray-100 pb-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tanggal Daftar</label>
                <p className="text-sm text-gray-800 mt-1">{new Date(viewingUser.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowViewModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Tutup</button>
              <button onClick={() => { setShowViewModal(false); setSelectedUser(viewingUser); setEditForm({ name: viewingUser.name || "", email: viewingUser.email, role: viewingUser.role, className: viewingUser.className || "", password: "" }); setShowEditModal(true); }} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition">Edit User</button>
            </div>
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