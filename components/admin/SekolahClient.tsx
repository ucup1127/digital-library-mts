// components/admin/SekolahClient.tsx
"use client";

import { useState } from "react";
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
  createdAt: Date;
}

export default function SekolahClient({ initialSchools }: { initialSchools: School[] }) {
  const router = useRouter();
  const [schools, setSchools] = useState(initialSchools);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

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
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Gagal menghapus sekolah";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();

      await logAdminActivity({
        action: "DELETE",
        targetType: "SCHOOL",
        targetId: selectedSchool.id,
        targetName: selectedSchool.name,
        changes: { 
          deletedUsers: data.deletedUsers,
          deletedBooks: data.deletedBooks
        },
      });
      
      toast.success(`✅ ${data.message || `Sekolah "${selectedSchool.name}" berhasil dihapus`}`, {
        duration: 3000,
        position: "top-center",
      });
      
      setSchools(schools.filter((s) => s.id !== selectedSchool.id));
      router.refresh();
      
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Gagal menghapus sekolah", {
        duration: 3000,
        position: "top-center",
        icon: "❌",
      });
    } finally {
      setDeletingId(null);
      closeDeleteModal();
    }
  };

  return (
    <>
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
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🏫</span>
                    <p className="text-sm">Belum ada sekolah yang terdaftar</p>
                    <Link href="/admin/sekolah/tambah" className="mt-2 text-blue-600 text-xs font-bold uppercase hover:underline">
                      + Tambah Sekolah
                    </Link>
                  </div>
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
                    <span className="text-xs font-bold text-blue-600">{school.totalUsers}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-bold text-green-600">{school.totalBooks}</span>
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
                        className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => openDeleteModal(school)}
                        disabled={deletingId === school.id}
                        className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                <span className="font-bold text-gray-700">"{selectedSchool.name}"</span>?
              </p>
              <div className="bg-red-50 rounded-xl p-3 mt-4">
                <p className="text-xs text-red-600">
                  ⚠️ Peringatan: Data berikut juga akan ikut terhapus:
                </p>
                <ul className="text-xs text-red-500 mt-2 space-y-1">
                  <li>• {selectedSchool.totalUsers} pengguna</li>
                  <li>• {selectedSchool.totalBooks} buku</li>
                </ul>
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
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2"
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
    </>
  );
}