"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface PdfToolbarProps {
  currentPage: number;
  numPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
}

export default function PdfToolbar({
  currentPage,
  numPages,
  scale,
  onPageChange,
  onScaleChange,
}: PdfToolbarProps) {
  const [inputPage, setInputPage] = useState<string>("");
  const [showInput, setShowInput] = useState(false);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputPage);
    if (page >= 1 && page <= numPages) {
      onPageChange(page);
    }
    setInputPage("");
    setShowInput(false);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl z-50">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-1.5 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page Window */}
      {showInput ? (
        <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={numPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onBlur={() => { setShowInput(false); setInputPage(""); }}
            autoFocus
            className="w-12 px-2 py-0.5 bg-white/10 text-white text-xs rounded text-center outline-none border border-white/20 focus:border-blue-400"
            placeholder={String(currentPage)}
          />
          <span className="text-white/50 text-[10px]">/ {numPages}</span>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="px-3 py-0.5 text-white text-xs font-medium hover:bg-white/10 rounded transition"
        >
          {currentPage} <span className="text-white/50">/ {numPages}</span>
        </button>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= numPages}
        className="p-1.5 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-white/20 mx-1" />

      {/* Zoom Out */}
      <button
        onClick={() => onScaleChange(Math.max(scale - 0.25, 0.5))}
        disabled={scale <= 0.5}
        className="p-1.5 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30 transition"
        aria-label="Perkecil"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Zoom % */}
      <span className="text-white text-[10px] font-medium min-w-[3ch] text-center">
        {Math.round(scale * 100)}%
      </span>

      {/* Zoom In */}
      <button
        onClick={() => onScaleChange(Math.min(scale + 0.25, 3))}
        disabled={scale >= 3}
        className="p-1.5 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30 transition"
        aria-label="Perbesar"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  );
}