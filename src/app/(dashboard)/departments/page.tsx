"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  X,
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
  getDepartmentsListAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from "@/actions/department-actions";

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function DepartmentsPage() {
  const [isPending, startTransition] = useTransition();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Modal State
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);

  // Load Data
  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await getDepartmentsListAction();
      if (res.success && res.data) {
        setDepartments(res.data as DepartmentItem[]);
      } else {
        toast.error(res.message || "Gagal memuat data bagian.");
      }
    } catch (err) {
      console.error("Load departments error:", err);
      toast.error("Terjadi kesalahan saat memuat data bagian.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // Filtered List (READ)
  const filteredDepartments = departments.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      d.code.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && d.isActive) ||
      (statusFilter === "INACTIVE" && !d.isActive);

    return matchesSearch && matchesStatus;
  });

  // Handle CREATE (C)
  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      toast.error("Kode dan Nama Bagian wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createDepartmentAction({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        isActive,
      });

      if (res.success) {
        toast.success(res.message || "Bagian baru berhasil ditambahkan!");
        setIsAddModalOpen(false);

        // Reset
        setCode("");
        setName("");
        setIsActive(true);

        loadDepartments();
      } else {
        toast.error(res.message || "Gagal menambahkan bagian.");
      }
    });
  };

  // Open EDIT Modal (U)
  const handleOpenEditModal = (d: DepartmentItem) => {
    setEditingDeptId(d.id);
    setEditCode(d.code);
    setEditName(d.name);
    setEditIsActive(d.isActive);
    setIsEditModalOpen(true);
  };

  // Handle UPDATE (U)
  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDeptId) return;
    if (!editCode.trim() || !editName.trim()) {
      toast.error("Kode dan Nama Bagian wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await updateDepartmentAction(editingDeptId, {
        code: editCode.trim().toUpperCase(),
        name: editName.trim(),
        isActive: editIsActive,
      });

      if (res.success) {
        toast.success(res.message || "Data bagian berhasil diperbarui!");
        setIsEditModalOpen(false);
        setEditingDeptId(null);
        loadDepartments();
      } else {
        toast.error(res.message || "Gagal memperbarui data bagian.");
      }
    });
  };

  // Handle DELETE (D)
  const handleConfirmDelete = () => {
    if (!deletingDept) return;

    startTransition(async () => {
      const res = await deleteDepartmentAction(deletingDept.id);
      if (res.success) {
        toast.success(res.message || "Bagian berhasil dihapus.");
        setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
        setDeletingDept(null);
      } else {
        toast.error(res.message || "Gagal menghapus bagian.");
      }
    });
  };

  const formatDate = (val: Date | string) => {
    const d = new Date(val);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(d);
  };

  const totalActive = departments.filter((d) => d.isActive).length;
  const totalEmployees = departments.reduce((acc, curr) => acc + curr.employeeCount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-slate-800">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Master Bagian (Departemen)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-2 sm:pl-0">
            Kelola data master unit kerja resmi PG Trangkil yang tersimpan di tabel database MySQL (<code className="font-mono text-slate-700">departments</code>).
          </p>
        </div>

        {/* CREATE Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="gap-1.5 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            + Tambah Bagian Baru
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Bagian Terdaftar</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {departments.length} Bagian
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Bagian Aktif</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5 tabular-nums">
                {totalActive} Bagian
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Karyawan Terdistribusi</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">
                {totalEmployees} Orang
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card (READ) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Tabel Master Bagian PG Trangkil
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Daftar unit kerja operasional dan jumlah karyawan yang terdaftar
            </CardDescription>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kode / nama bagian..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="INACTIVE">Hanya Nonaktif</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat data bagian dari database...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {departments.length === 0 ? "Belum Ada Bagian" : "Tidak Ada Data yang Sesuai"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {departments.length === 0
                  ? "Klik '+ Tambah Bagian Baru' untuk mulai menambahkan master bagian."
                  : `Tidak ditemukan bagian dengan kata kunci "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 text-[11px]">
                  <TableHead className="w-28 font-bold">KODE BAGIAN</TableHead>
                  <TableHead className="font-bold">NAMA BAGIAN / UNIT KERJA</TableHead>
                  <TableHead className="text-center font-bold">JUMLAH KARYAWAN</TableHead>
                  <TableHead className="font-bold">STATUS</TableHead>
                  <TableHead className="font-bold">TANGGAL DIBUAT</TableHead>
                  <TableHead className="text-right font-bold w-24">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((d) => (
                  <TableRow key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* 1. Kode Bagian */}
                    <TableCell>
                      <Badge className="font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                        {d.code}
                      </Badge>
                    </TableCell>

                    {/* 2. Nama Bagian */}
                    <TableCell className="text-xs font-bold text-slate-900">
                      {d.name}
                    </TableCell>

                    {/* 3. Jumlah Karyawan */}
                    <TableCell className="text-center">
                      <Link href={`/employees`}>
                        <Badge
                          variant="secondary"
                          className="font-medium text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                          title="Lihat daftar karyawan"
                        >
                          <Users className="h-3 w-3 mr-1 text-slate-500" />
                          {d.employeeCount} orang
                        </Badge>
                      </Link>
                    </TableCell>

                    {/* 4. Status */}
                    <TableCell>
                      {d.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          Nonaktif
                        </span>
                      )}
                    </TableCell>

                    {/* 5. Tanggal Dibuat */}
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(d.createdAt)}
                    </TableCell>

                    {/* 6. AKSI: Edit (U) & Delete (D) */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit / Ubah Bagian"
                          onClick={() => handleOpenEditModal(d)}
                          className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          title="Hapus Bagian"
                          onClick={() => setDeletingDept(d)}
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

      {/* MODAL CREATE (C): Tambah Bagian Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              Tambah Master Bagian Baru
            </DialogTitle>
            <DialogDescription>
              Tambahkan data bagian atau unit kerja baru ke database PG Trangkil.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDepartment} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="createCode" required className="text-xs">
                KODE BAGIAN
              </Label>
              <Input
                id="createCode"
                type="text"
                placeholder="Contoh: SDM / QC / LOG"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isPending}
                required
                className="h-9 text-xs font-mono font-bold"
              />
              <p className="text-[10px] text-slate-400">
                Gunakan singkatan huruf kapital (contoh: PIMPINAN, TUK, TAN, TEK, PAB).
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="createName" required className="text-xs">
                NAMA BAGIAN / UNIT KERJA
              </Label>
              <Input
                id="createName"
                type="text"
                placeholder="Contoh: Bagian Sumber Daya Manusia (SDM)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="createIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="createIsActive" className="text-xs font-normal cursor-pointer text-slate-700">
                Bagian aktif dan dapat dipilih saat input data karyawan
              </Label>
            </div>

            <DialogFooter className="gap-2 pt-3">
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
                    Simpan Bagian Baru
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL UPDATE (U): Edit Bagian */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent onClose={() => setIsEditModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Pencil className="h-5 w-5 text-amber-600" />
              Edit / Ubah Data Bagian
            </DialogTitle>
            <DialogDescription>
              Perbarui kode singkatan, nama bagian, atau status keaktifan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateDepartment} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="editCode" required className="text-xs">
                KODE BAGIAN
              </Label>
              <Input
                id="editCode"
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                disabled={isPending}
                required
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editName" required className="text-xs">
                NAMA BAGIAN / UNIT KERJA
              </Label>
              <Input
                id="editName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isPending}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="editIsActive" className="text-xs font-normal cursor-pointer text-slate-700">
                Bagian aktif dan dapat dipilih
              </Label>
            </div>

            <DialogFooter className="gap-2 pt-3">
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
      <Dialog open={!!deletingDept} onOpenChange={(open) => !open && setDeletingDept(null)}>
        <DialogContent onClose={() => setDeletingDept(null)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Data Bagian
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus bagian ini dari master database?
            </DialogDescription>
          </DialogHeader>

          {deletingDept && (
            <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
              <div>
                <strong>Kode Bagian:</strong> <span className="font-mono">{deletingDept.code}</span>
              </div>
              <div>
                <strong>Nama Bagian:</strong> {deletingDept.name}
              </div>
              <div>
                <strong>Jumlah Karyawan:</strong> {deletingDept.employeeCount} orang
              </div>
              {deletingDept.employeeCount > 0 && (
                <div className="pt-1.5 text-red-700 font-semibold">
                  ⚠️ Peringatan: Bagian ini memiliki karyawan terdaftar dan tidak dapat dihapus sebelum karyawan dipindahkan.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingDept(null)}
              disabled={isPending}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isPending || (deletingDept ? deletingDept.employeeCount > 0 : false)}
              className="h-9 text-xs font-semibold gap-1.5 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Ya, Hapus Bagian
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
