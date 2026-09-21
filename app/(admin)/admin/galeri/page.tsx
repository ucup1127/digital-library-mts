// app/(admin)/admin/galeri/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ImageUploader from "@/components/admin/ImageUploader";
import Image from "next/image";
import { 
  Images, 
  Plus, 
  Trash2, 
  Edit, 
  X,
  Save,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3,
  Eye,
  Sparkles
} from "lucide-react";

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export default function KelolaGaleriPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [userRole, setUserRole] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const pageSizeOptions = [10, 20, 50, 100];
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "kegiatan",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "kegiatan",
  });
  const [editing, setEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categories = [
    { value: "kegiatan", label: "Kegiatan", icon: "🎉" },
    { value: "koleksi", label: "Koleksi", icon: "📚" },
    { value: "fasilitas", label: "Fasilitas", icon: "🏛️" },
    { value: "acara", label: "Acara", icon: "🎪" },
  ];

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
    if (selectedSchoolId) {
      fetchGallery();
    }
  }, [selectedSchoolId, currentPage, pageSize, search]);

  const fetchGallery = async () => {
    if (!selectedSchoolId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("schoolId", selectedSchoolId);
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());
      if (search) params.append("search", search);
      
      const res = await fetch(`/api/gallery?${params.toString()}`);
      const data = await res.json();
      
      setImages(Array.isArray(data.images) ? data.images : []);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      toast.error("Gagal memuat galeri");
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Judul gambar harus diisi!");
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error("Gambar harus diupload!");
      return;
    }
    if (!selectedSchoolId) {
      toast.error("School ID tidak ditemukan!");
      return;
    }
    
    setSubmitting(true);
    toast.loading("Menyimpan gambar...", { id: "save" });
    
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          category: formData.category,
          schoolId: selectedSchoolId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("✅ Gambar berhasil ditambahkan!", { id: "save" });
        setShowAddModal(false);
        setFormData({ title: "", description: "", imageUrl: "", category: "kegiatan" });
        fetchGallery();
      } else {
        toast.error(data.error || "Gagal menambah gambar", { id: "save" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "save" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (image: GalleryImage) => {
    setEditingImage(image);
    setEditForm({
      title: image.title,
      description: image.description || "",
      category: image.category,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;
    
    setEditing(true);
    toast.loading("Menyimpan perubahan...", { id: "edit" });
    
    try {
      const res = await fetch(`/api/gallery/${editingImage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
        }),
      });
      
      if (res.ok) {
        toast.success("✅ Gambar berhasil diperbarui!", { id: "edit" });
        setShowEditModal(false);
        setEditingImage(null);
        fetchGallery();
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

  const handleDelete = async () => {
    if (!selectedImage) return;
    
    setDeleting(true);
    toast.loading("Menghapus gambar...", { id: "delete" });
    
    try {
      const res = await fetch(`/api/gallery/${selectedImage.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success("✅ Gambar berhasil dihapus!", { id: "delete" });
        setShowDeleteModal(false);
        setSelectedImage(null);
        fetchGallery();
      } else {
        toast.error("Gagal menghapus gambar", { id: "delete" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "delete" });
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadComplete = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? `${cat.icon} ${cat.label}` : category;
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Images className="w-6 h-6 text-pink-600" />
              Kelola Galeri
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Kelola foto dokumentasi perpustakaan</p>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat galeri...</p>
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
            <Images className="w-6 h-6 text-pink-600" />
            Kelola Galeri
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Kelola foto dokumentasi perpustakaan
            {selectedSchoolName && (
              <span className="text-pink-600 ml-1">- {selectedSchoolName}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg text-sm font-semibold hover:from-pink-700 hover:to-rose-700 transition flex items-center gap-2 shadow-lg shadow-pink-200"
        >
          <Plus className="w-4 h-4" />
          Tambah Foto
        </button>
      </div>

      {/* Statistik Kategori */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.value} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition hover:-translate-y-0.5">
            <div className="text-3xl mb-1">{cat.icon}</div>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{cat.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">
              {images.filter(img => img.category === cat.value).length}
            </p>
          </div>
        ))}
      </div>

      {/* Search & View Mode & Page Size */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari foto berdasarkan judul..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "table"
                    ? "bg-pink-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "grid"
                    ? "bg-pink-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tampilkan</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none bg-white"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">data</span>
            </div>
            
            <span className="text-xs text-gray-400">
              Total: <span className="font-semibold text-gray-700">{totalItems}</span> foto
            </span>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 TABEL VIEW (DEFAULT) */}
      {/* ============================================= */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Foto</th>
                  <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                  <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {images.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Images className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-400 text-sm">Belum ada foto dalam galeri</p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="text-pink-600 text-xs font-medium hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Tambah Foto
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  images.map((image, index) => (
                    <tr key={image.id} className="hover:bg-gray-50 transition group">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-400">
                          {(currentPage - 1) * pageSize + index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                          <Image
                            src={image.imageUrl}
                            alt={image.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{image.title}</p>
                        {image.description && (
                          <p className="text-[9px] text-gray-400 truncate max-w-[200px]">{image.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                          {getCategoryLabel(image.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(image.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(image)}
                            className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition group-hover:scale-110"
                            title="Edit Foto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedImage(image);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition group-hover:scale-110"
                            title="Hapus Foto"
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
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs text-gray-500">
                Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} foto
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
      )}

      {/* ============================================= */}
      {/* 🔥 GRID VIEW (OPSIONAL) */}
      {/* ============================================= */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-gray-500 text-sm font-medium">Belum ada foto dalam galeri</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl text-xs font-medium hover:from-pink-700 hover:to-rose-700 transition shadow-lg shadow-pink-200 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Foto Pertama
              </button>
            </div>
          ) : (
            images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                    <div>
                      <p className="text-white text-xs font-medium line-clamp-1">{image.title}</p>
                      <p className="text-white/60 text-[9px]">{getCategoryLabel(image.category)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditClick(image)}
                        className="p-1.5 bg-blue-500/90 backdrop-blur-sm rounded-lg text-white hover:bg-blue-600 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedImage(image);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-white hover:bg-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <span className="text-white text-[8px] font-medium">{getCategoryLabel(image.category)}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-gray-800 truncate">{image.title}</p>
                  <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(image.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ============================================= */}
      {/* 🔥 MODAL TAMBAH FOTO */}
      {/* ============================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-pink-600" />
                Tambah Foto
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddImage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Judul Foto</label>
                <input
                  type="text"
                  placeholder="Contoh: Kegiatan Literasi 2024"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deskripsi (Opsional)</label>
                <textarea
                  placeholder="Deskripsi singkat tentang foto..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Upload Foto</label>
                <ImageUploader onUploadComplete={handleUploadComplete} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.imageUrl}
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl text-sm font-medium hover:from-pink-700 hover:to-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                >
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

      {/* ============================================= */}
      {/* 🔥 MODAL EDIT FOTO */}
      {/* ============================================= */}
      {showEditModal && editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Foto
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="mb-3">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 mx-auto">
                  <Image
                  src={editingImage.imageUrl}
                  alt={editingImage.title}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
                </div>
                <p className="text-[9px] text-gray-400 text-center mt-1">Preview foto saat ini</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Judul Foto</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
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

      {/* ============================================= */}
      {/* 🔥 MODAL HAPUS */}
      {/* ============================================= */}
      {showDeleteModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hapus Foto?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin menghapus foto <strong>"{selectedImage.title}"</strong>?
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
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:opacity-50"
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