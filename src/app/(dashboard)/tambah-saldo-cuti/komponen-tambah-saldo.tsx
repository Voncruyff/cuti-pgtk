"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import {
  Building2,
  Briefcase,
  Loader2,
  Factory,
  Search,
  X,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepperHari } from "@/components/bersama/stepper-hari";
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
  getEmployeeLeaveRequestsAction,
  EmployeeLeaveHistoryItem,
} from "@/actions/aksi-cuti";
import { addMultipleLeaveBalanceAction } from "@/actions/aksi-saldo";
import { BalanceActivityCard } from "@/components/fitur/cuti/kartu-aktivitas-saldo";

interface EmployeeOption {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  category?: string;
  stasiun?: string;
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

export function KomponenTambahSaldo() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Search & Selected Employee
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // History State
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeLeaveHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form Modal Tambah Saldo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [annualAmount, setAnnualAmount] = useState<number>(0);
  const [longLeaveAmount, setLongLeaveAmount] = useState<number>(0);
  const [inhaldagenAmount, setInhaldagenAmount] = useState<number>(0);

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

  // Fetch employees
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

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employeeNumber.toLowerCase().includes(q) ||
      emp.department.name.toLowerCase().includes(q) ||
      (emp.stasiun && emp.stasiun.toLowerCase().includes(q)) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  // Handle selecting an employee from search results
  const handleSelectEmployee = (emp: EmployeeOption) => {
    setSelectedEmployee(emp);
    setSearchQuery(`${emp.employeeNumber} - ${emp.name}`);
    setIsSearchOpen(false);

    setAnnualAmount(0);
    setLongLeaveAmount(0);
    setInhaldagenAmount(0);

    loadEmployeeHistory(emp.id);
  };

  // Handle clearing selected employee
  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setEmployeeHistory([]);
  };

  // Open modal without auto-input
  const handleOpenAddModal = () => {
    if (!selectedEmployee) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setAnnualAmount(0);
    setLongLeaveAmount(0);
    setInhaldagenAmount(0);
    setIsModalOpen(true);
  };

  // Handle Submit Tambah Saldo
  const handleSubmitAddBalance = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Silakan pilih karyawan terlebih dahulu.");
      return;
    }

    const totalToAdd = annualAmount + longLeaveAmount + inhaldagenAmount;
    if (totalToAdd <= 0) {
      toast.error("Masukkan jumlah hari penambahan minimal 1 hari.");
      return;
    }

    startTransition(async () => {
      const res = await addMultipleLeaveBalanceAction({
        employeeId: selectedEmployee.id,
        annualAmount: Number(annualAmount) || 0,
        longLeaveAmount: Number(longLeaveAmount) || 0,
        inhaldagenAmount: Number(inhaldagenAmount) || 0,
        transactionDate,
        description: "Penambahan Saldo",
      });

      if (res.success && res.data) {
        toast.success(res.message || "Penambahan saldo cuti berhasil disimpan!");
        setIsModalOpen(false);

        const updatedEmp: EmployeeOption = {
          ...selectedEmployee,
          balances: res.data.newBalances,
        };
        setSelectedEmployee(updatedEmp);
        setEmployees((prev) =>
          prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
        );

        loadEmployeeHistory(selectedEmployee.id);
      } else {
        toast.error(res.message || "Gagal menambah saldo cuti.");
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
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  className="h-9 px-3.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border-rose-200 gap-1.5 shrink-0 shadow-2xs transition-colors cursor-pointer"
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
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0084c7]" />
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
                        className="w-full text-left px-3 py-2 hover:bg-blue-50/70 transition-colors flex items-center justify-between group cursor-pointer"
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
              onClick={handleOpenAddModal}
              className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Saldo
            </Button>
          }
        />
      )}

      {/* POPUP MODAL DIALOG: TAMBAH SALDO CUTI */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <PlusCircle className="h-5 w-5 text-emerald-600" />
              Tambah Saldo Cuti
            </DialogTitle>
            <DialogDescription>
              Karyawan: <span className="font-semibold text-slate-900">{selectedEmployee?.name}</span> (NIP: {selectedEmployee?.employeeNumber})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAddBalance} className="space-y-4 pt-2">
            {/* Input 3 Jenis Saldo */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                  Jumlah Hari yang Ditambahkan
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tentukan jumlah penambahan kuota per jenis cuti
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Tahunan */}
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-800">Cuti Tahunan</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block pl-3.5">
                      Saldo saat ini: {selectedEmployee?.balances.annual} hari
                    </span>
                  </div>
                  <div className="w-32">
                    <StepperHari
                      id="annualAmount"
                      min={0}
                      value={annualAmount}
                      onChange={setAnnualAmount}
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* Cuti Besar */}
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="font-semibold text-slate-800">Cuti Besar</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block pl-3.5">
                      Saldo saat ini: {selectedEmployee?.balances.longLeave} hari
                    </span>
                  </div>
                  <div className="w-32">
                    <StepperHari
                      id="longLeaveAmount"
                      min={0}
                      value={longLeaveAmount}
                      onChange={setLongLeaveAmount}
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* Inhaldagen (HANYA UNTUK KARYAWAN PIMPINAN) */}
                {selectedEmployee?.category?.toUpperCase() !== "PELAKSANA" && (
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-slate-800">Inhaldagen</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pl-3.5">
                        Saldo saat ini: {selectedEmployee?.balances.inhaldagen} hari
                      </span>
                    </div>
                    <div className="w-32">
                      <StepperHari
                        id="inhaldagenAmount"
                        min={0}
                        value={inhaldagenAmount}
                        onChange={setInhaldagenAmount}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Total Ditambahkan */}
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/70 text-xs font-semibold">
                <span className="text-slate-600">Total Ditambahkan:</span>
                <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +{annualAmount + longLeaveAmount + (selectedEmployee?.category?.toUpperCase() === "PELAKSANA" ? 0 : inhaldagenAmount)} Hari
                </span>
              </div>
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
                disabled={isPending || annualAmount + longLeaveAmount + inhaldagenAmount <= 0}
                className="font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Simpan Penambahan Saldo
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
