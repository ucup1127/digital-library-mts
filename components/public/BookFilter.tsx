"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BookFilter({ categories }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('q') || '';
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (search) {
          params.set('q', search);
        } else {
          params.delete('q');
        }
        router.push(`/?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, currentSearch, router, searchParams]);

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="relative">
        {/* 🔍 ICON - di kiri, tidak nutupin tulisan */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-gray-400 text-sm">🔍</span>
        </div>
        
        {/* INPUT - padding kiri cukup besar biar icon tidak nutup */}
        <input 
          type="text"
          placeholder="Cari judul buku atau penulis..."
          className="w-full py-3 pl-8 pr-4 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}