// app/(admin)/admin/sekolah/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import {
  School,
  Plus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  Building2,
  X,
  AlertTriangle,
} from "lucide-react";

interface School {
  id: string;
  name: string;
  slug: string;
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
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

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

  const openDeleteModal = (school: School) => {
    setSelectedSchool(school);
    setShowModal(true);
  };

  const closeDeleteModal = () => {
    setShowModal(false);
    setSelectedSchool(null);
  };

  const handleDelete = async () => {
    if (!selectedSchool) return;

    setDeletingId(selectedSchool.id);

    try {
      const res = await fetch(`/api/schools/${selectedSchool.id}`, {
        method: "DELETE",
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Terjadi kesalahan" };
      }

      if (res.ok) {
        toast.success(`✅ ${data.message || `Sekolah "${selectedSchool.name}" berhasil dihapus`}`);
        setSchools(schools.filter((s) => s.id !== selectedSchool.id));
      } else {
        toast.error(data.error || "Gagal menghapus sekolah");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setDeletingId(null);
      closeDeleteModal();
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
            <School className="w-6 h-6 text-purple-600" />
            Kelola Sekolah
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Atur sekolah yang terdaftar di sistem (Khusus Super Admin)
          </p>
        </div>
        <Link
          href="/admin/sekolah/tambah"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-lg shadow-purple-200"
        >
          <Plus className="w-4 h-4" />
          Tambah Sekolah
        </Link>
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
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <School className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada sekolah terdaftar</p>
                      <Link href="/admin/sekolah/tambah" className="text-purple-600 text-xs font-medium hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Tambah Sekolah
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition group">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {school.name}
                      </p>
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
                        <Link
                          href={`/admin/sekolah/edit/${school.id}`}
                          className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition group-hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(school)}
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

      {/* Modal Konfirmasi Hapus */}
      {showModal && selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Sekolah</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus sekolah{" "}
                <span className="font-bold">"{selectedSchool.name}"</span>?
              </p>
              <div className="bg-red-50 rounded-xl p-3 mt-4 border border-red-100">
                <div className="flex items-start gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-600">Peringatan</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      {(selectedSchool.totalUsers || 0)} pengguna dan {(selectedSchool.totalBooks || 0)} buku akan ikut terhapus!
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId === selectedSchool.id}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingId === selectedSchool.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}