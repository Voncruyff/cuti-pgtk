"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/bersama/kartu-statistik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getCompanyProfileAction } from "@/actions/aksi-pengaturan";
import { formatDateIndo, formatSingkatanBagian } from "@/lib/utils";

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
  canManage?: boolean;
  userRole?: string;
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
  canManage = true,
  userRole,
  onUbahTabKategori,
  onUbahFilterBagian,
  onUbahFilterStasiun,
  onUbahSearch,
  onMuatUlang,
  onTambah,
  onEdit,
  onHapus,
}: PropsTabelKaryawan) {
  const [sortField, setSortField] = useState<string>("employeeNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [companyProfile, setCompanyProfile] = useState<{
    companyName: string;
    unitName: string;
    location: string;
    currentUserName: string;
  }>({
    companyName: "PT KEBON AGUNG",
    unitName: "PABRIK GULA TRANGKIL",
    location: "Trangkil, Pati, Jawa Tengah",
    currentUserName: "Administrator",
  });

  useEffect(() => {
    getCompanyProfileAction().then((res) => {
      if (res.success && res.data) {
        setCompanyProfile({
          companyName: res.data.companyName || "PT KEBON AGUNG",
          unitName: res.data.unitName || "PABRIK GULA TRANGKIL",
          location: res.data.location || "Trangkil, Pati, Jawa Tengah",
          currentUserName: res.data.currentUserName || "Administrator",
        });
      }
    });
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#0789D1] font-bold shrink-0" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#0789D1] font-bold shrink-0" />
    );
  };
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
    if (userRole !== "ADMIN_BAGIAN" && filterStasiun !== "ALL") {
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

  const sortedKaryawan = [...karyawanFiltered].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === "department") {
      aVal = a.department?.name || "";
      bVal = b.department?.name || "";
    } else {
      aVal = a[sortField as keyof typeof a] ?? "";
      bVal = b[sortField as keyof typeof b] ?? "";
    }

    if (typeof aVal === "string") {
      const res = aVal.localeCompare(bVal, "id", { sensitivity: "base", numeric: true });
      return sortDirection === "asc" ? res : -res;
    }

    return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
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
    <div className="space-y-6 w-full pb-12 print-page-wrapper print:p-0 print:m-0 print:space-y-0 print:max-w-none">
      {/* PRINT-ONLY OFFICIAL KOP SURAT PERUSAHAAN */}
      <div className="hidden print:block mb-4">
        {/* Header Kop: Logo PG Trangkil di Kiri & Alamat di Bawahnya */}
        <div className="border-b-2 border-black pb-2.5">
          <div className="flex flex-col items-start gap-1">
            <Image
              src="/assets/PGTrangkilLogo.png"
              alt="Logo PG Trangkil"
              width={180}
              height={36}
              priority
              className="h-9 w-auto object-contain"
            />
            <div className="text-[9px] text-black leading-tight mt-0.5 font-sans">
              {companyProfile.location}
            </div>
          </div>
        </div>

        {/* Judul Dokumen Resmi */}
        <div className="text-center mt-3 mb-2">
          <h1 className="text-sm font-black uppercase text-black tracking-wide">
            DAFTAR DATA MASTER KARYAWAN PG TRANGKIL
          </h1>
          <p className="text-[11px] text-black mt-0.5">
            Kategori: {tabKategori === "ALL" ? "Semua Karyawan" : tabKategori}
            {filterBagian !== "ALL" ? ` • Bagian: ${bagian.find(b => b.id === filterBagian)?.name || filterBagian}` : ""}
            {filterStasiun !== "ALL" ? ` • Stasiun: ${stasiun.find(s => s.id === filterStasiun)?.name || filterStasiun}` : ""}
          </p>
        </div>
      </div>

      {/* Tab Kategori & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3 print:hidden">
        <div className="flex items-center gap-1 p-1 bg-[#F3F6F8] rounded-xl border border-[#E8F5FC] w-fit">
          <button
            type="button"
            onClick={() => onUbahTabKategori("ALL")}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer select-none transition-colors"
          >
            {tabKategori === "ALL" && (
              <motion.div
                layoutId="tab-kategori-indicator"
                className="absolute inset-0 bg-white rounded-lg shadow-2xs border border-[#E8F5FC]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${tabKategori === "ALL" ? "text-[#263238] font-bold" : "text-[#6B7280] hover:text-[#263238]"}`}>
              <Users className="h-3.5 w-3.5" />
              Semua Karyawan
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${tabKategori === "ALL" ? "bg-[#E8F5FC] text-[#005B96] font-bold" : "bg-slate-200 text-slate-600"}`}>
                {isLoading ? "..." : karyawan.length}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUbahTabKategori("PIMPINAN")}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer select-none transition-colors"
          >
            {tabKategori === "PIMPINAN" && (
              <motion.div
                layoutId="tab-kategori-indicator"
                className="absolute inset-0 bg-white rounded-lg shadow-2xs border border-[#E8F5FC]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${tabKategori === "PIMPINAN" ? "text-[#0789D1] font-bold" : "text-[#6B7280] hover:text-[#0789D1]"}`}>
              <Briefcase className="h-3.5 w-3.5" />
              Pimpinan
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${tabKategori === "PIMPINAN" ? "bg-[#E8F5FC] text-[#0789D1] font-bold border border-[#0789D1]/20" : "bg-slate-200 text-slate-600"}`}>
                {isLoading ? "..." : jumlahPimpinan}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUbahTabKategori("PELAKSANA")}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer select-none transition-colors"
          >
            {tabKategori === "PELAKSANA" && (
              <motion.div
                layoutId="tab-kategori-indicator"
                className="absolute inset-0 bg-white rounded-lg shadow-2xs border border-[#E8F5FC]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${tabKategori === "PELAKSANA" ? "text-emerald-700 font-bold" : "text-[#6B7280] hover:text-emerald-700"}`}>
              <HardHat className="h-3.5 w-3.5" />
              Pelaksana
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${tabKategori === "PELAKSANA" ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200" : "bg-slate-200 text-slate-600"}`}>
                {isLoading ? "..." : jumlahPelaksana}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 print:hidden">
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
      <Card className="border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none print:bg-transparent print:p-0">
        {/* Card Header: Title & Action Button */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50/40 via-slate-50/20 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0789D1]" />
              Tabel Master Karyawan PG Trangkil
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Menampilkan {karyawanFiltered.length} dari {karyawan.length} karyawan terdata di sistem
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center print:hidden">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => window.print()}
              className="h-9 px-3.5 text-xs font-semibold gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              <span>Cetak</span>
            </Button>
            {canManage && (
              <Button
                onClick={onTambah}
                size="default"
                className="h-9 px-4 text-xs font-semibold gap-2 rounded-xl shadow-xs bg-[#0789D1] hover:bg-[#005B96] text-white cursor-pointer shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>Tambah Karyawan</span>
              </Button>
            )}
          </div>
        </div>

        {/* Toolbar: Search & Filters (Uniform h-9, rounded-xl) */}
        <div className="px-5 py-3 bg-[#F8FAFC]/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari NIP / nama..."
                value={searchQuery}
                onChange={(e) => onUbahSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs bg-white rounded-xl border-slate-200 focus-visible:ring-[#0789D1]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onUbahSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {userRole === "ADMIN_BAGIAN" ? (
              <div className="h-9 rounded-xl border border-sky-200 bg-sky-50/80 px-3 flex items-center text-xs font-semibold text-[#005B96] shadow-2xs select-none">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-[#0789D1]" />
                Bagian: {bagian[0]?.name || "Bagian Anda"}
              </div>
            ) : (
              <select
                value={filterBagian}
                onChange={(e) => {
                  onUbahFilterBagian(e.target.value);
                  onUbahFilterStasiun("ALL");
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-medium focus:border-[#0789D1] focus:ring-1 focus:ring-[#0789D1] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Bagian</option>
                {bagian.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            )}

            {userRole !== "ADMIN_BAGIAN" && (
              <select
                value={filterStasiun}
                onChange={(e) => onUbahFilterStasiun(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-medium focus:border-[#0789D1] focus:ring-1 focus:ring-[#0789D1] focus:outline-none cursor-pointer max-w-[190px]"
              >
                <option value="ALL">Semua Stasiun</option>
                {stasiunUntukFilterBagian.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onMuatUlang}
            disabled={isLoading}
            title="Muat ulang data"
            className="h-9 w-9 p-0 text-slate-500 rounded-xl border-slate-200 hover:bg-white hover:text-slate-700 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4 select-none">
              <div className="flex items-center justify-center py-4 gap-2 text-xs font-medium text-[#6B7280]">
                <Loader2 className="h-4 w-4 animate-spin text-[#0789D1]" />
                <span>Memuat data...</span>
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
            <div className="overflow-x-auto print:overflow-visible">
              <Table className="print:w-full print:border-collapse print:border print:border-black print:text-black">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px] print:bg-slate-100 print:text-black print:border-b print:border-black">
                    <TableHead className="w-12 text-center font-bold print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold">NO</TableHead>
                    <TableHead
                      onClick={() => handleSort("employeeNumber")}
                      className="w-24 font-bold cursor-pointer select-none group hover:text-slate-900 transition-colors print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>NIP</span>
                        {renderSortIcon("employeeNumber")}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("name")}
                      className="font-bold cursor-pointer select-none group hover:text-slate-900 transition-colors print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>NAMA KARYAWAN</span>
                        {renderSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("position")}
                      className="font-bold cursor-pointer select-none group hover:text-slate-900 transition-colors print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>JABATAN</span>
                        {renderSortIcon("position")}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("category")}
                      className="font-bold cursor-pointer select-none group hover:text-slate-900 transition-colors print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>JENIS</span>
                        {renderSortIcon("category")}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("department")}
                      className="font-bold cursor-pointer select-none group hover:text-slate-900 transition-colors print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>BAGIAN</span>
                        {renderSortIcon("department")}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("stasiun")}
                      className="font-bold cursor-pointer select-none group hover:text-slate-900 transition-colors print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>STASIUN</span>
                        {renderSortIcon("stasiun")}
                      </div>
                    </TableHead>
                    {canManage && <TableHead className="text-right font-bold w-20 print:hidden">AKSI</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedKaryawan.map((emp, index) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50/60 transition-colors print:border-b print:border-black">
                      <TableCell className="text-center text-xs font-medium text-slate-400 font-mono print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">{index + 1}</TableCell>
                      <TableCell className="print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                        <span className="font-mono font-bold text-xs print:text-black">{emp.employeeNumber}</span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">{emp.name}</TableCell>
                      <TableCell className="text-xs text-slate-600 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                        <div className="font-medium print:text-black">{emp.position || "-"}</div>
                        {emp.appointmentDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5 print:hidden">
                            SK: {formatTanggal(emp.appointmentDate)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                        <span className="text-[10px] font-semibold print:text-black">
                          {emp.category === "PELAKSANA" ? "Pelaksana" : "Pimpinan"}
                        </span>
                      </TableCell>
                      <TableCell className="print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                        <span className="font-bold text-[10px] print:text-black">
                          {emp.department.code || formatSingkatanBagian(emp.department.name)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                        <span className="text-[10px] print:text-black">
                          {emp.stasiun && emp.stasiun !== "-" ? emp.stasiun : "-"}
                        </span>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right print:hidden">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" title="Edit Karyawan" onClick={() => onEdit(emp)} className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700 cursor-pointer">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Hapus Karyawan" onClick={() => onHapus(emp)} disabled={isPending} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRINT-ONLY FOOTER: POJOK KIRI BAWAH KERTAS (HANYA NAMA & TANGGAL TANPA LABEL) */}
      <div className="hidden print:block print:fixed print:bottom-3 print:left-4 text-left text-[9px] text-black font-sans leading-tight">
        <div>{companyProfile.currentUserName}</div>
        <div>{formatDateIndo(new Date())}</div>
      </div>
    </div>
  );
}
