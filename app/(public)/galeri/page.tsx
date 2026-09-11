// app/(public)/galeri/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Image, 
  X, 
  Calendar, 
  Tag, 
  Grid3x3,
  Sparkles,
  Library,
  FolderOpen,
  ChevronRight
} from "lucide-react";

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export default function GaleriPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("semua");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const categories = [
    { value: "semua", label: "Semua"},
    { value: "kegiatan", label: "Kegiatan"},
    { value: "koleksi", label: "Koleksi"},
    { value: "fasilitas", label: "Fasilitas"},
    { value: "acara", label: "Acara"},
  ];

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchGallery = async () => {
    const schoolId = localStorage.getItem("school_id");
    
    if (!schoolId) {
      setError("Data sekolah tidak ditemukan");
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/gallery?schoolId=${schoolId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      setError("Gagal memuat galeri");
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = selectedCategory === "semua" 
    ? images 
    : images.filter(img => img.category === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // 🔥 Hitung jumlah per kategori
  const getCategoryCount = (categoryValue: string) => {
    if (categoryValue === "semua") return images.length;
    return images.filter(img => img.category === categoryValue).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat galeri...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={fetchGallery} 
            className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-md"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================= */}
      {/* 🔥 HERO SECTION - PREMIUM */}
      {/* ============================================= */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden pt-16 pb-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 mb-4">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-[10px] font-medium text-white uppercase tracking-wider">Galeri</span>
          </div>
          
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10">
            <Image className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Galeri Perpustakaan
          </h1>
          <p className="text-blue-100 text-sm max-w-2xl mx-auto">
            Dokumentasi kegiatan dan koleksi perpustakaan
          </p>
          
          {/* Total foto */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <Grid3x3 className="w-3 h-3 text-white/70" />
            <span className="text-xs text-white/80">{images.length} foto</span>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 CONTENT */}
      {/* ============================================= */}
      <div className="max-w-6xl mx-auto px-5 -mt-4 pb-16 pt-10">
        
        {/* 🔥 Category Filter - Horizontal Scroll */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</span>
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
            <div className="flex gap-2 min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === cat.value
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedCategory === cat.value 
                      ? "bg-white/20 text-white" 
                      : "bg-gray-200 text-gray-400"
                  }`}>
                    {getCategoryCount(cat.value)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredImages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-gray-500 text-sm font-medium">Belum ada foto dalam galeri</p>
            <p className="text-gray-400 text-xs mt-1">Foto akan muncul setelah ditambahkan oleh admin</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                      <p className="text-white text-xs sm:text-sm font-medium line-clamp-2">{image.title}</p>
                      <p className="text-white/60 text-[9px] sm:text-[10px] mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(image.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <p className="text-white text-[8px] font-medium">
                      {categories.find(c => c.value === image.category)?.label || image.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Info jumlah foto */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="h-px flex-1 max-w-12 bg-gray-200"></div>
              <p className="text-gray-400 text-xs">
                Menampilkan {filteredImages.length} dari {images.length} foto
              </p>
              <div className="h-px flex-1 max-w-12 bg-gray-200"></div>
            </div>
          </>
        )}
      </div>

      {/* ============================================= */}
      {/* 🔥 MODAL PREVIEW - PREMIUM */}
      {/* ============================================= */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            ref={modalRef}
            className="relative max-w-[95vw] sm:max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Close */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition active:scale-95 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Gambar */}
            <div className="relative bg-gray-900">
              <img 
                src={selectedImage.imageUrl} 
                alt={selectedImage.title} 
                className="w-full h-auto max-h-[50vh] sm:max-h-[65vh] object-contain"
              />
            </div>
            
            {/* Info */}
            <div className="p-5 sm:p-6">
              <h3 className="font-bold text-gray-800 text-lg sm:text-xl">{selectedImage.title}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 mb-3">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(selectedImage.createdAt)}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 capitalize">
                  <Tag className="w-3.5 h-3.5" />
                  {categories.find(c => c.value === selectedImage.category)?.label || selectedImage.category}
                </span>
              </div>
              {selectedImage.description && (
                <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3 mt-2">
                  {selectedImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
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