import { NextResponse } from "next/server";
import { executeAutomatedLeaveAccrualsAction } from "@/actions/aksi-otomasi-saldo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.AUTH_SECRET;
    const url = new URL(request.url);
    const keyParam = url.searchParams.get("key");

    // Otorisasi: Wajib menyertakan Header 'Authorization: Bearer <AUTH_SECRET>' atau query '?key=<AUTH_SECRET>'
    const isAuthorized =
      Boolean(cronSecret) &&
      (authHeader === `Bearer ${cronSecret}` || keyParam === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Token otorisasi scheduler tidak valid.",
        },
        { status: 401 }
      );
    }

    const result = await executeAutomatedLeaveAccrualsAction({
      isSystemCall: true,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("Cron route GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error saat menjalankan scheduler otomatisasi cuti.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
