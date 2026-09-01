import Link from "next/link";
import {
  Users,
  CalendarDays,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  LayoutDashboard,
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

export default async function HalamanDashboard() {
  const user = await requireAuth();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let totalKaryawanAktif = 0;
  let transaksiBuilanIni = 0;
  let permohonanHariIni = 0;
  let daftarTransaksiTerbaru: Record<string, unknown>[] = [];

  try {
    totalKaryawanAktif = await prisma.employee.count({
      where: { isActive: true },
    });

    const baris: Record<string, unknown>[] = await prisma.$queryRaw`
      SELECT a.id, a.nip, a.nama, a.jenis_transaksi, a.uraian, a.tgl_transaksi, a.tgl_cuti, 
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

    permohonanHariIni = baris.filter(
      (r) =>
        r.jenis_transaksi === "AMBIL_CUTI" &&
        new Date(String(r.tgl_transaksi || r.created_at)) >= startOfToday
    ).length;

    daftarTransaksiTerbaru = baris;
  } catch {
    // Database tidak tersedia — tampilkan data kosong
    totalKaryawanAktif = 0;
    transaksiBuilanIni = 0;
    permohonanHariIni = 0;
  }

  const pintasPintas = [
    {
      title: "Pengambilan Cuti",
      desc: "Input form permohonan cuti",
      href: "/ambil-cuti",
      icon: CalendarDays,
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Tambah Saldo",
      desc: "Tambah saldo cuti karyawan",
      href: "/tambah-saldo-cuti",
      icon: PlusCircle,
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Rincian Cuti",
      desc: "Lihat saldo & histori per karyawan",
      href: "/rincian-cuti",
      icon: FileText,
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Laporan Cuti",
      desc: "Laporan rekap & cetak dokumen",
      href: "/laporan-cuti",
      icon: FileSpreadsheet,
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Master Karyawan",
      desc: "Kelola data karyawan & NIP",
      href: "/master-karyawan",
      icon: Users,
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
  ];

  const pintasTerlihat = pintasPintas.filter((s) => s.roles.includes(user.role));

  const getBadgeJenisCuti = (kode: string) => {
    switch (kode) {
      case "ANNUAL":
      case "TAHUNAN":
        return <Badge variant="default">Tahunan</Badge>;
      case "LONG_LEAVE":
      case "BESAR":
        return <Badge variant="longLeave">Besar</Badge>;
      case "INHALDAGEN":
        return <Badge variant="inhaldagen">Inhaldagen</Badge>;
      default:
        return <Badge variant="outline">{kode}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Hero Welcome Banner */}
      <div className="flex flex-col items-center text-center pt-2 pb-1 space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Sistem Informasi Pengelolaan Cuti
        </h2>
        <p className="text-xs text-slate-500 max-w-lg">
          Layanan terpadu pengelolaan kuota cuti tahunan, cuti besar, dan inhaldagen karyawan pimpinan & pelaksana secara akurat dan realtime.
        </p>
      </div>

      {/* Kartu Statistik Operasional */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <StatCard title="Total Karyawan Aktif" value={totalKaryawanAktif} badgeText="Pimpinan & Pelaksana" icon={Users} variant="sky" />
        <StatCard title="Transaksi Bulan Ini" value={transaksiBuilanIni} badgeText="Mutasi Ledger Aktif" icon={CheckCircle2} variant="emerald" />
        <StatCard title="Permohonan Hari Ini" value={permohonanHariIni} badgeText="Pengajuan Terkini" icon={Clock} variant="indigo" />
      </div>

      {/* Menu Pintasan */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-[#0084c7]" />
            Menu Operasional Cuti
          </h3>
          <span className="text-[11px] text-slate-400">Pilih modul untuk memulai</span>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {pintasTerlihat.map((pintasan) => {
            const Icon = pintasan.icon;
            return (
              <Link key={pintasan.title} href={pintasan.href}>
                <Card className="hover:border-sky-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full group bg-white border-slate-200/85">
                  <CardContent className="p-4 flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0084c7] to-[#0093dc] text-white shadow-xs group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#0084c7] transition-colors">{pintasan.title}</p>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#0084c7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{pintasan.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tabel Transaksi Terbaru */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3.5">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Transaksi Terbaru</CardTitle>
            <CardDescription className="text-[11px]">Mutasi ledger saldo cuti terakhir</CardDescription>
          </div>
          <Link href="/cuti/rincian">
            <Button variant="outline" size="sm" className="font-semibold text-[#0084c7] hover:text-[#0077b6] hover:bg-sky-50">
              Lihat Semua
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
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
                  const totalHari = Number(tx.total_hari || (Number(tx.cuti_tahunan || 0) + Number(tx.cuti_besar || 0) + Number(tx.inhaldagen || 0)));
                  const txDate = tx.tgl_transaksi || tx.created_at || new Date();
                  return (
                    <TableRow key={String(tx.id)}>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {formatDateIndo(new Date(String(txDate)))}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-xs">{String(tx.nama || "Karyawan")}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIP: {String(tx.nip)}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700" title={String(tx.bagian || "-")}>
                          {formatSingkatanBagian(String(tx.bagian || "-"))}
                        </Badge>
                        {!!tx.stasiun && String(tx.stasiun) !== "-" && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">{String(tx.stasiun)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isAmbil ? "default" : "secondary"}>
                          {isAmbil ? "Ambil Cuti" : "Tambah Saldo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 max-w-[220px] truncate">
                        {String(tx.uraian || tx.keperluan || (isAmbil ? "Pengambilan Cuti" : "Penambahan Saldo"))}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold text-xs tabular-nums ${isAmbil ? "text-red-700" : "text-emerald-700"}`}>
                        {isAmbil ? `-${totalHari}` : `+${totalHari}`} hari
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
