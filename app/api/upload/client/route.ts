// app/api/upload/client/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_SG_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        await requireAuth();

        let allowedContentTypes: string[];
        let maximumSizeInBytes: number;

        if (pathname.startsWith("books/")) {
          allowedContentTypes = ["application/pdf"];
          maximumSizeInBytes = 50 * 1024 * 1024;
        } else if (pathname.startsWith("covers/")) {
          allowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
          maximumSizeInBytes = 4 * 1024 * 1024;
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
      onUploadCompleted: async ({ blob }) => {
        logger.log("✅ Client upload selesai:", blob.url);
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