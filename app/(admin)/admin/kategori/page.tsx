// app/(admin)/admin/kategori/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  FolderTree, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Save,
  AlertCircle,
  Sparkles,
  Layers,
  FileText
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  _count?: {
    books: number;
  };
}

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  year: string | null;
  views: number;
}

export default function KategoriPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string; bookCount: number } | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<{ id: string; name: string } | null>(null);
  const [categoryBooks, setCategoryBooks] = useState<Book[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kategori");
      const data = await res.json();
      
      const categoriesWithCount = await Promise.all(
        data.map(async (cat: Category) => {
          try {
            const bookRes = await fetch(`/api/buku?category=${cat.id}&limit=1`);
            const bookData = await bookRes.json();
            return {
              ...cat,
              _count: { books: bookData.pagination?.totalItems || 0 }
            };
          } catch {
            return { ...cat, _count: { books: 0 } };
          }
        })
      );
      
      setCategories(categoriesWithCount);
      setTotalItems(categoriesWithCount.length);
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

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalFilteredItems = filteredCategories.length;
  const totalPages = Math.ceil(totalFilteredItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

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

  const handleEditClick = (cat: Category) => {
    setEditingCategory({ id: cat.id, name: cat.name });
    setEditingName(cat.name);
    setShowEditModal(true);
  };

  const handleEditConfirm = async () => {
    if (!editingCategory) return;
    if (!editingName.trim()) {
      toast.error("Nama kategori tidak boleh kosong!");
      return;
    }

    setEditingSubmitting(true);
    toast.loading("Menyimpan perubahan...", { id: "edit" });

    try {
      const res = await fetch(`/api/kategori/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Kategori berhasil diperbarui!", { id: "edit" });
        setShowEditModal(false);
        setEditingCategory(null);
        setEditingName("");
        fetchCategories();
      } else {
        toast.error(data.error || "Gagal memperbarui kategori", { id: "edit" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "edit" });
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleViewClick = async (cat: Category) => {
    setViewingCategory({ id: cat.id, name: cat.name });
    setShowViewModal(true);
    setViewLoading(true);
    
    try {
      const res = await fetch(`/api/buku?category=${cat.id}&limit=50`);
      const data = await res.json();
      setCategoryBooks(Array.isArray(data.books) ? data.books : []);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Gagal memuat daftar buku");
    } finally {
      setViewLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat kategori...</p>
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
            <FolderTree className="w-6 h-6 text-green-600" />
            Kelola Kategori
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manajemen label koleksi buku</p>
        </div>
      </div>

      {/* Form Tambah Kategori */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleAddCategory} className="flex gap-3">
          <div className="relative flex-1">
            <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Tulis nama kategori baru..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition placeholder:text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-200"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Tambah
          </button>
        </form>
      </div>

      {/* Search dan Page Size */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Tampilkan</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <span className="text-xs text-gray-500">data</span>
            <span className="w-px h-6 bg-gray-200"></span>
            <span className="text-xs text-gray-400">
              Total: <span className="font-semibold text-gray-700">{totalItems}</span> kategori
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Kategori */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Jumlah Buku</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FolderTree className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Tidak ada kategori</p>
                      <p className="text-xs text-gray-300">Tambahkan kategori baru</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition group">
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-400">{startIndex + idx + 1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-green-500" />
                        {cat.name}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full">
                        <BookOpen className="w-3 h-3" />
                        {cat._count?.books || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewClick(cat)}
                          className="p-1.5 text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition group-hover:scale-110"
                          title="Lihat Buku"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(cat)}
                          className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition group-hover:scale-110"
                          title="Edit Kategori"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(cat.id, cat.name, cat._count?.books || 0)}
                          disabled={deletingId === cat.id}
                          className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition group-hover:scale-110 disabled:opacity-50"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
              Menampilkan {startIndex + 1} - {Math.min(endIndex, totalFilteredItems)} dari {totalFilteredItems} kategori
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                Sebelumnya
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg transition ${
                        pageNum === currentPage
                          ? "bg-green-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
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

      {/* ========== MODAL EDIT KATEGORI ========== */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Kategori
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setEditingName("");
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Kategori</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                    setEditingName("");
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditConfirm}
                  disabled={editingSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {editingSubmitting ? (
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
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL KONFIRMASI HAPUS ========== */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Kategori?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus kategori{" "}
                <span className="font-semibold">"{deletingCategory.name}"</span>?
              </p>
              {deletingCategory.bookCount > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-xs text-yellow-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Kategori ini memiliki <strong>{deletingCategory.bookCount}</strong> buku.
                    Buku tersebut akan tetap ada, hanya kategorinya yang dihapus.
                  </p>
                </div>
              )}
              <p className="text-xs text-red-500 mt-2">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingId === deletingCategory.id}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingId === deletingCategory.id ? (
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

      {/* ========== MODAL LIHAT BUKU DALAM KATEGORI ========== */}
      {showViewModal && viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-green-600" />
                Buku dalam kategori: <span className="text-green-600">{viewingCategory.name}</span>
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingCategory(null);
                  setCategoryBooks([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[55vh]">
              {viewLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-xs">Memuat daftar buku...</p>
                  </div>
                </div>
              ) : categoryBooks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-sm text-gray-400">Belum ada buku dalam kategori ini</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categoryBooks.map((book, idx) => (
                    <div key={book.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-400 w-6 text-center">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                          <p className="text-xs text-gray-400">{book.author}</p>
                        </div>
                      </div>
                      <Link
                        href={`/admin/buku/edit/${book.id}`}
                        className="px-3 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 group-hover:scale-105"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingCategory(null);
                  setCategoryBooks([]);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Tutup
              </button>
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