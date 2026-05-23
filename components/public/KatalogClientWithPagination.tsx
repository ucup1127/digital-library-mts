// components/public/KatalogClientWithPagination.tsx
"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Pagination from "./Pagination";
import Skeleton from "@/components/ui/Skeleton";

const fetchBooks = async (page: number, category: string, search: string) => {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', '24');
  if (category && category !== 'all') params.set('category', category);
  if (search) params.set('q', search);
  
  const res = await fetch(`/api/buku?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function KatalogClientWithPagination({ categories = [] }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(search);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);
        if (searchInput) params.set('q', searchInput);
        router.push(`/katalog?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, category, router, search]);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['books', page, category, search],
    queryFn: () => fetchBooks(page, category, search),
    staleTime: 60 * 1000,
  });
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Search bar skeleton */}
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 px-6">
          <Skeleton className="flex-grow h-14 rounded-2xl" />
          <Skeleton className="w-48 h-14 rounded-2xl" />
        </div>
        {/* Category pills skeleton */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full flex-none" />
            ))}
          </div>
        </div>
        {/* Books grid skeleton */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 gap-y-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-2 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-black italic">Gagal memuat data</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          Coba lagi
        </button>
      </div>
    );
  }
  
  const { books = [], pagination = { currentPage: 1, totalPages: 1, totalItems: 0 } } = data || {};
  
  return (
    <div className="space-y-8">
      {/* Search & Filter */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 px-6">
        <div className="flex-grow relative">
          <input 
            type="text"
            placeholder="Cari judul atau penulis..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full p-4 pl-12 bg-gray-50 rounded-[20px] border-none focus:ring-2 focus:ring-blue-600 font-bold text-sm shadow-sm transition-all"
          />
          <span className="absolute left-5 top-4 opacity-30 text-lg">🔍</span>
        </div>
      </div>

      {/* ✅ TAMBAHAN: Category Pills dengan Horizontal Scroll (seperti halaman utama) */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex overflow-x-auto gap-2 pb-3 no-scrollbar">
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (search) params.set('q', search);
              router.push(`/katalog?${params.toString()}`);
            }}
            className={`flex-none px-5 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              category === 'all'
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600"
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('category', cat.id);
                if (search) params.set('q', search);
                if (page !== 1) params.set('page', '1');
                router.push(`/katalog?${params.toString()}`);
              }}
              className={`flex-none px-5 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                category === cat.id
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Buku */}
      <section className="max-w-7xl mx-auto px-6">
        {books.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-300 font-black italic uppercase tracking-widest text-sm">
              Buku tidak ditemukan
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 gap-y-6">
              {books.map((book: any) => (
                <Link href={`/katalog/${book.id}`} key={book.id} className="group">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all">
                    {book.coverUrl ? (
                      <Image 
                        src={book.coverUrl} 
                        alt={book.title}
                        width={200}
                        height={266}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                        loading="lazy"
                        sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-[8px] font-bold p-2 text-center">
                        {book.title}
                      </div>
                    )}
                    {book.categories && book.categories.length > 0 && (
                      <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[6px] font-bold px-1.5 py-0.5 rounded-full">
                        {book.categories[0].category?.name || book.categories[0].name}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 text-[10px] mt-1.5 line-clamp-1 group-hover:text-blue-600 transition">
                    {book.title}
                  </h3>
                  <p className="text-[8px] text-gray-400 truncate">
                    {book.author || "Penulis"}
                  </p>
                </Link>
              ))}
            </div>
            
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
            />
          </>
        )}
      </section>
    </div>
  );
}