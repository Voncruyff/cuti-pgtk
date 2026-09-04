"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Users,
  Briefcase,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  X,
  Eye,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface KaryawanCutiItem {
  id: string;
  nip: string;
  nama: string;
  bagian: string;
  stasiun: string;
  category: string; // PIMPINAN / PELAKSANA
  jabatan: string;
  tglCuti: string;
  cutiTahunan: number | null;
  cutiBesar: number | null;
  inhaldagen: number | null;
  totalHari: number | null;
  keperluan: string;
}

interface TabelCutiLandingProps {
  data: KaryawanCutiItem[];
  tanggalHariIniFormatted: string;
}

function parseAndFormatDatesLong(tglString: string): string[] {
  if (!tglString) return [];
  const parts = tglString.split(",").map((s) => s.trim()).filter(Boolean);
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return parts.map((p) => {
    const match = p.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const d = String(parseInt(match[1], 10)).padStart(2, "0");
      const m = parseInt(match[2], 10) - 1;
      const y = match[3];
      return `${d} ${monthNames[m] || ""} ${y}`;
    }
    return p;
  });
}

export function TabelCutiLanding({ data, tanggalHariIniFormatted }: TabelCutiLandingProps) {
  const [query, setQuery] = useState("");
  const [filterKategori, setFilterKategori] = useState<"SEMUA" | "PIMPINAN" | "PELAKSANA">("SEMUA");
  const [filterJenis, setFilterJenis] = useState<"SEMUA" | "TAHUNAN" | "BESAR" | "INHALDAGEN">("SEMUA");
  const [selectedKaryawan, setSelectedKaryawan] = useState<KaryawanCutiItem | null>(null);
  const [sortField, setSortField] = useState<string>("nama");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  // Summary metrics
  const totalCount = data.length;
  const countPimpinan = data.filter((d) => (d.category || "").toUpperCase() === "PIMPINAN").length;
  const countPelaksana = data.filter((d) => (d.category || "").toUpperCase() === "PELAKSANA").length;
  const countTahunan = data.filter((d) => d.cutiTahunan !== null && Number(d.cutiTahunan) !== 0).length;
  const countBesar = data.filter((d) => d.cutiBesar !== null && Number(d.cutiBesar) !== 0).length;
  const countInhaldagen = data.filter((d) => d.inhaldagen !== null && Number(d.inhaldagen) !== 0).length;

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Kategori Filter
      if (filterKategori !== "SEMUA") {
        if ((item.category || "").toUpperCase() !== filterKategori) return false;
      }

      // 2. Jenis Cuti Filter
      if (filterJenis === "TAHUNAN") {
        if (!item.cutiTahunan || Number(item.cutiTahunan) === 0) return false;
      } else if (filterJenis === "BESAR") {
        if (!item.cutiBesar || Number(item.cutiBesar) === 0) return false;
      } else if (filterJenis === "INHALDAGEN") {
        if (!item.inhaldagen || Number(item.inhaldagen) === 0) return false;
      }

      // 3. Text Search
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchNama = (item.nama || "").toLowerCase().includes(q);
        const matchNip = (item.nip || "").toLowerCase().includes(q);
        const matchBagian = (item.bagian || "").toLowerCase().includes(q);
        const matchStasiun = (item.stasiun || "").toLowerCase().includes(q);
        const matchJabatan = (item.jabatan || "").toLowerCase().includes(q);
        const matchKeperluan = (item.keperluan || "").toLowerCase().includes(q);
        return matchNama || matchNip || matchBagian || matchStasiun || matchJabatan || matchKeperluan;
      }

      return true;
    });
  }, [data, query, filterKategori, filterJenis]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a] ?? "";
      let bVal: any = b[sortField as keyof typeof b] ?? "";

      if (sortField === "totalHari") {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      if (typeof aVal === "string") {
        const res = aVal.localeCompare(bVal, "id", { sensitivity: "base", numeric: true });
        return sortDirection === "asc" ? res : -res;
      }

      return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [filteredData, sortField, sortDirection]);

  const hasActiveFilters = query.trim() !== "" || filterKategori !== "SEMUA" || filterJenis !== "SEMUA";

  const resetFilters = () => {
    setQuery("");
    setFilterKategori("SEMUA");
    setFilterJenis("SEMUA");
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Metrics Bar - Minimalist & Compact Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-[#E8F5FC] px-3.5 py-2 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium">Total Cuti</span>
          <span className="text-sm font-bold text-[#263238]">
            {totalCount} <span className="text-[10px] font-normal text-[#6B7280]">orang</span>
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-[#E8F5FC] px-3.5 py-2 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium">Tahunan</span>
          <span className="text-sm font-bold text-[#0789D1]">
            {countTahunan} <span className="text-[10px] font-normal text-[#6B7280]">orang</span>
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-[#E8F5FC] px-3.5 py-2 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium">Besar</span>
          <span className="text-sm font-bold text-[#005B96]">
            {countBesar} <span className="text-[10px] font-normal text-[#6B7280]">orang</span>
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-[#E8F5FC] px-3.5 py-2 flex items-center justify-between shadow-2xs">
          <span className="text-xs text-[#6B7280] font-medium">Inhaldagen</span>
          <span className="text-sm font-bold text-slate-700">
            {countInhaldagen} <span className="text-[10px] font-normal text-[#6B7280]">orang</span>
          </span>
        </div>
      </div>

      {/* 2. Filter & Search Bar - Minimalist & Compact */}
      <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-[#E8F5FC] p-2.5 sm:p-3 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
            <Input
              type="text"
              placeholder="Cari nama, NIP, bagian, keperluan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8 h-8 text-xs bg-[#F3F6F8]/80 text-[#263238] placeholder:text-[#6B7280] border-[#E8F5FC] focus-visible:bg-white rounded-lg transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#263238] p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Kategori Tabs */}
            <div className="inline-flex rounded-lg bg-[#F3F6F8] p-0.5 text-xs font-medium border border-[#E8F5FC]">
              <button
                type="button"
                onClick={() => setFilterKategori("SEMUA")}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  filterKategori === "SEMUA"
                    ? "bg-white text-[#263238] shadow-2xs font-semibold"
                    : "text-[#6B7280] hover:text-[#263238]"
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterKategori("PIMPINAN")}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  filterKategori === "PIMPINAN"
                    ? "bg-white text-[#005B96] shadow-2xs font-semibold"
                    : "text-[#6B7280] hover:text-[#263238]"
                }`}
              >
                Pimpinan ({countPimpinan})
              </button>
              <button
                type="button"
                onClick={() => setFilterKategori("PELAKSANA")}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                  filterKategori === "PELAKSANA"
                    ? "bg-white text-[#0789D1] shadow-2xs font-semibold"
                    : "text-[#6B7280] hover:text-[#263238]"
                }`}
              >
                Pelaksana ({countPelaksana})
              </button>
            </div>

            {/* Jenis Cuti Dropdown Selector */}
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value as any)}
              className="h-7 text-xs bg-[#F3F6F8] text-[#263238] border border-[#E8F5FC] rounded-lg px-2 cursor-pointer focus:outline-none focus:border-[#0789D1] font-medium transition-colors"
            >
              <option value="SEMUA">Semua Jenis Cuti</option>
              <option value="TAHUNAN">Cuti Tahunan</option>
              <option value="BESAR">Cuti Besar</option>
              <option value="INHALDAGEN">Inhaldagen</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 h-7 px-2 cursor-pointer transition-colors rounded-lg"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Status Line */}
        <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1.5 border-t border-[#E8F5FC]">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0789D1]" />
            <span>
              Menampilkan <strong className="text-[#263238] font-semibold">{filteredData.length}</strong> dari{" "}
              <strong className="text-[#263238] font-semibold">{totalCount}</strong> karyawan cuti
            </span>
          </div>
        </div>
      </div>

      {/* 3. Table / Empty State */}
      {totalCount === 0 ? (
        /* Empty State - Clean & Compact */
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-[#E8F5FC] py-8 px-4 text-center shadow-2xs space-y-2">
          <div className="h-10 w-10 mx-auto rounded-full bg-[#E8F5FC] text-[#005B96] flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#263238]">
              Tidak Ada Karyawan Cuti Hari Ini
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5 max-w-sm mx-auto">
              Seluruh staf dan karyawan pimpinan & pelaksana tercatat aktif bekerja pada hari ini.
            </p>
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        /* Empty Filter State */
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#E8F5FC] p-8 text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-2.5">
          <div className="h-10 w-10 mx-auto rounded-full bg-[#F3F6F8] text-[#6B7280] flex items-center justify-center">
            <Search className="h-4 w-4" />
          </div>
          <p className="text-xs text-[#6B7280]">
            Tidak ada data yang cocok dengan kriteria pencarian &ldquo;{query}&rdquo;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-xs h-7 px-3 cursor-pointer bg-white border-[#E8F5FC] text-[#263238] rounded-lg"
          >
            Bersihkan Filter
          </Button>
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F6F8]/80 text-[#6B7280] font-semibold border-b border-[#E8F5FC] text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th
                    onClick={() => handleSort("nama")}
                    className="py-3 px-4 min-w-[200px] cursor-pointer select-none group hover:text-[#263238] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Karyawan</span>
                      {renderSortIcon("nama")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bagian")}
                    className="py-3 px-4 min-w-[170px] cursor-pointer select-none group hover:text-[#263238] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Unit Penugasan</span>
                      {renderSortIcon("bagian")}
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[130px]">Jenis Cuti</th>
                  <th
                    onClick={() => handleSort("totalHari")}
                    className="py-3 px-4 min-w-[100px] cursor-pointer select-none group hover:text-[#263238] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Durasi</span>
                      {renderSortIcon("totalHari")}
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[180px]">Keperluan</th>
                  <th className="py-3 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F5FC]/60">
                {sortedData.map((item, idx) => {
                  const isPimpinan = (item.category || "").toUpperCase() === "PIMPINAN";

                  const hasTahunan = item.cutiTahunan !== null && Number(item.cutiTahunan) !== 0;
                  const hasBesar = item.cutiBesar !== null && Number(item.cutiBesar) !== 0;
                  const hasInhaldagen = item.inhaldagen !== null && Number(item.inhaldagen) !== 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#E8F5FC]/30 transition-colors duration-150"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-medium text-[#6B7280]">
                        {idx + 1}
                      </td>

                      {/* Karyawan */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#263238] block truncate">
                              {item.nama}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-bold border ${
                                isPimpinan
                                  ? "bg-[#E8F5FC] text-[#005B96] border-[#0789D1]/30"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {isPimpinan ? "PIMPINAN" : "PELAKSANA"}
                            </Badge>
                          </div>
                          <span className="text-[10px] font-mono text-[#6B7280] block">
                            NIP: {item.nip}
                          </span>
                        </div>
                      </td>

                      {/* Unit Penugasan */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-[#263238] block">
                            {item.bagian || "-"}
                          </span>
                          <span className="text-[10px] text-[#6B7280] block">
                            Stasiun: {item.stasiun || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Jenis Cuti (Calm Muted Corporate Colors, No Neon) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {hasTahunan && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E8F5FC] text-[#0789D1] border border-[#0789D1]/30">
                              Cuti Tahunan
                            </span>
                          )}
                          {hasBesar && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3F6F8] text-[#005B96] border border-[#005B96]/30">
                              Cuti Besar
                            </span>
                          )}
                          {hasInhaldagen && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E8F5FC] text-[#005B96] border border-[#005B96]/30">
                              Inhaldagen
                            </span>
                          )}
                          {!hasTahunan && !hasBesar && !hasInhaldagen && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F3F6F8] text-[#6B7280] border border-slate-200">
                              Cuti Kerja
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Durasi */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#263238] bg-[#F3F6F8] px-2 py-0.5 rounded-md text-[11px] border border-[#E8F5FC]">
                          {Math.abs(Number(item.totalHari) || 1)} Hari
                        </span>
                      </td>

                      {/* Keperluan */}
                      <td className="py-3 px-4">
                        <p className="text-[#6B7280] text-xs leading-relaxed line-clamp-2" title={item.keperluan}>
                          {item.keperluan && item.keperluan !== "-" ? item.keperluan : "Izin cuti dinas / pribadi"}
                        </p>
                      </td>

                      {/* Aksi Button Detail */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedKaryawan(item)}
                          className="h-7 px-2.5 text-xs font-semibold text-[#005B96] hover:text-[#0789D1] hover:bg-[#E8F5FC] cursor-pointer rounded-lg gap-1 border-[#E8F5FC] bg-white shadow-2xs transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Pop-up / Modal Detail Cuti Karyawan */}
      {selectedKaryawan && (
        <Dialog open={Boolean(selectedKaryawan)} onOpenChange={(open) => !open && setSelectedKaryawan(null)}>
          <DialogContent
            onClose={() => setSelectedKaryawan(null)}
            className="bg-white border border-[#E8F5FC] shadow-[0_20px_60px_rgb(0,0,0,0.1)] rounded-2xl max-w-lg p-5 sm:p-6"
          >
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#E8F5FC] text-[#0789D1] flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-[#263238]">
                    Rincian Cuti Karyawan
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#6B7280]">
                    Data resmi permohonan izin cuti PT Kebon Agung - PG Trangkil
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-3 text-xs">
              {/* Profil Karyawan Box */}
              <div className="p-3.5 rounded-xl bg-[#F3F6F8] border border-[#E8F5FC] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#263238] leading-snug">
                      {selectedKaryawan.nama}
                    </h4>
                    <span className="font-mono text-[11px] text-[#6B7280] block">
                      NIP: {selectedKaryawan.nip}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 font-bold border ${
                      (selectedKaryawan.category || "").toUpperCase() === "PIMPINAN"
                        ? "bg-[#E8F5FC] text-[#005B96] border-[#0789D1]/30"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {selectedKaryawan.category || "PIMPINAN"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8F5FC] text-[11px]">
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">Bagian</span>
                    <span className="font-medium text-[#263238]">{selectedKaryawan.bagian || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">Stasiun Kerja</span>
                    <span className="font-medium text-[#263238]">{selectedKaryawan.stasiun || "-"}</span>
                  </div>
                  {selectedKaryawan.jabatan && selectedKaryawan.jabatan !== "-" && (
                    <div className="col-span-2">
                      <span className="text-[#6B7280] block text-[10px]">Jabatan</span>
                      <span className="font-medium text-[#263238]">{selectedKaryawan.jabatan}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Jenis & Durasi Cuti Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F3F6F8] border border-[#E8F5FC] space-y-1">
                  <span className="text-[10px] font-medium text-[#6B7280] block uppercase tracking-wider">
                    Jenis Cuti
                  </span>
                  <div>
                    {selectedKaryawan.cutiTahunan && Number(selectedKaryawan.cutiTahunan) !== 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F5FC] text-[#0789D1] border border-[#0789D1]/30">
                        Cuti Tahunan
                      </span>
                    ) : selectedKaryawan.cutiBesar && Number(selectedKaryawan.cutiBesar) !== 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-[#005B96] border border-[#005B96]/30">
                        Cuti Besar
                      </span>
                    ) : selectedKaryawan.inhaldagen && Number(selectedKaryawan.inhaldagen) !== 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F5FC] text-[#005B96] border border-[#005B96]/30">
                        Inhaldagen
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-[#6B7280] border border-slate-200">
                        Cuti Kerja
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F3F6F8] border border-[#E8F5FC] space-y-1">
                  <span className="text-[10px] font-medium text-[#6B7280] block uppercase tracking-wider">
                    Total Durasi
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-[#263238] text-sm">
                    <Clock className="h-4 w-4 text-[#6B7280]" />
                    <span>{Math.abs(Number(selectedKaryawan.totalHari) || 1)} Hari Kerja</span>
                  </div>
                </div>
              </div>

              {/* Tanggal Pelaksanaan Cuti */}
              <div className="p-3.5 rounded-xl bg-[#E8F5FC]/60 border border-[#0789D1]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#005B96] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#0789D1]" />
                    <span>Jadwal Tanggal Cuti:</span>
                  </span>
                  <span className="text-[10px] font-medium text-[#005B96] bg-white px-2 py-0.5 rounded-full border border-[#0789D1]/30">
                    Aktif Hari Ini
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parseAndFormatDatesLong(selectedKaryawan.tglCuti).map((tgl, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E8F5FC] text-[#263238] font-semibold text-xs shadow-2xs"
                    >
                      {tgl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Keperluan / Alasan Izin Box */}
              <div className="p-3.5 rounded-xl bg-[#F3F6F8] border border-[#E8F5FC] space-y-1">
                <span className="text-[10px] font-medium text-[#6B7280] block uppercase tracking-wider">
                  Keperluan / Alasan Izin
                </span>
                <p className="text-[#263238] text-xs leading-relaxed font-medium">
                  {selectedKaryawan.keperluan && selectedKaryawan.keperluan !== "-"
                    ? selectedKaryawan.keperluan
                    : "Izin cuti dinas / permohonan pribadi."}
                </p>
              </div>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-[#E8F5FC] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedKaryawan(null)}
                className="h-8 px-4 text-xs font-semibold cursor-pointer rounded-lg bg-[#F3F6F8] hover:bg-slate-200 text-[#263238] border-[#E8F5FC]"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
