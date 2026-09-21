// app/(admin)/admin/buku/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PrintButton from "@/components/ui/PrintButton";
import Image from "next/image";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Sparkles,
  Library,
  FileText,
  User,
  Calendar,
  X,
  AlertCircle
} from "lucide-react";

interface Buku {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string | null;
  fileUrl: string | null;
  year: string | null;
  views: number;
  createdAt: string;
  schoolId: string;
  categories: { category: { id: string; name: string } }[];
}

export default function BukuPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Buku[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Buku | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "";
    setUserRole(role);
    
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
  }, [search, pageSize]);

  useEffect(() => {
    if (selectedSchoolId || (userRole === "SUPER_ADMIN" && !selectedSchoolId)) {
      fetchBooks();
    }
  }, [selectedSchoolId, currentPage, search, pageSize]);

  const fetchBooks = async () => {
    if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
      setBooks([]);
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
      if (selectedSchoolId) params.append("schoolId", selectedSchoolId);
      
      const res = await fetch(`/api/buku?${params.toString()}`);
      const data = await res.json();
      
      setBooks(data.books || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Gagal memuat data buku");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (book: Buku) => {
    setDeletingBook(book);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;
    
    setDeleting(true);
    toast.loading("Menghapus buku...", { id: "delete" });
    
    try {
      const res = await fetch(`/api/buku/${deletingBook.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success(`✅ Buku "${deletingBook.title}" berhasil dihapus!`, { id: "delete" });
        setShowDeleteModal(false);
        setDeletingBook(null);
        fetchBooks();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menghapus", { id: "delete" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "delete" });
    } finally {
      setDeleting(false);
    }
  };

  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kelola Buku Digital</h1>
            <p className="text-xs text-gray-400 mt-1">Manajemen koleksi buku digital perpustakaan</p>
          </div>
          <Link
            href="/admin/buku/tambah"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Buku
          </Link>
        </div>
        
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-8 text-center">
          <div className="text-5xl mb-3">🏫</div>
          <h2 className="text-lg font-semibold text-yellow-700">Belum Memilih Sekolah</h2>
          <p className="text-sm text-yellow-600 mt-1">
            Silakan pilih sekolah terlebih dahulu dari dropdown di pojok kanan atas atau dari sidebar.
          </p>
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
            <Library className="w-6 h-6 text-blue-600" />
            Kelola Buku Digital
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manajemen koleksi buku digital perpustakaan
            {selectedSchoolName && (
              <span className="text-blue-600 ml-1">- {selectedSchoolName}</span>
            )}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <PrintButton 
            title="Daftar Buku Digital"
            data={books}
            columns={[
              { header: "Judul", accessor: "title" },
              { header: "Penulis", accessor: "author" },
              { header: "Tahun", accessor: "year" },
              { header: "Dilihat", accessor: "views" },
            ]}
          />
          <Link
            href="/admin/buku/tambah"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Buku
          </Link>
        </div>
      </div>

      {/* Search dan Page Size */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul, penulis, atau tahun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-gray-500">data</span>
            <span className="w-px h-6 bg-gray-200"></span>
            <span className="text-xs text-gray-400">
              Total: <span className="font-semibold text-gray-700">{totalItems}</span> buku
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Buku */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cover</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Penulis</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Dilihat</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && books.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Library className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada buku digital</p>
                      <Link
                        href="/admin/buku/tambah"
                        className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Tambah Buku
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition group">
                  <td className="px-5 py-3">
                    {book.coverUrl ? (
                      <div className="w-12 h-16 rounded-lg overflow-hidden shadow-sm bg-gray-100">
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 text-sm line-clamp-2">{book.title}</p>
                    {book.year && (
                      <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {book.year}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-300" />
                      {book.author}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {book.categories?.slice(0, 2).map((cat) => (
                        <span key={cat.category.id} className="px-2 py-0.5 bg-blue-50 text-[8px] text-blue-600 rounded-full">
                          {cat.category.name}
                        </span>
                      ))}
                      {book.categories && book.categories.length > 2 && (
                        <span className="text-[8px] text-gray-400">+{book.categories.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-700">{book.views}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/admin/buku/edit/${book.id}`}
                        className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition group-hover:scale-110"
                        title="Edit Buku"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(book)}
                        className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition group-hover:scale-110"
                        title="Hapus Buku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
              Menampilkan {books.length} dari {totalItems} buku
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

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Buku?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus buku <strong>"{deletingBook.title}"</strong>?
              </p>
              <p className="text-xs text-red-500 mt-2">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
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