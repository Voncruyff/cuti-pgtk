"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Factory,
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  X,
  Layers,
  Filter,
  RefreshCw,
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
  getStationsListAction,
  getDepartmentsSelectorAction,
  createStationAction,
  updateStationAction,
  deleteStationAction,
  StationItem,
} from "@/actions/station-actions";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

export default function StationsPage() {
  const [isPending, startTransition] = useTransition();
  const [stations, setStations] = useState<StationItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Modal State
  const [deletingStation, setDeletingStation] = useState<StationItem | null>(null);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stationRes, deptRes] = await Promise.all([
        getStationsListAction(),
        getDepartmentsSelectorAction(),
      ]);

      if (stationRes.success && stationRes.data) {
        setStations(stationRes.data);
      } else {
        toast.error(stationRes.message || "Gagal memuat data stasiun.");
      }

      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
        if (deptRes.data.length > 0 && !departmentId) {
          setDepartmentId(deptRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Load data error:", err);
      toast.error("Terjadi kesalahan saat memuat data master stasiun.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered List
  const filteredStations = stations.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.departmentName.toLowerCase().includes(q);

    const matchesDept =
      departmentFilter === "ALL" || s.departmentId === departmentFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && s.isActive) ||
      (statusFilter === "INACTIVE" && !s.isActive);

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Handle CREATE (C)
  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      toast.error("Kode dan Nama Stasiun wajib diisi.");
      return;
    }

    if (!departmentId) {
      toast.error("Silakan pilih Bagian induk.");
      return;
    }

    startTransition(async () => {
      const res = await createStationAction({
        code: code.trim().toUpperCase(),
        name: name.trim().toUpperCase(),
        departmentId,
        isActive,
      });

      if (res.success) {
        toast.success(res.message || "Stasiun baru berhasil ditambahkan!");
        setIsAddModalOpen(false);

        // Reset
        setCode("");
        setName("");
        setIsActive(true);

        loadData();
      } else {
        toast.error(res.message || "Gagal menambahkan stasiun.");
      }
    });
  };

  // Open EDIT Modal (U)
  const handleOpenEditModal = (s: StationItem) => {
    setEditingStationId(s.id);
    setEditCode(s.code);
    setEditName(s.name);
    setEditDepartmentId(s.departmentId || (departments[0]?.id ?? ""));
    setEditIsActive(s.isActive);
    setIsEditModalOpen(true);
  };

  // Handle UPDATE (U)
  const handleUpdateStation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStationId) return;
    if (!editCode.trim() || !editName.trim()) {
      toast.error("Kode dan Nama Stasiun wajib diisi.");
      return;
    }

    if (!editDepartmentId) {
      toast.error("Silakan pilih Bagian induk.");
      return;
    }

    startTransition(async () => {
      const res = await updateStationAction(editingStationId, {
        code: editCode.trim().toUpperCase(),
        name: editName.trim().toUpperCase(),
        departmentId: editDepartmentId,
        isActive: editIsActive,
      });

      if (res.success) {
        toast.success(res.message || "Data stasiun berhasil diperbarui!");
        setIsEditModalOpen(false);
        setEditingStationId(null);
        loadData();
      } else {
        toast.error(res.message || "Gagal memperbarui data stasiun.");
      }
    });
  };

  // Handle DELETE (D)
  const handleConfirmDelete = () => {
    if (!deletingStation) return;

    startTransition(async () => {
      const res = await deleteStationAction(deletingStation.id);
      if (res.success) {
        toast.success(res.message || "Stasiun berhasil dihapus.");
        setStations((prev) => prev.filter((s) => s.id !== deletingStation.id));
        setDeletingStation(null);
      } else {
        toast.error(res.message || "Gagal menghapus stasiun.");
      }
    });
  };

  const formatDate = (val: Date | string) => {
    const d = new Date(val);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(d);
  };

  const totalActive = stations.filter((s) => s.isActive).length;

  // Warna badge departemen
  const getDeptBadgeStyle = (code: string) => {
    const c = code.toUpperCase();
    if (c === "TUK") return "bg-blue-50 text-blue-700 border-blue-200";
    if (c === "TEK" || c.includes("TEK")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (c === "PAB" || c.includes("PAB")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (c === "TAN" || c.includes("TAN")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        {/* Tabs Switcher: Master Stasiun vs Master Bagian */}
        <div className="flex items-center gap-2">
          <Link
            href="/stations"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border-b-2 border-blue-600 text-blue-600"
          >
            <Factory className="h-4 w-4" />
            Master Stasiun
            <Badge className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 border-none">
              {stations.length}
            </Badge>
          </Link>
          <Link
            href="/departments"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Master Bagian
            <Badge className="h-5 px-1.5 text-[10px] bg-slate-100 text-slate-600 border-none">
              {departments.length}
            </Badge>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (departments.length > 0 && !departmentId) {
                setDepartmentId(departments[0].id);
              }
              setIsAddModalOpen(true);
            }}
            size="sm"
            className="gap-1.5 h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            + Tambah Stasiun Baru
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total Master Stasiun</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {stations.length} Stasiun
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Factory className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Stasiun Aktif</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5 tabular-nums">
                {totalActive} Aktif
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
              <p className="text-[11px] font-medium text-slate-500">Bagian Induk Terdaftar</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">
                {departments.length} Bagian
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Building2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Status Sinkronisasi DB</p>
              <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tersinkron MySQL
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Factory className="h-4 w-4 text-blue-600" />
              Tabel Master Stasiun PG Trangkil
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Total {filteredStations.length} dari {stations.length} stasiun terdata di sistem
            </CardDescription>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kode / nama stasiun..."
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

            {/* Department Selector Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Bagian</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
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
              Memuat data master stasiun dari MySQL...
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Factory className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {stations.length === 0 ? "Belum Ada Data Stasiun" : "Tidak Ada Data yang Sesuai"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {stations.length === 0
                  ? "Klik '+ Tambah Stasiun Baru' untuk menambahkan master stasiun pertama."
                  : `Tidak ditemukan stasiun dengan kata kunci "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 text-[11px]">
                    <TableHead className="w-12 text-center font-bold">NO</TableHead>
                    <TableHead className="w-28 font-bold">KODE STASIUN</TableHead>
                    <TableHead className="font-bold">NAMA STASIUN</TableHead>
                    <TableHead className="w-48 font-bold">BAGIAN INDUK</TableHead>
                    <TableHead className="w-36 font-bold">TANGGAL DIBUAT</TableHead>
                    <TableHead className="text-right font-bold w-24">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStations.map((s, index) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* No */}
                      <TableCell className="text-center text-xs font-medium text-slate-400 font-mono">
                        {index + 1}
                      </TableCell>

                      {/* Kode Stasiun */}
                      <TableCell>
                        <Badge className="font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                          {s.code}
                        </Badge>
                      </TableCell>

                      {/* Nama Stasiun */}
                      <TableCell className="text-xs font-bold text-slate-900">
                        {s.name}
                      </TableCell>

                      {/* BAGIAN INDUK */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium border ${getDeptBadgeStyle(s.departmentCode)}`}
                        >
                          <Building2 className="h-3 w-3 mr-1 opacity-70" />
                          {s.departmentName}
                        </Badge>
                      </TableCell>

                      {/* TANGGAL DIBUAT */}
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {formatDate(s.createdAt)}
                      </TableCell>

                      {/* AKSI: EDIT & DELETE */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit Data Stasiun"
                            onClick={() => handleOpenEditModal(s)}
                            className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Hapus Stasiun"
                            onClick={() => setDeletingStation(s)}
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

      {/* MODAL CREATE (C): Tambah Stasiun Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Factory className="h-5 w-5 text-blue-600" />
              Tambah Master Stasiun Baru
            </DialogTitle>
            <DialogDescription>
              Masukkan Kode Stasiun dan Nama Stasiun lalu pilih Bagian induknya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStation} className="space-y-4 pt-2">
            {/* Field 1: Kode Stasiun */}
            <div className="space-y-1">
              <Label htmlFor="createCode" required className="text-xs">
                KODE STASIUN
              </Label>
              <Input
                id="createCode"
                type="text"
                placeholder="Contoh: 14000 / 25002 / 35020"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isPending}
                required
                className="h-9 text-xs font-mono font-bold"
              />
              <p className="text-[10px] text-slate-400">
                Kode identifikasi unik stasiun kerja PG Trangkil.
              </p>
            </div>

            {/* Field 2: Nama Stasiun */}
            <div className="space-y-1">
              <Label htmlFor="createName" required className="text-xs">
                NAMA STASIUN
              </Label>
              <Input
                id="createName"
                type="text"
                placeholder="Contoh: PIMPINAN DAN ADMINISTRASI / GILINGAN"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                disabled={isPending}
                required
                className="h-9 text-xs font-semibold"
              />
            </div>

            {/* Field 3: Selector Bagian */}
            <div className="space-y-1">
              <Label htmlFor="createDepartment" required className="text-xs">
                SELECTOR BAGIAN INDUK
              </Label>
              <select
                id="createDepartment"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={isPending}
                required
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="" disabled>-- Pilih Bagian Induk --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Pilih bagian induk (TUK, Teknik, Pabrikasi, Tanaman, dll) yang menaungi stasiun ini.
              </p>
            </div>

            {/* Field 4: Status Keaktifan */}
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
                Stasiun aktif dan operasional
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
                    Simpan Stasiun Baru
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL UPDATE (U): Edit Stasiun */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent onClose={() => setIsEditModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Pencil className="h-5 w-5 text-amber-600" />
              Edit Data Stasiun
            </DialogTitle>
            <DialogDescription>
              Perbarui kode stasiun, nama stasiun, Bagian induk, atau status keaktifan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStation} className="space-y-4 pt-2">
            {/* Edit Field 1: Kode Stasiun */}
            <div className="space-y-1">
              <Label htmlFor="editCode" required className="text-xs">
                KODE STASIUN
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

            {/* Edit Field 2: Nama Stasiun */}
            <div className="space-y-1">
              <Label htmlFor="editName" required className="text-xs">
                NAMA STASIUN
              </Label>
              <Input
                id="editName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value.toUpperCase())}
                disabled={isPending}
                required
                className="h-9 text-xs font-semibold"
              />
            </div>

            {/* Edit Field 3: Selector Bagian */}
            <div className="space-y-1">
              <Label htmlFor="editDepartment" required className="text-xs">
                SELECTOR BAGIAN INDUK
              </Label>
              <select
                id="editDepartment"
                value={editDepartmentId}
                onChange={(e) => setEditDepartmentId(e.target.value)}
                disabled={isPending}
                required
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="" disabled>-- Pilih Bagian Induk --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Edit Field 4: Status Keaktifan */}
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
                Stasiun aktif dan operasional
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
      <Dialog open={!!deletingStation} onOpenChange={(open) => !open && setDeletingStation(null)}>
        <DialogContent onClose={() => setDeletingStation(null)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Data Stasiun
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data stasiun ini dari master database?
            </DialogDescription>
          </DialogHeader>

          {deletingStation && (
            <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
              <div>
                <strong>Kode Stasiun:</strong> <span className="font-mono font-bold">{deletingStation.code}</span>
              </div>
              <div>
                <strong>Nama Stasiun:</strong> {deletingStation.name}
              </div>
              <div>
                <strong>Bagian Induk:</strong> {deletingStation.departmentName}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingStation(null)}
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
                  Ya, Hapus Stasiun
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
