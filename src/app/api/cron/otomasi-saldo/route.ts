import { NextResponse } from "next/server";
import { executeAutomatedLeaveAccrualsAction } from "@/actions/aksi-otomasi-saldo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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
