// app/(public)/profil-sekolah/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ExternalLink, Globe, ArrowLeft, School } from "lucide-react";

export default function ProfilSekolahPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [schoolWebsite, setSchoolWebsite] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [noWebsite, setNoWebsite] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (!meData.user) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        setIsLoggedIn(true);

        // Ambil info sekolah
        const schoolRes = await fetch("/api/public/school-info");
        const schoolData = await schoolRes.json();

        setSchoolName(schoolData.name || "Sekolah");

        const website = schoolData.website;

        if (website && website.trim() !== "") {
          setSchoolWebsite(website);

          // 🔥 Buka di tab baru
          setTimeout(() => {
            window.open(website, "_blank", "noopener,noreferrer");
          }, 500);
        } else {
          // 🔥 Nggak ada website → tampil pesan
          setNoWebsite(true);
        }
      } catch (error) {
        console.error(error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Loading
  if (loading || isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Belum login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Anda Belum Login</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Harap login/register agar kami bisa menampilkan informasi sesuai sekolah Anda.
          </p>
          <div className="space-y-3">
            <Link
              href="/login/user"
              className="block w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
            >
              Login Sekarang
            </Link>
            <Link
              href="/register"
              className="block w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 Nggak ada website → tampil pesan
  if (noWebsite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-200">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Website Belum Tersedia
          </h1>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed">
            <strong>{schoolName}</strong> belum memiliki website resmi yang terdaftar di sistem.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Silakan hubungi admin perpustakaan untuk informasi lebih lanjut.
          </p>
          <div className="space-y-3">
            <Link
              href="/tentang"
              className="block w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
            >
              Lihat Tentang Sekolah
            </Link>
            <Link
              href="/"
              className="block w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 Ada website → loading redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200 animate-pulse">
          <School className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Mengalihkan ke Website Sekolah
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Website <strong>{schoolName}</strong> sedang dibuka di tab baru.
        </p>

        <div className="w-full bg-gray-100 rounded-full h-1 mb-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse" style={{ width: "60%" }}></div>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Kalau tab baru tidak terbuka, klik tombol di bawah:
        </p>

        <a
          href={schoolWebsite || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
        >
          <ExternalLink className="w-4 h-4" />
          Buka Website Sekolah
        </a>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}