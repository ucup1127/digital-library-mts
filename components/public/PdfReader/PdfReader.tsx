"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import PdfToolbar from "./PdfToolbar";

// Setup worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  fileUrl: string;
  title: string;
}

export default function PdfReader({ fileUrl, title }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 STATE BARU: Untuk melacak halaman mana saja yang sudah boleh dirender
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set([1]));
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (err: Error) => {
    setError("Gagal memuat PDF: " + err.message);
    setLoading(false);
  };

  const scrollToPage = useCallback((pageNum: number) => {
    const pageEl = pageRefs.current[pageNum - 1];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // 🔥 PERBAIKAN INTERSECTION OBSERVER
  useEffect(() => {
    if (numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute("data-page") || "1");
          
          if (entry.isIntersecting) {
            setCurrentPage(pageNum);
            // Tandai halaman ini untuk dirender
            setRenderedPages((prev) => new Set(prev).add(pageNum));
            
            // Pre-render halaman sebelahnya (sebelum & sesudah) biar scroll mulus
            if (pageNum > 1) setRenderedPages((prev) => new Set(prev).add(pageNum - 1));
            if (pageNum < numPages) setRenderedPages((prev) => new Set(prev).add(pageNum + 1));
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.1, // Ubah ke 0.1 agar lebih sensitif saat scroll cepat
        rootMargin: "200px 0px", // Pre-load 200px sebelum halaman masuk layar
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentPage < numPages) {
        scrollToPage(currentPage + 1);
      } else if (e.key === "ArrowLeft" && currentPage > 1) {
        scrollToPage(currentPage - 1);
      } else if (e.key === "+" || e.key === "=") {
        setScale((s) => Math.min(s + 0.25, 3));
      } else if (e.key === "-") {
        setScale((s) => Math.max(s - 0.25, 0.5));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, numPages, scrollToPage]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs opacity-60">Memuat PDF...</p>
            </div>
          </div>
        }
        className="flex-1 overflow-auto"
        inputRef={containerRef}
      >
        <div className="flex flex-col items-center py-16 gap-4">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => { pageRefs.current[pageNum - 1] = el; }}
              data-page={pageNum}
              className="shadow-2xl bg-white" // Tambah bg-white biar ga gelap pas loading
            >
              {/* 🔥 LAZY LOADING: Hanya render jika halaman ada di daftar renderedPages */}
              {renderedPages.has(pageNum) ? (
                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={
                    <div className="flex items-center justify-center bg-white" style={{ width: 600, height: 800 }}>
                      <div className="text-xs text-gray-400">Memuat Halaman {pageNum}...</div>
                    </div>
                  }
                />
              ) : (
                // Placeholder saat halaman belum dirender (menghemat RAM)
                <div 
                  className="flex items-center justify-center bg-gray-100" 
                  style={{ width: 600 * scale, height: 800 * scale }}
                >
                  <span className="text-gray-400 text-xs">Halaman {pageNum}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Document>

      {/* Toolbar */}
      {numPages > 0 && (
        <PdfToolbar
          currentPage={currentPage}
          numPages={numPages}
          scale={scale}
          onPageChange={(page) => {
            // Pastikan halaman tujuan dirender sebelum di-scroll
            setRenderedPages((prev) => new Set(prev).add(page));
            scrollToPage(page);
          }}
          onScaleChange={setScale}
        />
      )}
    </div>
  );
}