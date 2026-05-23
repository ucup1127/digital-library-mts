"use client";

import { useEffect } from "react";

export default function SaveHistory({ book }: { book: any }) {
  useEffect(() => {
    try {
      const bookData = {
        id: book.id,
        title: book.title,
        coverUrl: book.coverUrl,
        author: book.author,
        lastRead: new Date().toISOString()
      };
      
      let history = JSON.parse(localStorage.getItem('reading_history') || '[]');
      history = history.filter((item: any) => item.id !== bookData.id);
      history.unshift(bookData);
      localStorage.setItem('reading_history', JSON.stringify(history.slice(0, 5)));
    } catch (e) {
      console.error('Gagal menyimpan history baca:', e);
    }
  }, [book]);

  return null; // Komponen ini tidak merender apapun ke layar
}