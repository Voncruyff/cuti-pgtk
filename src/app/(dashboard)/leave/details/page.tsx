"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  User,
  Building2,
  Briefcase,
  ArrowLeft,
  Loader2,
  CalendarDays,
  PlusCircle,
  Clock,
  Printer,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  getEmployeesForLeaveAction,
  getEmployeeTransactionsAction,
} from "@/actions/leave-actions";
import { formatDateIndo, formatSignedDays } from "@/lib/utils";

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

interface TransactionItem {
  id: string;
  employeeId: string;
  transactionType: string;
  transactionDate: string | Date;
  amount: number;
  description: string;
  notes: string | null;
  leaveType: {
    code: string;
    name: string;
  };
  createdBy: {
    fullName: string;
    username: string;
  };
}

export default function LeaveDetailsPage() {
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

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
            loadTransactions(empList[0].id);
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

  const loadTransactions = (empId: string) => {
    setIsLoadingTransactions(true);
    startTransition(async () => {
      try {
        const res = await getEmployeeTransactionsAction(empId);
        if (res.success && res.data) {
          setTransactions(res.data.transactions as unknown as TransactionItem[]);
          if (res.data.employee) {
            setSelectedEmployee(res.data.employee as EmployeeOption);
          }
        } else {
          toast.error(res.message || "Gagal mengambil data transaksi.");
        }
      } catch (err) {
        console.error("Load transactions error:", err);
        toast.error("Terjadi kesalahan saat memuat mutasi cuti.");
      } finally {
        setIsLoadingTransactions(false);
      }
    });
  };

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setSelectedEmployee(emp);
    }
    loadTransactions(empId);
  };

  const getLeaveTypeBadge = (code: string) => {
    switch (code) {
      case "ANNUAL":
        return <Badge variant="annual">Tahunan</Badge>;
      case "LONG_LEAVE":
        return <Badge variant="longLeave">Besar</Badge>;
      case "INHALDAGEN":
        return <Badge variant="inhaldagen">Inhaldagen</Badge>;
      default:
        return <Badge variant="outline">{code}</Badge>;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "OPENING_BALANCE":
        return "Saldo Awal";
      case "ADD_BALANCE":
        return "Tambah Saldo";
      case "HOLIDAY_COMPENSATION":
        return "Kompensasi Libur";
      case "LEAVE_USAGE":
        return "Pengambilan Cuti";
      case "MASS_GRANT":
        return "Pemberian Massal";
      case "REVERSAL":
        return "Pembatalan";
      default:
        return type;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none">
      {/* Top Action Bar (Print: Hidden) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        <p className="text-xs text-slate-500 font-medium">
          Buku mutasi saldo cuti (penambahan & pemotongan) karyawan pimpinan PG Trangkil
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 h-8 text-xs font-medium"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak Kartu Cuti
          </Button>
          <Link href="/balances/add">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-medium text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100">
              <PlusCircle className="h-3.5 w-3.5" />
              + Tambah Saldo
            </Button>
          </Link>
          <Link href="/leave/create">
            <Button size="sm" className="gap-1.5 h-8 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">
              <CalendarDays className="h-3.5 w-3.5" />
              - Ambil Cuti
            </Button>
          </Link>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight uppercase">
              PT PERKEBUNAN NUSANTARA — PG TRANGKIL PATI
            </h2>
            <h3 className="text-sm font-semibold text-slate-700">
              KARTU MUTASI SALDO CUTI KARYAWAN PIMPINAN
            </h3>
          </div>
          <div className="text-right text-xs font-mono">
            <div>Dokumen: Internal Kepegawaian</div>
            <div>Dicetak: {formatDateIndo(new Date())}</div>
          </div>
        </div>
      </div>

      {/* Selector & Employee Details Card */}
      <Card className="border-slate-200 shadow-xs print:border-none print:shadow-none">
        <CardContent className="p-4 space-y-4">
          <div className="print:hidden space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Pilih Karyawan yang Ingin Dilihat:
            </label>
            {isLoadingEmployees ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded-md border border-slate-200">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Memuat data karyawan...
              </div>
            ) : (
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={isPending || isLoadingTransactions}
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

          {selectedEmployee && (
            <div className="space-y-4">
              {/* Info Karyawan Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/90 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">NIP / Nomor Induk</span>
                  <span className="font-bold font-mono text-slate-900">{selectedEmployee.employeeNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Nama Lengkap</span>
                  <span className="font-bold text-slate-900">{selectedEmployee.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Jabatan</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.position}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Bagian</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.department.name}</span>
                </div>
              </div>

              {/* 3 Kartu Saldo Aktif */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                  <span>Posisi Saldo Aktif Saat Ini:</span>
                  <span className="text-slate-600 font-normal">
                    Total Keseluruhan: <strong className="text-blue-700 font-mono">{selectedEmployee.balances.total} hari</strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-900">Cuti Tahunan</span>
                      <Badge variant="annual" className="text-[10px]">Annual</Badge>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-blue-700 tabular-nums">
                        {selectedEmployee.balances.annual}
                      </span>
                      <span className="text-xs text-blue-600 font-medium">hari</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-900">Cuti Besar</span>
                      <Badge variant="longLeave" className="text-[10px]">Long Leave</Badge>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-purple-700 tabular-nums">
                        {selectedEmployee.balances.longLeave}
                      </span>
                      <span className="text-xs text-purple-600 font-medium">hari</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-900">Inhaldagen</span>
                      <Badge variant="inhaldagen" className="text-[10px]">Inhaldagen</Badge>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-amber-700 tabular-nums">
                        {selectedEmployee.balances.inhaldagen}
                      </span>
                      <span className="text-xs text-amber-600 font-medium">hari</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabel Mutasi Buku Cuti */}
      <Card className="border-slate-200 shadow-xs print:border-none print:shadow-none">
        <CardHeader className="py-3.5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              Histori Mutasi Saldo Cuti
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Rincian keluar masuk hari cuti tercatat di buku besar kepegawaian
            </CardDescription>
          </div>
          {transactions.length > 0 && (
            <Badge variant="outline" className="text-xs font-mono">
              {transactions.length} Transaksi
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center p-8 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat histori mutasi...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 text-[11px]">
                  <TableHead className="w-28 font-bold">Tanggal</TableHead>
                  <TableHead className="font-bold">Jenis Cuti</TableHead>
                  <TableHead className="font-bold">Aktivitas</TableHead>
                  <TableHead className="font-bold">Uraian / Alasan</TableHead>
                  <TableHead className="text-center font-bold">Masuk (+)</TableHead>
                  <TableHead className="text-center font-bold">Keluar (-)</TableHead>
                  <TableHead className="font-bold">Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-500 text-xs">
                      Belum ada catatan mutasi untuk karyawan ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const amount = Number(tx.amount);
                    const isPositive = amount > 0;
                    return (
                      <TableRow key={tx.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs text-slate-700">
                          {formatDateIndo(tx.transactionDate)}
                        </TableCell>
                        <TableCell>
                          {getLeaveTypeBadge(tx.leaveType.code)}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-700">
                          {getTransactionTypeLabel(tx.transactionType)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-800 max-w-xs">
                          <div>{tx.description}</div>
                          {tx.notes && (
                            <div className="text-[10px] text-slate-400 italic">
                              Catatan: {tx.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-xs tabular-nums text-emerald-700">
                          {isPositive ? `+${amount}` : "—"}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-xs tabular-nums text-red-600">
                          {!isPositive ? `${amount}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {tx.createdBy.fullName || tx.createdBy.username}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
