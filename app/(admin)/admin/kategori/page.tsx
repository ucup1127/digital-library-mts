// app/(admin)/admin/kategori/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";

interface Category {
  id: string;
  name: string;
  _count?: {
    books: number;
  };
}

export default function KategoriPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [search, setSearch] = useState("");
  
  // State untuk modal hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string; bookCount: number } | null>(null);

  // Ambil data kategori
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kategori");
      const data = await res.json();
      
      // Ambil jumlah buku per kategori
      const categoriesWithCount = await Promise.all(
        data.map(async (cat: Category) => {
          const bookRes = await fetch(`/api/buku?category=${cat.id}&limit=1`);
          const bookData = await bookRes.json();
          return {
            ...cat,
            _count: { books: bookData.pagination?.totalItems || 0 }
          };
        })
      );
      
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Tambah kategori
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong!");
      return;
    }

    setSubmitting(true);
    toast.loading("Menambahkan kategori...", { id: "add" });

    try {
      const res = await fetch("/api/kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
          await logAdminActivity({
      action: "CREATE",
      targetType: "CATEGORY",
      targetId: data.id,
      targetName: newCategoryName.trim(),
    });
        toast.success("✅ Kategori berhasil ditambahkan!", { id: "add" });
        setNewCategoryName("");
        fetchCategories();
      } else {
        toast.error(data.error || "Gagal menambah kategori", { id: "add" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "add" });
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus kategori dengan modal
  const handleDeleteClick = (id: string, name: string, bookCount: number = 0) => {
    setDeletingCategory({ id, name, bookCount });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;

    setDeletingId(deletingCategory.id);
    toast.loading("Menghapus kategori...", { id: "delete" });

    try {
      const res = await fetch(`/api/kategori/${deletingCategory.id}`, { method: "DELETE" });

      if (res.ok) {
         await logAdminActivity({
      action: "DELETE",
      targetType: "CATEGORY",
      targetId: deletingCategory.id,
      targetName: deletingCategory.name,
    });
        toast.success(`✅ Kategori "${deletingCategory.name}" berhasil dihapus!`, { id: "delete" });
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus kategori", { id: "delete" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "delete" });
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setDeletingCategory(null);
    }
  };

  // Edit kategori
  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

 const saveEdit = async (id: string) => {
  if (!editingName.trim()) {
    toast.error("Nama kategori tidak boleh kosong!");
    return;
  }

  // Cari nama lama sebelum update
  const oldCategory = categories.find(cat => cat.id === id);
  const oldName = oldCategory?.name || "";

  toast.loading("Menyimpan perubahan...", { id: "edit" });

  try {
    const res = await fetch(`/api/kategori/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });

    const data = await res.json();

    if (res.ok) {
      await logAdminActivity({
        action: "UPDATE",
        targetType: "CATEGORY",
        targetId: id,
        targetName: editingName,
        changes: { old: oldName, new: editingName },
      });
      toast.success("✅ Kategori berhasil diperbarui!", { id: "edit" });
      setEditingId(null);
      setEditingName("");
      fetchCategories();
    } else {
      toast.error(data.error || "Gagal memperbarui kategori", { id: "edit" });
    }
  } catch (error) {
    console.error("Error:", error);
    toast.error("Terjadi kesalahan", { id: "edit" });
  }
};

  // Filter kategori berdasarkan pencarian
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Kelola Kategori</h1>
          <p className="text-xs text-gray-400 mt-1">Manajemen label koleksi buku</p>
        </div>
      </div>

      {/* Form Tambah Kategori */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Tulis nama kategori baru..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? "⏳" : "+"} Tambah
          </button>
        </form>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Grid Kategori */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-2">📂</div>
            <p className="text-sm text-gray-400">Tidak ada kategori</p>
            <p className="text-xs text-gray-300 mt-1">Tambahkan kategori baru</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-4 group"
            >
              {editingId === cat.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(cat.id)}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-medium hover:bg-green-700 transition"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium hover:bg-gray-200 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-base line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {cat._count?.books || 0} judul buku
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition rounded-lg hover:bg-blue-50"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cat.id, cat.name, cat._count?.books || 0)}
                        disabled={deletingId === cat.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Hapus"
                      >
                        {deletingId === cat.id ? "⏳" : "🗑️"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Statistik */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-500">
          Total <span className="font-semibold text-gray-700">{categories.length}</span> kategori
          {search && ` · Menampilkan ${filteredCategories.length} dari ${categories.length}`}
        </p>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hapus Kategori?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus kategori{" "}
                <span className="font-semibold">"{deletingCategory.name}"</span>?
              </p>
              {deletingCategory.bookCount > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-600">
                    ⚠️ Kategori ini memiliki {deletingCategory.bookCount} buku.
                    Buku tersebut akan tetap ada, hanya kategorinya yang dihapus.
                  </p>
                </div>
              )}
              <p className="text-xs text-red-500 mt-2">Tindakan ini tidak dapat dibatalkan!</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}