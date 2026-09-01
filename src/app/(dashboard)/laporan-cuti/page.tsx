"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import Link from "next/link";
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
  getLeaveBalanceReportAction,
  getLeaveUsageReportAction,
  EmployeeBalanceReportItem,
  LeaveUsageReportItem,
} from "@/actions/aksi-laporan";
import { getDepartmentsAction, getStationsForDepartmentAction } from "@/actions/aksi-karyawan";
import { formatDateIndo, formatSingkatanBagian } from "@/lib/utils";

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

  const [usageSortField, setUsageSortField] = useState<UsageSortField>("nip");
  const [usageSortOrder, setUsageSortOrder] = useState<SortOrder>("asc");

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
      setUsageSortOrder("asc");
    }
  };

  const renderSortIcon = (currentField: string, field: string, order: "asc" | "desc") => {
    if (currentField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover:text-slate-600 transition-colors" />;
    }
    return order === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-600 font-bold" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600 font-bold" />
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
        comparison = new Date(a.tglTransaksi || a.requestDate).getTime() - new Date(b.tglTransaksi || b.requestDate).getTime();
      } else if (usageSortField === "uraian") {
        comparison = (a.uraian || a.purpose || "").localeCompare(b.uraian || b.purpose || "");
      } else if (usageSortField === "tglCuti") {
        comparison = (a.tglCuti || a.startDate || "").localeCompare(b.tglCuti || b.startDate || "");
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
    <div className="space-y-6 w-full pb-12 print:p-0 print:m-0 print:max-w-none">
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

      {/* PRINT-ONLY OFFICIAL HEADER (Dinas PG Trangkil) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight uppercase">
              PT KEBON AGUNG — PABRIK GULA TRANGKIL PATI
            </h2>
            <h3 className="text-sm font-semibold text-slate-800">
              {activeTab === "BALANCES"
                ? "LAPORAN REKAPITULASI SALDO CUTI KARYAWAN PIMPINAN"
                : "LAPORAN REKAPITULASI PEMAKAIAN CUTI KARYAWAN PIMPINAN"}
            </h3>
            <p className="text-xs text-slate-600">
              Periode Tahun: {selectedYear} {selectedMonth > 0 ? `• Bulan: ${MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label}` : ""}
            </p>
          </div>
          <div className="text-right text-xs font-mono">
            <div>Klasifikasi: Internal SDM</div>
            <div>Dicetak: {formatDateIndo(new Date())}</div>
          </div>
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

      {/* DUA CARD FILTER: KIRI (Pencarian Cepat) & KANAN (Jenis Karyawan, Bagian, Stasiun) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 print:hidden">
        {/* CARD 1: PENCARIAN CEPAT (KIRI) */}
        <Card className="lg:col-span-5 border-slate-200/90 shadow-2xs">
          <CardHeader className="py-2.5 px-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-50/50 via-slate-50/30 to-transparent">
            <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-[#0093dc]" />
              Pencarian Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                CARI CEPAT:
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik NIP, Nama karyawan, dll..."
                  className="h-8.5 pl-8 pr-2 text-xs focus-visible:ring-[#0093dc]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: FILTER KATEGORI & ORGANISASI (KANAN) */}
        <Card className="lg:col-span-7 border-slate-200/90 shadow-2xs">
          <CardHeader className="py-2.5 px-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-50/50 via-slate-50/30 to-transparent flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#0093dc]" />
              Filter Jenis Karyawan, Bagian & Stasiun
            </CardTitle>
            {(categoryFilter !== "ALL" || departmentFilter !== "ALL" || stationFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("ALL");
                  setDepartmentFilter("ALL");
                  setStationFilter("ALL");
                }}
                className="text-[10px] text-[#0093dc] hover:text-sky-800 font-bold hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Jenis Karyawan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  JENIS KARYAWAN:
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`w-full h-8.5 rounded-lg border px-2.5 text-xs font-medium focus:border-[#0093dc] focus:outline-none transition-colors ${
                    categoryFilter === "PIMPINAN"
                      ? "border-sky-400 bg-sky-50/60 text-sky-950 font-bold"
                      : categoryFilter === "PELAKSANA"
                      ? "border-emerald-400 bg-emerald-50/60 text-emerald-950 font-bold"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="PIMPINAN">Pimpinan</option>
                  <option value="PELAKSANA">Pelaksana</option>
                </select>
              </div>

              {/* 2. Bagian */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  BAGIAN:
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setStationFilter("ALL");
                  }}
                  className={`w-full h-8.5 rounded-md border px-2.5 text-xs font-medium focus:border-blue-500 focus:outline-none transition-colors ${
                    departmentFilter !== "ALL"
                      ? "border-blue-400 bg-blue-50/30 text-blue-900 font-bold"
                      : "border-slate-200 bg-white text-slate-800"
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

              {/* 3. Stasiun */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  STASIUN:
                </label>
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className={`w-full h-8.5 rounded-md border px-2.5 text-xs font-medium focus:border-blue-500 focus:outline-none transition-colors ${
                    stationFilter !== "ALL"
                      ? "border-blue-400 bg-blue-50/30 text-blue-900 font-bold"
                      : "border-slate-200 bg-white text-slate-800"
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
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-2xs print:border-none print:shadow-none">
        <CardHeader className="py-3 px-4 border-b border-slate-100 print:hidden flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              {activeTab === "BALANCES"
                ? "Tabel Rekapitulasi Posisi Saldo Cuti"
                : "Tabel Riwayat Pengambilan Cuti Periode Terpilih"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Menampilkan {activeTab === "BALANCES" ? sortedBalanceItems.length : sortedUsageItems.length} baris data
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat data laporan...
            </div>
          ) : activeTab === "BALANCES" ? (
            /* TAB 1: TABEL REKAP SALDO DENGAN ATRIBUT STASIUN & SORTER */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px]">
                    <TableHead
                      className="w-12 text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("no")}
                      title="Urutkan No"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>No</span>
                        {renderSortIcon(balanceSortField, "no", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-28 font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("nip")}
                      title="Urutkan NIP (Sorter Utama)"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>NIP</span>
                        {renderSortIcon(balanceSortField, "nip", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("nama")}
                      title="Urutkan Nama Karyawan"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Nama Karyawan</span>
                        {renderSortIcon(balanceSortField, "nama", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("bagian")}
                      title="Urutkan Bagian"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Bagian</span>
                        {renderSortIcon(balanceSortField, "bagian", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("stasiun")}
                      title="Urutkan Stasiun"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Stasiun</span>
                        {renderSortIcon(balanceSortField, "stasiun", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("cutiTahunan")}
                      title="Urutkan Cuti Tahunan"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Tahunan</span>
                        {renderSortIcon(balanceSortField, "cutiTahunan", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("cutiBesar")}
                      title="Urutkan Cuti Besar"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Besar</span>
                        {renderSortIcon(balanceSortField, "cutiBesar", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleBalanceSort("inhaldagen")}
                      title="Urutkan Inhaldagen"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Inhaldagen</span>
                        {renderSortIcon(balanceSortField, "inhaldagen", balanceSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold bg-blue-50/50 cursor-pointer select-none hover:bg-blue-100/70 transition-colors group"
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
                      <TableCell colSpan={9} className="h-24 text-center text-slate-500 text-xs">
                        Tidak ada data saldo karyawan yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedBalanceItems.map((emp, idx) => (
                      <TableRow key={emp.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-center text-xs font-mono text-slate-400">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                          {emp.nip}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-slate-900">
                          {emp.nama}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800" title={emp.bagian}>
                          <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700">
                            {formatSingkatanBagian(emp.bagian)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {emp.stasiun && emp.stasiun !== "-" ? (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-800 text-xs">
                              <Factory className="h-3 w-3 text-slate-400" />
                              {emp.stasiun}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-blue-700 tabular-nums">
                          {emp.cutiTahunan}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-purple-700 tabular-nums">
                          {emp.cutiBesar}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-amber-700 tabular-nums">
                          {emp.inhaldagen}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-black text-slate-900 bg-blue-50/30 tabular-nums">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px]">
                    <TableHead
                      className="w-12 text-center font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleUsageSort("no")}
                      title="Urutkan No"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>No</span>
                        {renderSortIcon(usageSortField, "no", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-24 font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleUsageSort("nip")}
                      title="Urutkan NIP"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>NIP</span>
                        {renderSortIcon(usageSortField, "nip", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleUsageSort("nama")}
                      title="Urutkan Nama Karyawan"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Nama Karyawan</span>
                        {renderSortIcon(usageSortField, "nama", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleUsageSort("bagian")}
                      title="Urutkan Bagian & Stasiun"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Bagian / Stasiun</span>
                        {renderSortIcon(usageSortField, "bagian", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleUsageSort("tglTransaksi")}
                      title="Urutkan Tgl Transaksi"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Tgl Transaksi</span>
                        {renderSortIcon(usageSortField, "tglTransaksi", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleUsageSort("uraian")}
                      title="Urutkan Uraian / Keperluan"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Uraian</span>
                        {renderSortIcon(usageSortField, "uraian", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-bold cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleUsageSort("tglCuti")}
                      title="Urutkan Tanggal Cuti"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Tanggal Cuti</span>
                        {renderSortIcon(usageSortField, "tglCuti", usageSortOrder)}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center font-bold bg-blue-50/50 cursor-pointer select-none hover:bg-blue-100/70 transition-colors group"
                      onClick={() => handleUsageSort("totalDays")}
                      title="Urutkan Total Hari"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Jumlah Cuti</span>
                        {renderSortIcon(usageSortField, "totalDays", usageSortOrder)}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-slate-500 text-xs">
                        Belum ada aktivitas mutasi/pengambilan cuti yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUsageItems.map((item, idx) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        {/* No */}
                        <TableCell className="text-center text-xs font-mono text-slate-400">
                          {idx + 1}
                        </TableCell>

                        {/* NIP */}
                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                          {item.nip}
                        </TableCell>

                        {/* Nama Karyawan */}
                        <TableCell className="font-semibold text-xs text-slate-900">
                          {item.nama}
                        </TableCell>

                        {/* Bagian / Stasiun */}
                        <TableCell className="text-xs text-slate-800">
                          <div className="font-semibold text-slate-800 flex items-center gap-1" title={item.bagian}>
                            <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700">
                              {formatSingkatanBagian(item.bagian)}
                            </Badge>
                          </div>
                          {item.stasiun && item.stasiun !== "-" && (
                            <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                              <Factory className="h-2.5 w-2.5 text-slate-400" />
                              {item.stasiun}
                            </div>
                          )}
                        </TableCell>

                        {/* Tgl Transaksi */}
                        <TableCell className="text-xs font-mono text-slate-700">
                          {formatDateIndo(item.tglTransaksi || item.requestDate)}
                        </TableCell>

                        {/* Uraian */}
                        <TableCell className="text-xs text-slate-800 max-w-xs">
                          {item.uraian || item.purpose || "-"}
                        </TableCell>

                        {/* Tanggal Cuti */}
                        <TableCell className="text-xs font-mono text-slate-700">
                          {item.tglCuti && item.tglCuti.length > 0 ? (
                            <span>{item.tglCuti}</span>
                          ) : item.startDate && item.startDate !== "-" ? (
                            <span>
                              {formatDateIndo(item.startDate)}
                              {item.startDate !== item.endDate && ` s/d ${formatDateIndo(item.endDate)}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </TableCell>

                        {/* Jumlah Cuti */}
                        <TableCell className="text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                            <span>{item.totalDays} hari</span>
                            {item.annualDays > 0 && (
                              <Badge variant="outline" className="text-[10px] font-sans px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                Tahunan
                              </Badge>
                            )}
                            {item.longLeaveDays > 0 && (
                              <Badge variant="outline" className="text-[10px] font-sans px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200">
                                Besar
                              </Badge>
                            )}
                            {item.inhaldagenDays > 0 && (
                              <Badge variant="outline" className="text-[10px] font-sans px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                                Inhaldagen
                              </Badge>
                            )}
                          </div>
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

      {/* PRINT-ONLY SIGNATURE BLOCK (Tanda Tangan Pejabat PG Trangkil) */}
      <div className="hidden print:block mt-12 pt-6">
        <div className="grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900">KEPALA BAGIAN SDM & UMUM</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">( .................................................... )</p>
            <p className="text-[10px] text-slate-500 font-mono">NIP: ..............................</p>
          </div>
          <div>
            <p className="text-slate-600">Pati, {formatDateIndo(new Date())}</p>
            <p className="font-bold text-slate-900">PENGELOLA ADMINISTRASI CUTI</p>
            <div className="h-20" />
            <p className="font-bold underline text-slate-900">( {balanceData?.generatedBy || "Administrator"} )</p>
            <p className="text-[10px] text-slate-500 font-mono">Seksi Kepegawaian & Tata Usaha</p>
          </div>
        </div>
      </div>
    </div>
  );
}
