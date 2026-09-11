// components/public/BookFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

export default function BookFilter({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari judul buku, penulis, atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-11 py-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-medium hover:bg-blue-700 transition shadow-sm"
        >
          Cari
        </button>
      </div>
    </form>
  );
}