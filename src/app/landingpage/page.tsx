import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { NavbarLanding } from "@/components/landingpage/navbar-landing";
import {
  TabelCutiLanding,
  KaryawanCutiItem,
} from "@/components/landingpage/tabel-cuti-landing";

export const metadata = {
  title: "Karyawan Cuti Hari Ini - PG Trangkil",
  description:
    "Daftar resmi karyawan pimpinan & pelaksana yang sedang mengambil cuti hari ini di PT Kebon Agung - Pabrik Gula Trangkil.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const todayDMY = `${day}/${month}/${year}`;
  const todayYMD = `${year}-${month}-${day}`;
  const todayDMYHyphen = `${day}-${month}-${year}`;
  const searchFormats = [todayDMY, todayYMD, todayDMYHyphen];

  const tanggalHariIniFormatted = format(now, "EEEE, dd MMMM yyyy", {
    locale: id,
  });

  let daftarKaryawanCutiHariIni: KaryawanCutiItem[] = [];

  try {
    const rawCutiHariIni = await prisma.balanceActivity.findMany({
      where: {
        jenisTransaksi: "AMBIL_CUTI",
        OR: searchFormats.map((tf) => ({
          tglCuti: { contains: tf },
        })),
      },
      include: {
        employee: true,
      },
      orderBy: {
        tglTransaksi: "desc",
      },
    });

    const filtered = rawCutiHariIni.filter((row) => {
      const dates = (row.tglCuti || "").split(",").map((s) => s.trim());
      return dates.some((d) => searchFormats.includes(d));
    });

    daftarKaryawanCutiHariIni = filtered.map((row) => ({
      id: row.id,
      nip: row.nip,
      nama: row.employee?.nama || row.nama || "Karyawan",
      bagian: row.employee?.bagian || "-",
      stasiun: row.employee?.stasiun || "-",
      category: row.employee?.category || "PIMPINAN",
      jabatan: row.employee?.jabatan || "-",
      tglCuti: row.tglCuti || todayDMY,
      cutiTahunan: row.cutiTahunan,
      cutiBesar: row.cutiBesar,
      inhaldagen: row.inhaldagen,
      totalHari: row.totalHari,
      keperluan: row.keperluan || row.uraian || "-",
    }));
  } catch (error) {
    console.error("Gagal mengambil data cuti hari ini:", error);
    daftarKaryawanCutiHariIni = [];
  }

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#263238] flex flex-col font-sans relative overflow-hidden selection:bg-[#0789D1]/20 selection:text-[#005B96]">
      {/* Calm Non-Neon Ambient Glow Blobs based on Official Palette */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-[#0789D1]/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -right-32 w-[28rem] h-[28rem] bg-[#005B96]/8 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-1/3 w-80 h-80 bg-[#E8F5FC]/70 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 1. Header / Navbar */}
      <NavbarLanding />

      {/* 2. Main Content */}
      <main className="flex-1 py-5 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Header Title Section - Minimalist & Ringkas */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-[#E8F5FC]">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#263238] tracking-tight">
                Daftar Karyawan Cuti
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Monitoring status cuti kerja PT Kebon Agung Pabrik Gula Trangkil
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#E8F5FC] text-[#005B96] text-xs font-semibold shadow-2xs self-start sm:self-auto shrink-0">
              <Calendar className="h-3.5 w-3.5 text-[#0789D1]" />
              <span>{tanggalHariIniFormatted}</span>
            </div>
          </div>

          {/* Table & Metrics Component */}
          <TabelCutiLanding
            data={daftarKaryawanCutiHariIni}
            tanggalHariIniFormatted={tanggalHariIniFormatted}
          />
        </div>
      </main>
    </div>
  );
}
