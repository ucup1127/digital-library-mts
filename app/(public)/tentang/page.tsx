// app/(public)/tentang/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Target, 
  ClipboardList, 
  ScrollText, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ArrowRight,
  Sparkles,
  Award,
  Users,
  Library
} from "lucide-react";

interface TentangData {
  vision: string;
  mission: string;
  history: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  school: {
    name: string;
    logo: string;
  };
  stats: {
    totalBooks: number;
    totalUsers: number;
    totalBukuDigital: number;
    totalCategories: number;
  };
}

export default function TentangPage() {
  const [data, setData] = useState<TentangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTentang = async () => {
      const schoolId = localStorage.getItem("school_id");
      
      if (!schoolId) {
        setError("Data sekolah tidak ditemukan");
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/tentang?schoolId=${schoolId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching tentang:", error);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTentang();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-gray-500 text-sm">{error || "Data tidak tersedia"}</p>
          <Link href="/" className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition shadow-md">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const missionList = data.mission?.split("\n").filter(m => m.trim()) || [];

  const stats = [
    { 
      icon: BookOpen, 
      value: data.stats?.totalBooks || 0, 
      label: "Koleksi Buku",
      color: "from-blue-500 to-blue-600"
    },
    { 
      icon: Users, 
      value: data.stats?.totalUsers || 0, 
      label: "Pengguna Aktif",
      color: "from-green-500 to-emerald-600"
    },
    { 
      icon: Award, 
      value: data.stats?.totalBukuDigital || 0, 
      label: "Buku Digital",
      color: "from-amber-500 to-orange-600"
    },
    { 
      icon: Target, 
      value: data.stats?.totalCategories || 0, 
      label: "Kategori",
      color: "from-purple-500 to-pink-600"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================= */}
      {/* 🔥 HERO SECTION - TETAP DI ATAS */}
      {/* ============================================= */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden pt-16 pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 mb-4">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-[10px] font-medium text-white uppercase tracking-wider">Tentang Kami</span>
          </div>
          
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10">
            {data.school?.logo ? (
              <img src={data.school.logo} alt={data.school.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <Library className="w-12 h-12 text-white" />
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {data.school?.name || "Perpustakaan Digital"}
          </h1>
          <p className="text-blue-100 text-sm max-w-2xl mx-auto">
            Perpustakaan digital yang mendukung kegiatan belajar mengajar
          </p>
        </div>
      </div>

      {/* ============================================= */}
      {/* 🔥 CONTENT - DIBERI JARAK DARI HERO */}
      {/* ============================================= */}
      <div className="max-w-6xl mx-auto px-5 -mt-6 pb-16 pt-10">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg mb-2`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-800">{stat.value.toLocaleString()}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Visi & Misi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Visi Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-bold text-gray-800 text-lg">Visi</h2>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100/50">
              <p className="text-gray-700 text-sm leading-relaxed italic">
                {data.vision || "Belum ada data visi"}
              </p>
            </div>
          </div>

          {/* Misi Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 group-hover:scale-105 transition">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-bold text-gray-800 text-lg">Misi</h2>
            </div>
            <ul className="space-y-2.5">
              {missionList.length > 0 ? (
                missionList.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700 items-start">
                    <span className="text-green-500 mt-0.5 font-bold">✓</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-400">Belum ada data misi</li>
              )}
            </ul>
          </div>
        </div>

        {/* Sejarah Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
              <ScrollText className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-bold text-gray-800 text-lg">Sejarah</h2>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50">
            <p className="text-gray-700 text-sm leading-relaxed">
              {data.history || "Belum ada data sejarah"}
            </p>
          </div>
        </div>

        {/* Kontak Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-200">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-bold text-gray-800 text-lg">Kontak & Alamat</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Alamat</p>
                <p className="text-sm text-gray-700 mt-0.5">{data.address || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Telepon</p>
                <p className="text-sm text-gray-700 mt-0.5">{data.phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <Mail className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-sm text-gray-700 mt-0.5 break-all">{data.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <Globe className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Website</p>
                {data.website ? (
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                    {data.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="text-sm text-gray-700 mt-0.5">-</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300/50 hover:scale-[1.02] transition-all duration-300 group"
          >
            <BookOpen className="w-4 h-4" />
            Jelajahi Koleksi Buku
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}