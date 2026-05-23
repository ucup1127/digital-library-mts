// app/(admin)/admin/sekolah/page.tsx
"use client"; // ✅ Tambahkan ini di baris pertama

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";

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

  // Cek role user
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    if (isLoggedIn !== "true") {
      router.push("/login/admin");
      return;
    }
    
    if (role !== "SUPER_ADMIN") {
      toast.error("Akses ditolak. Hanya Super Admin yang bisa mengakses halaman ini!");
      router.push("/admin");
      return;
    }
    
    setIsSuperAdmin(true);
    fetchSchools();
  }, [router]);

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      // ✅ Pastikan data memiliki nilai default untuk menghindari NaN
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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  // Hitung total yang aman (hindari NaN)
  const totalUsers = schools.reduce((acc, s) => acc + (s.totalUsers || 0), 0);
  const totalBooks = schools.reduce((acc, s) => acc + (s.totalBooks || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Kelola Sekolah
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
            Atur sekolah yang terdaftar di sistem (Khusus Super Admin)
          </p>
        </div>
        <Link
          href="/admin/sekolah/tambah"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
        >
          + Tambah Sekolah
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Sekolah</p>
          <p className="text-2xl font-black italic text-gray-900 mt-1">{schools.length || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Pengguna</p>
          <p className="text-2xl font-black italic text-gray-900 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Buku</p>
          <p className="text-2xl font-black italic text-gray-900 mt-1">{totalBooks}</p>
        </div>
      </div>

      {/* Tabel Sekolah */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">Nama Sekolah</th>
                <th className="p-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">Slug</th>
                <th className="p-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-wider">Pengguna</th>
                <th className="p-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-wider">Buku</th>
                <th className="p-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">Terdaftar</th>
                <th className="p-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    Belum ada sekolah yang terdaftar
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{school.name}</p>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{school.slug}</code>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-blue-600">{school.totalUsers || 0}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-green-600">{school.totalBooks || 0}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-gray-500">
                        {new Date(school.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/sekolah/edit/${school.id}`}
                          className="text-gray-400 hover:text-blue-600 transition"
                          title="Edit"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => openDeleteModal(school)}
                          disabled={deletingId === school.id}
                          className="text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === school.id ? "⏳" : "🗑️"}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Sekolah</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus sekolah{" "}
                <span className="font-bold">"{selectedSchool.name}"</span>?
              </p>
              <div className="bg-red-50 rounded-xl p-3 mt-4">
                <p className="text-xs text-red-600">⚠️ Peringatan:</p>
                <p className="text-xs text-red-500">
                  {(selectedSchool.totalUsers || 0)} pengguna dan {(selectedSchool.totalBooks || 0)} buku akan ikut terhapus!
                </p>
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
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deletingId === selectedSchool.id ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}