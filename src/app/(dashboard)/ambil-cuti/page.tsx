"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import {
  CalendarDays,
  Building2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Factory,
  Search,
  X,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiDatePicker } from "@/components/bersama/pemilih-tanggal";
import { StepperHari } from "@/components/bersama/stepper-hari";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getEmployeesForLeaveAction,
  createLeaveRequestAction,
  getEmployeeLeaveRequestsAction,
  EmployeeLeaveHistoryItem,
} from "@/actions/aksi-cuti";
import { BalanceActivityCard } from "@/components/fitur/cuti/kartu-aktivitas-saldo";

interface EmployeeOption {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  stasiun?: string;
  category?: string;
  department: {
    id: string;
    code: string;
    name: string;
  };
  balances: {
    annual: number;
    longLeave: number;
    inhaldagen: number;
    total: number;
  };
}

export default function HalamanAmbilCuti() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeLeaveHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [isPending, startTransition] = useTransition();

  // Modal Dialog Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestDate, setRequestDate] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [annualDays, setAnnualDays] = useState<number>(0);
  const [longLeaveDays, setLongLeaveDays] = useState<number>(0);
  const [inhaldagenDays, setInhaldagenDays] = useState<number>(0);
  const [purpose, setPurpose] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all employees on mount
  useEffect(() => {
    async function loadEmployees() {
      setIsLoadingEmployees(true);
      try {
        const res = await getEmployeesForLeaveAction();
        if (res.success && res.data) {
          setEmployees(res.data as EmployeeOption[]);
        }
      } catch (err) {
        console.error("Failed to load employees", err);
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, []);

  // Filter employees by search query
  const filteredEmployees = searchQuery.trim()
    ? employees.filter((emp) => {
        const q = searchQuery.toLowerCase();
        return (
          emp.name.toLowerCase().includes(q) ||
          emp.employeeNumber.toLowerCase().includes(q) ||
          emp.department?.name?.toLowerCase().includes(q) ||
          (emp.stasiun && emp.stasiun.toLowerCase().includes(q)) ||
          emp.position?.toLowerCase().includes(q)
        );
      })
    : employees;

  // Load employee leave history
  const loadEmployeeHistory = useCallback(async (employeeId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await getEmployeeLeaveRequestsAction(employeeId);
      if (res.success && res.data) {
        setEmployeeHistory(res.data);
      } else {
        setEmployeeHistory([]);
      }
    } catch (err) {
      console.error("Failed to load history", err);
      setEmployeeHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Handle selecting an employee from search dropdown
  const handleSelectEmployee = (emp: EmployeeOption) => {
    setSelectedEmployee(emp);
    setSearchQuery(`${emp.employeeNumber} - ${emp.name}`);
    setIsSearchOpen(false);

    // Reset leave allocation fields
    setSelectedDates([]);
    setAnnualDays(0);
    setLongLeaveDays(0);
    setInhaldagenDays(0);
    setPurpose("");
    setNotes("");

    // Load History
    loadEmployeeHistory(emp.id);
  };

  // Handle clearing selected employee
  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setEmployeeHistory([]);
  };

  // Calculation for requested days & balances
  const totalRequestedDays =
    Number(annualDays || 0) + Number(longLeaveDays || 0) + Number(inhaldagenDays || 0);

  const remainingAnnual =
    (selectedEmployee?.balances.annual ?? 0) - (Number(annualDays) || 0);
  const remainingLongLeave =
    (selectedEmployee?.balances.longLeave ?? 0) - (Number(longLeaveDays) || 0);
  const remainingInhaldagen =
    (selectedEmployee?.balances.inhaldagen ?? 0) - (Number(inhaldagenDays) || 0);

  const isExceedingAnnual = remainingAnnual < 0;
  const isExceedingLongLeave = remainingLongLeave < 0;
  const isExceedingInhaldagen = remainingInhaldagen < 0;
  const hasInvalidAllocation =
    isExceedingAnnual || isExceedingLongLeave || isExceedingInhaldagen;

  const isAllocationMismatch =
    selectedDates.length > 0 && totalRequestedDays !== selectedDates.length;

  const handleDatesChange = (dates: string[]) => {
    setSelectedDates(dates);
    if (dates.length === 0) {
      setAnnualDays(0);
      setLongLeaveDays(0);
      setInhaldagenDays(0);
    }
  };

  const handleOpenLeaveModal = () => {
    if (!selectedEmployee) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }
    setRequestDate(new Date().toISOString().split("T")[0]);
    setSelectedDates([]);
    setAnnualDays(0);
    setLongLeaveDays(0);
    setInhaldagenDays(0);
    setPurpose("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }

    if (selectedDates.length === 0) {
      toast.error("Silakan pilih minimal 1 tanggal cuti di kalender.");
      return;
    }

    if (isAllocationMismatch) {
      toast.error(
        `Total alokasi (${totalRequestedDays} hari) tidak sama dengan jumlah tanggal yang dipilih (${selectedDates.length} hari).`
      );
      return;
    }

    if (hasInvalidAllocation) {
      toast.error("Jumlah hari cuti yang diminta melebihi sisa saldo yang tersedia!");
      return;
    }

    if (!purpose.trim()) {
      toast.error("Mohon isi alasan / keperluan cuti.");
      return;
    }

    startTransition(async () => {
      const res = await createLeaveRequestAction({
        employeeId: selectedEmployee.id,
        requestDate,
        selectedDates,
        startDate: selectedDates[0],
        endDate: selectedDates[selectedDates.length - 1],
        annualDays: Number(annualDays) || 0,
        longLeaveDays: Number(longLeaveDays) || 0,
        inhaldagenDays: Number(inhaldagenDays) || 0,
        purpose,
        notes,
      });

      if (res.success && res.data) {
        toast.success(res.message || "Permohonan cuti berhasil disimpan!");
        setIsModalOpen(false);

        const updatedBalances = {
          annual: remainingAnnual,
          longLeave: remainingLongLeave,
          inhaldagen: remainingInhaldagen,
          total: remainingAnnual + remainingLongLeave + remainingInhaldagen,
        };

        const updatedEmp: EmployeeOption = {
          ...selectedEmployee,
          balances: updatedBalances,
        };
        setSelectedEmployee(updatedEmp);
        setEmployees((prev) =>
          prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
        );

        loadEmployeeHistory(selectedEmployee.id);
      } else {
        toast.error(res.message || "Gagal menyimpan permohonan cuti.");
      }
    });
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* SECTION 1: DATA KARYAWAN & POSISI SALDO (COMPACT & RINGKAS) */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 space-y-3">
          {/* Kolom Pencarian Karyawan (Search Box with Autocomplete) */}
          <div className="relative" ref={searchContainerRef}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="employeeSearchInput"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                    if (selectedEmployee && e.target.value !== `${selectedEmployee.employeeNumber} - ${selectedEmployee.name}`) {
                      setSelectedEmployee(null);
                      setEmployeeHistory([]);
                    }
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Cari Karyawan (Ketik NIP, Nama, atau Bagian)..."
                  className="pl-9 pr-8 h-9 text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white"
                />
                {searchQuery && !selectedEmployee && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(true);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    title="Hapus ketikan"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Tombol Tutup di kanan searchbar */}
              {selectedEmployee && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearEmployee}
                  className="h-9 px-3.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border-rose-200 gap-1.5 shrink-0 shadow-2xs transition-colors"
                  title="Tutup pencarian"
                >
                  <X className="h-3.5 w-3.5 text-rose-600" />
                  Tutup
                </Button>
              )}
            </div>

            {/* Dropdown Hasil Pencarian */}
            {isSearchOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                {isLoadingEmployees ? (
                  <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    Memuat data karyawan...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    Tidak ditemukan karyawan dengan kata kunci &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const deptStr = emp.department?.name && emp.department.name !== "-" ? emp.department.name : "";
                    const stationStr = emp.stasiun && emp.stasiun !== "-" ? `Stasiun: ${emp.stasiun}` : "";
                    const posStr = emp.position && emp.position !== "-" ? emp.position : "";
                    const metaParts = [`NIP: ${emp.employeeNumber}`, deptStr, stationStr, posStr].filter(Boolean);

                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50/70 transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 truncate">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            {metaParts.join(" • ")}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono text-slate-600 h-5 shrink-0 ml-2">
                          Saldo: {emp.balances.total} hr
                        </Badge>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Profil Karyawan & Posisi Saldo Cuti */}
          {selectedEmployee && (() => {
            const isPelaksana = selectedEmployee.category?.toUpperCase() === "PELAKSANA";
            return (
              <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedEmployee.employeeNumber}
                    </span>
                    <span className="text-slate-400 font-normal text-sm">-</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedEmployee.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-medium ${
                      isPelaksana
                        ? "bg-amber-50 text-amber-900 border-amber-200 font-semibold"
                        : "bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold"
                    }`}>
                      Kategori: {isPelaksana ? "Pelaksana" : "Pimpinan"}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200/80 font-medium">
                      <Building2 className="h-3 w-3 text-[#0093dc]" />
                      {selectedEmployee.department.name}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                      <Factory className="h-3 w-3 text-slate-600" />
                      Stasiun: {selectedEmployee.stasiun && selectedEmployee.stasiun !== "-" ? selectedEmployee.stasiun : "Semua Stasiun"}
                    </span>
                    {selectedEmployee.position && selectedEmployee.position !== "-" && (
                      <span className="inline-flex items-center gap-1 bg-indigo-50/80 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200/80 font-medium">
                        <Briefcase className="h-3 w-3 text-indigo-600" />
                        {selectedEmployee.position}
                      </span>
                    )}
                  </div>
                </div>

                {/* Saldo Cuti Ringkas (2 Grid untuk Pelaksana, 3 Grid untuk Pimpinan) */}
                <div className={`grid ${isPelaksana ? "grid-cols-2" : "grid-cols-3"} gap-2.5 text-xs`}>
                  {/* Tahunan */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/90 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-sky-950 font-bold block">Cuti Tahunan</span>
                      <span className="text-[10px] text-sky-600/90 font-medium">Reguler</span>
                    </div>
                    <span className="font-bold font-mono text-base text-[#0093dc]">
                      {selectedEmployee.balances.annual} <span className="text-[10px] font-medium font-sans">hr</span>
                    </span>
                  </div>

                  {/* Besar */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/90 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-indigo-950 font-bold block">Cuti Besar</span>
                      <span className="text-[10px] text-indigo-600/90 font-medium">6 Tahunan</span>
                    </div>
                    <span className="font-bold font-mono text-base text-indigo-700">
                      {selectedEmployee.balances.longLeave} <span className="text-[10px] font-medium font-sans">hr</span>
                    </span>
                  </div>

                  {/* Inhaldagen (Hanya untuk Pimpinan) */}
                  {!isPelaksana && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/90 shadow-2xs">
                      <div>
                        <span className="text-[10px] text-amber-950 font-bold block">Inhaldagen</span>
                        <span className="text-[10px] text-amber-600/90 font-medium">Pengganti</span>
                      </div>
                      <span className="font-bold font-mono text-base text-amber-700">
                        {selectedEmployee.balances.inhaldagen} <span className="text-[10px] font-medium font-sans">hr</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* SECTION 2: KOMPONEN REUSABLE RIWAYAT AKTIVITAS SALDO */}
      {selectedEmployee && (
        <BalanceActivityCard
          employee={selectedEmployee}
          history={employeeHistory}
          isLoading={isLoadingHistory}
          onRefreshHistory={loadEmployeeHistory}
          onEmployeeBalancesUpdated={(updatedBalances) => {
            const updatedEmp = {
              ...selectedEmployee,
              balances: updatedBalances,
            };
            setSelectedEmployee(updatedEmp);
            setEmployees((prev) =>
              prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
            );
          }}
          actionButton={
            <Button
              type="button"
              size="default"
              onClick={handleOpenLeaveModal}
              className="font-semibold shadow-xs"
            >
              <CalendarDays className="h-4 w-4" />
              Ambil Cuti
            </Button>
          }
        />
      )}

      {/* POPUP MODAL DIALOG: DETAIL PERMOHONAN CUTI BARU */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Formulir Pengambilan Cuti
            </DialogTitle>
            <DialogDescription>
              Karyawan: <span className="font-semibold text-slate-900">{selectedEmployee?.name}</span> (NIP: {selectedEmployee?.employeeNumber} — {selectedEmployee?.department.name})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitLeave} className="space-y-4 pt-2">
            {/* Kalender Interaktif Multi-Date Picker */}
            <div className="space-y-1.5">
              <Label required className="text-xs font-semibold text-slate-700">
                Pilih Tanggal Cuti di Kalender (Klik tanggal untuk memilih / membatalkan):
              </Label>
              <MultiDatePicker
                selectedDates={selectedDates}
                onChange={handleDatesChange}
                disabled={isPending}
              />
            </div>

            {/* Alokasi Jumlah Hari per Jenis Cuti */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                    Alokasi Hari per Jenis Cuti
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Bagikan kuota cuti sesuai jumlah tanggal yang dipilih
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-medium text-slate-600">
                    <span className="text-slate-400">Dipilih:</span>
                    <span className="font-bold text-blue-600">{selectedDates.length} hari</span>
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xs text-[11px] font-medium transition-colors",
                      isAllocationMismatch
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-emerald-50 border-emerald-300 text-emerald-800"
                    )}
                  >
                    <span className="opacity-70">Alokasi:</span>
                    <span className="font-bold">{totalRequestedDays} hari</span>
                  </div>
                </div>
              </div>

              {isAllocationMismatch && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>
                    Total alokasi ({totalRequestedDays} hari) belum sesuai dengan {selectedDates.length} tanggal yang dipilih.
                  </span>
                </div>
              )}

              {/* Dedicated Card: Sisa Saldo Setelah Cuti */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-blue-600" />
                    Sisa Saldo Setelah Cuti
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Otomatis terpotong sesuai alokasi
                  </span>
                </div>

                <div className={`grid grid-cols-1 ${selectedEmployee?.category?.toUpperCase() === "PELAKSANA" ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
                  {/* Tahunan Stat */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100/70">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-700">Tahunan</span>
                    </div>
                    <div className="flex items-baseline gap-1 font-mono">
                      <motion.span
                        key={remainingAnnual}
                        initial={{ scale: 1.25, color: "#2563eb" }}
                        animate={{ scale: 1, color: "#1d4ed8" }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-bold text-blue-700"
                      >
                        <AnimatedNumber value={Math.max(0, remainingAnnual)} />
                      </motion.span>
                      <span className="text-[10px] text-slate-400">/ {selectedEmployee?.balances.annual ?? 0} hr</span>
                    </div>
                  </div>

                  {/* Besar Stat */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 border border-purple-100/70">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-700">Besar</span>
                    </div>
                    <div className="flex items-baseline gap-1 font-mono">
                      <motion.span
                        key={remainingLongLeave}
                        initial={{ scale: 1.25, color: "#9333ea" }}
                        animate={{ scale: 1, color: "#7e22ce" }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-bold text-purple-700"
                      >
                        <AnimatedNumber value={Math.max(0, remainingLongLeave)} />
                      </motion.span>
                      <span className="text-[10px] text-slate-400">/ {selectedEmployee?.balances.longLeave ?? 0} hr</span>
                    </div>
                  </div>

                  {/* Inhaldagen Stat */}
                  {selectedEmployee?.category?.toUpperCase() !== "PELAKSANA" && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/70">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-medium text-slate-700">Inhaldagen</span>
                      </div>
                      <div className="flex items-baseline gap-1 font-mono">
                        <motion.span
                          key={remainingInhaldagen}
                          initial={{ scale: 1.25, color: "#059669" }}
                          animate={{ scale: 1, color: "#047857" }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-bold text-emerald-700"
                        >
                          <AnimatedNumber value={Math.max(0, remainingInhaldagen)} />
                        </motion.span>
                        <span className="text-[10px] text-slate-400">/ {selectedEmployee?.balances.inhaldagen ?? 0} hr</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-1 ${selectedEmployee?.category?.toUpperCase() === "PELAKSANA" ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-2.5`}>
                {/* Tahunan Card */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-800">Cuti Tahunan</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      Maks {selectedEmployee?.balances.annual ?? 0}
                    </span>
                  </div>
                  <StepperHari
                    id="annualDays"
                    min={0}
                    max={selectedEmployee?.balances.annual ?? 0}
                    value={annualDays}
                    onChange={setAnnualDays}
                    disabled={isPending}
                    isError={isExceedingAnnual}
                  />
                  {isExceedingAnnual && (
                    <p className="text-[10px] text-red-600 font-medium">Melebihi saldo!</p>
                  )}
                </div>

                {/* Cuti Besar Card */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="font-semibold text-slate-800">Cuti Besar</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      Maks {selectedEmployee?.balances.longLeave ?? 0}
                    </span>
                  </div>
                  <StepperHari
                    id="longLeaveDays"
                    min={0}
                    max={selectedEmployee?.balances.longLeave ?? 0}
                    value={longLeaveDays}
                    onChange={setLongLeaveDays}
                    disabled={isPending}
                    isError={isExceedingLongLeave}
                  />
                  {isExceedingLongLeave && (
                    <p className="text-[10px] text-red-600 font-medium">Melebihi saldo!</p>
                  )}
                </div>

                {/* Inhaldagen Card (HANYA UNTUK KARYAWAN PIMPINAN) */}
                {selectedEmployee?.category?.toUpperCase() !== "PELAKSANA" && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-slate-800">Inhaldagen</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        Maks {selectedEmployee?.balances.inhaldagen ?? 0}
                      </span>
                    </div>
                    <StepperHari
                      id="inhaldagenDays"
                      min={0}
                      max={selectedEmployee?.balances.inhaldagen ?? 0}
                      value={inhaldagenDays}
                      onChange={setInhaldagenDays}
                      disabled={isPending}
                      isError={isExceedingInhaldagen}
                    />
                    {isExceedingInhaldagen && (
                      <p className="text-[10px] text-red-600 font-medium">Melebihi saldo!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Keperluan / Alasan Cuti */}
            <div className="space-y-1">
              <Label htmlFor="purpose" required className="text-xs font-semibold text-slate-700">
                Keperluan / Alasan Cuti
              </Label>
              <textarea
                id="purpose"
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Contoh: Keperluan keluarga di luar kota"
                disabled={isPending}
                required
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending ||
                  hasInvalidAllocation ||
                  isAllocationMismatch ||
                  totalRequestedDays <= 0 ||
                  selectedDates.length === 0
                }
                className="font-semibold gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Simpan Permohonan Cuti
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
