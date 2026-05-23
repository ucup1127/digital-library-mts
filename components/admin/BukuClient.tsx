// components/admin/BukuClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteBookButton from "./DeleteBookButton";

interface Book {
  id: string;
  title: string;
  author: string;
  year: string | null;
  views: number;
  coverUrl: string | null;
  createdAt: Date;
  categories: string[];
}

interface Category {
  id: string;
  name: string;
}

interface BukuClientProps {
  initialBooks: Book[];
  categories: Category[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  searchParams: {
    q: string;
    category: string;
    sort: string;
  };
}

export default function BukuClient({
  initialBooks,
  categories,
  totalPages,
  currentPage,
  totalItems,
  searchParams,
}: BukuClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(searchParams.q);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category);
  const [selectedSort, setSelectedSort] = useState(searchParams.sort || "newest");
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchParams.q) {
        applyFilters();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const applyFilters = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchInput) params.set("q", searchInput);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSort) params.set("sort", selectedSort);
    params.set("page", "1");
    
    router.push(`/admin/buku?${params.toString()}`);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchInput) params.set("q", searchInput);
    if (value) params.set("category", value);
    if (selectedSort) params.set("sort", selectedSort);
    params.set("page", "1");
    
    router.push(`/admin/buku?${params.toString()}`);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchInput) params.set("q", searchInput);
    if (selectedCategory) params.set("category", selectedCategory);
    params.set("sort", value);
    params.set("page", "1");
    
    router.push(`/admin/buku?${params.toString()}`);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handlePageChange = (page: number) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchInput) params.set("q", searchInput);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSort) params.set("sort", selectedSort);
    params.set("page", page.toString());
    
    router.push(`/admin/buku?${params.toString()}`);
    setTimeout(() => setIsLoading(false), 500);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategory("");
    setSelectedSort("newest");
    setIsLoading(true);
    router.push("/admin/buku");
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Cari judul, penulis, atau deskripsi..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div className="w-full md:w-64 relative">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer appearance-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs">▼</span>
        </div>

        <div className="w-full md:w-56 relative">
          <select
            value={selectedSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer appearance-none"
          >
            <option value="newest">📅 Terbaru</option>
            <option value="oldest">📅 Terlama</option>
            <option value="most_viewed">👁️ Paling Banyak Dilihat</option>
            <option value="least_viewed">👁️ Paling Jarang Dilihat</option>
            <option value="title_asc">🔤 Judul A-Z</option>
            <option value="title_desc">🔤 Judul Z-A</option>
          </select>
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs">▼</span>
        </div>

        {(searchInput || selectedCategory || selectedSort !== "newest") && (
          <button onClick={clearFilters} className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            ✕ Reset
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-500">
        <p>Menampilkan <span className="font-bold text-gray-700">{initialBooks.length}</span> dari <span className="font-bold text-gray-700">{totalItems}</span> buku</p>
        {initialBooks.length > 0 && <p className="text-[9px] uppercase tracking-wider">Halaman {currentPage} dari {totalPages}</p>}
      </div>

      {!isLoading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 rounded-xl">
              <tr>
                <th className="p-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Cover</th>
                <th className="p-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Judul & Penulis</th>
                <th className="p-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Tahun</th>
                <th className="p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Dilihat</th>
                <th className="p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📚</span>
                      <p className="text-sm">Tidak ada buku yang ditemukan</p>
                      <Link href="/admin/buku/tambah" className="mt-2 text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline">+ Tambah Buku Baru</Link>
                    </div>
                   </td>
                 </tr>
              ) : (
                initialBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">📖</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{book.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{book.author}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {book.categories.length > 0 ? (
                          book.categories.slice(0, 2).map((cat) => (
                            <span key={cat} className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{cat}</span>
                          ))
                        ) : (
                          <span className="text-[8px] text-gray-400">-</span>
                        )}
                        {book.categories.length > 2 && <span className="text-[8px] text-gray-400">+{book.categories.length - 2}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center text-xs text-gray-500">{book.year || "-"}</td>
                    <td className="p-3 text-center"><span className="text-xs font-bold text-blue-600">{book.views}</span></td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/buku/edit/${book.id}`} className="text-gray-400 hover:text-blue-600 transition text-sm" title="Edit">✏️</Link>
                        <DeleteBookButton bookId={book.id} bookTitle={book.title} />
                        <Link href={`/buku/${book.id}`} target="_blank" className="text-gray-400 hover:text-green-600 transition text-sm" title="Lihat">👁️</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && !isLoading && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition">← Prev</button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-8 h-8 text-xs font-bold rounded-lg transition ${pageNum === currentPage ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition">Next →</button>
        </div>
      )}
    </div>
  );
}