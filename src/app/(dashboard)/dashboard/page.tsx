import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { formatDateIndo, formatSingkatanBagian } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dasbor Sistem Pengelolaan Cuti Karyawan PG Trangkil",
};

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
  const namaBulanSekarang = now.toLocaleDateString("id-ID", { month: "long" });

  let totalKaryawanAktif = 0;
  let totalPimpinan = 0;
  let totalPelaksana = 0;
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

    const [pimpinanCount, pelaksanaCount] = await Promise.all([
      prisma.employee.count({
        where: { isActive: true, category: "PIMPINAN" },
      }),
      prisma.employee.count({
        where: { isActive: true, category: "PELAKSANA" },
      }),
    ]);
    totalPimpinan = pimpinanCount;
    totalPelaksana = pelaksanaCount;

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
      LIMIT 7
    `;

    transaksiBuilanIni = baris.filter(
      (r) => new Date(String(r.tgl_transaksi || r.created_at)) >= startOfMonth
    ).length;

    daftarTransaksiTerbaru = baris;
  } catch {
    totalKaryawanAktif = 0;
    totalPimpinan = 0;
    totalPelaksana = 0;
    transaksiBuilanIni = 0;
    daftarKaryawanCutiHariIni = [];
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header Dashboard Minimalis */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDateIndo(now)} &bull; PG Trangkil
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link href="/laporan-cuti">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border-slate-200/80 rounded-xl cursor-pointer shadow-2xs"
            >
              Laporan Cuti
            </Button>
          </Link>
          <Link href="/ambil-cuti">
            <Button
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold bg-[#0093dc] hover:bg-[#0084c7] text-white rounded-xl shadow-2xs cursor-pointer"
            >
              + Ambil Cuti
            </Button>
          </Link>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* BENTO 1 (Point Utama): Karyawan Cuti Hari Ini */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Cuti Hari Ini
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar karyawan yang sedang izin cuti
                </p>
              </div>

              {daftarKaryawanCutiHariIni.length > 0 ? (
                <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-semibold">
                  {daftarKaryawanCutiHariIni.length} orang cuti
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold">
                  Semua Masuk
                </span>
              )}
            </div>

            {/* List atau Status Kosong */}
            {daftarKaryawanCutiHariIni.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                  0
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tidak ada karyawan yang cuti hari ini
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-medium">
                      <th className="pb-2">Karyawan</th>
                      <th className="pb-2">Bagian</th>
                      <th className="pb-2">Jenis Cuti</th>
                      <th className="pb-2">Jadwal</th>
                      <th className="pb-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {daftarKaryawanCutiHariIni.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3">
                          <div className="font-semibold text-slate-900">{item.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NIP {item.nip}</div>
                        </td>
                        <td className="py-3 text-slate-600">
                          <div>{formatSingkatanBagian(item.bagian || "-")}</div>
                          {item.stasiun && item.stasiun !== "-" && (
                            <span className="text-[10px] text-slate-400">{item.stasiun}</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
                            {item.cutiTahunan > 0
                              ? "Tahunan"
                              : item.cutiBesar > 0
                              ? "Besar"
                              : "Inhaldagen"}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-600">
                          {item.tglCuti}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/rincian-cuti?nip=${item.nip}`}
                            className="text-xs font-semibold text-[#0093dc] hover:text-sky-800"
                          >
                            Detail &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400 mt-2">
            <span>{totalKaryawanAktif} total karyawan aktif</span>
            <Link
              href="/laporan-cuti"
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Lihat laporan lengkap &rarr;
            </Link>
          </div>
        </div>

        {/* BENTO 2: Ringkasan Samping (Total Karyawan & Aktivitas Bulan Ini) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Bento Card: Total Karyawan */}
          <div className="bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-2xs flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Karyawan</span>
              <span className="text-[10px] text-slate-400">Aktif</span>
            </div>

            <div className="my-3">
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {totalKaryawanAktif}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                  {totalPimpinan} Pimpinan
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                  {totalPelaksana} Pelaksana
                </span>
              </div>
            </div>

            <Link
              href="/kelola-user"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 pt-2 border-t border-slate-100 inline-flex items-center justify-between"
            >
              <span>Data Karyawan</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Bento Card: Cuti Bulan Ini */}
          <div className="bg-white border border-slate-200/80 rounded-[22px] p-5 shadow-2xs flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cuti Bulan Ini</span>
              <span className="text-[10px] text-slate-400">{namaBulanSekarang}</span>
            </div>

            <div className="my-3">
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {transaksiBuilanIni}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pengambilan & penambahan cuti
              </p>
            </div>

            <Link
              href="/laporan-cuti"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 pt-2 border-t border-slate-100 inline-flex items-center justify-between"
            >
              <span>Rekapitulasi Cuti</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* BENTO 3: Aktivitas Terkini (Full Width) */}
        <div className="lg:col-span-12 bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Aktivitas Terbaru
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Catatan mutasi cuti terakhir
              </p>
            </div>
            <Link
              href="/laporan-cuti"
              className="text-xs font-semibold text-[#0093dc] hover:text-sky-800"
            >
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-medium">
                  <th className="py-3">Tanggal</th>
                  <th className="py-3">Karyawan</th>
                  <th className="py-3">Bagian</th>
                  <th className="py-3">Jenis</th>
                  <th className="py-3">Keterangan</th>
                  <th className="py-3 text-right">Hari</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {daftarTransaksiTerbaru.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Belum ada transaksi cuti tercatat.
                    </td>
                  </tr>
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
                      <tr key={String(tx.id)} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDateIndo(new Date(String(txDate)))}
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-900">
                            {String(tx.nama || "Karyawan")}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIP {String(tx.nip)}
                          </div>
                        </td>
                        <td className="py-3 text-slate-600">
                          <div>{formatSingkatanBagian(String(tx.bagian || "-"))}</div>
                          {!!tx.stasiun && String(tx.stasiun) !== "-" && (
                            <span className="text-[10px] text-slate-400">
                              {String(tx.stasiun)}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              isAmbil
                                ? "bg-blue-50 text-blue-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isAmbil ? "Ambil Cuti" : "Tambah Saldo"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 max-w-[260px] truncate">
                          {String(
                            tx.uraian ||
                              tx.keperluan ||
                              (isAmbil ? "Pengambilan Cuti" : "Penambahan Saldo")
                          )}
                        </td>
                        <td
                          className={`py-3 text-right font-mono font-semibold text-xs whitespace-nowrap ${
                            isAmbil ? "text-slate-900" : "text-emerald-700"
                          }`}
                        >
                          {isAmbil ? `-${totalHari}` : `+${totalHari}`} hari
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
