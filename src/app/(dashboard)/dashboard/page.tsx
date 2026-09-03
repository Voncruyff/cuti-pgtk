import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  CalendarOff,
  ArrowUpRight,
  CalendarDays,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/bersama/kartu-statistik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDateIndo, formatSingkatanBagian } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dasbor Sistem Pengelolaan Cuti Karyawan PG Trangkil",
};

function getInitials(name: string): string {
  if (!name) return "K";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function HalamanDashboard() {
  const user = await requireAuth();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const d2 = pad(now.getDate());
  const m2 = pad(now.getMonth() + 1);
  const y4 = now.getFullYear();

  const todayDMY = `${d2}/${m2}/${y4}`;
  const todayDMYShort = `${now.getDate()}/${now.getMonth() + 1}/${y4}`;
  const todayYMD = `${y4}-${m2}-${d2}`;
  const searchFormats = [todayDMY, todayDMYShort, todayYMD];

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalKaryawanAktif = 0;
  let transaksiBuilanIni = 0;
  let daftarTransaksiTerbaru: Record<string, unknown>[] = [];
  let daftarKaryawanCutiHariIni: Array<{
    id: string;
    nip: string;
    nama: string;
    bagian: string;
    stasiun: string;
    category: string;
    jabatan: string;
    tglCuti: string;
    cutiTahunan: number;
    cutiBesar: number;
    inhaldagen: number;
    totalHari: number;
    keperluan: string;
  }> = [];

  try {
    totalKaryawanAktif = await prisma.employee.count({
      where: { isActive: true },
    });

    // 1. Ambil Karyawan yang sedang Cuti Hari Ini
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
      const isToday = dates.some((d) => searchFormats.includes(d));
      if (!isToday) return false;

      if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
        const empDept = (row.employee?.bagian || "").toLowerCase();
        const userDept = user.department.toLowerCase();
        return empDept.includes(userDept) || userDept.includes(empDept);
      }
      return true;
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

    // 2. Ambil Transaksi Mutasi Terbaru
    const baris: Record<string, unknown>[] = await prisma.$queryRaw`
      SELECT a.id, a.nip, COALESCE(k.nama, a.nama) as nama, a.jenis_transaksi, a.uraian, a.tgl_transaksi, a.tgl_cuti, 
             a.cuti_tahunan, a.cuti_besar, a.inhaldagen, a.total_hari, a.keperluan, a.created_at,
             k.bagian, k.stasiun, k.category, k.jabatan
      FROM aktivitas_saldo a
      LEFT JOIN karyawan k ON a.nip = k.nip
      ORDER BY a.tgl_transaksi DESC
      LIMIT 8
    `;

    transaksiBuilanIni = baris.filter(
      (r) => new Date(String(r.tgl_transaksi || r.created_at)) >= startOfMonth
    ).length;

    daftarTransaksiTerbaru = baris;
  } catch {
    totalKaryawanAktif = 0;
    transaksiBuilanIni = 0;
    daftarKaryawanCutiHariIni = [];
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Hero Welcome Banner */}
      <div className="flex flex-col items-center text-center pt-2 pb-1 space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black text-[#263238] tracking-tight">
          Sistem Informasi Pengelolaan Cuti
        </h2>
        <p className="text-xs text-[#6B7280] max-w-lg">
          Layanan terpadu pengelolaan kuota cuti tahunan, cuti besar, dan inhaldagen karyawan pimpinan & pelaksana secara akurat dan realtime.
        </p>
      </div>

      {/* Kartu Statistik Operasional */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <StatCard
          title="Total Karyawan Aktif"
          value={totalKaryawanAktif}
          badgeText="Pimpinan & Pelaksana"
          icon={Users}
          variant="sky"
        />
        <StatCard
          title="Transaksi Bulan Ini"
          value={transaksiBuilanIni}
          badgeText="Mutasi Ledger Aktif"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Karyawan Cuti Hari Ini"
          value={daftarKaryawanCutiHariIni.length}
          badgeText="Sedang Izin / Cuti"
          icon={CalendarOff}
          variant={daftarKaryawanCutiHariIni.length > 0 ? "amber" : "indigo"}
        />
      </div>

      {/* Bagian: Karyawan Cuti Hari Ini */}
      <Card className="border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden bg-white">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-3.5 bg-gradient-to-r from-[#E8F5FC]/35 via-white to-transparent border-b border-[#E8F5FC]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F5FC] text-[#0789D1] border border-[#0789D1]/20 shrink-0">
              <CalendarOff className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-[#263238]">
                  Karyawan Cuti Hari Ini
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    daftarKaryawanCutiHariIni.length > 0
                      ? "bg-amber-50 text-amber-800 border-amber-200 font-bold text-[10px]"
                      : "bg-[#E8F5FC] text-[#005B96] border-[#0789D1]/30 font-bold text-[10px]"
                  }
                >
                  {daftarKaryawanCutiHariIni.length > 0
                    ? `${daftarKaryawanCutiHariIni.length} Karyawan`
                    : "0 Karyawan"}
                </Badge>
              </div>
              <CardDescription className="text-[11px] text-[#6B7280]">
                Daftar karyawan yang sedang mengambil hak cuti aktif pada {formatDateIndo(now)}
              </CardDescription>
            </div>
          </div>
          <Link href="/laporan-cuti">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-[#005B96] hover:text-[#0789D1] hover:bg-[#E8F5FC] h-8 gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Buka Laporan Cuti</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {daftarKaryawanCutiHariIni.length === 0 ? (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 border border-emerald-100">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Tidak ada karyawan yang sedang cuti hari ini
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                Seluruh karyawan aktif pimpinan dan pelaksana tercatat hadir bertugas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Karyawan & NIP</TableHead>
                    <TableHead>Bagian & Stasiun</TableHead>
                    <TableHead>Jenis Cuti</TableHead>
                    <TableHead>Jadwal Cuti</TableHead>
                    <TableHead>Keperluan</TableHead>
                    <TableHead className="text-right w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daftarKaryawanCutiHariIni.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-[#E8F5FC]/30 transition-colors">
                      <TableCell className="text-center font-mono text-xs text-[#6B7280]">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-[#263238] leading-snug">
                            {item.nama}
                          </div>
                          <div className="text-[10px] text-[#6B7280] font-mono">
                            NIP: {item.nip}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F3F6F8] border-[#E8F5FC] text-[#263238]"
                          title={item.bagian}
                        >
                          {formatSingkatanBagian(item.bagian || "-")}
                        </Badge>
                        {item.stasiun && item.stasiun !== "-" && (
                          <span className="text-[10px] text-[#6B7280] block mt-0.5">
                            {item.stasiun}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.cutiTahunan > 0 && (
                            <Badge variant="default" className="text-[10px]">
                              Tahunan ({item.cutiTahunan}h)
                            </Badge>
                          )}
                          {item.cutiBesar > 0 && (
                            <Badge variant="longLeave" className="text-[10px]">
                              Besar ({item.cutiBesar}h)
                            </Badge>
                          )}
                          {item.inhaldagen > 0 && (
                            <Badge variant="inhaldagen" className="text-[10px]">
                              Inhaldagen ({item.inhaldagen}h)
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div
                          className="text-xs font-medium text-[#263238] line-clamp-2"
                          title={item.tglCuti}
                        >
                          {item.tglCuti}
                        </div>
                        <span className="text-[10px] text-[#6B7280] font-mono">
                          Total {item.totalHari} hari
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs text-[#6B7280]">
                        {item.keperluan || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/rincian-cuti?nip=${item.nip}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-[11px] font-semibold text-[#005B96] hover:text-[#0789D1] hover:bg-[#E8F5FC] border-[#E8F5FC] cursor-pointer"
                          >
                            Rincian
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabel Transaksi Terbaru */}
      <Card className="border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-white">
        <CardHeader className="flex flex-row items-center justify-between py-3.5 border-b border-[#E8F5FC] bg-gradient-to-r from-[#E8F5FC]/35 via-white to-transparent">
          <div>
            <CardTitle className="text-sm font-bold text-[#263238]">
              Transaksi Terbaru
            </CardTitle>
            <CardDescription className="text-[11px] text-[#6B7280]">
              Mutasi ledger saldo cuti terakhir
            </CardDescription>
          </div>
          <Link href="/rincian-cuti">
            <Button
              variant="outline"
              size="sm"
              className="font-semibold text-[#005B96] hover:text-[#0789D1] hover:bg-[#E8F5FC] border-[#E8F5FC] cursor-pointer"
            >
              Lihat Semua
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Tanggal</TableHead>
                  <TableHead>Karyawan & NIP</TableHead>
                  <TableHead>Bagian & Stasiun</TableHead>
                  <TableHead>Jenis Transaksi</TableHead>
                  <TableHead>Uraian / Keperluan</TableHead>
                  <TableHead className="text-right">Jumlah Hari</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftarTransaksiTerbaru.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500 text-xs">
                      Belum ada transaksi cuti tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  daftarTransaksiTerbaru.map((tx) => {
                    const isAmbil = tx.jenis_transaksi === "AMBIL_CUTI";
                    const totalHari = Number(
                      tx.total_hari ||
                        Number(tx.cuti_tahunan || 0) +
                          Number(tx.cuti_besar || 0) +
                          Number(tx.inhaldagen || 0)
                    );
                    const txDate = tx.tgl_transaksi || tx.created_at || new Date();
                    return (
                      <TableRow key={String(tx.id)} className="hover:bg-slate-50/70">
                        <TableCell className="font-mono text-xs text-slate-600">
                          {formatDateIndo(new Date(String(txDate)))}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 text-xs">
                            {String(tx.nama || "Karyawan")}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            NIP: {String(tx.nip)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700"
                            title={String(tx.bagian || "-")}
                          >
                            {formatSingkatanBagian(String(tx.bagian || "-"))}
                          </Badge>
                          {!!tx.stasiun && String(tx.stasiun) !== "-" && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {String(tx.stasiun)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isAmbil ? "default" : "secondary"}>
                            {isAmbil ? "Ambil Cuti" : "Tambah Saldo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 max-w-[220px] truncate">
                          {String(
                            tx.uraian ||
                              tx.keperluan ||
                              (isAmbil ? "Pengambilan Cuti" : "Penambahan Saldo")
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-bold text-xs tabular-nums ${
                            isAmbil ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {isAmbil ? `-${totalHari}` : `+${totalHari}`} hari
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
