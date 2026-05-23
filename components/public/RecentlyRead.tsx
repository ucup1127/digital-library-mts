// components/public/RecentlyRead.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryBook {
  id: string;
  title: string;
  coverUrl: string;
  author: string;
}

export default function RecentlyRead() {
  const [history, setHistory] = useState<HistoryBook[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Cek status login
    const authStatus = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(authStatus);

    if (authStatus) {
      try {
        // Ambil data history dari localStorage
        const data = JSON.parse(localStorage.getItem('reading_history') || '[]');
        // Ambil maksimal 5 buku terakhir
        setHistory(data.slice(0, 5));
      } catch (e) {
        console.error("Gagal memuat history:", e);
        setHistory([]);
      }
    }
  }, []);

  // Jika tidak login atau history kosong, jangan tampilkan apa-apa
  if (!isLoggedIn || history.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto mb-8 px-4">
      {/* Header History - Lebih kecil dan hemat tempat */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase italic tracking-wider">
          History
        </span>
        <h2 className="text-[11px] font-black text-gray-900 italic uppercase tracking-tighter">
          Terakhir Kamu Baca
        </h2>
      </div>

      {/* Grid History - Ukuran kecil, 3-4 kolom di HP */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {history.map((book) => (
          <Link href={`/buku/${book.id}`} key={book.id} className="group">
            {/* Cover lebih kecil - aspect ratio 3:4 */}
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shadow-sm relative">
              {book.coverUrl ? (
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[7px] font-black uppercase text-gray-400 italic p-2 text-center">
                  {book.title}
                </div>
              )}
              {/* Badge kecil "lanjutkan" di pojok */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <span className="text-[7px] font-black text-white uppercase italic">Lanjut →</span>
              </div>
            </div>
            {/* Judul buku - lebih kecil */}
            <h3 className="text-[9px] font-bold mt-1.5 uppercase italic truncate text-gray-800 group-hover:text-blue-600 transition line-clamp-1">
              {book.title}
            </h3>
            {/* Author - opsional, bisa dihilangkan biar lebih hemat */}
            <p className="text-[7px] text-gray-400 uppercase tracking-wider truncate">
              {book.author?.split(' ')[0] || "Penulis"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}