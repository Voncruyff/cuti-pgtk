"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Calendar,
  Sparkles,
  RefreshCcw,
  ArrowRight,
  ShieldAlert,
  Clock,
  Award,
  CalendarDays,
  FileSpreadsheet,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getEmployeesForLeaveAction,
  getEmployeeBalanceAction,
} from "@/actions/leave-actions";
import { addLeaveBalanceAction } from "@/actions/balance-actions";

interface EmployeeOption {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
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

type LeaveTypeCode = "ANNUAL" | "LONG_LEAVE" | "INHALDAGEN";

export default function AddBalancePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);

  // Search State
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // State penambahan hari per jenis cuti
  const [inhaldagenAmount, setInhaldagenAmount] = useState<number>(1);
  const [annualAmount, setAnnualAmount] = useState<number>(0);
  const [longLeaveAmount, setLongLeaveAmount] = useState<number>(0);

  const todayStr = new Date().toISOString().split("T")[0];
  const [description, setDescription] = useState<string>("Kompensasi Kerja Hari Libur / Piket");
  const [notes, setNotes] = useState<string>("");

  // Result state after success
  const [successResult, setSuccessResult] = useState<{
    employeeName: string;
    leaveTypeName: string;
    addedAmount: number;
    newBalance: number;
  } | null>(null);

  // Load employees on mount
  useEffect(() => {
    async function loadEmployees() {
      setIsLoadingEmployees(true);
      try {
        const res = await getEmployeesForLeaveAction();
        if (res.success && res.data) {
          const empList = res.data as EmployeeOption[];
          setEmployees(empList);
          if (empList.length > 0) {
            setSelectedEmployeeId(empList[0].id);
            setSelectedEmployee(empList[0]);
            setSearchQuery(`${empList[0].employeeNumber} — ${empList[0].name}`);
          }
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
    setSelectedEmployeeId(emp.id);
    setSearchQuery(`${emp.employeeNumber} — ${emp.name}`);
    setIsSearchOpen(false);
    setSuccessResult(null);
  };

  // Handle clearing selected employee
  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSelectedEmployeeId("");
    setSearchQuery("");
    setIsSearchOpen(false);
    setSuccessResult(null);
  };

  // Submit Handler: Mendukung penambahan satu atau beberapa jenis saldo sekaligus
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }

    const itemsToAdd: { code: LeaveTypeCode; name: string; amount: number }[] = [];
    if (inhaldagenAmount > 0) {
      itemsToAdd.push({ code: "INHALDAGEN", name: "Inhaldagen", amount: inhaldagenAmount });
    }
    if (annualAmount > 0) {
      itemsToAdd.push({ code: "ANNUAL", name: "Cuti Tahunan", amount: annualAmount });
    }
    if (longLeaveAmount > 0) {
      itemsToAdd.push({ code: "LONG_LEAVE", name: "Cuti Besar", amount: longLeaveAmount });
    }

    if (itemsToAdd.length === 0) {
      toast.error("Masukkan jumlah hari penambahan minimal 1 hari pada salah satu jenis cuti.");
      return;
    }

    if (!description.trim()) {
      toast.error("Mohon isi keterangan / dasar penambahan saldo.");
      return;
    }

    startTransition(async () => {
      let lastBalances = selectedEmployee?.balances;
      let allSuccess = true;
      const addedNames: string[] = [];
      let totalDays = 0;

      for (const item of itemsToAdd) {
        const res = await addLeaveBalanceAction({
          employeeId: selectedEmployeeId,
          leaveTypeCode: item.code,
          amount: item.amount,
          transactionDate: todayStr,
          description: description.trim() || `Penambahan saldo ${item.name}`,
          notes: notes.trim(),
        });

        if (res.success && res.data) {
          lastBalances = res.data.newBalances;
          addedNames.push(`${item.name} (+${item.amount} hari)`);
          totalDays += item.amount;
        } else {
          allSuccess = false;
          toast.error(res.message || `Gagal menambahkan saldo ${item.name}.`);
          break;
        }
      }

      if (allSuccess && lastBalances) {
        toast.success(`Saldo cuti berhasil ditambahkan: ${addedNames.join(", ")}!`);

        setSuccessResult({
          employeeName: selectedEmployee?.name || "",
          leaveTypeName: addedNames.join(", "),
          addedAmount: totalDays,
          newBalance: lastBalances.total,
        });

        // Update local employee balance state
        if (selectedEmployee) {
          const updatedEmp: EmployeeOption = {
            ...selectedEmployee,
            balances: lastBalances,
          };
          setSelectedEmployee(updatedEmp);
          setEmployees((prev) =>
            prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
          );
        }
      }
    });
  };

  const handleResetForm = () => {
    setSuccessResult(null);
    setInhaldagenAmount(1);
    setAnnualAmount(0);
    setLongLeaveAmount(0);
    setDescription("Kompensasi Kerja Hari Libur / Piket");
    setNotes("");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">

      {/* Success Notification Card */}
      {successResult ? (
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm animate-in fade-in-50 duration-300">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-900">
                Saldo Cuti Berhasil Ditambahkan!
              </h2>
              <p className="text-sm text-slate-700 mt-2">
                Karyawan <span className="font-semibold text-slate-900">{successResult.employeeName}</span> telah mendapatkan tambahan saldo{" "}
                <span className="font-bold text-emerald-700">+{successResult.addedAmount} hari</span> untuk jenis{" "}
                <span className="font-bold text-slate-900">{successResult.leaveTypeName}</span>.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-medium text-xs">
                <span>Total Saldo Aktif Sekarang:</span>
                <span className="font-bold text-sm font-mono">{successResult.newBalance} hari</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                onClick={handleResetForm}
                className="gap-1.5 h-9 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Tambah Saldo Karyawan Lain
              </Button>
              <Link href="/leave/create">
                <Button variant="default" className="gap-1.5 h-9 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Ke Halaman Pengambilan Cuti
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="h-9 text-xs font-medium">
                  Kembali ke Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Pemilihan Karyawan & Status Saldo */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    1. Data Karyawan Penerima
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Pilih karyawan pimpinan yang akan ditambahkan saldonya
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
              {/* Kolom Pencarian Karyawan (Search Box with Autocomplete Dropdown) */}
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
                        setSelectedEmployeeId("");
                      }
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Contoh: Ketik 1042 atau Janoko atau Teknik..."
                    className="pl-9 pr-9 h-10 text-sm font-medium text-slate-900 bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearEmployee}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      title="Hapus pencarian"
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
                        Tidak ditemukan karyawan dengan kata kunci <span className="font-semibold text-slate-800">&quot;{searchQuery}&quot;</span>.
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
                              <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-2">
                                <span>{emp.name}</span>
                                {emp.category === "PELAKSANA" ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1 py-0 h-4">
                                    Pelaksana
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] px-1 py-0 h-4">
                                    Pimpinan
                                  </Badge>
                                )}
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

              {/* Kondisi Jika Belum Ada Karyawan Terpilih */}
              {!selectedEmployee && (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/60 my-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800">
                    Pilih Karyawan Terlebih Dahulu
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                    Ketik NIP atau Nama pada kolom pencarian di atas untuk melihat saldo dan menambah hari cuti.
                  </p>
                </div>
              )}

              {/* Detail Karyawan & 3 Kartu Saldo Saat Ini */}
              {selectedEmployee && (
                <div className="pt-2 space-y-3">
                  {/* Info Ringkas */}
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
                        <span className="text-[10px] text-slate-400 block font-medium">Bagian</span>
                        <span className="font-semibold text-slate-800">{selectedEmployee.department.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                        <span className="font-semibold text-emerald-700">Pimpinan Aktif</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Kartu Saldo Cuti Saat Ini */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                      Saldo Cuti Sebelum Penambahan:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cuti Tahunan */}
                      <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3.5">
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
                      <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3.5">
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
                      <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3.5">
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Formulir Penambahan Saldo */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                2. Detail Penambahan Saldo
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tentukan jumlah hari penambahan pada jenis cuti yang diinginkan
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <Label required className="text-xs font-bold text-slate-800">
                Jenis Saldo Cuti & Jumlah Hari Penambahan (+ Hari)
              </Label>

              <div className="space-y-3">
                {/* Baris 1: Inhaldagen */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                    inhaldagenAmount > 0
                      ? "border-amber-400 bg-amber-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        inhaldagenAmount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Inhaldagen</span>
                        {selectedEmployee && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800 font-mono font-medium">
                            Saldo: {selectedEmployee.balances.inhaldagen} hari
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Piket / Ganti Hari Libur</p>
                    </div>
                  </div>

                  {/* Stepper nambah/kurang panah */}
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInhaldagenAmount((v) => Math.max(0, v - 1))}
                      disabled={isPending || inhaldagenAmount <= 0}
                      className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-300 bg-white"
                      title="Kurangi 1 hari"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <div className="relative w-20">
                      <Input
                        type="number"
                        min="0"
                        max="90"
                        value={inhaldagenAmount}
                        onChange={(e) => setInhaldagenAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={isPending}
                        className="text-center font-mono font-bold text-sm h-9 pr-6 bg-white"
                      />
                      <div className="absolute right-0.5 top-0.5 bottom-0.5 flex flex-col justify-center border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => setInhaldagenAmount((v) => v + 1)}
                          disabled={isPending}
                          className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center h-4 rounded-tr"
                          title="Tambah"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInhaldagenAmount((v) => Math.max(0, v - 1))}
                          disabled={isPending || inhaldagenAmount <= 0}
                          className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center h-4 rounded-br disabled:opacity-40"
                          title="Kurang"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInhaldagenAmount((v) => v + 1)}
                      disabled={isPending}
                      className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-300 bg-white"
                      title="Tambah 1 hari"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold text-slate-600 pl-1 w-8">hari</span>
                  </div>
                </div>

                {/* Baris 2: Cuti Tahunan */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                    annualAmount > 0
                      ? "border-blue-400 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        annualAmount > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Cuti Tahunan</span>
                        {selectedEmployee && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800 font-mono font-medium">
                            Saldo: {selectedEmployee.balances.annual} hari
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Hak Cuti Reguler Tahunan</p>
                    </div>
                  </div>

                  {/* Stepper nambah/kurang panah */}
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAnnualAmount((v) => Math.max(0, v - 1))}
                      disabled={isPending || annualAmount <= 0}
                      className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-300 bg-white"
                      title="Kurangi 1 hari"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <div className="relative w-20">
                      <Input
                        type="number"
                        min="0"
                        max="90"
                        value={annualAmount}
                        onChange={(e) => setAnnualAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={isPending}
                        className="text-center font-mono font-bold text-sm h-9 pr-6 bg-white"
                      />
                      <div className="absolute right-0.5 top-0.5 bottom-0.5 flex flex-col justify-center border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => setAnnualAmount((v) => v + 1)}
                          disabled={isPending}
                          className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center h-4 rounded-tr"
                          title="Tambah"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnnualAmount((v) => Math.max(0, v - 1))}
                          disabled={isPending || annualAmount <= 0}
                          className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center h-4 rounded-br disabled:opacity-40"
                          title="Kurang"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAnnualAmount((v) => v + 1)}
                      disabled={isPending}
                      className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-300 bg-white"
                      title="Tambah 1 hari"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold text-slate-600 pl-1 w-8">hari</span>
                  </div>
                </div>

                {/* Baris 3: Cuti Besar */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                    longLeaveAmount > 0
                      ? "border-purple-400 bg-purple-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        longLeaveAmount > 0 ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Cuti Besar</span>
                        {selectedEmployee && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100/70 text-purple-800 font-mono font-medium">
                            Saldo: {selectedEmployee.balances.longLeave} hari
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Berkala Masa Kerja 6 Tahun</p>
                    </div>
                  </div>

                  {/* Stepper nambah/kurang panah */}
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLongLeaveAmount((v) => Math.max(0, v - 1))}
                      disabled={isPending || longLeaveAmount <= 0}
                      className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-300 bg-white"
                      title="Kurangi 1 hari"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <div className="relative w-20">
                      <Input
                        type="number"
                        min="0"
                        max="90"
                        value={longLeaveAmount}
                        onChange={(e) => setLongLeaveAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={isPending}
                        className="text-center font-mono font-bold text-sm h-9 pr-6 bg-white"
                      />
                      <div className="absolute right-0.5 top-0.5 bottom-0.5 flex flex-col justify-center border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => setLongLeaveAmount((v) => v + 1)}
                          disabled={isPending}
                          className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center h-4 rounded-tr"
                          title="Tambah"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLongLeaveAmount((v) => Math.max(0, v - 1))}
                          disabled={isPending || longLeaveAmount <= 0}
                          className="px-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center h-4 rounded-br disabled:opacity-40"
                          title="Kurang"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLongLeaveAmount((v) => v + 1)}
                      disabled={isPending}
                      className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-300 bg-white"
                      title="Tambah 1 hari"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold text-slate-600 pl-1 w-8">hari</span>
                  </div>
                </div>
              </div>

              {/* Keterangan / Alasan */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="description" required className="text-xs">
                  Alasan / Keterangan Penambahan
                </Label>
                <Input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Kompensasi Kerja Hari Libur / Piket"
                  disabled={isPending}
                  required
                  className="h-9 text-xs bg-white"
                />
                {/* Template Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setDescription("Kompensasi Kerja Hari Libur / Piket")}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    + Piket Hari Libur
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescription("Penambahan Hak Cuti Tahunan Periode 2026")}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    + Hak Cuti Tahunan Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescription("Pemberian Cuti Besar Berkala 6 Tahun")}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    + Cuti Besar Berkala
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescription("Koreksi / Penyesuaian Administrasi")}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    + Penyesuaian Saldo
                  </button>
                </div>
              </div>

              {/* Catatan Tambahan (Opsional) */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">Catatan Tambahan / Nomor Memo (Opsional)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Berdasarkan Memo Direksi / Surat Tugas No. 045/SK/2026"
                  disabled={isPending}
                  className="h-9 text-xs bg-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard">
              <Button type="button" variant="outline" disabled={isPending} className="h-10 text-xs font-medium">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={
                isPending ||
                (inhaldagenAmount === 0 && annualAmount === 0 && longLeaveAmount === 0) ||
                !selectedEmployeeId
              }
              className="h-10 px-6 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan Saldo...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Simpan Penambahan Saldo
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
