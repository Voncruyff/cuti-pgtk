"use client";

import {
  Users,
  Search,
  Building2,
  Trash2,
  Pencil,
  Loader2,
  X,
  Factory,
  Briefcase,
  HardHat,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/bersama/kartu-statistik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatSingkatanBagian } from "@/lib/utils";

export interface ItemKaryawan {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  category?: string;
  departmentId: string;
  department: {
    id: string;
    code: string;
    name: string;
  };
  stationId?: string | null;
  stasiun?: string;
  stationCode?: string;
  appointmentDate?: string | null;
  balances: {
    annual: number;
    longLeave: number;
    inhaldagen: number;
    total: number;
  };
}

export interface PilihanBagian {
  id: string;
  code: string;
  name: string;
}

export interface PilihanStasiun {
  id: string;
  code: string;
  name: string;
  departmentId: string | null;
  departmentName: string;
}

interface PropsTabelKaryawan {
  karyawan: ItemKaryawan[];
  bagian: PilihanBagian[];
  stasiun: PilihanStasiun[];
  isLoading: boolean;
  isPending: boolean;
  tabKategori: "ALL" | "PIMPINAN" | "PELAKSANA";
  filterBagian: string;
  filterStasiun: string;
  searchQuery: string;
  onUbahTabKategori: (tab: "ALL" | "PIMPINAN" | "PELAKSANA") => void;
  onUbahFilterBagian: (val: string) => void;
  onUbahFilterStasiun: (val: string) => void;
  onUbahSearch: (val: string) => void;
  onMuatUlang: () => void;
  onTambah: () => void;
  onEdit: (karyawan: ItemKaryawan) => void;
  onHapus: (karyawan: ItemKaryawan) => void;
}

