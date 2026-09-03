"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Building2,
  Briefcase,
  Loader2,
  CalendarDays,
  CalendarOff,
  PlusCircle,
  Factory,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEmployeesForLeaveAction,
  getEmployeeLeaveRequestsAction,
  getEmployeesOnLeaveTodayAction,
  EmployeeLeaveHistoryItem,
  EmployeeOnLeaveToday,
} from "@/actions/aksi-cuti";
import { BalanceActivityCard } from "@/components/fitur/cuti/kartu-aktivitas-saldo";
import { formatDateIndo, formatSingkatanBagian } from "@/lib/utils";

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

export default function HalamanRincianCuti() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  // Search & Selected Employee
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // History / Activity Transactions
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeLeaveHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
      console.error("Failed to load history:", err);
      setEmployeeHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Karyawan Cuti Hari Ini
  const [employeesOnLeaveToday, setEmployeesOnLeaveToday] = useState<EmployeeOnLeaveToday[]>([]);
  const [isLoadingOnLeave, setIsLoadingOnLeave] = useState(true);

  // Fetch employees on mount
  useEffect(() => {
    async function loadEmployees() {
      setIsLoadingEmployees(true);
      try {
        const res = await getEmployeesForLeaveAction();
        if (res.success && res.data) {
          const empList = res.data as EmployeeOption[];
          setEmployees(empList);
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

  // Fetch karyawan yang cuti hari ini
  useEffect(() => {
    async function loadLeaveToday() {
      setIsLoadingOnLeave(true);
      try {
        const res = await getEmployeesOnLeaveTodayAction();
        if (res.success && res.data) {
          setEmployeesOnLeaveToday(res.data);
        }
      } catch (err) {
        console.error("Failed to load employees on leave today:", err);
      } finally {
        setIsLoadingOnLeave(false);
      }
    }
    loadLeaveToday();
  }, []);

  // Handle selecting an employee from search results
  const handleSelectEmployee = useCallback((emp: EmployeeOption) => {
    setSelectedEmployee(emp);
    setSearchQuery(`${emp.employeeNumber} - ${emp.name}`);
    setIsSearchOpen(false);
    loadEmployeeHistory(emp.id);
  }, [loadEmployeeHistory]);

  // Auto-select if URL has ?nip=... parameter
  useEffect(() => {
    if (typeof window !== "undefined" && employees.length > 0 && !selectedEmployee) {
      const urlParams = new URLSearchParams(window.location.search);
      const nip = urlParams.get("nip");
      if (nip) {
        const found = employees.find((e) => e.employeeNumber === nip);
        if (found) {
          handleSelectEmployee(found);
        }
      }
    }
  }, [employees, selectedEmployee, handleSelectEmployee]);

  // Filter employees by search query
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

  // Handle clearing selected employee
  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setEmployeeHistory([]);
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* SECTION 1: HEADER & DATA KARYAWAN (COMPACT & RINGKAS) */}
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
                    if (
                      selectedEmployee &&
                      e.target.value !== `${selectedEmployee.employeeNumber} - ${selectedEmployee.name}`
                    ) {
                      setSelectedEmployee(null);
                      setEmployeeHistory([]);
                    }
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Cari Karyawan untuk Melihat Rincian Saldo (Ketik NIP, Nama, atau Bagian)..."
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
                  className="h-9 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
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

                  {/* Inhaldagen (Hanya tampil untuk Pimpinan) */}
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

      {/* SECTION 2: CARD KARYAWAN CUTI HARI INI (Otomatis ter-hide saat karyawan dipilih) */}
      {!selectedEmployee && (
        <Card className="border-slate-200/80 shadow-2xs rounded-[22px] overflow-hidden bg-white">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Cuti Hari Ini
                </h3>
                <span className="text-xs text-slate-400">&bull; {formatDateIndo(new Date())}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Karyawan yang sedang izin cuti hari ini. Klik untuk langsung membuka rincian saldo.
              </p>
            </div>

            {isLoadingOnLeave ? (
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memuat...
              </span>
            ) : employeesOnLeaveToday.length > 0 ? (
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-semibold">
                {employeesOnLeaveToday.length} orang cuti
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold">
                Semua Masuk
              </span>
            )}
          </div>

          <CardContent className="p-0">
            {isLoadingOnLeave ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#0093dc]" />
                Memeriksa data cuti hari ini...
              </div>
            ) : employeesOnLeaveToday.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="text-3xl font-black text-slate-900 font-mono tracking-tight mb-1">
                  0
                </div>
                <h4 className="text-xs font-semibold text-slate-700">
                  Tidak Ada Karyawan yang Cuti Hari Ini
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Seluruh staf dan karyawan tercatat hadir bertugas. Gunakan kolom pencarian di atas untuk melihat rincian saldo karyawan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
                      <th className="py-3 px-5">Karyawan</th>
                      <th className="py-3 px-3">Bagian & Stasiun</th>
                      <th className="py-3 px-3">Jenis Cuti</th>
                      <th className="py-3 px-3">Jadwal & Keperluan</th>
                      <th className="py-3 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {employeesOnLeaveToday.map((item) => {
                      const matchedEmp = employees.find(
                        (e) => e.employeeNumber === item.nip || e.id === item.employeeId
                      );

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                          onClick={() => {
                            if (matchedEmp) {
                              handleSelectEmployee(matchedEmp);
                            }
                          }}
                        >
                          <td className="py-3 px-5">
                            <div className="font-semibold text-slate-900 group-hover:text-[#0093dc] transition-colors">
                              {item.nama}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              NIP {item.nip}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            <div>{formatSingkatanBagian(item.bagian || "-")}</div>
                            {item.stasiun && item.stasiun !== "-" && (
                              <span className="text-[10px] text-slate-400 block">
                                {item.stasiun}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
                              {item.cutiTahunan > 0
                                ? "Tahunan"
                                : item.cutiBesar > 0
                                ? "Besar"
                                : "Inhaldagen"}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-[240px]">
                            <div className="font-mono text-[11px] text-slate-600 truncate" title={item.tglCuti}>
                              {item.tglCuti}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5" title={item.keperluan}>
                              {item.keperluan || "Keperluan pribadi"}
                            </div>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (matchedEmp) {
                                  handleSelectEmployee(matchedEmp);
                                }
                              }}
                              className="h-7 px-3 text-xs font-semibold text-[#0093dc] hover:text-sky-900 hover:bg-sky-50 border-sky-200 rounded-lg cursor-pointer"
                            >
                              Lihat Rincian &rarr;
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: KOMPONEN REUSABLE RIWAYAT AKTIVITAS SALDO */}
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
            <div className="flex items-center gap-2">
              <Link href="/saldo/tambah">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-600" />
                  Tambah Saldo
                </Button>
              </Link>
              <Link href="/cuti/buat">
                <Button
                  type="button"
                  size="default"
                  className="font-semibold shadow-xs"
                >
                  <CalendarDays className="h-4 w-4" />
                  Ambil Cuti
                </Button>
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
