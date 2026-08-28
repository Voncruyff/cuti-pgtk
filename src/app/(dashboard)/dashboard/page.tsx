import Link from "next/link";
import {
  Users,
  CalendarDays,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { mockDb } from "@/lib/mock-db";
import { requireAuth } from "@/lib/auth/session";
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
import { formatDateIndo, formatSignedDays } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Load operational stats from mockDb
  const employees = mockDb.getEmployees();
  const totalActiveEmployees = employees.filter((e) => e.isActive).length;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const transactions = mockDb.getTransactions();
  const currentMonthTransactions = transactions.filter(
    (tx) => tx.transactionDate >= startOfMonth && !tx.isVoid
  ).length;

  const leaveRequests = mockDb.getLeaveRequests();
  const todayLeaveRequests = leaveRequests.filter(
    (req) => req.requestDate >= startOfToday
  ).length;

  const recentTransactions = transactions.slice(0, 5);

  const shortcuts = [
    {
      title: "Pengambilan Cuti",
      desc: "Input form permohonan cuti",
      href: "/leave/create",
      icon: CalendarDays,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Tambah Saldo",
      desc: "Tambah saldo cuti karyawan",
      href: "/balances/add",
      icon: PlusCircle,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Rincian Cuti",
      desc: "Lihat saldo & histori per karyawan",
      href: "/leave/details",
      icon: FileSpreadsheet,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Rekap Cuti",
      desc: "Laporan rekap & cetak dokumen",
      href: "/reports/summary",
      icon: FileText,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
    {
      title: "Proses Massal",
      desc: "Pemberian cuti massal tahunan",
      href: "/mass-process",
      icon: Layers,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      roles: ["ADMIN_UTAMA"],
    },
    {
      title: "Master Karyawan",
      desc: "Kelola data karyawan & NIP",
      href: "/employees",
      icon: Users,
      color: "bg-slate-50 text-slate-700 border-slate-200",
      roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
    },
  ];

  const visibleShortcuts = shortcuts.filter((s) => s.roles.includes(user.role));

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dashboard Operasional
            </h1>
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
              Dummy / Mock Data Mode
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Selamat datang, <span className="font-semibold text-slate-700">{user.fullName || user.username}</span>. Ringkasan sistem cuti PG Trangkil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leave/create">
            <Button size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <CalendarDays className="h-3.5 w-3.5" />
              + Ambil Cuti
            </Button>
          </Link>
          <Link href="/balances/add">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium">
              <PlusCircle className="h-3.5 w-3.5" />
              Tambah Saldo
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Karyawan Aktif</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {totalActiveEmployees}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Karyawan pimpinan terdaftar</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Transaksi Bulan Ini</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {currentMonthTransactions}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ledger mutasi aktif</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Permohonan Cuti Hari Ini</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {todayLeaveRequests}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Permohonan diajukan</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Shortcuts Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Shortcut Menu Operasional
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleShortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link key={shortcut.title} href={shortcut.href}>
                <Card className="hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer h-full group">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`p-2 rounded-md border shrink-0 ${shortcut.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {shortcut.title}
                        </p>
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {shortcut.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3.5">
          <div>
            <CardTitle className="text-sm font-semibold">Transaksi Terbaru</CardTitle>
            <CardDescription className="text-[11px]">
              Mutasi ledger saldo cuti terakhir
            </CardDescription>
          </div>
          <Link href="/leave/details">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700">
              Lihat Semua
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Tanggal</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Bagian</TableHead>
                <TableHead>Jenis Cuti</TableHead>
                <TableHead>Uraian</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500 text-xs">
                    Belum ada transaksi cuti tercatat.
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((tx) => {
                  const amount = Number(tx.amount);
                  const isPositive = amount > 0;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {formatDateIndo(tx.transactionDate)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 text-xs">
                          {tx.employee.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          NIP: {tx.employee.employeeNumber}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {tx.employee.department.name}
                      </TableCell>
                      <TableCell>
                        {getLeaveTypeBadge(tx.leaveType.code)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 max-w-[200px] truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-semibold text-xs tabular-nums ${
                          isPositive
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatSignedDays(amount)} hari
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
        </CardContent>
      </Card>
    </div>
  );
}
