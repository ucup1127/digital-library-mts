"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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

  // 🔥 FUNGSI UNTUK MENCATAT AKTIVITAS
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
      console.log("✅ Aktivitas tercatat:", book.title);
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
    
    // 🔥 CATAT AKTIVITAS saat halaman dibuka (hanya jika login)
    if (authStatus && book.id) {
      catatAktivitas();
    }
  }, [book.id]);

  const handleReadBook = () => {
    if (isLoggedIn && book.fileUrl) {
      // Simpan ke reading history
      const history = JSON.parse(localStorage.getItem('reading_history') || '[]');
      const newHistory = [
        { id: book.id, title: book.title, coverUrl: book.coverUrl, author: book.author },
        ...history.filter((item: any) => item.id !== book.id)
      ].slice(0, 10);
      localStorage.setItem('reading_history', JSON.stringify(newHistory));
      
      // Buka PDF
      window.open(book.fileUrl, '_blank');
    } else if (!isLoggedIn) {
      localStorage.setItem('redirect_after_login', `/buku/${book.id}`);
      router.push(`/login/user?redirect=/buku/${book.id}`);
    }
  };

  const handleDownload = () => {
    if (book.fileUrl) {
      const link = document.createElement('a');
      link.href = book.fileUrl;
      link.download = `${book.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-[10px] text-gray-400">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-20">
      {/* HERO SECTION */}
      <div className="relative w-full pt-24 pb-8 px-6 flex items-center gap-6 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-150 blur-[80px] opacity-10"
          style={{ backgroundImage: book.coverUrl ? `url(${book.coverUrl})` : 'none' }}
        ></div>
        
        <div className="relative z-10 w-[100px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white flex-shrink-0 bg-gray-50">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-300 uppercase italic p-2 text-center bg-gray-100">
              {book.title}
            </div>
          )}
        </div>

        <div className="relative z-10 flex flex-col justify-center overflow-hidden pr-4 flex-1">
          <span className="text-[8px] bg-blue-600 text-white px-3 py-1 rounded-full font-black uppercase italic tracking-widest w-fit mb-2 shadow-lg shadow-blue-100">
            {book.category?.name || "Koleksi"}
          </span>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-gray-900 leading-tight line-clamp-2">
            {book.title}
          </h1>
          <p className="text-[9px] font-bold text-gray-400 mt-2 italic uppercase tracking-widest truncate">
            Karya: {book.author || "Anonim"}
          </p>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-15px_30px_rgba(0,0,0,0.03)] px-8 pt-8 flex flex-col justify-between pb-8">
        
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-50 pb-6">
            <div className="text-center flex-1">
              <p className="text-[8px] font-black text-gray-300 uppercase italic mb-1 tracking-widest">Tahun</p>
              <p className="text-[11px] font-black text-gray-900 italic uppercase">{book.year || "-"}</p>
            </div>
            <div className="text-center flex-1 border-x border-gray-50">
              <p className="text-[8px] font-black text-gray-300 uppercase italic mb-1 tracking-widest">Dilihat</p>
              <p className="text-[11px] font-black text-gray-900 italic uppercase">{book.views || 0} x</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-[8px] font-black text-gray-300 uppercase italic mb-1 tracking-widest">Bahasa</p>
              <p className="text-[11px] font-black text-gray-900 italic uppercase">IDN</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-[10px] font-black italic uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
              Sinopsis
            </h2>
            <p className="text-[11px] leading-[1.6] text-gray-500 font-medium italic">
              {book.description || "Admin belum menginput deskripsi untuk buku ini."}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3 pt-4">
          {isLoggedIn ? (
            <div className="flex gap-3">
              <button 
                onClick={handleReadBook}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-xl shadow-blue-100 flex items-center justify-center active:scale-95 transition-all"
              >
                Baca Sekarang →
              </button>
              <button 
                onClick={handleDownload}
                className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-black uppercase italic text-[10px] tracking-widest flex items-center justify-center active:scale-95 transition-all text-center"
              >
                DOWNLOAD PDF
              </button>
            </div>
          ) : (
            <Link 
              href={`/login/user?redirect=/buku/${book.id}`}
              className="w-full block py-4 bg-gray-900 text-white rounded-xl font-black uppercase italic text-[10px] tracking-[0.2em] text-center shadow-xl active:scale-95 transition-all"
            >
              Login Untuk Membaca
            </Link>
          )}

          <Link 
            href="/"
            className="w-full py-3 text-[9px] font-black text-gray-300 uppercase italic tracking-[0.3em] hover:text-blue-600 transition-all active:opacity-50 block text-center"
          >
            ← Kembali ke Beranda
          </Link>
        </div>

      </div>
    </div>
  );
}