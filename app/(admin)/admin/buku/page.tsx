// app/(admin)/admin/buku/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import PrintButton from "@/components/ui/PrintButton";

interface Book {
  id: string;
  title: string;
  author: string;
  year: string | null;
  views: number;
  coverUrl: string | null;
  categories: string[];
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function BukuPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // State untuk modal hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBook, setDeletingBook] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ambil daftar kategori untuk filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/kategori");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Ambil data buku dari API
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const schoolId = localStorage.getItem("school_id");
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedYear) params.set("year", selectedYear);
      if (sortBy) params.set("sort", sortBy);
      if (schoolId) params.set("schoolId", schoolId);
      
      const res = await fetch(`/api/buku?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      const formattedBooks = (data.books || []).map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        year: book.year,
        views: book.views,
        coverUrl: book.coverUrl,
        createdAt: book.createdAt,
        categories: (book.categories || []).map((bc: any) => {
          if (typeof bc === 'string') return bc;
          return bc.category?.name || bc.name || 'Tanpa Kategori';
        })
      }));
      
      setBooks(formattedBooks);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Gagal memuat data buku");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [currentPage, search, selectedCategory, selectedYear, sortBy]);

  // Fungsi hapus dengan modal
  const handleDeleteClick = (id: string, title: string) => {
    setDeletingBook({ id, title });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;
    
    setDeleting(true);
    toast.loading("Menghapus buku...", { id: "delete" });
    
    try {
      const res = await fetch(`/api/buku/${deletingBook.id}`, { method: "DELETE" });
      
      if (res.ok) {
        await logAdminActivity({
          action: "DELETE",
          targetType: "BOOK",
          targetId: deletingBook.id,
          targetName: deletingBook.title,
        });
        toast.success("✅ Buku berhasil dihapus!", { id: "delete" });
        fetchBooks();
      } else {
        throw new Error("Gagal menghapus buku");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menghapus buku", { id: "delete" });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletingBook(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResetFilter = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedYear("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Generate opsi tahun
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 2000; y--) {
    yearOptions.push(y);
  }

  if (loading && books.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Kelola Buku</h1>
          <p className="text-xs text-gray-400 mt-1">Atur koleksi buku digital</p>
        </div>
        <div className="flex gap-3">
          <PrintButton 
            title="Daftar Buku"
            data={books}
            columns={[
              { header: "Judul", accessor: "title" },
              { header: "Penulis", accessor: "author" },
              { header: "Tahun", accessor: "year" },
              { header: "Dilihat", accessor: "views" },
            ]}
          />
          <Link href="/admin/buku/import" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2">
            📥 Import Excel
          </Link>
          <Link href="/admin/buku/tambah" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2">
            + Tambah Buku
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari judul atau penulis..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Semua Tahun</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="newest">📅 Terbaru</option>
            <option value="oldest">📅 Terlama</option>
            <option value="most_viewed">👁️ Paling Banyak Dilihat</option>
            <option value="least_viewed">👁️ Paling Jarang Dilihat</option>
            <option value="title_asc">🔤 Judul A-Z</option>
            <option value="title_desc">🔤 Judul Z-A</option>
          </select>

          {(search || selectedCategory || selectedYear || sortBy !== "newest") && (
            <button
              onClick={handleResetFilter}
              className="px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition border border-gray-200 rounded-lg flex items-center justify-center gap-1"
            >
              ✕ Reset Filter
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
          Menampilkan {books.length} dari {totalItems} buku
          {(search || selectedCategory || selectedYear) && (
            <button
              onClick={handleResetFilter}
              className="ml-3 text-blue-600 hover:underline"
            >
              Hapus filter
            </button>
          )}
        </div>
      </div>

      {/* Tabel Buku */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cover</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Penulis</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tahun</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Dilihat</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📚</span>
                      <p className="text-sm">Tidak ada buku yang ditemukan</p>
                      <button
                        onClick={handleResetFilter}
                        className="text-blue-600 text-xs font-medium hover:underline"
                      >
                        Hapus filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="w-10 h-14 bg-gray-100 rounded-lg overflow-hidden">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">📖</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 text-sm line-clamp-1">{book.title}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-500 text-xs line-clamp-1">{book.author}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {book.categories && book.categories.length > 0 ? (
                          book.categories.slice(0, 2).map((cat, idx) => (
                            <span key={`${book.id}-cat-${idx}`} className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-[8px] text-gray-400">-</span>
                        )}
                        {book.categories && book.categories.length > 2 && (
                          <span className="text-[8px] text-gray-400">+{book.categories.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-500 text-sm">{book.year || "-"}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-semibold text-blue-600">{book.views}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/buku/edit/${book.id}`}
                          className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                          title="Edit"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(book.id, book.title)}
                          className="px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition"
                          title="Hapus"
                        >
                          Hapus
                        </button>
                        <Link
                          href={`/buku/${book.id}`}
                          target="_blank"
                          className="px-2 py-1 text-[10px] font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition"
                          title="Lihat"
                        >
                          Lihat
                        </Link>
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
      {showDeleteModal && deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hapus Buku?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus buku <span className="font-semibold">"{deletingBook.title}"</span>?
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
    </div>
  );
}