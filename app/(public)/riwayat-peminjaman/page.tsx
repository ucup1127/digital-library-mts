// app/(public)/riwayat-pinjam/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Peminjaman {
  id: string;
  tglPinjam: string;
  tglKembali: string;
  tglDikembalikan: string | null;
  status: string;
  denda: number;
  sisaHari: number;
  isTerlambat: boolean;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
  };
}

export default function RiwayatPinjamPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userIdStorage = localStorage.getItem("user_id");
    
    if (!isLoggedIn || !userIdStorage) {
      router.push("/login/user?redirect=/riwayat-pinjam");
      return;
    }
    
    setUserId(userIdStorage);
    fetchLoans(userIdStorage);
  }, []);

  const fetchLoans = async (userId: string) => {
    try {
      const res = await fetch(`/api/peminjaman?userId=${userId}`);
      const data = await res.json();
      setLoans(data);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Gagal memuat riwayat peminjaman");
    } finally {
      setLoading(false);
    }
  };

  const handleKembalikan = async (id: string, title: string) => {
    toast.loading("Memproses pengembalian...", { id: "kembali" });
    
    try {
      const res = await fetch("/api/peminjaman", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (res.ok) {
        toast.success(`✅ Buku "${title}" berhasil dikembalikan!`, { id: "kembali" });
        fetchLoans(userId);
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengembalikan buku", { id: "kembali" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "kembali" });
    }
  };

  const getStatusBadge = (status: string, isTerlambat: boolean) => {
    if (status === "DIKEMBALIKAN") {
      return <span className="px-2 py-1 text-[10px] font-medium bg-green-100 text-green-600 rounded-full">Dikembalikan</span>;
    }
    if (isTerlambat) {
      return <span className="px-2 py-1 text-[10px] font-medium bg-red-100 text-red-600 rounded-full">Terlambat</span>;
    }
    return <span className="px-2 py-1 text-[10px] font-medium bg-yellow-100 text-yellow-600 rounded-full">Dipinjam</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Peminjaman</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar buku yang pernah dan sedang dipinjam</p>
        </div>

        {/* Daftar Peminjaman */}
        {loans.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-gray-400">Belum ada riwayat peminjaman</p>
            <Link
              href="/pinjam"
              className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
            >
              Pinjam Buku Sekarang →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex gap-4">
                  {/* Cover */}
                  <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {loan.book.coverUrl ? (
                      <img src={loan.book.coverUrl} alt={loan.book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                        📖
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{loan.book.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{loan.book.author}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getStatusBadge(loan.status, loan.isTerlambat)}
                      <span className="text-[10px] text-gray-400">
                        Pinjam: {new Date(loan.tglPinjam).toLocaleDateString("id-ID")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Kembali: {new Date(loan.tglKembali).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    {loan.status === "DIPINJAM" && loan.sisaHari >= 0 && (
                      <p className="text-xs text-blue-600 mt-2">
                        ⏰ Sisa {loan.sisaHari} hari lagi
                      </p>
                    )}
                    {loan.status === "DIPINJAM" && loan.isTerlambat && (
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ Terlambat! Denda Rp{loan.denda || (Math.abs(loan.sisaHari) * 1000)} 
                      </p>
                    )}
                    {loan.denda > 0 && loan.status === "DIKEMBALIKAN" && (
                      <p className="text-xs text-orange-600 mt-2">
                        💰 Denda: Rp{loan.denda.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  {/* Tombol Kembalikan */}
                  {loan.status === "DIPINJAM" && (
                    <button
                      onClick={() => handleKembalikan(loan.id, loan.book.title)}
                      className="px-4 py-2 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition self-center"
                    >
                      Kembalikan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link kembali */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-blue-500 transition">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}