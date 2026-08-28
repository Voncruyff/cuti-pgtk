"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import {
  CalendarDays,
  User,
  Building2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  RefreshCcw,
  Search,
  X,
  Printer,
  ChevronRight,
  UserCheck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getEmployeeBalanceAction,
  createLeaveRequestAction,
} from "@/actions/leave-actions";

interface EmployeeOption {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
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

export default function LeaveCreatePage() {
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Selected Employee
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);

  // Modal / Popup Form State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields inside Modal
  const todayStr = new Date().toISOString().split("T")[0];
  const [requestDate, setRequestDate] = useState<string>(todayStr);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [annualDays, setAnnualDays] = useState<number>(0);
  const [longLeaveDays, setLongLeaveDays] = useState<number>(0);
  const [inhaldagenDays, setInhaldagenDays] = useState<number>(0);

  const [purpose, setPurpose] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Result state after success
  const [successResult, setSuccessResult] = useState<{
    requestNumber: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
    totalDays: number;
    annualDays: number;
    longLeaveDays: number;
    inhaldagenDays: number;
  } | null>(null);

  // Load employees on mount
  useEffect(() => {
    async function loadEmployees() {
      setIsLoadingEmployees(true);
      try {
        const res = await getEmployeesForLeaveAction();
        if (res.success && res.data) {
          setEmployees(res.data as EmployeeOption[]);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
        toast.error("Gagal memuat daftar karyawan.");
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, []);

  // Handle outside click to close search dropdown
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

  // Filter employees based on search query
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.employeeNumber.toLowerCase().includes(q) ||
      emp.name.toLowerCase().includes(q) ||
      emp.department.name.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  // Handle selecting an employee from search results
  const handleSelectEmployee = (emp: EmployeeOption) => {
    setSelectedEmployee(emp);
    setSearchQuery(`${emp.employeeNumber} — ${emp.name}`);
    setIsSearchOpen(false);
    setSuccessResult(null);

    // Reset leave allocation fields
    setAnnualDays(0);
    setLongLeaveDays(0);
    setInhaldagenDays(0);
    setPurpose("");
    setNotes("");
  };

  // Handle clearing selected employee
  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setSuccessResult(null);
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

  // Handle opening the leave modal
  const handleOpenLeaveModal = () => {
    if (!selectedEmployee) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }
    // Default dates
    const today = new Date().toISOString().split("T")[0];
    setRequestDate(today);
    setStartDate(today);
    setEndDate(today);

    // Default allocation suggestion if annual available
    if (selectedEmployee.balances.annual > 0 && totalRequestedDays === 0) {
      setAnnualDays(1);
    }

    setIsModalOpen(true);
  };

  // Handle form submit inside Modal
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Data karyawan belum dipilih.");
      return;
    }

    if (totalRequestedDays <= 0) {
      toast.error("Mohon isi jumlah hari cuti minimal 1 hari.");
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
        startDate,
        endDate,
        annualDays: Number(annualDays) || 0,
        longLeaveDays: Number(longLeaveDays) || 0,
        inhaldagenDays: Number(inhaldagenDays) || 0,
        purpose,
        notes,
      });

      if (res.success && res.data) {
        toast.success(res.message || "Permohonan cuti berhasil disimpan!");

        // Close modal
        setIsModalOpen(false);

        // Update local employee balance
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

        // Set success result
        setSuccessResult({
          requestNumber: res.data.requestNumber,
          employeeName: selectedEmployee.name,
          employeeNumber: selectedEmployee.employeeNumber,
          departmentName: selectedEmployee.department.name,
          totalDays: totalRequestedDays,
          annualDays: Number(annualDays) || 0,
          longLeaveDays: Number(longLeaveDays) || 0,
          inhaldagenDays: Number(inhaldagenDays) || 0,
        });
      } else {
        toast.error(res.message || "Gagal menyimpan permohonan cuti.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-slate-800">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Pengambilan Cuti
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-2 sm:pl-0">
            Cari data karyawan pimpinan untuk memeriksa saldo dan mengajukan permohonan cuti.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successResult && (
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm animate-in fade-in-50 duration-300">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-900">
                Permohonan Cuti Berhasil Disimpan!
              </h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-emerald-700">Nomor Registrasi:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-sm shadow-2xs">
                  {successResult.requestNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-3 max-w-lg mx-auto">
                Pengambilan cuti atas nama <span className="font-semibold text-slate-900">{successResult.employeeName}</span> ({successResult.departmentName}) sebanyak{" "}
                <span className="font-bold text-blue-700">{successResult.totalDays} hari</span> telah resmi dipotong dari saldo cuti aktif.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => {
                  setSuccessResult(null);
                  handleOpenLeaveModal();
                }}
                className="gap-1.5 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Input Cuti Lagi untuk Karyawan Ini
              </Button>
              <Link href="/leave/details">
                <Button variant="outline" className="gap-1.5 h-9 text-xs font-medium bg-white">
                  <FileText className="h-3.5 w-3.5" />
                  Lihat Buku Mutasi Cuti
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={handleClearEmployee}
                className="h-9 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cari Karyawan Lain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Section: Data Karyawan & Pencarian */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                1. Data Karyawan Pimpinan
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ketik NIP atau Nama karyawan pada kolom pencarian di bawah
              </CardDescription>
            </div>
            {employees.length > 0 && (
              <Badge variant="outline" className="text-[11px] font-normal text-slate-600 bg-slate-50">
                {employees.length} Karyawan Terdaftar
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Kolom Pencarian Karyawan (Search Box with Autocomplete) */}
          <div className="space-y-1.5 relative" ref={searchContainerRef}>
            <Label htmlFor="employeeSearchInput" required className="text-xs font-semibold text-slate-700">
              Cari Karyawan (Ketik NIP / Nama / Bagian)
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="employeeSearchInput"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  if (selectedEmployee && e.target.value !== `${selectedEmployee.employeeNumber} — ${selectedEmployee.name}`) {
                    setSelectedEmployee(null);
                  }
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Contoh: Ketik 4147 atau Fikri atau Bambang..."
                className="pl-9 pr-9 h-10 text-sm font-medium text-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearEmployee}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown Hasil Pencarian */}
            {isSearchOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
                {isLoadingEmployees ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    Memuat data karyawan...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Tidak ditemukan karyawan dengan kata kunci <span className="font-semibold text-slate-800">"{searchQuery}"</span>.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className="w-full text-left p-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 truncate">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            NIP: {emp.employeeNumber} • {emp.department.name} - {emp.position}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-[11px] font-mono font-bold text-blue-600 block">
                          {emp.balances.total} hari
                        </span>
                        <span className="text-[10px] text-slate-400">Total Saldo</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Kondisi 1: Belum Ada Karyawan yang Dipilih (Empty State) */}
          {!selectedEmployee ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/60 my-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Pilih Karyawan Terlebih Dahulu
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Ketik nama atau NIP karyawan pada kotak pencarian di atas untuk memunculkan profil lengkap dan posisi saldo cuti aktif.
              </p>

              {/* Quick Suggestion Chips */}
              {employees.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Pilih cepat:</span>
                  {employees.slice(0, 3).map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 shadow-2xs transition-all font-medium"
                    >
                      {emp.employeeNumber} — {emp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Kondisi 2: Karyawan Sudah Dipilih (Tampilkan Detail & Kartu Saldo) */
            <div className="pt-2 space-y-4 animate-in fade-in-50 duration-300">
              {/* Header Info Karyawan Terpilih */}
              <div className="flex items-center justify-between bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-xs">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{selectedEmployee.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-white font-mono text-slate-700">
                        NIP: {selectedEmployee.employeeNumber}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedEmployee.position} • <span className="font-semibold text-slate-800">{selectedEmployee.department.name}</span>
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearEmployee}
                  className="h-8 text-xs text-slate-500 hover:text-red-600 hover:bg-white"
                >
                  Ganti Karyawan
                </Button>
              </div>

              {/* Rincian Ringkas Jabatan & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Jabatan</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.position}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Bagian / Unit</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.department.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Status Kepegawaian</span>
                    <span className="font-semibold text-emerald-700">Pimpinan Aktif</span>
                  </div>
                </div>
              </div>

              {/* 3 Kartu Saldo Cuti Aktif */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Posisi Saldo Cuti Aktif Saat Ini:
                  </span>
                  <span className="text-xs text-slate-600">
                    Total Keseluruhan: <strong className="text-blue-700 font-mono">{selectedEmployee.balances.total} hari</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Cuti Tahunan */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-900">Cuti Tahunan</span>
                      <Badge variant="annual" className="text-[10px]">Annual</Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-blue-700 tabular-nums">
                        {selectedEmployee.balances.annual}
                      </span>
                      <span className="text-xs text-blue-600 font-medium">hari</span>
                    </div>
                    <p className="text-[10px] text-blue-600/80 mt-0.5">Jatah cuti reguler tahunan</p>
                  </div>

                  {/* Cuti Besar */}
                  <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-900">Cuti Besar</span>
                      <Badge variant="longLeave" className="text-[10px]">Long Leave</Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-purple-700 tabular-nums">
                        {selectedEmployee.balances.longLeave}
                      </span>
                      <span className="text-xs text-purple-600 font-medium">hari</span>
                    </div>
                    <p className="text-[10px] text-purple-600/80 mt-0.5">Jatah cuti besar berkala</p>
                  </div>

                  {/* Inhaldagen */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-900">Inhaldagen</span>
                      <Badge variant="inhaldagen" className="text-[10px]">Inhaldagen</Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-amber-700 tabular-nums">
                        {selectedEmployee.balances.inhaldagen}
                      </span>
                      <span className="text-xs text-amber-600 font-medium">hari</span>
                    </div>
                    <p className="text-[10px] text-amber-600/80 mt-0.5">Kompensasi cuti istirahat/piket</p>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi di Kanan Bawah: Ambil Cuti Karyawan */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Data karyawan sudah sesuai? Klik tombol di kanan untuk membuka formulir cuti.
                </p>
                <Button
                  type="button"
                  onClick={handleOpenLeaveModal}
                  className="gap-2 h-10 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all hover:translate-y-[-1px]"
                >
                  <CalendarDays className="h-4 w-4" />
                  Ambil Cuti Karyawan
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* POPUP MODAL DIALOG: Section 2 (Detail Permohonan & Alokasi Cuti) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-2xl">
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
            {/* Tanggal Permohonan, Mulai, & Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="modalRequestDate" required className="text-xs">
                  Tanggal Permohonan
                </Label>
                <Input
                  id="modalRequestDate"
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="modalStartDate" required className="text-xs">
                  Tanggal Mulai
                </Label>
                <Input
                  id="modalStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="modalEndDate" required className="text-xs">
                  Tanggal Selesai
                </Label>
                <Input
                  id="modalEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Alokasi Jumlah Hari per Jenis Cuti */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Alokasi Hari per Jenis Cuti:
                </Label>
                <div className="text-xs font-semibold text-slate-700">
                  Total Diambil:{" "}
                  <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {totalRequestedDays} hari
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tahunan Input */}
                <div className="space-y-1 bg-white p-2.5 rounded-md border border-slate-200">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-blue-900">Cuti Tahunan</span>
                    <span className="text-slate-400 font-mono">
                      Maks: {selectedEmployee?.balances.annual ?? 0}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max={selectedEmployee?.balances.annual ?? 0}
                      value={annualDays || ""}
                      placeholder="0"
                      onChange={(e) => setAnnualDays(Number(e.target.value) || 0)}
                      disabled={isPending}
                      className={`h-8 text-xs pr-10 font-semibold ${isExceedingAnnual ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">hari</span>
                  </div>
                  {isExceedingAnnual && (
                    <p className="text-[10px] text-red-600 font-medium">Melebihi saldo!</p>
                  )}
                </div>

                {/* Cuti Besar Input */}
                <div className="space-y-1 bg-white p-2.5 rounded-md border border-slate-200">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-purple-900">Cuti Besar</span>
                    <span className="text-slate-400 font-mono">
                      Maks: {selectedEmployee?.balances.longLeave ?? 0}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max={selectedEmployee?.balances.longLeave ?? 0}
                      value={longLeaveDays || ""}
                      placeholder="0"
                      onChange={(e) => setLongLeaveDays(Number(e.target.value) || 0)}
                      disabled={isPending}
                      className={`h-8 text-xs pr-10 font-semibold ${isExceedingLongLeave ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">hari</span>
                  </div>
                  {isExceedingLongLeave && (
                    <p className="text-[10px] text-red-600 font-medium">Melebihi saldo!</p>
                  )}
                </div>

                {/* Inhaldagen Input */}
                <div className="space-y-1 bg-white p-2.5 rounded-md border border-slate-200">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-amber-900">Inhaldagen</span>
                    <span className="text-slate-400 font-mono">
                      Maks: {selectedEmployee?.balances.inhaldagen ?? 0}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max={selectedEmployee?.balances.inhaldagen ?? 0}
                      value={inhaldagenDays || ""}
                      placeholder="0"
                      onChange={(e) => setInhaldagenDays(Number(e.target.value) || 0)}
                      disabled={isPending}
                      className={`h-8 text-xs pr-10 font-semibold ${isExceedingInhaldagen ? "border-red-500" : ""}`}
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">hari</span>
                  </div>
                  {isExceedingInhaldagen && (
                    <p className="text-[10px] text-red-600 font-medium">Melebihi saldo!</p>
                  )}
                </div>
              </div>

              {/* Live Simulation Box */}
              {totalRequestedDays > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    Simulasi Saldo Akhir Setelah Pengambilan:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 rounded bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Sisa Tahunan</span>
                      <span className={`font-bold font-mono ${remainingAnnual < 0 ? "text-red-600" : "text-slate-900"}`}>
                        {remainingAnnual} hari
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Sisa Cuti Besar</span>
                      <span className={`font-bold font-mono ${remainingLongLeave < 0 ? "text-red-600" : "text-slate-900"}`}>
                        {remainingLongLeave} hari
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Sisa Inhaldagen</span>
                      <span className={`font-bold font-mono ${remainingInhaldagen < 0 ? "text-red-600" : "text-slate-900"}`}>
                        {remainingInhaldagen} hari
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Keperluan / Alasan Cuti */}
            <div className="space-y-1">
              <Label htmlFor="modalPurpose" required className="text-xs">
                Keperluan / Alasan Cuti
              </Label>
              <textarea
                id="modalPurpose"
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Contoh: Keperluan keluarga di luar kota"
                disabled={isPending}
                required
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <div className="space-y-1">
              <Label htmlFor="modalNotes" className="text-xs">
                Alamat / Kontak Selama Cuti (Opsional)
              </Label>
              <Input
                id="modalNotes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pati, Jawa Tengah (No HP: 08123456789)"
                disabled={isPending}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending || hasInvalidAllocation || totalRequestedDays <= 0}
                className="h-9 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
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
