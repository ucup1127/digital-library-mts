// app/(public)/pinjam/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  isAvailable: boolean;
}

export default function PinjamBukuPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [activeLoans, setActiveLoans] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userIdStorage = localStorage.getItem("user_id");
    
    if (!isLoggedIn || !userIdStorage) {
      router.push("/login/user?redirect=/pinjam");
      return;
    }
    
    setUserId(userIdStorage);
    fetchActiveLoans(userIdStorage);
    fetchBooks();
  }, []);

  const fetchActiveLoans = async (userId: string) => {
    try {
      const res = await fetch(`/api/peminjaman?userId=${userId}`);
      const data = await res.json();
      
      // ✅ Validasi: pastikan data adalah array
      const loans = Array.isArray(data) ? data : [];
      const active = loans.filter((p: any) => p.status === "DIPINJAM").length;
      setActiveLoans(active);
    } catch (error) {
      console.error("Error fetching loans:", error);
      setActiveLoans(0);
    }
  };

  const fetchBooks = async () => {
    try {
      const schoolId = localStorage.getItem("school_id");
      const res = await fetch(`/api/buku?schoolId=${schoolId}&limit=100`);
      const data = await res.json();
      
      const booksData = data.books || [];
      
      // Cek ketersediaan buku
      const booksWithStatus = await Promise.all(
        booksData.map(async (book: any) => {
          try {
            const loanRes = await fetch(`/api/peminjaman?bookId=${book.id}&status=DIPINJAM`);
            const loanData = await loanRes.json();
            const isAvailable = Array.isArray(loanData) ? loanData.length === 0 : true;
            return {
              ...book,
              isAvailable
            };
          } catch {
            return { ...book, isAvailable: true };
          }
        })
      );
      
      setBooks(booksWithStatus);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Gagal memuat daftar buku");
    } finally {
      setLoading(false);
    }
  };

  const handlePinjam = async (bookId: string, title: string) => {
    if (activeLoans >= 2) {
      toast.error("Maksimal pinjam 2 buku!");
      return;
    }
    
    toast.loading("Memproses pinjaman...", { id: "pinjam" });
    
    try {
      const res = await fetch("/api/peminjaman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bookId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`✅ Berhasil meminjam "${title}"!`, { id: "pinjam" });
        fetchActiveLoans(userId);
        fetchBooks();
      } else {
        toast.error(data.error || "Gagal meminjam buku", { id: "pinjam" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "pinjam" });
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pinjam Buku Fisik</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pilih buku yang ingin dipinjam (maksimal 2 buku, durasi 2 hari)
          </p>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg inline-block">
            <p className="text-sm text-blue-700">
              📚 Sisa kuota pinjaman: {2 - activeLoans} dari 2 buku
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari judul atau penulis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Daftar Buku */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-400">Tidak ada buku yang tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                {/* Cover */}
                <div className="aspect-[2/3] bg-gray-100">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      📖
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-800 line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{book.author}</p>
                  
                  {/* Status dan Tombol */}
                  {activeLoans >= 2 ? (
                    <button
                      disabled
                      className="w-full mt-2 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                    >
                      Kuota Habis
                    </button>
                  ) : !book.isAvailable ? (
                    <button
                      disabled
                      className="w-full mt-2 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg cursor-not-allowed"
                    >
                      Dipinjam
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePinjam(book.id, book.title)}
                      className="w-full mt-2 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                    >
                      Pinjam
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link ke Riwayat Peminjaman */}
        <div className="mt-8 text-center">
          <Link
            href="/riwayat-pinjam"
            className="text-sm text-blue-500 hover:underline"
          >
            Lihat Riwayat Peminjaman →
          </Link>
        </div>
      </div>
    </div>
  );
}