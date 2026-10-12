// app/api/upload/client/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// ============================================
// POST — Generate token untuk client upload
// Browser akan upload file langsung ke Vercel Blob
// Route ini hanya kasih "izin" (token)
// ============================================
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 🔥 Verifikasi user (harus login)
        await requireAuth();

        // Tentukan tipe file yang diizinkan berdasarkan pathname
        let allowedContentTypes: string[];
        let maximumSizeInBytes: number;

        if (pathname.startsWith("books/")) {
          // PDF buku
          allowedContentTypes = ["application/pdf"];
          maximumSizeInBytes = 50 * 1024 * 1024; // 50 MB
        } else if (pathname.startsWith("covers/")) {
          // Cover buku (biasanya lewat server, tapi izinkan juga)
          allowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
          maximumSizeInBytes = 4 * 1024 * 1024; // 4 MB
        } else {
          throw new Error("Path tidak diizinkan: " + pathname);
        }

        logger.log("🎫 Generating upload token untuk:", pathname);

        return {
          allowedContentTypes,
          maximumSizeInBytes,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        logger.log("✅ Client upload selesai:", blob.url);
        // Tidak ada yang perlu dilakukan di sini — 
        // frontend akan simpan URL ke DB lewat /api/buku
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Client upload token error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal generate upload token" },
      { status: 400 }
    );
  }
}