"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  Users,
  Search,
  Filter,
  Loader2,
  CalendarDays,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Factory,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getLeaveBalanceReportAction,
  getLeaveUsageReportAction,
  EmployeeBalanceReportItem,
  LeaveUsageReportItem,
} from "@/actions/aksi-laporan";
import { getDepartmentsAction, getStationsForDepartmentAction } from "@/actions/aksi-karyawan";
import { formatDateIndo, formatSingkatanBagian } from "@/lib/utils";

function parseDatesList(tglCutiStr?: string, startDate?: string, endDate?: string): string[] {
  if (tglCutiStr && tglCutiStr.trim().length > 0) {
    return tglCutiStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (startDate && startDate !== "-") {
    if (endDate && endDate !== "-" && endDate !== startDate) {
      return [`${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`];
    }
    return [formatDateIndo(startDate)];
  }
  return [];
}

function parseDateToTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const dmyMatch = dateStr.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day).getTime();
  }
  const timestamp = new Date(dateStr).getTime();
  return isNaN(timestamp) ? 0 : timestamp;
}

const MONTH_OPTIONS = [
  { value: 0, label: "Semua Bulan (Jan - Des)" },
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export default function HalamanLaporan() {
  const [activeTab, setActiveTab] = useState<"BALANCES" | "USAGE">("BALANCES");
  const [isPending, startTransition] = useTransition();

  // Filter States
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL"); // "ALL" | "PIMPINAN" | "PELAKSANA"
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [stationFilter, setStationFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [stationsList, setStationsList] = useState<{ id: string; name: string; code: string; departmentName: string }[]>([]);

  // Sorting States for Tab 1 (Saldo) - Sorter Utama: NIP
  type BalanceSortField = "no" | "nip" | "nama" | "bagian" | "stasiun" | "cutiTahunan" | "cutiBesar" | "inhaldagen" | "totalSaldo";
  type UsageSortField = "no" | "nip" | "nama" | "bagian" | "stasiun" | "tglTransaksi" | "uraian" | "tglCuti" | "annualDays" | "longLeaveDays" | "inhaldagenDays" | "totalDays";
  type SortOrder = "asc" | "desc";

  const [balanceSortField, setBalanceSortField] = useState<BalanceSortField>("nip");
  const [balanceSortOrder, setBalanceSortOrder] = useState<SortOrder>("asc");

  const [usageSortField, setUsageSortField] = useState<UsageSortField>("tglTransaksi");
  const [usageSortOrder, setUsageSortOrder] = useState<SortOrder>("desc");

  // Modal Detail Rincian Tanggal Cuti
  const [selectedDetailItem, setSelectedDetailItem] = useState<LeaveUsageReportItem | null>(null);

  const handleBalanceSort = (field: BalanceSortField) => {
    if (balanceSortField === field) {
      setBalanceSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setBalanceSortField(field);
      setBalanceSortOrder("asc");
    }
  };

  const handleUsageSort = (field: UsageSortField) => {
    if (usageSortField === field) {
      setUsageSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setUsageSortField(field);
      if (field === "tglTransaksi" || field === "tglCuti") {
        setUsageSortOrder("desc");
      } else {
        setUsageSortOrder("asc");
      }
    }
  };

  const renderSortIcon = (currentField: string, field: string, order: "asc" | "desc") => {
    if (currentField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover:text-slate-600 transition-colors print:hidden" />;
    }
    return order === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-600 font-bold print:hidden" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600 font-bold print:hidden" />
    );
  };

  // Data States
  const [balanceData, setBalanceData] = useState<{
    items: EmployeeBalanceReportItem[];
    summary: {
      totalEmployees: number;
      totalAnnual: number;
      totalLongLeave: number;
      totalInhaldagen: number;
      totalCombined: number;
    };
    generatedAt: string;
    generatedBy: string;
  } | null>(null);

  const [usageData, setUsageData] = useState<{
    items: LeaveUsageReportItem[];
    summary: {
      totalTransactions: number;
      approvedTransactions: number;
      totalDaysUsed: number;
      totalAnnualDays: number;
      totalLongLeaveDays: number;
      totalInhaldagenDays: number;
    };
    generatedAt: string;
    generatedBy: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Load Departments & Stations Metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const [deptRes, stRes] = await Promise.all([
          getDepartmentsAction(),
          getStationsForDepartmentAction(),
        ]);
        if (deptRes.success && deptRes.data) {
          setDepartmentsList(deptRes.data);
        }
        if (stRes.success && stRes.data) {
          setStationsList(stRes.data);
        }
      } catch (e) {
        console.error("Load meta error:", e);
      }
    }
    loadMeta();
  }, []);

  // Dynamic available stations based on selected department
  const availableStations = useMemo(() => {
    const set = new Set<string>();
    const allReportItems = activeTab === "BALANCES" ? (balanceData?.items || []) : (usageData?.items || []);

    if (departmentFilter === "ALL") {
      stationsList.forEach((s) => {
        if (s.name && s.name !== "-") set.add(s.name);
      });
      allReportItems.forEach((i) => {
        if (i.stasiun && i.stasiun !== "-" && i.stasiun !== "Semua / Belum Ada") set.add(i.stasiun);
      });
    } else {
      const filterDept = departmentFilter.toLowerCase();
      stationsList.forEach((s) => {
        if (
          s.name &&
          s.name !== "-" &&
          (s.departmentName.toLowerCase().includes(filterDept) || filterDept.includes(s.departmentName.toLowerCase()))
        ) {
          set.add(s.name);
        }
      });
      allReportItems.forEach((i) => {
        const itemDept = (i.bagian || "").toLowerCase();
        if (
          (itemDept.includes(filterDept) || filterDept.includes(itemDept)) &&
          i.stasiun &&
          i.stasiun !== "-" &&
          i.stasiun !== "Semua / Belum Ada"
        ) {
          set.add(i.stasiun);
        }
      });
    }
    return Array.from(set).sort();
  }, [departmentFilter, stationsList, activeTab, balanceData?.items, usageData?.items]);

  // Load Report Data
  const loadReports = useCallback(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        if (activeTab === "BALANCES") {
          const res = await getLeaveBalanceReportAction({
            department: "ALL",
            year: selectedYear,
          });
          if (res.success && res.data) {
            setBalanceData(res.data);
          } else {
            toast.error(res.message || "Gagal memuat rekap saldo cuti.");
          }
        } else {
          const res = await getLeaveUsageReportAction({
            year: selectedYear,
            month: selectedMonth,
            department: "ALL",
          });
          if (res.success && res.data) {
            setUsageData(res.data);
          } else {
            toast.error(res.message || "Gagal memuat rekap pemakaian cuti.");
          }
        }
      } catch (err) {
        console.error("Load report error:", err);
        toast.error("Terjadi kesalahan saat memuat data laporan.");
      } finally {
        setIsLoading(false);
      }
    });
  }, [activeTab, selectedYear, selectedMonth]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Client-side search & organizational filter
  const filteredBalanceItems = useMemo(() => {
    return (balanceData?.items || []).filter((item) => {
      // 1. Jenis Karyawan filter
      if (categoryFilter !== "ALL") {
        if (item.kategori !== categoryFilter) return false;
      }

      // 2. Bagian filter
      if (departmentFilter !== "ALL") {
        const filterDept = departmentFilter.toLowerCase();
        const itemDept = item.bagian.toLowerCase();
        if (!itemDept.includes(filterDept) && !filterDept.includes(itemDept)) return false;
      }

      // 3. Stasiun filter
      if (stationFilter !== "ALL") {
        const filterSt = stationFilter.toLowerCase();
        const itemSt = (item.stasiun || "").toLowerCase();
        if (!itemSt.includes(filterSt) && !filterSt.includes(itemSt)) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.nama.toLowerCase().includes(q) ||
          item.nip.toLowerCase().includes(q) ||
          item.bagian.toLowerCase().includes(q) ||
          (item.stasiun && item.stasiun.toLowerCase().includes(q)) ||
          (item.jabatan && item.jabatan.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [balanceData?.items, categoryFilter, departmentFilter, stationFilter, searchQuery]);

  const filteredUsageItems = useMemo(() => {
    return (usageData?.items || []).filter((item) => {
      // 1. Jenis Karyawan filter
      if (categoryFilter !== "ALL") {
        if (item.kategori !== categoryFilter) return false;
      }

      // 2. Bagian filter
      if (departmentFilter !== "ALL") {
        const filterDept = departmentFilter.toLowerCase();
        const itemDept = item.bagian.toLowerCase();
        if (!itemDept.includes(filterDept) && !filterDept.includes(itemDept)) return false;
      }

      // 3. Stasiun filter
      if (stationFilter !== "ALL") {
        const filterSt = stationFilter.toLowerCase();
        const itemSt = (item.stasiun || "").toLowerCase();
        if (!itemSt.includes(filterSt) && !filterSt.includes(itemSt)) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.nama.toLowerCase().includes(q) ||
          item.nip.toLowerCase().includes(q) ||
          item.bagian.toLowerCase().includes(q) ||
          (item.stasiun && item.stasiun.toLowerCase().includes(q)) ||
          (item.uraian && item.uraian.toLowerCase().includes(q)) ||
          (item.tglCuti && item.tglCuti.toLowerCase().includes(q)) ||
          (item.purpose && item.purpose.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [usageData?.items, categoryFilter, departmentFilter, stationFilter, searchQuery]);

  // Sorted Data (Sorter Utama: NIP)
  const sortedBalanceItems = useMemo(() => {
    return [...filteredBalanceItems].sort((a, b) => {
      let comparison = 0;
      if (balanceSortField === "no" || balanceSortField === "nip") {
        comparison = a.nip.localeCompare(b.nip, undefined, { numeric: true });
      } else if (balanceSortField === "nama") {
        comparison = a.nama.localeCompare(b.nama);
      } else if (balanceSortField === "bagian") {
        comparison = (a.bagian || "").localeCompare(b.bagian || "");
      } else if (balanceSortField === "stasiun") {
        comparison = (a.stasiun || "").localeCompare(b.stasiun || "");
      } else if (balanceSortField === "cutiTahunan") {
        comparison = a.cutiTahunan - b.cutiTahunan;
      } else if (balanceSortField === "cutiBesar") {
        comparison = a.cutiBesar - b.cutiBesar;
      } else if (balanceSortField === "inhaldagen") {
        comparison = a.inhaldagen - b.inhaldagen;
      } else if (balanceSortField === "totalSaldo") {
        comparison = a.totalSaldo - b.totalSaldo;
      }

      // Tie-breaker utama selalu NIP ASC
      if (comparison === 0) {
        comparison = a.nip.localeCompare(b.nip, undefined, { numeric: true });
      }
      return balanceSortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredBalanceItems, balanceSortField, balanceSortOrder]);

  const sortedUsageItems = useMemo(() => {
    return [...filteredUsageItems].sort((a, b) => {
      let comparison = 0;
      if (usageSortField === "no" || usageSortField === "nip") {
        comparison = a.nip.localeCompare(b.nip, undefined, { numeric: true });
      } else if (usageSortField === "nama") {
        comparison = a.nama.localeCompare(b.nama);
      } else if (usageSortField === "bagian") {
        comparison = (a.bagian || "").localeCompare(b.bagian || "");
      } else if (usageSortField === "stasiun") {
        comparison = (a.stasiun || "").localeCompare(b.stasiun || "");
      } else if (usageSortField === "tglTransaksi") {
        const timeA = parseDateToTimestamp(a.tglTransaksi || a.requestDate);
        const timeB = parseDateToTimestamp(b.tglTransaksi || b.requestDate);
        comparison = timeA - timeB;
      } else if (usageSortField === "uraian") {
        comparison = (a.uraian || a.purpose || "").localeCompare(b.uraian || b.purpose || "");
      } else if (usageSortField === "tglCuti") {
        const firstDateA = (a.tglCuti ? a.tglCuti.split(",")[0] : a.startDate) || "";
        const firstDateB = (b.tglCuti ? b.tglCuti.split(",")[0] : b.startDate) || "";
        const timeA = parseDateToTimestamp(firstDateA);
        const timeB = parseDateToTimestamp(firstDateB);
        comparison = timeA - timeB;
      } else if (usageSortField === "annualDays") {
        comparison = a.annualDays - b.annualDays;
      } else if (usageSortField === "longLeaveDays") {
        comparison = a.longLeaveDays - b.longLeaveDays;
      } else if (usageSortField === "inhaldagenDays") {
        comparison = a.inhaldagenDays - b.inhaldagenDays;
      } else if (usageSortField === "totalDays") {
        comparison = a.totalDays - b.totalDays;
      }

      // Tie-breaker utama selalu NIP ASC
      if (comparison === 0) {
        comparison = a.nip.localeCompare(b.nip, undefined, { numeric: true });
      }
      return usageSortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredUsageItems, usageSortField, usageSortOrder]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel / CSV Handler
  const handleExportCSV = () => {
    try {
      let csvContent = "";
      const nowStr = new Date().toISOString().split("T")[0];

      if (activeTab === "BALANCES") {
        const headers = ["No", "NIP", "Nama Karyawan", "Bagian", "Stasiun", "Cuti Tahunan", "Cuti Besar", "Inhaldagen", "Total Saldo"];
        const rows = sortedBalanceItems.map((item, idx) => [
          idx + 1,
          `"${item.nip}"`,
          `"${item.nama}"`,
          `"${item.bagian}"`,
          `"${item.stasiun}"`,
          item.cutiTahunan,
          item.cutiBesar,
          item.inhaldagen,
          item.totalSaldo,
        ]);

        csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        downloadFile(csvContent, `Rekap_Saldo_Cuti_PG_Trangkil_${nowStr}.csv`);
      } else {
        const headers = ["No", "NIP", "Nama Karyawan", "Bagian", "Stasiun", "Tgl Transaksi", "Uraian", "Tanggal Cuti", "Jenis & Total Hari"];
        const rows = sortedUsageItems.map((item, idx) => {
          const parts: string[] = [];
          if (item.annualDays > 0) parts.push(`Tahunan: ${item.annualDays} hr`);
          if (item.longLeaveDays > 0) parts.push(`Besar: ${item.longLeaveDays} hr`);
          if (item.inhaldagenDays > 0) parts.push(`Inhaldagen: ${item.inhaldagenDays} hr`);
          const typeText = parts.length > 0 ? parts.join(", ") : "Cuti";
          return [
            idx + 1,
            `"${item.nip}"`,
            `"${item.nama}"`,
            `"${item.bagian}"`,
            `"${item.stasiun}"`,
            `"${item.tglTransaksi ? item.tglTransaksi.split("T")[0] : item.requestDate ? item.requestDate.split("T")[0] : "-"}"`,
            `"${(item.uraian || item.purpose || "-").replace(/"/g, '""')}"`,
            `"${(item.tglCuti && item.tglCuti.length > 0 ? item.tglCuti : item.startDate ? `${item.startDate.split("T")[0]} s/d ${item.endDate.split("T")[0]}` : "-").replace(/"/g, '""')}"`,
            `"${item.totalDays} hari (${typeText})"`,
          ];
        });

        csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
        downloadFile(csvContent, `Rekap_Aktivitas_Pengambilan_Cuti_PG_Trangkil_${nowStr}.csv`);
      }

      toast.success("File spreadsheet laporan berhasil diunduh.");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor data laporan.");
    }
  };

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full pb-12 print-page-wrapper print:p-0 print:m-0 print:space-y-0 print:max-w-none">
      {/* Top Header (Print: Hidden) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan & Rekapitulasi Cuti
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat laporan resmi saldo, histori mutasi, cetak dokumen fisik, dan ekspor data kepegawaian PG Trangkil.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handlePrint}
            className="font-medium text-slate-700 shadow-2xs"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            Cetak Laporan
          </Button>
          <Button
            type="button"
            size="default"
            onClick={handleExportCSV}
            className="font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
          >
            <Download className="h-4 w-4" />
            Export Excel / CSV
          </Button>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL KOP SURAT PERUSAHAAN */}
      <div className="hidden print:block mb-4">
        {/* Header Kop: Logo Kiri, Teks Tengah/Kiri, Logo Kanan */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
          {/* Logo PT Kebon Agung */}
          <div className="flex items-center gap-3">
            <Image
              src="/assets/KebonAgungLogo.png"
              alt="Logo PT Kebon Agung"
              width={48}
              height={48}
              priority
              className="h-12 w-12 object-contain"
            />
            <div>
              <div className="text-[13px] font-black tracking-wider uppercase text-black font-serif">
                PT KEBON AGUNG
              </div>
              <div className="text-[11px] font-extrabold uppercase text-black">
                PABRIK GULA TRANGKIL PATI
              </div>
              <div className="text-[9px] text-black leading-tight">
                Jl. Raya Trangkil No. 1, Kec. Trangkil, Kab. Pati, Jawa Tengah 59153
              </div>
            </div>
          </div>

          {/* Logo PG Trangkil & Info Dokumen */}
          <div className="flex flex-col items-end">
            <Image
              src="/assets/PGTrangkilLogo.png"
              alt="Logo PG Trangkil"
              width={160}
              height={32}
              priority
              className="h-8 w-auto object-contain mb-1"
            />
            <div className="text-right text-[9px] text-black font-mono">
              <div>Klasifikasi: Internal SDM</div>
              <div>Tanggal Cetak: {formatDateIndo(new Date())}</div>
            </div>
          </div>
        </div>

        {/* Judul Dokumen Resmi Laporan Cuti */}
        <div className="text-center mt-3 mb-2">
          <h1 className="text-sm font-black uppercase text-black tracking-wide">
            {activeTab === "BALANCES"
              ? "LAPORAN REKAPITULASI POSISI SALDO CUTI KARYAWAN"
              : "LAPORAN REKAPITULASI PENGAMBILAN CUTI KARYAWAN"}
          </h1>
          <p className="text-[11px] text-black mt-0.5">
            Periode: Tahun {selectedYear}
            {selectedMonth > 0
              ? ` • Bulan ${MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label}`
              : ""}
            {categoryFilter !== "ALL" ? ` • Kategori: ${categoryFilter}` : ""}
            {departmentFilter !== "ALL" ? ` • Bagian: ${departmentFilter}` : ""}
            {stationFilter !== "ALL" ? ` • Stasiun: ${stationFilter}` : ""}
          </p>
        </div>
      </div>

      {/* Tabs Switcher (Print: Hidden) */}
      <div className="print:hidden flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab("BALANCES")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "BALANCES"
              ? "bg-white text-[#0084c7] font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          1. Rekapitulasi Sisa Saldo Karyawan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("USAGE")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "USAGE"
              ? "bg-white text-[#0084c7] font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          2. Rekapitulasi Pengambilan Cuti Periode
        </button>
      </div>

      {/* 1 CARD TUNGGAL UNTUK FILTER, PENCARIAN & TABEL DATA */}
      <Card className="border-slate-200/90 shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none print:bg-transparent print:p-0">
        {/* Header & Integrated Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3.5 print:hidden">
          {/* Header Title & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                {activeTab === "BALANCES" ? (
                  <>
                    <span className="p-1.5 rounded-lg bg-blue-50 text-[#0093dc] border border-blue-100">
                      <BarChart3 className="h-4 w-4" />
                    </span>
                    Tabel Rekapitulasi Posisi Saldo Cuti
                  </>
                ) : (
                  <>
                    <span className="p-1.5 rounded-lg bg-blue-50 text-[#0093dc] border border-blue-100">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    Tabel Riwayat Pengambilan Cuti Periode Terpilih
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan <strong className="font-semibold text-slate-800 font-mono">{activeTab === "BALANCES" ? sortedBalanceItems.length : sortedUsageItems.length}</strong> baris data
              </p>
            </div>

            {(categoryFilter !== "ALL" || departmentFilter !== "ALL" || stationFilter !== "ALL" || searchQuery) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                  setDepartmentFilter("ALL");
                  setStationFilter("ALL");
                }}
                className="h-8 px-2.5 text-xs text-[#0093dc] hover:text-sky-800 hover:bg-sky-50 font-semibold gap-1.5 self-start sm:self-center cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filter
              </Button>
            )}
          </div>

          {/* Integrated Filter Bar: Search + Dropdowns in 1 cohesive row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1">
            {/* 1. Search Box */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik NIP, Nama karyawan, dll..."
                className="h-9 pl-9 pr-3 text-xs bg-slate-50/60 border-slate-200/90 focus:bg-white focus-visible:ring-[#0093dc] rounded-lg transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 2. Jenis Karyawan */}
            <div className="lg:col-span-2 sm:col-span-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full h-9 rounded-lg border px-2.5 text-xs font-medium focus:border-[#0093dc] focus:outline-none transition-colors ${
                  categoryFilter === "PIMPINAN"
                    ? "border-sky-400 bg-sky-50/60 text-sky-950 font-bold"
                    : categoryFilter === "PELAKSANA"
                    ? "border-emerald-400 bg-emerald-50/60 text-emerald-950 font-bold"
                    : "border-slate-200/90 bg-slate-50/60 text-slate-700"
                }`}
              >
                <option value="ALL">Semua Jenis</option>
                <option value="PIMPINAN">Pimpinan</option>
                <option value="PELAKSANA">Pelaksana</option>
              </select>
            </div>

            {/* 3. Bagian */}
            <div className="lg:col-span-3 sm:col-span-1">
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setStationFilter("ALL");
                }}
                className={`w-full h-9 rounded-lg border px-2.5 text-xs font-medium focus:border-[#0093dc] focus:outline-none transition-colors ${
                  departmentFilter !== "ALL"
                    ? "border-blue-400 bg-blue-50/50 text-blue-900 font-bold"
                    : "border-slate-200/90 bg-slate-50/60 text-slate-700"
                }`}
              >
                <option value="ALL">Semua Bagian</option>
                {departmentsList.length > 0
                  ? departmentsList.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  : ["Tanaman", "Pabrikasi", "Teknik", "Tata Usaha & Keuangan (TUK)", "Pimpinan"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
              </select>
            </div>

            {/* 4. Stasiun */}
            <div className="lg:col-span-3 sm:col-span-2">
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className={`w-full h-9 rounded-lg border px-2.5 text-xs font-medium focus:border-[#0093dc] focus:outline-none transition-colors ${
                  stationFilter !== "ALL"
                    ? "border-blue-400 bg-blue-50/50 text-blue-900 font-bold"
                    : "border-slate-200/90 bg-slate-50/60 text-slate-700"
                }`}
              >
                <option value="ALL">Semua Stasiun</option>
                {availableStations.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat data laporan...
            </div>
          ) : activeTab === "BALANCES" ? (
            /* TAB 1: TABEL REKAP SALDO DENGAN ATRIBUT STASIUN & SORTER */
            <div className="overflow-x-auto print:overflow-visible">
              <Table className="print:w-full print:border-collapse print:border print:border-black print:text-black">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px] print:bg-slate-100 print:text-black print:border-b print:border-black">
                    <TableHead
                      className="w-12 text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("no")}
                      title="Urutkan No"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>No</span>
                        {renderSortIcon(balanceSortField, "no", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-28 font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("nip")}
                      title="Urutkan NIP (Sorter Utama)"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>NIP</span>
                        {renderSortIcon(balanceSortField, "nip", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("nama")}
                      title="Urutkan Nama Karyawan"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Nama Karyawan</span>
                        {renderSortIcon(balanceSortField, "nama", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("bagian")}
                      title="Urutkan Bagian"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Bagian</span>
                        {renderSortIcon(balanceSortField, "bagian", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("stasiun")}
                      title="Urutkan Stasiun"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Stasiun</span>
                        {renderSortIcon(balanceSortField, "stasiun", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("cutiTahunan")}
                      title="Urutkan Cuti Tahunan"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Tahunan</span>
                        {renderSortIcon(balanceSortField, "cutiTahunan", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("cutiBesar")}
                      title="Urutkan Cuti Besar"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Besar</span>
                        {renderSortIcon(balanceSortField, "cutiBesar", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("inhaldagen")}
                      title="Urutkan Inhaldagen"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Inhaldagen</span>
                        {renderSortIcon(balanceSortField, "inhaldagen", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold bg-blue-50/50 cursor-pointer select-none hover:bg-blue-100/70 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleBalanceSort("totalSaldo")}
                      title="Urutkan Total Saldo"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Total Saldo</span>
                        {renderSortIcon(balanceSortField, "totalSaldo", balanceSortOrder)}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBalanceItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-slate-500 text-xs print:border print:border-black print:text-black">
                        Tidak ada data saldo karyawan yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedBalanceItems.map((emp, idx) => (
                      <TableRow key={emp.id} className="hover:bg-slate-50/50 print:border-b print:border-black">
                        <TableCell className="text-center text-xs font-mono text-slate-400 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-slate-900 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {emp.nip}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-slate-900 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {emp.nama}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]" title={emp.bagian}>
                          <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700 print:border-none print:bg-transparent print:p-0 print:text-black print:font-normal">
                            {formatSingkatanBagian(emp.bagian)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {emp.stasiun && emp.stasiun !== "-" ? (
                            <span className="font-medium text-slate-800 text-xs print:text-black">
                              {emp.stasiun}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic print:text-black">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-blue-700 tabular-nums print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {emp.cutiTahunan}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-purple-700 tabular-nums print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {emp.cutiBesar}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-amber-700 tabular-nums print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {emp.inhaldagen}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-black text-slate-900 bg-blue-50/30 tabular-nums print:border print:border-black print:text-black print:bg-transparent print:p-1.5 print:text-[10px]">
                          {emp.totalSaldo} hari
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* TAB 2: TABEL REKAP PENGAMBILAN CUTI DENGAN STRUKTUR AKTIVITAS SALDO */
            <div className="overflow-x-auto print:overflow-visible">
              <Table className="print:w-full print:border-collapse print:border print:border-black print:text-black">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px] print:bg-slate-100 print:text-black print:border-b print:border-black">
                    <TableHead
                      className="w-12 text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleUsageSort("no")}
                      title="Urutkan No"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>No</span>
                        {renderSortIcon(usageSortField, "no", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-24 font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleUsageSort("nip")}
                      title="Urutkan NIP"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>NIP</span>
                        {renderSortIcon(usageSortField, "nip", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleUsageSort("nama")}
                      title="Urutkan Nama Karyawan"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Nama Karyawan</span>
                        {renderSortIcon(usageSortField, "nama", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleUsageSort("bagian")}
                      title="Urutkan Bagian & Stasiun"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Bagian / Stasiun</span>
                        {renderSortIcon(usageSortField, "bagian", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleUsageSort("tglTransaksi")}
                      title="Urutkan Tgl Transaksi"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Tgl Transaksi</span>
                        {renderSortIcon(usageSortField, "tglTransaksi", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleUsageSort("uraian")}
                      title="Urutkan Uraian / Keperluan"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Uraian</span>
                        {renderSortIcon(usageSortField, "uraian", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group print:border print:border-black print:text-black print:bg-slate-100 print:text-[10px] print:p-1.5 print:font-bold"
                      onClick={() => handleUsageSort("tglCuti")}
                      title="Urutkan Tanggal Cuti"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Tanggal Cuti</span>
                        {renderSortIcon(usageSortField, "tglCuti", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-bold w-24 print:hidden">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-slate-500 text-xs print:border print:border-black print:text-black">
                        Belum ada aktivitas mutasi/pengambilan cuti yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUsageItems.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 print:border-b print:border-black">
                        {/* No */}
                        <TableCell className="text-center text-xs font-mono text-slate-400 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {idx + 1}
                        </TableCell>

                        {/* NIP */}
                        <TableCell className="font-mono text-xs font-bold text-slate-900 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {item.nip}
                        </TableCell>

                        {/* Nama Karyawan */}
                        <TableCell className="font-semibold text-xs text-slate-900 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {item.nama}
                        </TableCell>

                        {/* Bagian / Stasiun */}
                        <TableCell className="text-xs text-slate-800 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          <div className="font-semibold text-slate-800 flex items-center gap-1 print:text-black" title={item.bagian}>
                            <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700 print:border-none print:bg-transparent print:p-0 print:text-black print:font-normal">
                              {formatSingkatanBagian(item.bagian)}
                            </Badge>
                          </div>
                          {item.stasiun && item.stasiun !== "-" && (
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5 print:text-black">
                              {item.stasiun}
                            </div>
                          )}
                        </TableCell>

                        {/* Tgl Transaksi */}
                        <TableCell className="text-xs font-mono text-slate-700 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {formatDateIndo(item.tglTransaksi || item.requestDate)}
                        </TableCell>

                        {/* Uraian */}
                        <TableCell className="text-xs text-slate-800 max-w-xs print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {item.uraian || item.purpose || "-"}
                        </TableCell>

                        {/* Tanggal Cuti */}
                        <TableCell className="text-xs font-mono text-slate-700 print:border print:border-black print:text-black print:p-1.5 print:text-[10px]">
                          {(() => {
                            const dates = parseDatesList(item.tglCuti, item.startDate, item.endDate);
                            if (dates.length === 0) {
                              return <span className="text-slate-400 italic print:text-black">-</span>;
                            }
                            const firstDate = dates[0];
                            const hasMultiple = dates.length > 1;

                            return (
                              <div>
                                {/* Versi Cetak Dokumen */}
                                <span className="hidden print:inline font-mono text-[10px] print:text-black">
                                  {item.tglCuti || dates.join(", ")}
                                </span>

                                {/* Tampilan Layar Ringkas */}
                                <div className="flex flex-col leading-tight print:hidden">
                                  <span className="font-semibold text-slate-800 text-xs font-mono">
                                    {firstDate}
                                  </span>
                                  {hasMultiple && (
                                    <span className="text-[10px] text-blue-600 font-sans font-medium">
                                      +{dates.length - 1} tgl lainnya
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>

                        {/* Aksi: Tombol Detail Modal */}
                        <TableCell className="text-center print:hidden">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDetailItem(item)}
                            className="h-7 px-2.5 text-xs font-medium text-blue-700 bg-blue-50/70 hover:bg-blue-100 hover:text-blue-900 border-blue-200/80 rounded-lg transition-all shadow-2xs gap-1.5 cursor-pointer inline-flex items-center"
                            title="Klik untuk melihat rincian permohonan & tanggal cuti"
                          >
                            <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL POPUP: RINCIAN TANGGAL CUTI */}
      <Dialog
        open={!!selectedDetailItem}
        onOpenChange={(open) => !open && setSelectedDetailItem(null)}
      >
        <DialogContent
          onClose={() => setSelectedDetailItem(null)}
          className="max-w-lg p-5 sm:p-6"
        >
          <DialogHeader className="space-y-1 pb-3 border-b border-slate-100 pr-8">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <CalendarDays className="h-4 w-4" />
              </span>
              Rincian Tanggal & Permohonan Cuti
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Informasi lengkap permohonan, alokasi kuota hari, dan daftar tanggal cuti.
            </DialogDescription>
          </DialogHeader>

          {selectedDetailItem && (
            <div className="space-y-4 mt-3">
              {/* Info Karyawan & Transaksi */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-slate-500 font-medium">Karyawan:</span>
                  <span className="font-bold text-slate-900">
                    {selectedDetailItem.nama}{" "}
                    <span className="font-mono text-slate-500 font-normal">
                      ({selectedDetailItem.nip})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-slate-500 font-medium">Bagian / Stasiun:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDetailItem.bagian}
                    {selectedDetailItem.stasiun && selectedDetailItem.stasiun !== "-" && ` • ${selectedDetailItem.stasiun}`}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-slate-500 font-medium">Tgl Transaksi:</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {formatDateIndo(selectedDetailItem.tglTransaksi || selectedDetailItem.requestDate)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Keperluan / Uraian:</span>
                  <span className="text-slate-800 text-right italic font-medium">
                    {selectedDetailItem.uraian || selectedDetailItem.purpose || "-"}
                  </span>
                </div>
              </div>

              {/* Distribusi Kuota Cuti */}
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    Distribusi Kuota Cuti:
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    Total {selectedDetailItem.totalDays} hari
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded-lg border border-blue-100/80 text-center shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Tahunan</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {selectedDetailItem.annualDays} hr
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-purple-100/80 text-center shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Cuti Besar</span>
                    <span className="font-mono font-bold text-purple-700 text-sm">
                      {selectedDetailItem.longLeaveDays} hr
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100/80 text-center shadow-2xs">
                    <span className="text-[10px] text-slate-500 block">Inhaldagen</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {selectedDetailItem.inhaldagenDays} hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Daftar Lengkap Tanggal Cuti */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-600" />
                    Daftar Tanggal yang Diambil:
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium font-mono">
                    {parseDatesList(selectedDetailItem.tglCuti, selectedDetailItem.startDate, selectedDetailItem.endDate).length} hari
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {parseDatesList(
                      selectedDetailItem.tglCuti,
                      selectedDetailItem.startDate,
                      selectedDetailItem.endDate
                    ).map((tgl, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-colors"
                      >
                        <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-100">
                          {i + 1}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {tgl}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDetailItem(null)}
                  className="h-9 text-xs w-full sm:w-auto"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