export function TabelKaryawan({
  karyawan,
  bagian,
  stasiun,
  isLoading,
  isPending,
  tabKategori,
  filterBagian,
  filterStasiun,
  searchQuery,
  onUbahTabKategori,
  onUbahFilterBagian,
  onUbahFilterStasiun,
  onUbahSearch,
  onMuatUlang,
  onTambah,
  onEdit,
  onHapus,
}: PropsTabelKaryawan) {
  const stasiunUntukFilterBagian = stasiun.filter((s) => {
    if (filterBagian === "ALL") return true;
    const targetBagian = bagian.find(
      (d) => d.id === filterBagian || d.name === filterBagian || d.code === filterBagian
    );
    return (
      s.departmentId === filterBagian ||
      (targetBagian && s.departmentName.toLowerCase() === targetBagian.name.toLowerCase())
    );
  });

  const karyawanFiltered = karyawan.filter((emp) => {
    if (tabKategori !== "ALL") {
      const empCat = emp.category || "PIMPINAN";
      if (empCat !== tabKategori) return false;
    }
    if (filterBagian !== "ALL") {
      const targetBagian = bagian.find(
        (d) => d.id === filterBagian || d.name === filterBagian || d.code === filterBagian
      );
      const cocokBagian =
        emp.departmentId === filterBagian ||
        (targetBagian && emp.department.name.toLowerCase() === targetBagian.name.toLowerCase()) ||
        (targetBagian && emp.department.code.toLowerCase() === targetBagian.code.toLowerCase());
      if (!cocokBagian) return false;
    }
    if (filterStasiun !== "ALL") {
      const cocokStasiun =
        (emp.stasiun && emp.stasiun.toLowerCase() === filterStasiun.toLowerCase()) ||
        emp.stationId === filterStasiun;
      if (!cocokStasiun) return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const cocokSearch =
        emp.employeeNumber.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        (emp.stasiun && emp.stasiun.toLowerCase().includes(q)) ||
        emp.department.name.toLowerCase().includes(q);
      if (!cocokSearch) return false;
    }
    return true;
  });

  const jumlahPimpinan = karyawan.filter((e) => !e.category || e.category === "PIMPINAN").length;
  const jumlahPelaksana = karyawan.filter((e) => e.category === "PELAKSANA").length;

  const formatTanggal = (val: Date | string | null | undefined) => {
    if (!val) return null;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Tab Kategori & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg border border-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => onUbahTabKategori("ALL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              tabKategori === "ALL"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Semua Karyawan
            <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${tabKategori === "ALL" ? "bg-slate-100 text-slate-800 font-bold" : "bg-slate-200 text-slate-600"}`}>
              {isLoading ? "..." : karyawan.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUbahTabKategori("PIMPINAN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              tabKategori === "PIMPINAN"
                ? "bg-white text-[#0084c7] shadow-2xs font-bold"
                : "text-slate-600 hover:text-[#0084c7] hover:bg-white/50"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Pimpinan
            <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${tabKategori === "PIMPINAN" ? "bg-sky-50 text-[#0084c7] font-bold border border-sky-100" : "bg-slate-200 text-slate-600"}`}>
              {isLoading ? "..." : jumlahPimpinan}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUbahTabKategori("PELAKSANA")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              tabKategori === "PELAKSANA"
                ? "bg-white text-emerald-700 shadow-2xs font-bold"
                : "text-slate-600 hover:text-emerald-700 hover:bg-white/50"
            }`}
          >
            <HardHat className="h-3.5 w-3.5" />
            Pelaksana
            <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${tabKategori === "PELAKSANA" ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100" : "bg-slate-200 text-slate-600"}`}>
              {isLoading ? "..." : jumlahPelaksana}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button onClick={onTambah} size="default" className="font-semibold shadow-xs">
            <Users className="h-4 w-4" />
            Tambah Karyawan
          </Button>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Karyawan"
          value={isLoading ? "..." : `${karyawan.length} Orang`}
          subtitle="Pegawai terdaftar"
          icon={Users}
          variant="sky"
        />
        <StatCard
          title="Karyawan Pimpinan"
          value={isLoading ? "..." : `${jumlahPimpinan} Orang`}
          subtitle="Hak cuti pimpinan"
          icon={Briefcase}
          variant="indigo"
        />
        <StatCard
          title="Karyawan Pelaksana"
          value={isLoading ? "..." : `${jumlahPelaksana} Orang`}
          subtitle="Hak cuti pelaksana"
          icon={HardHat}
          variant="emerald"
        />
        <StatCard
          title="Bagian & Stasiun"
          value={isLoading ? "..." : `${bagian.length} Bagian`}
          subtitle={`${stasiun.length} Stasiun kerja`}
          icon={Building2}
          variant="purple"
        />
      </div>

      {/* Tabel Utama */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100/90 bg-gradient-to-r from-sky-50/50 via-slate-50/30 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0093dc]" />
              Tabel Master Karyawan PG Trangkil
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Menampilkan {karyawanFiltered.length} dari {karyawan.length} karyawan terdata di sistem
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-44 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari NIP / nama..."
                value={searchQuery}
                onChange={(e) => onUbahSearch(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs bg-white focus-visible:ring-[#0093dc]"
              />
              {searchQuery && (
                <button type="button" onClick={() => onUbahSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={filterBagian}
              onChange={(e) => { onUbahFilterBagian(e.target.value); onUbahFilterStasiun("ALL"); }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:border-[#0093dc] focus:outline-none"
            >
              <option value="ALL">Semua Bagian</option>
              {bagian.map((d) => (<option key={d.id} value={d.id}>{d.code} - {d.name}</option>))}
            </select>

            <select
              value={filterStasiun}
              onChange={(e) => onUbahFilterStasiun(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:border-[#0093dc] focus:outline-none max-w-[180px]"
            >
              <option value="ALL">Semua Stasiun</option>
              {stasiunUntukFilterBagian.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
            </select>

            <Button variant="outline" size="sm" onClick={onMuatUlang} disabled={isLoading} title="Muat ulang data" className="h-8 w-8 p-0 text-slate-500">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4 select-none">
              <div className="flex items-center justify-center p-4 gap-3 text-xs font-semibold text-sky-800 bg-sky-50/70 rounded-xl border border-sky-100/90 shadow-2xs">
                <Loader2 className="h-4 w-4 animate-spin text-[#0084c7]" />
                <span>Sedang mengambil dan menyinkronkan data karyawan dari MySQL...</span>
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-8 bg-slate-200/80 rounded font-mono" />
                      <div className="h-6 w-20 bg-sky-100/70 rounded-full" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-40 bg-slate-200 rounded" />
                        <div className="h-3 w-28 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                      <div className="h-5 w-20 bg-slate-100 rounded-full" />
                      <div className="h-5 w-24 bg-slate-100 rounded" />
                      <div className="h-5 w-24 bg-slate-100 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                      <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : karyawanFiltered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {karyawan.length === 0 ? "Belum Ada Data Karyawan" : "Tidak Ada Data yang Sesuai"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {karyawan.length === 0
                  ? "Klik '+ Tambah Karyawan' untuk mulai menginput data karyawan."
                  : `Tidak ditemukan karyawan dengan filter yang dipilih atau kata kunci "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px]">
                    <TableHead className="w-12 text-center font-bold">NO</TableHead>
                    <TableHead className="w-24 font-bold">NIP</TableHead>
                    <TableHead className="font-bold">NAMA KARYAWAN</TableHead>
                    <TableHead className="font-bold">JABATAN</TableHead>
                    <TableHead className="font-bold">JENIS</TableHead>
                    <TableHead className="font-bold">BAGIAN</TableHead>
                    <TableHead className="font-bold">STASIUN</TableHead>
                    <TableHead className="text-right font-bold w-20">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {karyawanFiltered.map((emp, index) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-center text-xs font-medium text-slate-400 font-mono">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="code" className="text-xs px-2.5 py-0.5">{emp.employeeNumber}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">{emp.name}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div className="font-medium">{emp.position || "-"}</div>
                        {emp.appointmentDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5 text-slate-400" />
                            SK: {formatTanggal(emp.appointmentDate)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {emp.category === "PELAKSANA" ? (
                          <Badge variant="success" className="text-[10px]">Pelaksana</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Pimpinan</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[11px] bg-slate-50 border-slate-200 text-slate-700" title={emp.department.name}>
                          <Building2 className="h-3 w-3 mr-1 text-slate-400" />
                          {emp.department.code || formatSingkatanBagian(emp.department.name)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {emp.stasiun && emp.stasiun !== "-" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-[11px]">
                            <Factory className="h-3 w-3 text-slate-400" />
                            {emp.stasiun}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Semua / Belum Ada</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" title="Edit Karyawan" onClick={() => onEdit(emp)} className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Hapus Karyawan" onClick={() => onHapus(emp)} disabled={isPending} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
