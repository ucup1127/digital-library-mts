// components/admin/ImageUploader.tsx
"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

export default function ImageUploader({ onUploadComplete, onUploadError, className = "" }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    // Preview lokal
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setUploading(true);
    toast.loading("Upload gambar...", { id: "upload" });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "gallery");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      // Cek response
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("Upload result:", result);

      if (result.success && result.url) {
        toast.success("✅ Gambar berhasil diupload!", { id: "upload" });
        onUploadComplete(result.url);
      } else {
        toast.error(result.error || "Gagal upload", { id: "upload" });
        setPreview(null);
        if (onUploadError) onUploadError(new Error(result.error));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Terjadi kesalahan saat upload", { id: "upload" });
      setPreview(null);
      if (onUploadError) onUploadError(error as Error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Mengupload...
          </>
        ) : (
          <>
            📤 Pilih Gambar
          </>
        )}
      </button>
      
      {preview && (
        <div className="mt-3">
          <p className="text-[9px] text-gray-400 mb-1">Preview:</p>
          <div className="border rounded-lg overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-32 object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}