// components/public/Pagination.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl = "" }: PaginationProps) {
  const pathname = usePathname();
  
  const getPageUrl = (page: number) => {
    if (baseUrl) {
      return `${baseUrl}page=${page}`;
    }
    return `${pathname}?page=${page}`;
  };

  // Tampilkan maksimal 5 halaman
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 flex-wrap">
      {/* Tombol Previous */}
      <Link
        href={getPageUrl(currentPage - 1)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
          currentPage === 1
            ? "text-gray-300 cursor-not-allowed pointer-events-none"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        aria-disabled={currentPage === 1}
      >
        ← Sebelumnya
      </Link>

      {/* Nomor Halaman */}
      {getPageNumbers().map((page) => (
        <Link
          key={page}
          href={getPageUrl(page)}
          className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition ${
            page === currentPage
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {page}
        </Link>
      ))}

      {/* Tombol Next */}
      <Link
        href={getPageUrl(currentPage + 1)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
          currentPage === totalPages
            ? "text-gray-300 cursor-not-allowed pointer-events-none"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        aria-disabled={currentPage === totalPages}
      >
        Selanjutnya →
      </Link>
    </div>
  );
}