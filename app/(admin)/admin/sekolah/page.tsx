// app/(admin)/admin/sekolah/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { logAdminActivity } from "@/lib/admin-log";
import {
  School as SchoolIcon,
  Plus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  Building2,
  X,
  Save,
  Upload,
} from "lucide-react";

interface School {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  totalUsers: number;
  totalBooks: number;
  createdAt: string;
}

export default function KelolaSekolahPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal Tambah
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", slug: "" });
  const [addLogoFile, setAddLogoFile] = useState<File | null>(null);
  const [addLogoPreview, setAddLogoPreview] = useState<string | null>(null);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Modal Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<School | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.user) {
          router.push("/login/admin");
          return;
        }

        if (data.user.role !== "SUPER_ADMIN") {
          toast.error("Akses ditolak. Hanya Super Admin!");
          router.push("/admin");
          return;
        }

        setIsSuperAdmin(true);
        fetchSchools();
      } catch (error) {
        console.error("Error checking role:", error);
        router.push("/login/admin");
      }
    };

    checkRole();
  }, [router]);

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      const formattedSchools = data.map((school: any) => ({
        ...school,
        totalUsers: school.totalUsers || 0,
        totalBooks: school.totalBooks || 0,
      }));
      setSchools(formattedSchools);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal memuat data sekolah");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // ============================================
  // TAMBAH SEKOLAH
  // ============================================
  const openAddModal = () => {
    setAddForm({ name: "", slug: "" });
    setAddLogoFile(null);
    setAddLogoPreview(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addForm.name.trim()) {
      toast.error("Nama sekolah harus diisi!");
      return;
    }

    setSubmittingAdd(true);

    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addForm.name, slug: addForm.slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal menambahkan sekolah");
        setSubmittingAdd(false);
        return;
      }

      const schoolId = data.id;
      let logoPath = "";

      // Upload logo kalau ada
      if (addLogoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("logo", addLogoFile);
        uploadFormData.append("schoolId", schoolId);

        const uploadRes = await fetch("/api/upload/logo", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          logoPath = uploadData.logoPath;
        }
      }

      // Log aktivitas
      await logAdminActivity({
        action: "CREATE",
        targetType: "SCHOOL",
        targetId: schoolId,
        targetName: addForm.name,
        changes: { name: addForm.name, slug: addForm.slug, logo: logoPath || "-" },
      });

      toast.success("Sekolah berhasil ditambahkan!");
      setShowAddModal(false);
      fetchSchools();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // ============================================
  // EDIT SEKOLAH
  // ============================================
  const openEditModal = (school: School) => {
    setEditTarget(school);
    setEditForm({ name: school.name, slug: school.slug });
    setEditLogoFile(null);
    setEditLogoPreview(school.logo || null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (!editForm.name.trim()) {
      toast.error("Nama sekolah harus diisi!");
      return;
    }

    setSubmittingEdit(true);

    try {
      let logoPath = editTarget.logo || "";

      // Upload logo baru kalau ada
      if (editLogoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("logo", editLogoFile);
        uploadFormData.append("schoolId", editTarget.id);

        const uploadRes = await fetch("/api/upload/logo", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          logoPath = uploadData.logoPath;
        }
      }

      const res = await fetch(`/api/schools/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          slug: editForm.slug,
          logo: logoPath,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await logAdminActivity({
          action: "UPDATE",
          targetType: "SCHOOL",
          targetId: editTarget.id,
          targetName: editForm.name,
          changes: {
            old: { name: editTarget.name, slug: editTarget.slug, logo: editTarget.logo },
            new: { name: editForm.name, slug: editForm.slug, logo: logoPath },
          },
        });

        toast.success("Sekolah berhasil diperbarui!");
        setShowEditModal(false);
        fetchSchools();
      } else {
        toast.error(data.error || "Gagal memperbarui sekolah");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // ============================================
  // HAPUS SEKOLAH
  // ============================================
  const handleDelete = async (school: School) => {
    const result = await Swal.fire({
      title: "Hapus Sekolah?",
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600">Anda akan menghapus:</p>
          <p class="font-semibold text-red-600 text-base mt-1">${school.name}</p>
          <hr class="my-3">
          <p class="text-xs text-red-600 font-bold">⚠️ ${school.totalUsers || 0} pengguna & ${school.totalBooks || 0} buku akan ikut terhapus!</p>
          <p class="text-xs text-gray-500 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingId(school.id);

    try {
      const res = await fetch(`/api/schools/${school.id}`, { method: "DELETE" });
      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Terjadi kesalahan" };
      }

      if (res.ok) {
        toast.success(`Sekolah "${school.name}" berhasil dihapus`);
        setSchools(schools.filter((s) => s.id !== school.id));
      } else {
        toast.error(data.error || "Gagal menghapus sekolah");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================
  // HANDLE FILE CHANGE
  // ============================================
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat data sekolah...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  const totalUsers = schools.reduce((acc, s) => acc + (s.totalUsers || 0), 0);
  const totalBooks = schools.reduce((acc, s) => acc + (s.totalBooks || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <SchoolIcon className="w-6 h-6 text-purple-600" />
            Kelola Sekolah
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Atur sekolah yang terdaftar di sistem (Khusus Super Admin)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-lg shadow-purple-200"
        >
          <Plus className="w-4 h-4" />
          Tambah Sekolah
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Sekolah</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{schools.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Pengguna</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Buku</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{totalBooks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Sekolah */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Logo</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nama Sekolah</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pengguna</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Buku</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Terdaftar</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <SchoolIcon className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada sekolah terdaftar</p>
                      <button onClick={openAddModal} className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Tambah Sekolah
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition group">
                    <td className="px-5 py-3">
                      {school.logo ? (
                        <img
                          src={school.logo}
                          alt={school.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 text-sm">{school.name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                        {school.slug}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                        <Users className="w-3 h-3" />
                        {school.totalUsers || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                        <BookOpen className="w-3 h-3" />
                        {school.totalBooks || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">
                        {new Date(school.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(school)}
                          className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition group-hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(school)}
                          disabled={deletingId === school.id}
                          className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition group-hover:scale-110 disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === school.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== MODAL TAMBAH SEKOLAH ========== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Tambah Sekolah
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nama Sekolah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ name: e.target.value, slug: generateSlug(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
                  placeholder="Contoh: MTs Muhammadiyah Patikraja"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.slug}
                  onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition font-mono"
                  placeholder="mts-muhammadiyah-patikraja"
                  required
                />
                <p className="text-[9px] text-gray-400 mt-1">
                  Huruf kecil, angka, strip (-)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Logo Sekolah
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File
                  </button>
                  <input
                    ref={addFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/svg+xml"
                    onChange={(e) =>
                      handleFileChange(e, setAddLogoFile, setAddLogoPreview)
                    }
                    className="hidden"
                  />
                  {addLogoFile && (
                    <span className="text-xs text-gray-500 truncate">{addLogoFile.name}</span>
                  )}
                </div>
                {addLogoPreview && (
                  <div className="mt-3">
                    <img
                      src={addLogoPreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-1">
                  Format: JPEG, PNG, SVG | Maks 2MB
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200 disabled:opacity-50"
                >
                  {submittingAdd ? (
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

      {/* ========== MODAL EDIT SEKOLAH ========== */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Sekolah
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nama Sekolah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ name: e.target.value, slug: generateSlug(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Logo Sekolah
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Ganti Logo
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/svg+xml"
                    onChange={(e) =>
                      handleFileChange(e, setEditLogoFile, setEditLogoPreview)
                    }
                    className="hidden"
                  />
                  {editLogoFile && (
                    <span className="text-xs text-gray-500 truncate">{editLogoFile.name}</span>
                  )}
                </div>
                {editLogoPreview && (
                  <div className="mt-3">
                    <img
                      src={editLogoPreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-1">
                  Kosongkan jika tidak ingin ganti logo
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {submittingEdit ? (
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
    </div>
  );
}