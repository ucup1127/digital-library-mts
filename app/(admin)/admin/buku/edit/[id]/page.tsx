// app/(admin)/admin/buku/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { 
  ArrowLeft, 
  Save, 
  X, 
  BookOpen,
  FileText,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  Globe,
  Lock,
  Trash2
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  year: string | null;
  description: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  isShared: boolean;
  categories: { categoryId: string }[];
}

export default function EditBukuPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [bookId, setBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 🔥 Book object untuk akses coverUrl/fileUrl existing
  const [book, setBook] = useState<Book | null>(null);
  
  // 🔥 State untuk file baru
  const [newCover, setNewCover] = useState<File | null>(null);
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [removePdf, setRemovePdf] = useState(false);
  
  // 🔥 Progress bar state
  const [pdfProgress, setPdfProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<"idle" | "cover" | "pdf" | "saving">("idle");
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    year: "",
    description: "",
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isShared, setIsShared] = useState(true);
  
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setBookId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!bookId) return;
    
    const fetchData = async () => {
      try {
        const [bookRes, catRes] = await Promise.all([
          fetch(`/api/buku/${bookId}`),
          fetch("/api/kategori"),
        ]);
        
        const bookData = await bookRes.json();
        const categoriesData = await catRes.json();
        
        setBook(bookData);
        setCategories(categoriesData);
        setFormData({
          title: bookData.title || "",
          author: bookData.author || "",
          year: bookData.year || "",
          description: bookData.description || "",
        });
        setSelectedCategories(bookData.categories?.map((c: any) => c.categoryId) || []);
        setIsShared(bookData.isShared ?? true);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bookId]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // 🔥 Handler upload cover
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCover(file);
      setRemoveCover(false); // batal hapus
      const reader = new FileReader();
      reader.onloadend = () => setNewCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 🔥 Handler upload PDF
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPdf(file);
      setRemovePdf(false); // batal hapus
    }
  };

  // 🔥 Upload cover via server (dengan sharp optimization)
  const uploadFileServer = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (res.ok) return data.url;
    throw new Error(data.error || `Gagal upload ${type}`);
  };

  // 🔥 Upload PDF via Blob client (dengan progress)
  const uploadFileClient = async (
    file: File,
    folder: string,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    const ext = file.name.split(".").pop() || "bin";
    const pathname = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/upload/client",
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );
        onProgress?.(percent);
      },
    });

    return blob.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Judul buku harus diisi!");
      return;
    }
    if (!formData.author.trim()) {
      toast.error("Penulis harus diisi!");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Pilih minimal 1 kategori!");
      return;
    }
    
    if (!bookId) {
      toast.error("ID buku tidak ditemukan!");
      return;
    }
    
    setSaving(true);
    setPdfProgress(0);
    toast.loading("Menyimpan perubahan...", { id: "save" });
    
    try {
      let finalCoverUrl: string | null | undefined = undefined; // undefined = tidak berubah
      let finalFileUrl: string | null | undefined = undefined;

      // 🔥 Handle cover
      if (newCover) {
        setUploadStage("cover");
        toast.loading("Mengupload cover baru...", { id: "save" });
        finalCoverUrl = await uploadFileServer(newCover, "cover");
      } else if (removeCover) {
        finalCoverUrl = null; // hapus cover
      }

      // 🔥 Handle PDF
      if (newPdf) {
        setUploadStage("pdf");
        toast.loading("Mengupload PDF baru...", { id: "save" });
        finalFileUrl = await uploadFileClient(newPdf, "books", (percent) => {
          setPdfProgress(percent);
        });
      } else if (removePdf) {
        finalFileUrl = null; // hapus PDF
      }

      // 🔥 Save ke API
      setUploadStage("saving");
      toast.loading("Menyimpan data...", { id: "save" });
      
      const res = await fetch(`/api/buku/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          year: formData.year || null,
          description: formData.description || null,
          categories: selectedCategories,
          isShared: isShared,
          ...(finalCoverUrl !== undefined ? { coverUrl: finalCoverUrl } : {}),
          ...(finalFileUrl !== undefined ? { fileUrl: finalFileUrl } : {}),
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await logAdminActivity({
          action: "UPDATE",
          targetType: "BOOK",
          targetId: bookId,
          targetName: formData.title,
          changes: { 
            new: formData,
            coverChanged: finalCoverUrl !== undefined,
            fileChanged: finalFileUrl !== undefined,
          },
        });
        toast.success("Buku berhasil diperbarui!", { id: "save" });
        router.push("/admin/buku");
      } else {
        throw new Error(data.error || "Gagal memperbarui buku");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan", { id: "save" });
    } finally {
      setSaving(false);
      setUploadStage("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat data buku...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/buku" className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-4 transition">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Kelola Buku
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Edit Buku
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Perbarui informasi katalog digital</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grid 2 kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Judul Buku <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Penulis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tahun
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-gray-400"
                placeholder="2024"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Deskripsi / Sinopsis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none placeholder:text-gray-400"
                placeholder="Tulis sinopsis atau deskripsi buku di sini..."
              />
            </div>
          </div>

          {/* 🔥 FILE SECTION (BARU) */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              File Buku
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* COVER */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Cover Buku
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition">
                  {newCoverPreview ? (
                    // Preview cover BARU
                    <div className="space-y-3">
                      <Image
                        src={newCoverPreview}
                        alt="Cover baru"
                        width={128}
                        height={160}
                        className="w-32 h-40 object-cover rounded-lg mx-auto shadow-sm"
                        unoptimized
                      />
                      <p className="text-[9px] text-green-600 font-medium">✅ Cover baru siap diupload</p>
                      <button
                        type="button"
                        onClick={() => { setNewCover(null); setNewCoverPreview(null); }}
                        className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 mx-auto"
                      >
                        <X className="w-3 h-3" /> Batalkan
                      </button>
                    </div>
                  ) : book?.coverUrl && !removeCover ? (
                    // Preview cover EXISTING
                    <div className="space-y-3">
                      <Image
                        src={book.coverUrl}
                        alt="Cover existing"
                        width={128}
                        height={160}
                        className="w-32 h-40 object-cover rounded-lg mx-auto shadow-sm"
                        unoptimized
                      />
                      <div className="flex gap-2 justify-center">
                        <label className="cursor-pointer text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Ganti
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={handleCoverChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setRemoveCover(true)}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Tidak ada cover / sudah dihapus
                    <div className="space-y-3">
                      <div className="text-4xl">🖼️</div>
                      <p className="text-xs text-gray-400">
                        {removeCover ? "Cover akan dihapus" : "Belum ada cover"}
                      </p>
                      <label className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200 transition">
                        <ImageIcon className="w-3 h-3 inline mr-1" />
                        Pilih Cover
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          onChange={handleCoverChange}
                          className="hidden"
                        />
                      </label>
                      {removeCover && (
                        <button
                          type="button"
                          onClick={() => setRemoveCover(false)}
                          className="text-xs text-blue-500 hover:text-blue-600 block mx-auto"
                        >
                          Batal hapus
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Format: JPG, PNG, WebP | Maks 4MB</p>
              </div>

              {/* PDF */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  File PDF
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition">
                  {newPdf ? (
                    // PDF baru
                    <div className="space-y-2">
                      <div className="text-4xl">📄</div>
                      <p className="text-xs font-medium text-gray-700 break-all">{newPdf.name}</p>
                      <p className="text-[9px] text-gray-400">{(newPdf.size / 1024 / 1024).toFixed(2)} MB</p>
                      
                      {uploadStage === "pdf" && (
                        <div className="mt-3 space-y-1">
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 ease-out"
                              style={{ width: `${pdfProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-gray-400">
                              {pdfProgress < 100 ? "Mengupload..." : "Memproses..."}
                            </span>
                            <span className="font-semibold text-blue-600">{pdfProgress}%</span>
                          </div>
                        </div>
                      )}
                      
                      {uploadStage !== "pdf" && (
                        <button
                          type="button"
                          onClick={() => setNewPdf(null)}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 mx-auto"
                        >
                          <X className="w-3 h-3" /> Batalkan
                        </button>
                      )}
                    </div>
                  ) : book?.fileUrl && !removePdf ? (
                    // PDF existing
                    <div className="space-y-3">
                      <div className="text-4xl">📄</div>
                      <p className="text-xs font-medium text-gray-700 break-all">
                        {book.fileUrl.split("/").pop()}
                      </p>
                      <p className="text-[9px] text-green-600">✅ PDF aktif</p>
                      <div className="flex gap-2 justify-center">
                        <label className="cursor-pointer text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Ganti PDF
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handlePdfChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setRemovePdf(true)}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Tidak ada PDF
                    <div className="space-y-3">
                      <div className="text-4xl">📑</div>
                      <p className="text-xs text-gray-400">
                        {removePdf ? "PDF akan dihapus" : "Belum ada PDF"}
                      </p>
                      <label className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200 transition">
                        <FileText className="w-3 h-3 inline mr-1" />
                        Pilih PDF
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfChange}
                          className="hidden"
                        />
                      </label>
                      {removePdf && (
                        <button
                          type="button"
                          onClick={() => setRemovePdf(false)}
                          className="text-xs text-blue-500 hover:text-blue-600 block mx-auto"
                        >
                          Batal hapus
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Format: PDF | Maks 50MB</p>
              </div>
            </div>
          </div>

          {/* Kategori Section */}
          <div className="border-t border-gray-100 pt-6">
            <label className="block text-xs font-semibold text-gray-700 mb-3">
              Kategori <span className="text-red-500">*</span>
              <span className="text-[9px] text-gray-400 ml-2">(Bisa pilih lebih dari satu)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedCategories.includes(category.id)
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-2">
              Terpilih <span className="font-semibold text-gray-600">{selectedCategories.length}</span> kategori
            </p>
          </div>

          {/* Shared Section */}
          <div className="border-t border-gray-100 pt-6">
            <label className="block text-xs font-semibold text-gray-700 mb-3">
              Akses Buku
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  isShared
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="isShared"
                  checked={isShared === true}
                  onChange={() => setIsShared(true)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800">
                      Bagikan ke Semua Sekolah
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Siswa dari semua sekolah bisa membaca buku ini.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  !isShared
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-gray-200 hover:border-amber-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="isShared"
                  checked={isShared === false}
                  onChange={() => setIsShared(false)}
                  className="mt-0.5 w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-gray-800">
                      Eksklusif Sekolah Ini
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Cuma siswa sekolah ini yang bisa akses.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 pt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {uploadStage === "cover" && "Upload cover..."}
                  {uploadStage === "pdf" && `Upload PDF ${pdfProgress}%`}
                  {uploadStage === "saving" && "Menyimpan..."}
                  {uploadStage === "idle" && "Menyimpan..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
            <Link
              href="/admin/buku"
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition text-center"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}