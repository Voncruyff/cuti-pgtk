"use client";

import { useState, useEffect, useTransition } from "react";
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

  const [leaveType, setLeaveType] = useState<LeaveTypeCode>("INHALDAGEN");
  const [amount, setAmount] = useState<number>(1);

  const todayStr = new Date().toISOString().split("T")[0];
  const [transactionDate, setTransactionDate] = useState<string>(todayStr);
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

  // Handle employee change
  const handleEmployeeChange = async (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setSelectedEmployee(emp);
    } else if (empId) {
      const res = await getEmployeeBalanceAction(empId);
      if (res.success && res.data?.employee) {
        setSelectedEmployee(res.data.employee as EmployeeOption);
      }
    }
  };

  // Preset description suggestions based on leave type
  const handleLeaveTypeChange = (type: LeaveTypeCode) => {
    setLeaveType(type);
    if (type === "INHALDAGEN") {
      setDescription("Kompensasi Kerja Hari Libur / Piket");
      setAmount(1);
    } else if (type === "ANNUAL") {
      setDescription("Hak Cuti Tahunan Baru");
      setAmount(12);
    } else if (type === "LONG_LEAVE") {
      setDescription("Pemberian Cuti Besar Berkala");
      setAmount(30);
    }
  };

  // Calculations for live simulation
  const getCurrentBalanceForType = () => {
    if (!selectedEmployee) return 0;
    if (leaveType === "ANNUAL") return selectedEmployee.balances.annual;
    if (leaveType === "LONG_LEAVE") return selectedEmployee.balances.longLeave;
    if (leaveType === "INHALDAGEN") return selectedEmployee.balances.inhaldagen;
    return 0;
  };

  const currentBalance = getCurrentBalanceForType();
  const simulatedNewBalance = currentBalance + (Number(amount) || 0);

  const getLeaveTypeLabel = (code: LeaveTypeCode) => {
    switch (code) {
      case "ANNUAL":
        return "Cuti Tahunan";
      case "LONG_LEAVE":
        return "Cuti Besar";
      case "INHALDAGEN":
        return "Inhaldagen";
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }

    if (amount <= 0) {
      toast.error("Jumlah penambahan saldo minimal 1 hari.");
      return;
    }

    if (!description.trim()) {
      toast.error("Mohon isi keterangan / dasar penambahan saldo.");
      return;
    }

    startTransition(async () => {
      const res = await addLeaveBalanceAction({
        employeeId: selectedEmployeeId,
        leaveTypeCode: leaveType,
        amount: Number(amount),
        transactionDate,
        description,
        notes,
      });

      if (res.success && res.data) {
        toast.success(res.message || "Saldo cuti berhasil ditambahkan!");

        const newBal =
          leaveType === "ANNUAL"
            ? res.data.newBalances.annual
            : leaveType === "LONG_LEAVE"
            ? res.data.newBalances.longLeave
            : res.data.newBalances.inhaldagen;

        setSuccessResult({
          employeeName: selectedEmployee?.name || "",
          leaveTypeName: getLeaveTypeLabel(leaveType),
          addedAmount: Number(amount),
          newBalance: newBal,
        });

        // Update local employee balance state
        if (selectedEmployee) {
          const updatedEmp: EmployeeOption = {
            ...selectedEmployee,
            balances: res.data.newBalances,
          };
          setSelectedEmployee(updatedEmp);
          setEmployees((prev) =>
            prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
          );
        }
      } else {
        toast.error(res.message || "Gagal menambahkan saldo cuti.");
      }
    });
  };

  const handleResetForm = () => {
    setSuccessResult(null);
    setAmount(1);
    setNotes("");
    if (leaveType === "INHALDAGEN") {
      setDescription("Kompensasi Kerja Hari Libur / Piket");
    }
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
              Tambah Saldo Cuti
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-2 sm:pl-0">
            Formulir penambahan saldo cuti karyawan pimpinan PG Trangkil (Tahunan, Cuti Besar, Inhaldagen).
          </p>
        </div>
      </div>

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
              {/* Dropdown Karyawan */}
              <div className="space-y-1.5">
                <Label htmlFor="employeeSelect" required>
                  Pilih Karyawan (NIP / Nama / Bagian)
                </Label>
                {isLoadingEmployees ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded-md border border-slate-200">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    Memuat daftar karyawan...
                  </div>
                ) : (
                  <select
                    id="employeeSelect"
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    disabled={isPending}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        NIP: {emp.employeeNumber} — {emp.name} ({emp.department.name} - {emp.position})
                      </option>
                    ))}
                  </select>
                )}
              </div>

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
                      <div
                        onClick={() => handleLeaveTypeChange("ANNUAL")}
                        className={`rounded-lg border p-3.5 cursor-pointer transition-all ${
                          leaveType === "ANNUAL"
                            ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20"
                            : "border-blue-200 bg-blue-50/30 hover:border-blue-300"
                        }`}
                      >
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
                      <div
                        onClick={() => handleLeaveTypeChange("LONG_LEAVE")}
                        className={`rounded-lg border p-3.5 cursor-pointer transition-all ${
                          leaveType === "LONG_LEAVE"
                            ? "border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20"
                            : "border-purple-200 bg-purple-50/30 hover:border-purple-300"
                        }`}
                      >
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
                      <div
                        onClick={() => handleLeaveTypeChange("INHALDAGEN")}
                        className={`rounded-lg border p-3.5 cursor-pointer transition-all ${
                          leaveType === "INHALDAGEN"
                            ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                            : "border-amber-200 bg-amber-50/30 hover:border-amber-300"
                        }`}
                      >
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

          {/* Section 2: Formulir Penambahan Saldo & Simulasi */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                2. Detail Penambahan Saldo
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pilih jenis cuti yang akan ditambah dan jumlah hari penambahan
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-5">
              {/* Pilihan Jenis Cuti */}
              <div className="space-y-2">
                <Label required>Jenis Saldo yang Ditambahkan</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLeaveTypeChange("INHALDAGEN")}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      leaveType === "INHALDAGEN"
                        ? "border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <div className="p-2 rounded-md bg-amber-100 text-amber-700 shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Inhaldagen</div>
                      <div className="text-[10px] text-slate-500">Piket / Ganti Hari Libur</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLeaveTypeChange("ANNUAL")}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      leaveType === "ANNUAL"
                        ? "border-blue-500 bg-blue-50 text-blue-950 ring-1 ring-blue-500"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <div className="p-2 rounded-md bg-blue-100 text-blue-700 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Cuti Tahunan</div>
                      <div className="text-[10px] text-slate-500">Hak Cuti Reguler</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLeaveTypeChange("LONG_LEAVE")}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      leaveType === "LONG_LEAVE"
                        ? "border-purple-500 bg-purple-50 text-purple-950 ring-1 ring-purple-500"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <div className="p-2 rounded-md bg-purple-100 text-purple-700 shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Cuti Besar</div>
                      <div className="text-[10px] text-slate-500">Berkala Masa Kerja</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Jumlah Hari & Tombol Cepat */}
              <div className="space-y-2">
                <Label htmlFor="amountInput" required>
                  Jumlah Hari yang Ditambahkan (+ Hari)
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative sm:w-48">
                    <Input
                      id="amountInput"
                      type="number"
                      min="1"
                      max="90"
                      value={amount || ""}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      disabled={isPending}
                      placeholder="Contoh: 1"
                      className="pr-12 text-sm font-semibold"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                      hari
                    </span>
                  </div>

                  {/* Tombol Shortcut Preset Cepat */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Cepat:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(1)}
                      className={`h-8 px-2.5 text-xs ${amount === 1 ? "border-blue-500 text-blue-600 bg-blue-50/50" : ""}`}
                    >
                      +1 Hari
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(2)}
                      className={`h-8 px-2.5 text-xs ${amount === 2 ? "border-blue-500 text-blue-600 bg-blue-50/50" : ""}`}
                    >
                      +2 Hari
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(6)}
                      className={`h-8 px-2.5 text-xs ${amount === 6 ? "border-blue-500 text-blue-600 bg-blue-50/50" : ""}`}
                    >
                      +6 Hari
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(12)}
                      className={`h-8 px-2.5 text-xs ${amount === 12 ? "border-blue-500 text-blue-600 bg-blue-50/50" : ""}`}
                    >
                      +12 Hari
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tanggal Mutasi */}
              <div className="space-y-1.5">
                <Label htmlFor="transactionDate" required>
                  Tanggal Efektif Penambahan
                </Label>
                <div className="sm:w-64">
                  <Input
                    id="transactionDate"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              {/* Keterangan / Alasan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" required>
                    Alasan / Keterangan Penambahan
                  </Label>
                </div>
                <Input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Kompensasi Kerja Hari Libur / Piket"
                  disabled={isPending}
                  required
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
                <Label htmlFor="notes">Catatan Tambahan / Nomor Memo (Opsional)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Berdasarkan Memo Direksi / Surat Tugas No. 045/SK/2026"
                  disabled={isPending}
                />
              </div>

              {/* Live Calculator Simulation Box */}
              {selectedEmployee && amount > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Simulasi Saldo Akhir Setelah Penambahan:
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200/80 shadow-2xs">
                    <div className="text-center flex-1">
                      <span className="text-[11px] text-slate-500 block">Saldo Saat Ini</span>
                      <span className="font-mono text-base font-bold text-slate-800">
                        {currentBalance} hari
                      </span>
                    </div>

                    <div className="text-slate-300 font-bold text-lg">+</div>

                    <div className="text-center flex-1">
                      <span className="text-[11px] text-emerald-600 block font-medium">Penambahan</span>
                      <span className="font-mono text-base font-bold text-emerald-600">
                        +{amount} hari
                      </span>
                    </div>

                    <div className="text-slate-300 font-bold text-lg">=</div>

                    <div className="text-center flex-1">
                      <span className="text-[11px] text-slate-700 block font-semibold">Saldo Baru</span>
                      <span className="font-mono text-lg font-extrabold text-blue-700">
                        {simulatedNewBalance} hari
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
              disabled={isPending || amount <= 0 || !selectedEmployeeId}
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
