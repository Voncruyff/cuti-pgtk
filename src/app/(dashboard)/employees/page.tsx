"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Building2,
  Trash2,
  Pencil,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  X,
  Factory,
  Briefcase,
  HardHat,
  RefreshCw,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getLeadersAction,
  getDepartmentsAction,
  getStationsForDepartmentAction,
  createLeaderAction,
  updateLeaderAction,
  deleteLeaderAction,
} from "@/actions/employee-actions";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface StationOption {
  id: string;
  code: string;
  name: string;
  departmentId: string | null;
  departmentName: string;
}

interface EmployeeItem {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  category?: string;
  departmentId: string;
  department: {
    id: string;
    code: string;
    name: string;
  };
  stationId?: string | null;
  stasiun?: string;
  stationCode?: string;
  balances: {
    annual: number;
    longLeave: number;
    inhaldagen: number;
    total: number;
  };
}

export default function EmployeesPage() {
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab Filter Jenis Karyawan: ALL | PIMPINAN | PELAKSANA
  const [categoryTab, setCategoryTab] = useState<"ALL" | "PIMPINAN" | "PELAKSANA">("ALL");

  // Dropdown Filter: Bagian & Stasiun
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedStationFilter, setSelectedStationFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nip, setNip] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [category, setCategory] = useState<"PIMPINAN" | "PELAKSANA">("PIMPINAN");
  const [departmentId, setDepartmentId] = useState("");
  const [stationId, setStationId] = useState<string>("");
  const [initialAnnual, setInitialAnnual] = useState(12);
  const [initialLongLeave, setInitialLongLeave] = useState(0);
  const [initialInhaldagen, setInitialInhaldagen] = useState(0);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editNip, setEditNip] = useState("");
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editCategory, setEditCategory] = useState<"PIMPINAN" | "PELAKSANA">("PIMPINAN");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editStationId, setEditStationId] = useState<string>("");

  // Delete Confirmation Modal State
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeItem | null>(null);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes, stationRes] = await Promise.all([
        getLeadersAction(),
        getDepartmentsAction(),
        getStationsForDepartmentAction(),
      ]);

      if (empRes.success && empRes.data) {
        setEmployees(empRes.data as unknown as EmployeeItem[]);
      }
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data as DepartmentOption[]);
      }
      if (stationRes.success && stationRes.data) {
        setStations(stationRes.data as StationOption[]);
      }
    } catch (err) {
      console.error("Load employees error:", err);
      toast.error("Gagal memuat data master karyawan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter stasiun berdasarkan bagian yang sedang dipilih di filter tabel
  const stationsForDeptFilter = stations.filter((s) => {
    if (selectedDeptFilter === "ALL") return true;
    const targetDept = departments.find(
      (d) => d.id === selectedDeptFilter || d.name === selectedDeptFilter || d.code === selectedDeptFilter
    );
    return (
      s.departmentId === selectedDeptFilter ||
      (targetDept && s.departmentName.toLowerCase() === targetDept.name.toLowerCase())
    );
  });

  // Filter stasiun untuk dropdown modal tambah/edit
  const getStationsForDept = (deptId: string) => {
    if (!deptId) return stations;
    const targetDept = departments.find((d) => d.id === deptId || d.name === deptId || d.code === deptId);
    return stations.filter(
      (s) =>
        s.departmentId === deptId ||
        (targetDept && s.departmentName.toLowerCase() === targetDept.name.toLowerCase())
    );
  };

  // Filter Karyawan untuk Tabel
  const filteredEmployees = employees.filter((emp) => {
    // 1. Filter Tab Jenis Karyawan
    if (categoryTab !== "ALL") {
      const empCat = emp.category || "PIMPINAN";
      if (empCat !== categoryTab) return false;
    }

    // 2. Filter Bagian
    if (selectedDeptFilter !== "ALL") {
      const targetDept = departments.find(
        (d) => d.id === selectedDeptFilter || d.name === selectedDeptFilter || d.code === selectedDeptFilter
      );
      const matchDept =
        emp.departmentId === selectedDeptFilter ||
        (targetDept && emp.department.name.toLowerCase() === targetDept.name.toLowerCase()) ||
        (targetDept && emp.department.code.toLowerCase() === targetDept.code.toLowerCase());
      if (!matchDept) return false;
    }

    // 3. Filter Stasiun
    if (selectedStationFilter !== "ALL") {
      const matchStation =
        (emp.stasiun && emp.stasiun.toLowerCase() === selectedStationFilter.toLowerCase()) ||
        emp.stationId === selectedStationFilter;
      if (!matchStation) return false;
    }

    // 4. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchesSearch =
        emp.employeeNumber.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        (emp.stasiun && emp.stasiun.toLowerCase().includes(q)) ||
        emp.department.name.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Handle CREATE (C)
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nip.trim() || !name.trim() || !departmentId) {
      toast.error("NIP, Nama Lengkap, dan Bagian wajib diisi.");
      return;
    }

    const selectedSt = stations.find((s) => s.id === stationId);
    const stationName = selectedSt ? selectedSt.name : (stationId || null);

    startTransition(async () => {
      const res = await createLeaderAction({
        employeeNumber: nip.trim(),
        name: name.trim(),
        position: position.trim(),
        category,
        departmentId,
        stationId: stationId || null,
        stasiun: stationName,
        initialAnnual: Number(initialAnnual) || 0,
        initialLongLeave: Number(initialLongLeave) || 0,
        initialInhaldagen: Number(initialInhaldagen) || 0,
      });

      if (res.success) {
        toast.success(res.message || "Data karyawan berhasil ditambahkan!");
        setIsAddModalOpen(false);

        // Reset fields
        setNip("");
        setName("");
        setPosition("");
        setInitialAnnual(12);
        setInitialLongLeave(0);
        setInitialInhaldagen(0);

        loadData();
      } else {
        toast.error(res.message || "Gagal menambahkan data karyawan.");
      }
    });
  };

  // Open EDIT Modal (U)
  const handleOpenEditModal = (emp: EmployeeItem) => {
    setEditingEmployeeId(emp.id);
    setEditNip(emp.employeeNumber);
    setEditName(emp.name);
    setEditPosition(emp.position === "-" ? "" : emp.position);
    setEditCategory((emp.category as "PIMPINAN" | "PELAKSANA") || "PIMPINAN");
    setEditDepartmentId(emp.departmentId || (departments[0]?.id ?? ""));

    const matchSt = stations.find(
      (s) => s.id === emp.stationId || (emp.stasiun && s.name.toLowerCase() === emp.stasiun.toLowerCase())
    );
    setEditStationId(matchSt ? matchSt.id : (emp.stationId || ""));

    setIsEditModalOpen(true);
  };

  // Handle UPDATE (U)
  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEmployeeId) return;

    if (!editNip.trim() || !editName.trim() || !editDepartmentId) {
      toast.error("NIP, Nama Lengkap, dan Bagian wajib diisi.");
      return;
    }

    const selectedSt = stations.find((s) => s.id === editStationId);
    const stationName = selectedSt ? selectedSt.name : (editStationId || null);

    startTransition(async () => {
      const res = await updateLeaderAction(editingEmployeeId, {
        employeeNumber: editNip.trim(),
        name: editName.trim(),
        position: editPosition.trim(),
        category: editCategory,
        departmentId: editDepartmentId,
        stationId: editStationId || null,
        stasiun: stationName,
      });

      if (res.success) {
        toast.success(res.message || "Data karyawan berhasil diperbarui!");
        setIsEditModalOpen(false);
        setEditingEmployeeId(null);
        loadData();
      } else {
        toast.error(res.message || "Gagal memperbarui data karyawan.");
      }
    });
  };

  // Handle DELETE (D)
  const handleConfirmDelete = () => {
    if (!deletingEmployee) return;

    startTransition(async () => {
      const res = await deleteLeaderAction(deletingEmployee.id);
      if (res.success) {
        toast.success(res.message || "Data karyawan berhasil dihapus.");
        setEmployees((prev) => prev.filter((emp) => emp.id !== deletingEmployee.id));
        setDeletingEmployee(null);
      } else {
        toast.error(res.message || "Gagal menghapus data karyawan.");
      }
    });
  };

  const pimpinanCount = employees.filter((e) => !e.category || e.category === "PIMPINAN").length;
  const pelaksanaCount = employees.filter((e) => e.category === "PELAKSANA").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        {/* Tabs Switcher: Semua vs Karyawan Pimpinan vs Karyawan Pelaksana */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryTab("ALL")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors ${
              categoryTab === "ALL"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Semua Karyawan
            <Badge className="h-5 px-1.5 text-[10px] bg-slate-100 text-slate-700 border-none">
              {employees.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab("PIMPINAN")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors ${
              categoryTab === "PIMPINAN"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Karyawan Pimpinan
            <Badge className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 border-none">
              {pimpinanCount}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setCategoryTab("PELAKSANA")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors ${
              categoryTab === "PELAKSANA"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <HardHat className="h-4 w-4" />
            Karyawan Pelaksana
            <Badge className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 border-none">
              {pelaksanaCount}
            </Badge>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/stations">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              <Factory className="h-3.5 w-3.5 text-slate-500" />
              Buka Master Stasiun
            </Button>
          </Link>

          <Button
            onClick={() => {
              if (categoryTab === "PELAKSANA") {
                setCategory("PELAKSANA");
              } else {
                setCategory("PIMPINAN");
              }
              if (selectedDeptFilter !== "ALL") {
                setDepartmentId(selectedDeptFilter);
              } else if (departments.length > 0) {
                setDepartmentId(departments[0].id);
              }
              if (selectedStationFilter !== "ALL") {
                const matchSt = stations.find((s) => s.name === selectedStationFilter);
                if (matchSt) setStationId(matchSt.id);
              }
              setIsAddModalOpen(true);
            }}
            size="sm"
            className="gap-1.5 h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            + Tambah Karyawan Baru
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Karyawan</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {employees.length} Orang
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Karyawan Pimpinan</p>
              <p className="text-xl font-bold text-blue-700 mt-0.5 tabular-nums">
                {pimpinanCount} Orang
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Karyawan Pelaksana</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5 tabular-nums">
                {pelaksanaCount} Orang
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <HardHat className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Bagian & Stasiun</p>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {departments.length} Bagian • {stations.length} Stasiun
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Factory className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card (Tampilan Bersih dan Simpel Model Tabel) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Tabel Master Karyawan PG Trangkil
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Menampilkan {filteredEmployees.length} dari {employees.length} karyawan terdata di sistem
            </CardDescription>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Input Pencarian */}
            <div className="relative w-44 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari NIP / nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs bg-slate-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 2. Selector Bagian */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => {
                setSelectedDeptFilter(e.target.value);
                setSelectedStationFilter("ALL"); // reset stasiun bila bagian berubah
              }}
              className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Bagian</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>

            {/* 3. Selector Stasiun */}
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none max-w-[180px]"
            >
              <option value="ALL">Semua Stasiun</option>
              {stationsForDeptFilter.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Tombol Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              title="Muat ulang data"
              className="h-8 w-8 p-0 text-slate-500"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat data karyawan dari MySQL...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {employees.length === 0 ? "Belum Ada Data Karyawan" : "Tidak Ada Data yang Sesuai"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {employees.length === 0
                  ? "Klik '+ Tambah Karyawan Baru' untuk mulai menginput data karyawan."
                  : `Tidak ditemukan karyawan dengan filter yang dipilih atau kata kunci "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px]">
                    <TableHead className="w-12 text-center font-bold">NO</TableHead>
                    <TableHead className="w-24 font-bold">NIP</TableHead>
                    <TableHead className="font-bold">NAMA KARYAWAN</TableHead>
                    <TableHead className="font-bold">JABATAN</TableHead>
                    <TableHead className="font-bold">JENIS</TableHead>
                    <TableHead className="font-bold">BAGIAN</TableHead>
                    <TableHead className="font-bold">STASIUN</TableHead>
                    <TableHead className="text-center font-bold">SALDO CUTI</TableHead>
                    <TableHead className="text-right font-bold w-20">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp, index) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* No */}
                      <TableCell className="text-center text-xs font-medium text-slate-400 font-mono">
                        {index + 1}
                      </TableCell>

                      {/* NIP */}
                      <TableCell>
                        <Badge className="font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                          {emp.employeeNumber}
                        </Badge>
                      </TableCell>

                      {/* Nama */}
                      <TableCell className="text-xs font-bold text-slate-900">
                        {emp.name}
                      </TableCell>

                      {/* Jabatan */}
                      <TableCell className="text-xs text-slate-600">
                        {emp.position || "-"}
                      </TableCell>

                      {/* Jenis Karyawan */}
                      <TableCell>
                        {emp.category === "PELAKSANA" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            Pelaksana
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            Pimpinan
                          </Badge>
                        )}
                      </TableCell>

                      {/* Bagian */}
                      <TableCell>
                        <Badge variant="outline" className="font-medium text-[11px] bg-slate-50">
                          <Building2 className="h-3 w-3 mr-1 text-slate-400" />
                          {emp.department.name}
                        </Badge>
                      </TableCell>

                      {/* Stasiun */}
                      <TableCell className="text-xs text-slate-700">
                        {emp.stasiun && emp.stasiun !== "-" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-[11px]">
                            <Factory className="h-3 w-3 text-slate-400" />
                            {emp.stasiun}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Semua / Belum Ada</span>
                        )}
                      </TableCell>

                      {/* Saldo Cuti */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100" title="Cuti Tahunan">
                            T: {emp.balances?.annual ?? 0}
                          </span>
                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100" title="Cuti Besar">
                            B: {emp.balances?.longLeave ?? 0}
                          </span>
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100" title="Inhaldagen">
                            I: {emp.balances?.inhaldagen ?? 0}
                          </span>
                        </div>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Karyawan"
                            onClick={() => handleOpenEditModal(emp)}
                            className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Hapus Karyawan"
                            onClick={() => setDeletingEmployee(emp)}
                            disabled={isPending}
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL CREATE (C): Tambah Karyawan Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Tambah Master Karyawan Baru
            </DialogTitle>
            <DialogDescription>
              Lengkapi data karyawan, jenis pimpinan/pelaksana, bagian, dan stasiun kerja.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEmployee} className="space-y-3.5 pt-2">
            {/* Jenis Karyawan */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">JENIS KARYAWAN</Label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                    category === "PIMPINAN"
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={category === "PIMPINAN"}
                    onChange={() => setCategory("PIMPINAN")}
                    className="text-blue-600"
                  />
                  <span>👔 Karyawan Pimpinan</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                    category === "PELAKSANA"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={category === "PELAKSANA"}
                    onChange={() => setCategory("PELAKSANA")}
                    className="text-emerald-600"
                  />
                  <span>👷 Karyawan Pelaksana</span>
                </label>
              </div>
            </div>

            {/* NIP & Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nip" required className="text-xs">
                  NIP KARYAWAN
                </Label>
                <Input
                  id="nip"
                  type="text"
                  placeholder="Contoh: 1042 / 5012"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  required
                  disabled={isPending}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="name" required className="text-xs">
                  NAMA LENGKAP
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama karyawan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isPending}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Jabatan */}
            <div className="space-y-1">
              <Label htmlFor="position" className="text-xs">
                JABATAN
              </Label>
              <Input
                id="position"
                type="text"
                placeholder="Contoh: Operator Gilingan / Masinis Ketel / Kepala Urusan"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={isPending}
                className="h-9 text-xs"
              />
            </div>

            {/* Bagian & Stasiun */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="departmentId" required className="text-xs">
                  BAGIAN INDUK
                </Label>
                <select
                  id="departmentId"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setStationId("");
                  }}
                  required
                  disabled={isPending}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>-- Pilih Bagian --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="stationId" className="text-xs">
                  STASIUN KERJA
                </Label>
                <select
                  id="stationId"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  disabled={isPending}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Stasiun (Opsional) --</option>
                  {getStationsForDept(departmentId).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Saldo Cuti Awal */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <p className="text-[11px] font-bold text-slate-700">Hak Saldo Awal Cuti:</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Tahunan</label>
                  <Input
                    type="number"
                    min={0}
                    value={initialAnnual}
                    onChange={(e) => setInitialAnnual(Number(e.target.value))}
                    disabled={isPending}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Besar/Panjang</label>
                  <Input
                    type="number"
                    min={0}
                    value={initialLongLeave}
                    onChange={(e) => setInitialLongLeave(Number(e.target.value))}
                    disabled={isPending}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Inhaldagen</label>
                  <Input
                    type="number"
                    min={0}
                    value={initialInhaldagen}
                    onChange={(e) => setInitialInhaldagen(Number(e.target.value))}
                    disabled={isPending}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isPending}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
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
                    Simpan Karyawan Baru
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL UPDATE (U): Edit Karyawan */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent onClose={() => setIsEditModalOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Pencil className="h-5 w-5 text-amber-600" />
              Edit Data Karyawan
            </DialogTitle>
            <DialogDescription>
              Perbarui klasifikasi jenis, bagian, stasiun, atau data karyawan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateEmployee} className="space-y-3.5 pt-2">
            {/* Jenis Karyawan */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-800">JENIS KARYAWAN</Label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                    editCategory === "PIMPINAN"
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="editCategory"
                    checked={editCategory === "PIMPINAN"}
                    onChange={() => setEditCategory("PIMPINAN")}
                    className="text-blue-600"
                  />
                  <span>👔 Karyawan Pimpinan</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                    editCategory === "PELAKSANA"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="editCategory"
                    checked={editCategory === "PELAKSANA"}
                    onChange={() => setEditCategory("PELAKSANA")}
                    className="text-emerald-600"
                  />
                  <span>👷 Karyawan Pelaksana</span>
                </label>
              </div>
            </div>

            {/* NIP & Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editNip" required className="text-xs">
                  NIP KARYAWAN
                </Label>
                <Input
                  id="editNip"
                  type="text"
                  value={editNip}
                  onChange={(e) => setEditNip(e.target.value)}
                  required
                  disabled={isPending}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="editName" required className="text-xs">
                  NAMA LENGKAP
                </Label>
                <Input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={isPending}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Jabatan */}
            <div className="space-y-1">
              <Label htmlFor="editPosition" className="text-xs">
                JABATAN
              </Label>
              <Input
                id="editPosition"
                type="text"
                value={editPosition}
                onChange={(e) => setEditPosition(e.target.value)}
                disabled={isPending}
                className="h-9 text-xs"
              />
            </div>

            {/* Bagian & Stasiun */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editDepartmentId" required className="text-xs">
                  BAGIAN INDUK
                </Label>
                <select
                  id="editDepartmentId"
                  value={editDepartmentId}
                  onChange={(e) => {
                    setEditDepartmentId(e.target.value);
                    setEditStationId("");
                  }}
                  required
                  disabled={isPending}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>-- Pilih Bagian --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editStationId" className="text-xs">
                  STASIUN KERJA
                </Label>
                <select
                  id="editStationId"
                  value={editStationId}
                  onChange={(e) => setEditStationId(e.target.value)}
                  disabled={isPending}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Stasiun (Opsional) --</option>
                  {getStationsForDept(editDepartmentId).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isPending}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-9 text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRM DELETE (D) */}
      <Dialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
        <DialogContent onClose={() => setDeletingEmployee(null)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Data Karyawan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus karyawan ini dari database master?
            </DialogDescription>
          </DialogHeader>

          {deletingEmployee && (
            <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
              <div>
                <strong>NIP:</strong> <span className="font-mono font-bold">{deletingEmployee.employeeNumber}</span>
              </div>
              <div>
                <strong>Nama:</strong> {deletingEmployee.name}
              </div>
              <div>
                <strong>Jenis:</strong> {deletingEmployee.category === "PELAKSANA" ? "Karyawan Pelaksana" : "Karyawan Pimpinan"}
              </div>
              <div>
                <strong>Bagian / Stasiun:</strong> {deletingEmployee.department.name} / {deletingEmployee.stasiun || "-"}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingEmployee(null)}
              disabled={isPending}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="h-9 text-xs font-semibold gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Ya, Hapus Karyawan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
