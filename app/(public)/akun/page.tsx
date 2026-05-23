// app/(public)/akun/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface HistoryBook {
  id: string;
  title: string;
  coverUrl: string;
  author: string;
}

export default function AkunPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryBook[]>([]);

  const [userData, setUserData] = useState({
    nama: "",
    email: "",
    kelas: "",
    password: "",
  });

  // Ambil data user dari database dan riwayat baca dari localStorage
  useEffect(() => {
    const fetchUser = async () => {
      const email = localStorage.getItem("user_email");
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      if (!isLoggedIn || !email) {
        router.push("/login/user");
        return;
      }

      try {
        const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("Gagal ambil data user");
        const data = await res.json();
        
        setUserData({
          nama: data.name || "",
          email: data.email || email,
          kelas: data.className || "",
          password: "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Ambil riwayat baca dari localStorage
    const savedHistory = localStorage.getItem("reading_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.slice(0, 10));
      } catch (e) {
        console.error("Gagal load history", e);
      }
    }
  }, [router]);

  // Fungsi simpan perubahan profil
  const confirmSave = async () => {
    setShowSaveModal(false);
    toast.loading("Menyimpan perubahan...", { id: "save" });

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          name: userData.nama,
          className: userData.kelas,
          password: userData.password || undefined,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      // Update localStorage
      localStorage.setItem("user_name", userData.nama);
      
      toast.success("✅ Data berhasil diubah!", { id: "save", duration: 3000 });
      setIsEditing(false);
      setUserData(prev => ({ ...prev, password: "" }));
    } catch (err) {
      toast.error("Gagal menyimpan data", { id: "save" });
    }
  };

  // Fungsi logout
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    localStorage.removeItem("reading_history");
    
    toast.success("👋 Anda berhasil logout!", {
      duration: 2000,
      position: "top-center",
    });
    
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* 1. HEADER PROFIL */}
        <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
          <div className="w-24 h-24 rounded-full bg-gray-900 mx-auto flex items-center justify-center text-4xl font-black text-white italic uppercase shadow-xl mb-4">
            {userData.nama ? userData.nama.charAt(0).toUpperCase() : "?"}
          </div>
          <h1 className="text-xl font-black italic uppercase text-gray-900 tracking-tighter">{userData.nama || "Pengguna"}</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Anggota Perpustakaan</p>
        </div>

        {/* 2. PENGATURAN AKUN */}
        <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Data Diri & Akun</h2>
            <button 
              onClick={() => isEditing ? setShowSaveModal(true) : setIsEditing(true)}
              className={`text-[10px] font-black uppercase italic px-6 py-2.5 rounded-full transition-all ${
                isEditing ? "bg-green-600 text-white shadow-lg shadow-green-100" : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}
            >
              {isEditing ? "SIMPAN PERUBAHAN" : "EDIT PROFIL"}
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-4 italic">Nama Lengkap</label>
              <input 
                disabled={!isEditing} 
                type="text" 
                value={userData.nama} 
                onChange={(e) => setUserData({...userData, nama: e.target.value})} 
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-800 border-none focus:ring-2 focus:ring-blue-600 disabled:opacity-70 transition-all" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-4 italic">Email</label>
              <input 
                disabled={true}
                type="email" 
                value={userData.email} 
                className="w-full px-6 py-4 bg-gray-100 rounded-2xl font-bold text-gray-500 border-none cursor-not-allowed" 
              />
              <p className="text-[8px] text-gray-400 ml-4 italic">Email tidak dapat diubah</p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-4 italic">Kelas</label>
              <input 
                disabled={!isEditing} 
                type="text" 
                value={userData.kelas} 
                onChange={(e) => setUserData({...userData, kelas: e.target.value})} 
                placeholder="Contoh: 9A"
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-800 border-none focus:ring-2 focus:ring-blue-600 disabled:opacity-70 transition-all" 
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[9px] font-black uppercase text-gray-400 ml-4 italic">Kata Sandi Baru</label>
              <div className="relative">
                <input 
                  disabled={!isEditing} 
                  type={showPassword ? "text" : "password"} 
                  value={userData.password} 
                  onChange={(e) => setUserData({...userData, password: e.target.value})} 
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-800 border-none focus:ring-2 focus:ring-blue-600 disabled:opacity-70 transition-all" 
                />
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-blue-600 italic"
                  >
                    {showPassword ? "Sembunyikan" : "Lihat"}
                  </button>
                )}
              </div>
              <p className="text-[8px] text-gray-400 ml-4 italic">Minimal 6 karakter jika ingin mengubah password</p>
            </div>
          </div>
        </div>

        {/* 3. RIWAYAT BACA - ✅ PERBAIKAN: Ganti /katalog menjadi /buku */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Riwayat Baca</h2>
              <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-1">Buku yang terakhir kamu baca</p>
            </div>
            <span className="text-[8px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black">
              {history.length} Buku
            </span>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Belum ada riwayat baca
              </p>
              {/* ✅ PERBAIKAN: Ganti /buku menjadi / (halaman utama) */}
              <Link href="/" className="inline-block mt-4 text-[9px] font-black text-blue-600 underline">
                Mulai baca buku →
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {history.map((book) => (
                <Link 
                  // ✅ PERBAIKAN: Ganti /katalog/${book.id} menjadi /buku/${book.id}
                  href={`/buku/${book.id}`}
                  key={book.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-all group"
                >
                  {/* Cover kecil */}
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 shadow-sm">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[6px] text-gray-400 p-1 text-center">
                        {book.title}
                      </div>
                    )}
                  </div>
                  
                  {/* Info buku */}
                  <div className="flex-grow">
                    <h4 className="font-black text-sm text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
                      {book.title}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      {book.author || "Penulis"}
                    </p>
                  </div>
                  
                  <div className="text-[8px] font-black text-blue-600 opacity-0 group-hover:opacity-100 transition">
                    Baca → 
                  </div>
                </Link>
              ))}
              
              {/* ✅ PERBAIKAN: Ganti /katalog menjadi / (halaman utama) */}
              <Link 
                href="/" 
                className="block text-center mt-4 py-3 bg-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition"
              >
                Lihat Semua Buku →
              </Link>
            </div>
          )}
        </div>

        {/* 4. NAVIGASI BAWAH */}
        <div className="space-y-3">
          <Link href="/" className="w-full py-5 bg-white text-gray-900 border border-gray-100 rounded-[25px] flex items-center justify-center font-black uppercase italic text-xs tracking-widest hover:bg-gray-50 transition-all shadow-sm">
            ← Kembali ke Beranda
          </Link>
          <button onClick={() => setShowLogoutModal(true)} className="w-full py-5 bg-red-50 text-red-600 rounded-[25px] font-black uppercase italic text-xs tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
            Keluar Sistem Sekarang
          </button>
        </div>
      </div>

      {/* MODAL LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm relative z-10 text-center shadow-2xl scale-in">
             <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">🚪</div>
             <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Mau Keluar?</h3>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">Yakin mau keluar sistem sekarang? Nanti login lagi ya kalau kangen baca buku!</p>
             <div className="flex gap-3">
               <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase italic text-[10px] tracking-widest">Gajadi</button>
               <button onClick={handleLogout} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-red-200">Keluar</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL SIMPAN PERUBAHAN */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)}></div>
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm relative z-10 text-center shadow-2xl scale-in">
             <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">💾</div>
             <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Simpan Profil?</h3>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">Pastikan data yang kamu ubah sudah benar ya, Jon!</p>
             <div className="flex gap-3">
               <button onClick={() => setShowSaveModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase italic text-[10px] tracking-widest">Batal</button>
               <button onClick={confirmSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-blue-200">Ya, Simpan</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .scale-in { animation: scaleIn 0.2s ease-out; }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}