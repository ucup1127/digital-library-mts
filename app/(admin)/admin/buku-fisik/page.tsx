// app/(admin)/admin/buku-fisik/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PrintButton from "@/components/ui/PrintButton";
import { 
  Library, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Barcode,
  BookOpen,
  User,
  Building,
  Calendar,
  Hash,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save,
  Sparkles,
  Layers
} from "lucide-react";

interface BukuFisik {
  id: string;
  judul: string;
  penulis: string;
  penerbit: string;
  tahun: string;
  isbn: string;
  lokasiRak: string;
  stok: number;
  stokTersedia: number;
  kondisi: string;
  barcode: string;
  deskripsi: string;
  schoolId: string;
  createdAt: string;
  kategori?: { name: string } | null;
  kategoriIds?: string[];
}

interface Kategori {
  id: string;
  name: string;
}

export default function BukuFisikPage() {
  const [books, setBooks] = useState<BukuFisik[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal Tambah Buku
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [formData, setFormData] = useState({
    judul: "",
    penulis: "",
    penerbit: "",
    tahun: "",
    isbn: "",
    lokasiRak: "",
    stok: 1,
    deskripsi: "",
    kategoriIds: [] as string[],
  });

  // Modal Edit Buku
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BukuFisik | null>(null);
  const [editForm, setEditForm] = useState({
    judul: "",
    penulis: "",
    penerbit: "",
    tahun: "",
    isbn: "",
    lokasiRak: "",
    stok: 1,
    deskripsi: "",
    kategoriIds: [] as string[],
  });
  const [editing, setEditing] = useState(false);

  // Modal Lihat Buku
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBook, setViewingBook] = useState<BukuFisik | null>(null);

  // Modal Hapus
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBook, setDeletingBook] = useState<BukuFisik | null>(null);
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
      fetchKategoris();
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
    
    if (!selectedSchoolId) {
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
      params.append("schoolId", selectedSchoolId);
      
      const res = await fetch(`/api/buku-fisik?${params.toString()}`);
      const data = await res.json();
      
      const booksWithCategories = await Promise.all(
        (data.books || []).map(async (book: any) => {
          try {
            const catRes = await fetch(`/api/buku-fisik/${book.id}/kategori`);
            const kategoriData = await catRes.json();
            return {
              ...book,
              kategoriIds: kategoriData.map((k: any) => k.kategoriId),
              kategori: kategoriData.length > 0 ? { name: kategoriData.map((k: any) => k.kategori?.name).join(", ") } : null
            };
          } catch {
            return { ...book, kategoriIds: [], kategori: null };
          }
        })
      );
      
      setBooks(booksWithCategories);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Gagal memuat data buku");
    } finally {
      setLoading(false);
    }
  };

  const fetchKategoris = async () => {
    try {
      const res = await fetch("/api/kategori");
      const data = await res.json();
      setKategoris(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching kategoris:", error);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.judul.trim()) {
      toast.error("Judul buku harus diisi!");
      return;
    }
    if (!formData.penulis.trim()) {
      toast.error("Penulis harus diisi!");
      return;
    }
    if (!selectedSchoolId) {
      toast.error("School ID tidak ditemukan!");
      return;
    }
    
    setSubmitting(true);
    toast.loading("Menyimpan buku...", { id: "save" });
    
    try {
      const res = await fetch("/api/buku-fisik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: formData.judul,
          penulis: formData.penulis,
          penerbit: formData.penerbit,
          tahun: formData.tahun,
          isbn: formData.isbn,
          lokasiRak: formData.lokasiRak,
          stok: formData.stok,
          deskripsi: formData.deskripsi,
          schoolId: selectedSchoolId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.id) {
        if (formData.kategoriIds.length > 0) {
          await fetch(`/api/buku-fisik/${data.id}/kategori`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kategoriIds: formData.kategoriIds }),
          });
        }
        
        toast.success("✅ Buku berhasil ditambahkan!", { id: "save" });
        setShowAddModal(false);
        resetForm();
        fetchBooks();
      } else {
        toast.error(data.error || "Gagal menambah buku", { id: "save" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "save" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewClick = (book: BukuFisik) => {
    setViewingBook(book);
    setShowViewModal(true);
  };

  const handleEditClick = async (book: BukuFisik) => {
    setEditingBook(book);
    
    try {
      const catRes = await fetch(`/api/buku-fisik/${book.id}/kategori`);
      const kategoriData = await catRes.json();
      const kategoriIds = kategoriData.map((k: any) => k.kategoriId);
      
      setEditForm({
        judul: book.judul || "",
        penulis: book.penulis || "",
        penerbit: book.penerbit || "",
        tahun: book.tahun || "",
        isbn: book.isbn || "",
        lokasiRak: book.lokasiRak || "",
        stok: book.stok || 1,
        deskripsi: book.deskripsi || "",
        kategoriIds: kategoriIds,
      });
      
      setShowEditModal(true);
    } catch (error) {
      setEditForm({
        judul: book.judul || "",
        penulis: book.penulis || "",
        penerbit: book.penerbit || "",
        tahun: book.tahun || "",
        isbn: book.isbn || "",
        lokasiRak: book.lokasiRak || "",
        stok: book.stok || 1,
        deskripsi: book.deskripsi || "",
        kategoriIds: [],
      });
      setShowEditModal(true);
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    
    setEditing(true);
    toast.loading("Menyimpan perubahan...", { id: "edit" });
    
    try {
      const res = await fetch(`/api/buku-fisik/${editingBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: editForm.judul,
          penulis: editForm.penulis,
          penerbit: editForm.penerbit,
          tahun: editForm.tahun,
          isbn: editForm.isbn,
          lokasiRak: editForm.lokasiRak,
          stok: editForm.stok,
          deskripsi: editForm.deskripsi,
        }),
      });
      
      if (res.ok) {
        await fetch(`/api/buku-fisik/${editingBook.id}/kategori`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kategoriIds: editForm.kategoriIds }),
        });
        
        toast.success("✅ Buku berhasil diperbarui!", { id: "edit" });
        setShowEditModal(false);
        setEditingBook(null);
        fetchBooks();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal memperbarui", { id: "edit" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "edit" });
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteClick = (book: BukuFisik) => {
    setDeletingBook(book);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;
    
    setDeleting(true);
    toast.loading("Menghapus buku...", { id: "delete" });
    
    try {
      const res = await fetch(`/api/buku-fisik/${deletingBook.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success(`✅ Buku "${deletingBook.judul}" berhasil dihapus!`, { id: "delete" });
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

  const resetForm = () => {
    setFormData({
      judul: "",
      penulis: "",
      penerbit: "",
      tahun: "",
      isbn: "",
      lokasiRak: "",
      stok: 1,
      deskripsi: "",
      kategoriIds: [],
    });
  };

  const handleKategoriChange = (kategoriId: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        kategoriIds: prev.kategoriIds.includes(kategoriId)
          ? prev.kategoriIds.filter(id => id !== kategoriId)
          : [...prev.kategoriIds, kategoriId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        kategoriIds: prev.kategoriIds.includes(kategoriId)
          ? prev.kategoriIds.filter(id => id !== kategoriId)
          : [...prev.kategoriIds, kategoriId]
      }));
    }
  };

  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kelola Buku Fisik</h1>
            <p className="text-xs text-gray-400 mt-1">Manajemen koleksi buku fisik perpustakaan</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Library className="w-6 h-6 text-indigo-600" />
            Kelola Buku Fisik
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manajemen koleksi buku fisik perpustakaan
            {selectedSchoolName && (
              <span className="text-indigo-600 ml-1">- {selectedSchoolName}</span>
            )}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <PrintButton 
            title="Daftar Buku Fisik"
            data={books}
            columns={[
              { header: "Barcode", accessor: "barcode" },
              { header: "Judul", accessor: "judul" },
              { header: "Penulis", accessor: "penulis" },
              { header: "Stok", accessor: "stok" },
              { header: "Tersedia", accessor: "stokTersedia" },
            ]}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Buku
          </button>
        </div>
      </div>

      {/* Search dan Page Size */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul, penulis, atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
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

      {/* Tabel Buku Fisik */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Barcode</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Penulis</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Stok</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tersedia</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && books.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Library className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada buku fisik</p>
                      <button onClick={() => setShowAddModal(true)} className="text-indigo-600 text-xs font-medium hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Tambah Buku
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-gray-400" />
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{book.barcode}</code>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 text-sm line-clamp-2">{book.judul}</p>
                    {book.tahun && (
                      <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {book.tahun}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-300" />
                      {book.penulis}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-700">{book.stok}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${book.stokTersedia > 0 ? "text-green-600" : "text-red-600"}`}>
                      {book.stokTersedia > 0 ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {book.stokTersedia}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleViewClick(book)}
                        className="p-1.5 text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 transition group-hover:scale-110"
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(book)}
                        className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition group-hover:scale-110"
                        title="Edit Buku"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
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
              Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} buku
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

      {/* ========== MODAL TAMBAH BUKU ========== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Tambah Buku Fisik
              </h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddBook} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Judul Buku <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Penulis <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.penulis} onChange={(e) => setFormData({ ...formData, penulis: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Penerbit</label>
                  <input type="text" value={formData.penerbit} onChange={(e) => setFormData({ ...formData, penerbit: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tahun Terbit</label>
                  <input type="text" placeholder="2024" value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">ISBN</label>
                  <input type="text" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lokasi Rak</label>
                  <input type="text" placeholder="Rak A1" value={formData.lokasiRak} onChange={(e) => setFormData({ ...formData, lokasiRak: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stok Awal</label>
                  <input type="number" min="1" value={formData.stok} onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Kategori (bisa pilih lebih dari satu)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                  {kategoris.map((kat) => (
                    <label key={kat.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition">
                      <input type="checkbox" checked={formData.kategoriIds.includes(kat.id)} onChange={() => handleKategoriChange(kat.id, false)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                      {kat.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea rows={3} value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50">
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Buku
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL LIHAT BUKU ========== */}
      {showViewModal && viewingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-600" />
                Detail Buku Fisik
              </h2>
              <button onClick={() => { setShowViewModal(false); setViewingBook(null); }} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Barcode</label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded-lg mt-1">{viewingBook.barcode}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Lokasi Rak</label>
                  <p className="text-sm text-gray-800 mt-1 font-medium">{viewingBook.lokasiRak || "-"}</p>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Judul Buku</label>
                <p className="text-base font-bold text-gray-800 mt-1">{viewingBook.judul}</p>
              </div>
              
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Penulis</label>
                <p className="text-sm text-gray-800 mt-1">{viewingBook.penulis}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Penerbit</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingBook.penerbit || "-"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tahun Terbit</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingBook.tahun || "-"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ISBN</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingBook.isbn || "-"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kategori</label>
                  <p className="text-sm text-gray-800 mt-1">{viewingBook.kategori?.name || "-"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Stok</label>
                  <p className="text-sm font-semibold text-gray-800">{viewingBook.stok}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tersedia</label>
                  <p className={`text-sm font-semibold ${viewingBook.stokTersedia > 0 ? "text-green-600" : "text-red-600"}`}>{viewingBook.stokTersedia}</p>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</label>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{viewingBook.deskripsi || "-"}</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowViewModal(false); setViewingBook(null); }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Tutup</button>
                <button onClick={() => { setShowViewModal(false); handleEditClick(viewingBook); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">Edit Buku</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL EDIT BUKU ========== */}
      {showEditModal && editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Buku Fisik
              </h2>
              <button onClick={() => { setShowEditModal(false); setEditingBook(null); }} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditBook} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Judul Buku <span className="text-red-500">*</span></label><input type="text" value={editForm.judul} onChange={(e) => setEditForm({ ...editForm, judul: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" required /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Penulis <span className="text-red-500">*</span></label><input type="text" value={editForm.penulis} onChange={(e) => setEditForm({ ...editForm, penulis: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" required /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Penerbit</label><input type="text" value={editForm.penerbit} onChange={(e) => setEditForm({ ...editForm, penerbit: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Tahun Terbit</label><input type="text" placeholder="2024" value={editForm.tahun} onChange={(e) => setEditForm({ ...editForm, tahun: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">ISBN</label><input type="text" value={editForm.isbn} onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Lokasi Rak</label><input type="text" placeholder="Rak A1" value={editForm.lokasiRak} onChange={(e) => setEditForm({ ...editForm, lokasiRak: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Stok</label><input type="number" min="1" value={editForm.stok} onChange={(e) => setEditForm({ ...editForm, stok: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" /></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Kategori (bisa pilih lebih dari satu)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                  {kategoris.map((kat) => (
                    <label key={kat.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition">
                      <input type="checkbox" checked={editForm.kategoriIds.includes(kat.id)} onChange={() => handleKategoriChange(kat.id, true)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                      {kat.name}
                    </label>
                  ))}
                </div>
              </div>

              <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Deskripsi</label><textarea rows={3} value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none" /></div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingBook(null); }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</button>
                <button type="submit" disabled={editing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50">
                  {editing ? (
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

      {/* ========== MODAL HAPUS ========== */}
      {showDeleteModal && deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Buku?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus buku <strong>"{deletingBook.judul}"</strong>?
              </p>
              <p className="text-xs text-red-500 mt-2">⚠️ Tindakan ini tidak dapat dibatalkan!</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Batal</button>
                <button onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
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