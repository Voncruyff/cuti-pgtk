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
  createLeaderAction,
  updateLeaderAction,
  deleteLeaderAction,
} from "@/actions/employee-actions";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface EmployeeItem {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  departmentId: string;
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

export default function EmployeesPage() {
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nip, setNip] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [initialAnnual, setInitialAnnual] = useState(12);
  const [initialLongLeave, setInitialLongLeave] = useState(0);
  const [initialInhaldagen, setInitialInhaldagen] = useState(0);

  // Edit / Update Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editNip, setEditNip] = useState("");
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");

  // Delete Confirmation Modal State
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeItem | null>(null);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        getLeadersAction(),
        getDepartmentsAction(),
      ]);

      if (empRes.success && empRes.data) {
        setEmployees(empRes.data as unknown as EmployeeItem[]);
      }
      if (deptRes.success && deptRes.data) {
        const depts = deptRes.data as DepartmentOption[];
        setDepartments(depts);
      }
    } catch (err) {
      console.error("Load employees error:", err);
      toast.error("Gagal memuat data karyawan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered List (READ)
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      emp.employeeNumber.toLowerCase().includes(q) ||
      emp.name.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.department.name.toLowerCase().includes(q);

    const matchesDept =
      selectedDeptFilter === "ALL" || emp.departmentId === selectedDeptFilter;

    return matchesSearch && matchesDept;
  });

  // Handle CREATE (C)
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nip.trim() || !name.trim() || !departmentId) {
      toast.error("NIP, Nama Lengkap, dan Bagian wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createLeaderAction({
        employeeNumber: nip.trim(),
        name: name.trim(),
        position: position.trim(),
        departmentId,
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
        setDepartmentId("");
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
    setEditDepartmentId(emp.departmentId || "");
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

    startTransition(async () => {
      const res = await updateLeaderAction(editingEmployeeId, {
        employeeNumber: editNip.trim(),
        name: editName.trim(),
        position: editPosition.trim(),
        departmentId: editDepartmentId,
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
        setEmployees((prev) => prev.filter((item) => item.id !== deletingEmployee.id));
        setDeletingEmployee(null);
      } else {
        toast.error(res.message || "Gagal menghapus karyawan.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
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
              Master Karyawan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-2 sm:pl-0">
            Kelola data master karyawan (NIP, Nama, Jabatan, Bagian) dengan fitur Create, Read, Update, Delete (CRUD).
          </p>
        </div>

        {/* CREATE Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="gap-1.5 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            + Tambah Karyawan
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Karyawan</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {employees.length} orang
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {departments.map((dept) => {
          const count = employees.filter((e) => e.departmentId === dept.id).length;
          return (
            <Card key={dept.id} className="border-slate-200 shadow-2xs">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-500 truncate max-w-[110px]" title={dept.name}>
                    {dept.code}
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                    {count}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
                  <Building2 className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Table Card (READ) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Tabel Data Karyawan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Daftar master karyawan: NIP, Nama, Jabatan, dan Bagian
            </CardDescription>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari NIP / Nama / Jabatan..."
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

            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Bagian</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat data karyawan...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {employees.length === 0
                  ? "Belum Ada Data Karyawan Terdaftar"
                  : "Tidak Ada Data yang Sesuai Pencarian"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {employees.length === 0
                  ? "Klik tombol '+ Tambah Karyawan' di atas untuk mulai menambahkan data."
                  : `Tidak ditemukan karyawan dengan kata kunci "${searchQuery}".`}
              </p>
              {employees.length === 0 && (
                <div className="mt-4">
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    size="sm"
                    className="gap-1.5 h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Tambah Karyawan Pertama
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 text-[11px]">
                  <TableHead className="w-32 font-bold">NIP</TableHead>
                  <TableHead className="font-bold">NAMA</TableHead>
                  <TableHead className="font-bold">JABATAN</TableHead>
                  <TableHead className="font-bold">BAGIAN</TableHead>
                  <TableHead className="text-right font-bold w-24">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* 1. NIP */}
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {emp.employeeNumber}
                    </TableCell>

                    {/* 2. NAMA */}
                    <TableCell className="font-bold text-xs text-slate-900">
                      {emp.name}
                    </TableCell>

                    {/* 3. JABATAN */}
                    <TableCell className="text-xs font-medium text-slate-700">
                      {emp.position}
                    </TableCell>

                    {/* 4. BAGIAN */}
                    <TableCell className="text-xs text-slate-700">
                      <Badge variant="outline" className="font-medium bg-slate-50 text-slate-700 border-slate-200">
                        {emp.department.name}
                      </Badge>
                    </TableCell>

                    {/* AKSI: Hanya Edit (U) & Hapus (D) */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* UPDATE (U) Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit / Ubah Data"
                          onClick={() => handleOpenEditModal(emp)}
                          className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {/* DELETE (D) Button */}
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
          )}
        </CardContent>
      </Card>

      {/* MODAL CREATE (C): Tambah Data Karyawan */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Tambah Data Karyawan Baru
            </DialogTitle>
            <DialogDescription>
              Isi atribut NIP, Nama, Jabatan, dan Bagian karyawan PG Trangkil.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEmployee} className="space-y-4 pt-2">
            {/* 1. NIP & 2. NAMA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="createNip" required className="text-xs">
                  NIP
                </Label>
                <Input
                  id="createNip"
                  type="text"
                  placeholder="Contoh: 4101"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="createName" required className="text-xs">
                  NAMA LENGKAP
                </Label>
                <Input
                  id="createName"
                  type="text"
                  placeholder="Contoh: Ir. Bambang Sudarmono, M.T."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* 3. JABATAN & 4. BAGIAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="createPos" className="text-xs">
                  JABATAN <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                </Label>
                <Input
                  id="createPos"
                  type="text"
                  placeholder="Contoh: Kepala Bagian / Sinder (Opsional)"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={isPending}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="createDept" required className="text-xs">
                  BAGIAN
                </Label>
                <select
                  id="createDept"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Bagian --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
                    Simpan Data Karyawan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL UPDATE (U): Edit Data Karyawan */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent onClose={() => setIsEditModalOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Pencil className="h-5 w-5 text-amber-600" />
              Edit / Ubah Data Karyawan
            </DialogTitle>
            <DialogDescription>
              Perbarui atribut NIP, Nama, Jabatan, atau Bagian karyawan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateEmployee} className="space-y-4 pt-2">
            {/* NIP & Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editNipInput" required className="text-xs">
                  NIP
                </Label>
                <Input
                  id="editNipInput"
                  type="text"
                  value={editNip}
                  onChange={(e) => setEditNip(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="editNameInput" required className="text-xs">
                  NAMA LENGKAP
                </Label>
                <Input
                  id="editNameInput"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Jabatan & Bagian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editPosInput" className="text-xs">
                  JABATAN <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                </Label>
                <Input
                  id="editPosInput"
                  type="text"
                  placeholder="Opsional"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  disabled={isPending}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editDeptInput" required className="text-xs">
                  BAGIAN
                </Label>
                <select
                  id="editDeptInput"
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Bagian --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
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
              Tindakan ini akan menghapus data karyawan dan seluruh riwayat mutasi cuti yang bersangkutan.
            </DialogDescription>
          </DialogHeader>

          {deletingEmployee && (
            <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
              <div>
                <strong>NIP:</strong> <span className="font-mono">{deletingEmployee.employeeNumber}</span>
              </div>
              <div>
                <strong>Nama:</strong> {deletingEmployee.name}
              </div>
              <div>
                <strong>Jabatan:</strong> {deletingEmployee.position}
              </div>
              <div>
                <strong>Bagian:</strong> {deletingEmployee.department.name}
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
                  Ya, Hapus Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
