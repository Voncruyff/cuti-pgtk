import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// Peta ekstensi berkas ke MIME Type standar
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

/**
 * Route Handler untuk melayani berkas unggahan secara dinamis di server produksi.
 * Next.js standalone tidak melayani berkas baru di public/ yang dibuat saat runtime.
 * Handler ini membaca berkas langsung dari penyimpanan disk server.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Validasi keamanan untuk mencegah serangan Directory Traversal
    for (const segment of pathSegments) {
      if (
        segment.includes("..") ||
        segment.includes("/") ||
        segment.includes("\\") ||
        !/^[a-zA-Z0-9_\-\.]+$/.test(segment)
      ) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Lokasi pencarian berkas di public/uploads atau uploads
    const candidatePaths = [
      path.join(process.cwd(), "public", "uploads", ...pathSegments),
      path.join(process.cwd(), "uploads", ...pathSegments),
    ];

    let targetFilePath: string | null = null;
    for (const candidate of candidatePaths) {
      if (existsSync(candidate)) {
        targetFilePath = candidate;
        break;
      }
    }

    if (!targetFilePath) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const fileBuffer = await fs.readFile(targetFilePath);
    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Gagal melayani berkas upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
