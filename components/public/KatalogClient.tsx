"use client";

import { useState } from "react";
import Link from "next/link";

export default function KatalogClient({ allBooks, categories }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBooks = allBooks.filter((book: any) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "all" || book.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12">
      {/* Search & Filter - Tetap Konsisten[cite: 1, 9] */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 px-6">
        <div className="flex-grow relative">
          <input 
            type="text"
            placeholder="Cari judul atau penulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 bg-gray-50 rounded-[20px] border-none focus:ring-2 focus:ring-blue-600 font-bold text-sm shadow-sm transition-all"
          />
          <span className="absolute left-5 top-4 opacity-30 text-lg">🔍</span>
        </div>

        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-4 bg-gray-50 rounded-[20px] border-none focus:ring-2 focus:ring-blue-600 font-black uppercase italic text-[10px] tracking-widest shadow-sm appearance-none cursor-pointer"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Grid Katalog - Sekarang 3 Kolom di Mobile agar ukuran mengecil */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-10">
          {filteredBooks.map((book: any) => (
            <Link href={`/katalog/${book.id}`} key={book.id} className="group">
              {/* Ukuran diperkecil dengan rounded yang disesuaikan */}
              <div className="relative aspect-[3/4] rounded-[18px] overflow-hidden bg-gray-50 mb-3 shadow-sm group-hover:shadow-xl transition-all duration-500 border border-gray-100">
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110" 
                    alt={book.title} 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[7px] text-gray-300 font-black uppercase p-2 text-center italic">
                    {book.title}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[9px] font-black text-gray-900 line-clamp-1 uppercase italic leading-tight group-hover:text-blue-600 transition">
                  {book.title}
                </h3>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate">
                  {book.author || "Anonim"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}