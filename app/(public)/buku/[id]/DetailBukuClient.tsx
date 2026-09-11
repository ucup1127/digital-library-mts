// app/(public)/buku/[id]/DetailBukuClient.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  User, 
  Calendar, 
  Eye, 
  Download, 
  ArrowLeft,
  Sparkles,
  Tag,
  FileText,
  Globe,
  ChevronRight,
  Lock
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  year: string | null;
  views: number;
  category: { id: string; name: string } | null;
}

export default function DetailBukuClient({ book }: { book: Book }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const catatAktivitas = async () => {
    try {
      await fetch("/api/visitor-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "READ",
          bookId: book.id,
          bookTitle: book.title,
          userId: userId,
          userEmail: userEmail,
          schoolId: schoolId,
        }),
      });
    } catch (error) {
      console.error("Gagal catat aktivitas:", error);
    }
  };

  useEffect(() => {
    const authStatus = localStorage.getItem("isLoggedIn") === "true";
    const id = localStorage.getItem("user_id");
    const email = localStorage.getItem("user_email");
    const school = localStorage.getItem("school_id");
    
    setIsLoggedIn(authStatus);
    setUserId(id);
    setUserEmail(email);
    setSchoolId(school);
    setIsChecking(false);
    
    if (authStatus && book.id) {
      catatAktivitas();
    }
  }, [book.id]);

  const handleReadBook = () => {
    if (isLoggedIn && book.fileUrl) {
      setIsReading(true);
      
      const history = JSON.parse(localStorage.getItem('reading_history') || '[]');
      const newHistory = [
        { id: book.id, title: book.title, coverUrl: book.coverUrl, author: book.author },
        ...history.filter((item: any) => item.id !== book.id)
      ].slice(0, 10);
      localStorage.setItem('reading_history', JSON.stringify(newHistory));
      
      const recent = JSON.parse(localStorage.getItem('recently_read') || '[]');
      const newRecent = [
        { id: book.id, title: book.title, coverUrl: book.coverUrl },
        ...recent.filter((item: any) => item.id !== book.id)
      ].slice(0, 10);
      localStorage.setItem('recently_read', JSON.stringify(newRecent));
      
      setTimeout(() => {
        setIsReading(false);
        window.open(book.fileUrl!, '_blank');
      }, 500);
    } else if (!isLoggedIn) {
      localStorage.setItem('redirect_after_login', `/buku/${book.id}`);
      router.push(`/login/user?redirect=/buku/${book.id}`);
    }
  };

  const handleDownload = () => {
    if (book.fileUrl) {
      setIsDownloading(true);
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = book.fileUrl!;
        link.download = `${book.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
      }, 500);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-sm font-medium">Memuat buku...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden pt-16 pb-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        {book.coverUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center blur-[60px] opacity-30"
            style={{ backgroundImage: `url(${book.coverUrl})` }}
          />
        )}
        
        <div className="relative z-10 max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center gap-6">
          {/* Cover Buku */}
          <div className="w-36 sm:w-44 flex-shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            {book.coverUrl ? (
              <img 
                src={book.coverUrl} 
                alt={book.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800/50 text-white text-sm font-medium p-4 text-center">
                {book.title}
              </div>
            )}
          </div>

          {/* Info Buku */}
          <div className="flex-1 text-white text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 mb-3">
              <Tag className="w-3 h-3" />
              <span className="text-[10px] font-medium">{book.category?.name || "Koleksi"}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              {book.title}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              oleh {book.author || "Anonim"}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-blue-100 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {book.year || "Tahun tidak tersedia"}
              </span>
              <span className="w-px h-4 bg-white/20"></span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {book.views || 0} dilihat
              </span>
              <span className="w-px h-4 bg-white/20"></span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Bahasa Indonesia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-5 -mt-4 pb-8">
        
        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={handleReadBook}
                  disabled={isReading || !book.fileUrl}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {isReading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      Baca Sekarang
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading || !book.fileUrl}
                  className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Mendownload...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>
              </>
            ) : (
              <Link 
                href={`/login/user?redirect=/buku/${book.id}`}
                className="w-full py-3.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold text-sm hover:from-gray-900 hover:to-black transition-all duration-300 shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Login untuk Membaca
              </Link>
            )}
          </div>
          {!book.fileUrl && (
            <p className="text-center text-xs text-amber-600 mt-2">
              ⚠️ File buku belum tersedia. Hubungi admin perpustakaan.
            </p>
          )}
        </div>

        {/* Deskripsi & Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sinopsis */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-800 text-lg">Sinopsis</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {book.description || "Belum ada sinopsis untuk buku ini."}
            </p>
          </div>

          {/* Detail Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Detail Buku
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Judul</p>
                <p className="text-sm text-gray-800 font-medium">{book.title}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Penulis</p>
                <p className="text-sm text-gray-800">{book.author || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Kategori</p>
                <p className="text-sm text-gray-800">{book.category?.name || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tahun Terbit</p>
                <p className="text-sm text-gray-800">{book.year || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Dilihat</p>
                <p className="text-sm text-gray-800">{book.views || 0} kali</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Koleksi Buku
          </Link>
        </div>
      </div>
    </div>
  );
}