// app/(admin)/admin/peminjaman-fisik/page.tsx
"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Plus, 
  Search, 
  User, 
  BookMarked,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Library,
  Users,
  X,
  Save,
  Sparkles,
  Barcode,
  UserCheck,
  BookCheck,
  RefreshCw,
  Eye,
  FileText,
  BadgeCheck,
  AlertTriangle
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  className: string;
  memberId: string;
  barcode: string;
}

interface BukuFisik {
  id: string;
  judul: string;
  penulis: string;
  penerbit: string;
  barcode: string;
  stokTersedia: number;
  stok: number;
  lokasiRak: string;
}

interface Peminjaman {
  id: string;
  tglPinjam: string;
  tglKembali: string;
  tglDikembalikan: string | null;
  status: string;
  denda: number;
  user: User;
  bukuFisik: BukuFisik;
}

export default function PeminjamanFisikPage() {
  const [loading, setLoading] = useState(true);
  const [activeLoans, setActiveLoans] = useState<Peminjaman[]>([]);
  const [historyLoans, setHistoryLoans] = useState<Peminjaman[]>([]);
  const [showPinjamModal, setShowPinjamModal] = useState(false);
  const [showKembaliModal, setShowKembaliModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Peminjaman | null>(null);
  const [userRole, setUserRole] = useState("");
  
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  
  const [step, setStep] = useState<"user" | "book">("user");
  const [searchUser, setSearchUser] = useState("");
  const [searchBook, setSearchBook] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<BukuFisik[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBook, setSelectedBook] = useState<BukuFisik | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [searchingBook, setSearchingBook] = useState(false);
  const [userTotalItems, setUserTotalItems] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
        setSelectedUser(null);
        setSelectedBook(null);
        setUsers([]);
        setBooks([]);
        setSearchUser("");
        setSearchBook("");
        setStep("user");
      }
    };
    
    window.addEventListener("schoolChanged", handleSchoolChange);
    return () => window.removeEventListener("schoolChanged", handleSchoolChange);
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchActiveLoans();
      fetchHistoryLoans();
    }
  }, [selectedSchoolId]);

  const fetchActiveLoans = async () => {
    if (!selectedSchoolId) return;
    
    try {
      const res = await fetch(`/api/peminjaman-fisik?status=DIPINJAM&schoolId=${selectedSchoolId}`);
      const data = await res.json();
      setActiveLoans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching active loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryLoans = async () => {
    if (!selectedSchoolId) return;
    
    try {
      const res = await fetch(`/api/peminjaman-fisik?status=all&schoolId=${selectedSchoolId}`);
      const data = await res.json();
      setHistoryLoans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching history loans:", error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }
    
    setSearchingUser(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setUsers(data.users || []);
      setUserTotalItems(data.users?.length || 0);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchingUser(false);
    }
  };

  const searchBooks = async (query: string) => {
    if (query.length < 2) {
      setBooks([]);
      return;
    }
    
    setSearchingBook(true);
    try {
      const res = await fetch(`/api/buku-fisik?search=${encodeURIComponent(query)}&schoolId=${selectedSchoolId}`);
      const data = await res.json();
      const bookList = data.books || [];
      const availableBooks = bookList.filter((book: BukuFisik) => book.stokTersedia > 0);
      setBooks(availableBooks);
    } catch (error) {
      console.error("Error searching books:", error);
    } finally {
      setSearchingBook(false);
    }
  };

  const openPinjamModal = () => {
    if (!selectedSchoolId) {
      toast.error("Pilih sekolah terlebih dahulu");
      return;
    }
    setStep("user");
    setSearchUser("");
    setSearchBook("");
    setUsers([]);
    setBooks([]);
    setSelectedUser(null);
    setSelectedBook(null);
    setShowPinjamModal(true);
  };

  const handlePinjam = async () => {
    if (!selectedUser || !selectedBook) {
      toast.error("Pilih user dan buku terlebih dahulu");
      return;
    }

    setSubmitting(true);
    toast.loading("Memproses peminjaman...", { id: "pinjam" });

    try {
      const res = await fetch("/api/peminjaman-fisik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          bukuFisikId: selectedBook.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`✅ Berhasil meminjam "${selectedBook.judul}"!`, { id: "pinjam" });
        setShowPinjamModal(false);
        setSelectedUser(null);
        setSelectedBook(null);
        setSearchUser("");
        setSearchBook("");
        setUsers([]);
        setBooks([]);
        setStep("user");
        fetchActiveLoans();
        fetchHistoryLoans();
      } else {
        toast.error(data.error || "Gagal meminjam", { id: "pinjam" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "pinjam" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKembalikan = async () => {
    if (!selectedLoan) return;

    setSubmitting(true);
    toast.loading("Memproses pengembalian...", { id: "kembali" });

    try {
      const res = await fetch("/api/peminjaman-fisik", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedLoan.id }),
      });

      const data = await res.json();

      if (res.ok) {
        const dendaMsg = data.denda > 0 ? ` Denda: Rp${data.denda.toLocaleString()}` : "";
        toast.success(`✅ Buku "${selectedLoan.bukuFisik.judul}" berhasil dikembalikan!${dendaMsg}`, { id: "kembali" });
        setShowKembaliModal(false);
        setSelectedLoan(null);
        fetchActiveLoans();
        fetchHistoryLoans();
      } else {
        toast.error(data.error || "Gagal mengembalikan", { id: "kembali" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "kembali" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DIPINJAM":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-yellow-100 text-yellow-700 rounded-full"><Clock className="w-3 h-3" /> Dipinjam</span>;
      case "TERLAMBAT":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-red-100 text-red-700 rounded-full animate-pulse"><AlertCircle className="w-3 h-3" /> Terlambat</span>;
      case "DIKEMBALIKAN":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-green-100 text-green-700 rounded-full"><CheckCircle className="w-3 h-3" /> Dikembalikan</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-gray-100 text-gray-600 rounded-full">{status}</span>;
    }
  };

  const getLateDays = (tglKembali: string) => {
    const today = new Date();
    const kembali = new Date(tglKembali);
    today.setHours(0, 0, 0, 0);
    kembali.setHours(0, 0, 0, 0);
    
    if (today > kembali) {
      return Math.ceil((today.getTime() - kembali.getTime()) / (1000 * 3600 * 24));
    }
    return 0;
  };

  if (userRole === "SUPER_ADMIN" && !selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Peminjaman Buku Fisik</h1>
            <p className="text-xs text-gray-400 mt-1">Manajemen peminjaman buku fisik perpustakaan</p>
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
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat data peminjaman...</p>
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
            <BookOpen className="w-6 h-6 text-amber-600" />
            Peminjaman Buku Fisik
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manajemen peminjaman buku fisik perpustakaan
            {selectedSchoolName && (
              <span className="text-amber-600 ml-1">- {selectedSchoolName}</span>
            )}
          </p>
        </div>
        <button
          onClick={openPinjamModal}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-sm font-semibold hover:from-amber-700 hover:to-orange-700 transition flex items-center gap-2 shadow-lg shadow-amber-200"
        >
          <Plus className="w-4 h-4" />
          Pinjam Buku
        </button>
      </div>

      {/* Peminjaman Aktif */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-gray-800 text-sm">📖 Peminjaman Aktif</h2>
          </div>
          <span className="text-[9px] text-gray-400">{activeLoans.length} buku dipinjam</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Peminjam</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Buku</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Tgl Pinjam</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Tgl Kembali</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Terlambat</th>
                <th className="px-4 py-3 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <BookOpen className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Tidak ada peminjaman aktif</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeLoans.map((loan) => {
                  const lateDays = getLateDays(loan.tglKembali);
                  const isLate = lateDays > 0;
                  
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50 transition group">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {loan.user?.name || "-"}
                        </p>
                        <p className="text-[9px] text-gray-400 flex items-center gap-1.5">
                          <BookMarked className="w-3 h-3" />
                          {loan.user?.className || ""}
                          {loan.user?.memberId && (
                            <span className="text-blue-600 font-mono">• No: {loan.user.memberId}</span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800 font-medium">{loan.bukuFisik?.judul || "-"}</p>
                        <p className="text-[9px] text-gray-400">{loan.bukuFisik?.penulis}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(loan.tglPinjam).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm flex items-center gap-1.5 ${isLate ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(loan.tglKembali).toLocaleDateString("id-ID")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {isLate ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            +{lateDays} hari
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(isLate ? "TERLAMBAT" : loan.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowKembaliModal(true);
                          }}
                          className="px-3 py-1.5 text-[9px] font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
                        >
                          <BookCheck className="w-3.5 h-3.5" />
                          Kembalikan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Riwayat Peminjaman */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-gray-800 text-sm">📜 Riwayat Peminjaman</h2>
          </div>
          <span className="text-[9px] text-gray-400">{historyLoans.length} riwayat</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Peminjam</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Buku</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Tgl Pinjam</th>
                <th className="px-4 py-3 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Tgl Kembali</th>
                <th className="px-4 py-3 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Denda</th>
                <th className="px-4 py-3 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historyLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Library className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">Belum ada riwayat peminjaman</p>
                    </div>
                  </td>
                </tr>
              ) : (
                historyLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {loan.user?.name || "-"}
                      </p>
                      {loan.user?.memberId && (
                        <p className="text-[9px] text-blue-600 font-mono">No: {loan.user.memberId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 font-medium">{loan.bukuFisik?.judul || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(loan.tglPinjam).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      {loan.tglDikembalikan ? new Date(loan.tglDikembalikan).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {loan.denda > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          Rp{loan.denda.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Dikembalikan
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== MODAL PINJAM BUKU ========== */}
      {showPinjamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                Pinjam Buku
              </h2>
              <button 
                onClick={() => {
                  setShowPinjamModal(false);
                  setSelectedUser(null);
                  setSelectedBook(null);
                  setSearchUser("");
                  setSearchBook("");
                  setUsers([]);
                  setBooks([]);
                  setStep("user");
                }} 
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress Step */}
              <div className="flex mb-6 bg-gray-50 rounded-xl p-1">
                <div className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition ${
                  step === "user" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}>
                  <span>1. Pilih Peminjam</span>
                </div>
                <div className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition ${
                  step === "book" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}>
                  <span>2. Pilih Buku</span>
                </div>
              </div>

              {/* Step 1: Pilih User */}
              {step === "user" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Cari Peminjam (Nama/Email/Nomor Anggota/Barcode)
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ketik minimal 2 karakter..."
                        value={searchUser}
                        onChange={(e) => {
                          setSearchUser(e.target.value);
                          if (e.target.value.length >= 2) searchUsers(e.target.value);
                          else setUsers([]);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                        autoFocus
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1.5">
                      {searchUser.length < 2 ? "Ketik minimal 2 karakter untuk mulai mencari" : `Menampilkan ${users.length} user`}
                    </p>
                  </div>

                  {searchingUser && (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {users.length > 0 && (
                    <div className="border border-gray-200 rounded-xl divide-y max-h-64 overflow-y-auto">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setStep("book");
                            setSearchBook("");
                            setBooks([]);
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 transition flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email} • {user.className || "Tanpa Kelas"} 
                              {user.memberId && <span className="ml-1 text-blue-600 font-medium">• No Anggota: {user.memberId}</span>}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchUser.length >= 2 && users.length === 0 && !searchingUser && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">User tidak ditemukan</p>
                      <p className="text-xs text-gray-300 mt-1">Pastikan user sudah terdaftar di sistem</p>
                    </div>
                  )}

                  {selectedUser && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {selectedUser.name} ({selectedUser.className || "-"})
                          </p>
                          {selectedUser.memberId && (
                            <p className="text-[9px] text-blue-600 font-mono">No Anggota: {selectedUser.memberId}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setStep("book")}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Lanjut Pilih Buku <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Pilih Buku */}
              {step === "book" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Cari Buku (Judul/Penulis/ISBN/Barcode)
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ketik minimal 2 karakter..."
                        value={searchBook}
                        onChange={(e) => {
                          setSearchBook(e.target.value);
                          if (e.target.value.length >= 2) searchBooks(e.target.value);
                          else setBooks([]);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                        autoFocus
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1.5">
                      {searchBook.length < 2 ? "Ketik minimal 2 karakter untuk mulai mencari" : `Menampilkan ${books.length} buku dengan stok tersedia`}
                    </p>
                  </div>

                  {searchingBook && (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {books.length > 0 && (
                    <div className="border border-gray-200 rounded-xl divide-y max-h-64 overflow-y-auto">
                      {books.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => setSelectedBook(book)}
                          className="w-full p-3 text-left hover:bg-gray-50 transition flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm flex-shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{book.judul}</p>
                            <p className="text-xs text-gray-400">
                              {book.penulis} • Rak: {book.lokasiRak || "-"} • Stok tersedia: <span className="font-semibold text-green-600">{book.stokTersedia}</span> dari {book.stok}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchBook.length >= 2 && books.length === 0 && !searchingBook && (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">📚 Buku tidak ditemukan</p>
                      <p className="text-xs text-gray-300 mt-1">Pastikan buku sudah diinput ke sistem dan stok tersedia</p>
                    </div>
                  )}

                  {selectedBook && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookCheck className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{selectedBook.judul}</p>
                          <p className="text-[9px] text-gray-500">Stok tersedia: {selectedBook.stokTersedia}</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-400">{selectedBook.penulis}</span>
                    </div>
                  )}

                  {/* Tombol Navigasi */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setStep("user");
                        setSelectedBook(null);
                      }}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Kembali
                    </button>
                    <button
                      onClick={handlePinjam}
                      disabled={!selectedBook || submitting}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-sm font-medium hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          Pinjam Buku
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL KONFIRMASI KEMBALIKAN ========== */}
      {showKembaliModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                <BookCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Konfirmasi Pengembalian</h3>
              <p className="text-sm text-gray-500 mt-2">
                Yakin ingin mengembalikan buku <strong>"{selectedLoan.bukuFisik?.judul}"</strong>?
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Peminjam: {selectedLoan.user?.name} ({selectedLoan.user?.className})
                {selectedLoan.user?.memberId && <span className="ml-1 font-mono">No: {selectedLoan.user.memberId}</span>}
              </p>
              
              {getLateDays(selectedLoan.tglKembali) > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Terlambat {getLateDays(selectedLoan.tglKembali)} hari
                  </p>
                  <p className="text-xs text-red-600">
                    Denda: Rp{(getLateDays(selectedLoan.tglKembali) * 1000).toLocaleString()}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowKembaliModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleKembalikan}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Ya, Kembalikan
                    </>
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