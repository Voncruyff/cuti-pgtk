"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  UserCog,
  UserPlus,
  Search,
  ShieldCheck,
  Building2,
  Lock,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  X,
  KeyRound,
  Eye,
  EyeOff,
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
  getUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/actions/user-actions";

interface UserItem {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN_UTAMA" | "ADMIN_BAGIAN";
  department: string | null;
  isActive: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const DEPARTMENTS = [
  { code: "PIMPINAN", name: "Pimpinan" },
  { code: "TUK", name: "Tata Usaha & Keuangan (TUK)" },
  { code: "TAN", name: "Tanaman (TAN)" },
  { code: "TEK", name: "Teknik (TEK)" },
  { code: "PAB", name: "Pabrikasi (PAB)" },
];

export default function UsersPage() {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN_UTAMA" | "ADMIN_BAGIAN">("ADMIN_BAGIAN");
  const [department, setDepartment] = useState("TUK");
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN_UTAMA" | "ADMIN_BAGIAN">("ADMIN_BAGIAN");
  const [editDepartment, setEditDepartment] = useState("TUK");
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  // Load Data
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getUsersAction();
      if (res.success && res.data) {
        setUsers(res.data as UserItem[]);
      } else {
        toast.error(res.message || "Gagal memuat data pengguna.");
      }
    } catch (err) {
      console.error("Load users error:", err);
      toast.error("Terjadi kesalahan saat memuat data pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered List (READ)
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    const matchesDept =
      deptFilter === "ALL" ||
      (u.role === "ADMIN_UTAMA" && deptFilter === "ALL") ||
      u.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  // Handle CREATE (C)
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !fullName.trim() || !password.trim()) {
      toast.error("Username, Nama Lengkap, dan Password wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createUserAction({
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        password: password.trim(),
        role,
        department: role === "ADMIN_UTAMA" ? "ALL" : department,
        isActive,
      });

      if (res.success) {
        toast.success(res.message || "User baru berhasil ditambahkan!");
        setIsAddModalOpen(false);

        // Reset
        setUsername("");
        setFullName("");
        setPassword("");
        setRole("ADMIN_BAGIAN");
        setDepartment("TUK");
        setIsActive(true);
        setShowPassword(false);

        loadUsers();
      } else {
        toast.error(res.message || "Gagal menambahkan user baru.");
      }
    });
  };

  // Open EDIT Modal (U)
  const handleOpenEditModal = (u: UserItem) => {
    setEditingUserId(u.id);
    setEditUsername(u.username);
    setEditFullName(u.fullName);
    setEditPassword("");
    setEditRole(u.role);
    setEditDepartment(u.department || "TUK");
    setEditIsActive(u.isActive);
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  // Handle UPDATE (U)
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUserId) return;
    if (!editUsername.trim() || !editFullName.trim()) {
      toast.error("Username dan Nama Lengkap wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await updateUserAction(editingUserId, {
        username: editUsername.trim().toLowerCase(),
        fullName: editFullName.trim(),
        password: editPassword.trim() ? editPassword.trim() : undefined,
        role: editRole,
        department: editRole === "ADMIN_UTAMA" ? "ALL" : editDepartment,
        isActive: editIsActive,
      });

      if (res.success) {
        toast.success(res.message || "Data user berhasil diperbarui!");
        setIsEditModalOpen(false);
        setEditingUserId(null);
        loadUsers();
      } else {
        toast.error(res.message || "Gagal memperbarui data user.");
      }
    });
  };

  // Handle DELETE (D)
  const handleConfirmDelete = () => {
    if (!deletingUser) return;

    startTransition(async () => {
      const res = await deleteUserAction(deletingUser.id);
      if (res.success) {
        toast.success(res.message || "User berhasil dihapus.");
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setDeletingUser(null);
      } else {
        toast.error(res.message || "Gagal menghapus user.");
      }
    });
  };

  // Format Date
  const formatDateTime = (val: Date | string | null) => {
    if (!val) return "Belum Pernah";
    const d = new Date(val);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  const totalAdminUtama = users.filter((u) => u.role === "ADMIN_UTAMA").length;
  const totalAdminBagian = users.filter((u) => u.role === "ADMIN_BAGIAN").length;
  const totalActive = users.filter((u) => u.isActive).length;

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
              <UserCog className="h-6 w-6 text-blue-600" />
              Kelola Pengguna (User)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-2 sm:pl-0">
            Manajemen akun operator aplikasi cuti PG Trangkil (Admin Utama & Admin Bagian) dengan fitur CRUD lengkap.
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
            + Tambah User Baru
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Total User</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                {users.length} akun
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <UserCog className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Admin Utama (ALL)</p>
              <p className="text-xl font-bold text-blue-700 mt-0.5 tabular-nums">
                {totalAdminUtama} akun
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Admin Bagian</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">
                {totalAdminBagian} akun
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              <Building2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500">User Aktif</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5 tabular-nums">
                {totalActive} akun
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card (READ) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-blue-600" />
              Tabel Data Pengguna (Users)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Daftar akun login dan hak akses operator sistem cuti PG Trangkil
            </CardDescription>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari username / nama..."
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Role</option>
              <option value="ADMIN_UTAMA">Admin Utama</option>
              <option value="ADMIN_BAGIAN">Admin Bagian</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Bagian</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Memuat data pengguna dari database...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <UserCog className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {users.length === 0 ? "Belum Ada Pengguna" : "Tidak Ada Data yang Sesuai"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {users.length === 0
                  ? "Klik tombol '+ Tambah User Baru' untuk mulai membuat akun pengguna."
                  : `Tidak ditemukan akun dengan kata kunci "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 text-[11px]">
                  <TableHead className="w-40 font-bold">USERNAME</TableHead>
                  <TableHead className="font-bold">NAMA LENGKAP</TableHead>
                  <TableHead className="font-bold">ROLE</TableHead>
                  <TableHead className="font-bold">BAGIAN / AKSES</TableHead>
                  <TableHead className="font-bold">STATUS</TableHead>
                  <TableHead className="font-bold">LOGIN TERAKHIR</TableHead>
                  <TableHead className="text-right font-bold w-28">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* 1. Username */}
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      {u.username}
                    </TableCell>

                    {/* 2. Nama Lengkap */}
                    <TableCell className="text-xs font-medium text-slate-900">
                      {u.fullName}
                    </TableCell>

                    {/* 3. Role */}
                    <TableCell>
                      {u.role === "ADMIN_UTAMA" ? (
                        <Badge className="bg-blue-600 text-white font-medium hover:bg-blue-700">
                          Admin Utama
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-700">
                          Admin Bagian
                        </Badge>
                      )}
                    </TableCell>

                    {/* 4. Bagian */}
                    <TableCell>
                      {u.role === "ADMIN_UTAMA" ? (
                        <Badge variant="outline" className="font-mono text-[11px] bg-blue-50 text-blue-700 border-blue-200">
                          Semua Bagian (ALL)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-semibold text-[11px] bg-slate-50 text-slate-800 border-slate-200">
                          {u.department || "-"}
                        </Badge>
                      )}
                    </TableCell>

                    {/* 5. Status */}
                    <TableCell>
                      {u.isActive ? (
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

                    {/* 6. Login Terakhir */}
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDateTime(u.lastLoginAt)}
                    </TableCell>

                    {/* 7. AKSI: Edit (U) & Delete (D) */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit / Ubah Data User"
                          onClick={() => handleOpenEditModal(u)}
                          className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          title="Hapus Akun User"
                          onClick={() => setDeletingUser(u)}
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

      {/* MODAL CREATE (C): Tambah User Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent onClose={() => setIsAddModalOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Tambah Akun Pengguna Baru
            </DialogTitle>
            <DialogDescription>
              Buat akun operator baru untuk mengakses sistem cuti PG Trangkil.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            {/* Username & Full Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="createUsername" required className="text-xs">
                  USERNAME
                </Label>
                <Input
                  id="createUsername"
                  type="text"
                  placeholder="Contoh: admin_tan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  disabled={isPending}
                  required
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="createFullName" required className="text-xs">
                  NAMA LENGKAP
                </Label>
                <Input
                  id="createFullName"
                  type="text"
                  placeholder="Contoh: Operator Bagian Tanaman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="createPassword" required className="text-xs">
                PASSWORD LOGIN
              </Label>
              <div className="relative">
                <Input
                  id="createPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role & Bagian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="createRole" required className="text-xs">
                  ROLE / PERAN
                </Label>
                <select
                  id="createRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN_UTAMA" | "ADMIN_BAGIAN")}
                  disabled={isPending}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ADMIN_BAGIAN">Admin Bagian (Unit Kerja)</option>
                  <option value="ADMIN_UTAMA">Admin Utama (Akses Penuh)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="createDept" required className="text-xs">
                  BAGIAN
                </Label>
                <select
                  id="createDept"
                  value={role === "ADMIN_UTAMA" ? "ALL" : department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={isPending || role === "ADMIN_UTAMA"}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {role === "ADMIN_UTAMA" ? (
                    <option value="ALL">Semua Bagian (ALL)</option>
                  ) : (
                    DEPARTMENTS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Status Aktif Switch */}
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
                Akun langsung aktif dan dapat login
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
                    Simpan User Baru
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL UPDATE (U): Edit User */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent onClose={() => setIsEditModalOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Pencil className="h-5 w-5 text-amber-600" />
              Edit / Ubah Data Pengguna
            </DialogTitle>
            <DialogDescription>
              Perbarui profil akun, hak akses role/bagian, atau ganti password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 pt-2">
            {/* Username & Full Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editUsername" required className="text-xs">
                  USERNAME
                </Label>
                <Input
                  id="editUsername"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                  disabled={isPending}
                  required
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="editFullName" required className="text-xs">
                  NAMA LENGKAP
                </Label>
                <Input
                  id="editFullName"
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Reset Password (Opsional) */}
            <div className="space-y-1 border border-slate-200 bg-slate-50/70 rounded-md p-2.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 mb-1">
                <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                Ganti Password Baru <span className="text-[10px] text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
              </div>
              <div className="relative">
                <Input
                  id="editPassword"
                  type={showEditPassword ? "text" : "password"}
                  placeholder="Masukkan password baru (minimal 6 karakter)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={isPending}
                  className="h-8 text-xs bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showEditPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Role & Bagian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editRole" required className="text-xs">
                  ROLE / PERAN
                </Label>
                <select
                  id="editRole"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as "ADMIN_UTAMA" | "ADMIN_BAGIAN")}
                  disabled={isPending}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ADMIN_BAGIAN">Admin Bagian (Unit Kerja)</option>
                  <option value="ADMIN_UTAMA">Admin Utama (Akses Penuh)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editDept" required className="text-xs">
                  BAGIAN
                </Label>
                <select
                  id="editDept"
                  value={editRole === "ADMIN_UTAMA" ? "ALL" : editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  disabled={isPending || editRole === "ADMIN_UTAMA"}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {editRole === "ADMIN_UTAMA" ? (
                    <option value="ALL">Semua Bagian (ALL)</option>
                  ) : (
                    DEPARTMENTS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Status Aktif Switch */}
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
                Akun aktif dan diizinkan login ke sistem
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
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent onClose={() => setDeletingUser(null)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Akun Pengguna
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun ini? Pengguna tidak akan dapat lagi masuk ke sistem.
            </DialogDescription>
          </DialogHeader>

          {deletingUser && (
            <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
              <div>
                <strong>Username:</strong> <span className="font-mono">{deletingUser.username}</span>
              </div>
              <div>
                <strong>Nama:</strong> {deletingUser.fullName}
              </div>
              <div>
                <strong>Role:</strong> {deletingUser.role} ({deletingUser.department || "ALL"})
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingUser(null)}
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
                  Ya, Hapus Akun
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
