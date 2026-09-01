"use client";

import {
  UserCog,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Search,
  X,
  Ban,
  Pencil,
  Trash2,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/bersama/kartu-statistik";
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
import { formatSingkatanBagian } from "@/lib/utils";

export interface ItemPengguna {
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

export interface PilihanBagianPengguna {
  id: string;
  code: string;
  name: string;
}

// ==================== TABEL PENGGUNA ====================

interface PropsTabelPengguna {
  pengguna: ItemPengguna[];
  bagian: PilihanBagianPengguna[];
  isLoading: boolean;
  isPending: boolean;
  searchQuery: string;
  filterRole: string;
  filterBagian: string;
  onUbahSearch: (val: string) => void;
  onUbahFilterRole: (val: string) => void;
  onUbahFilterBagian: (val: string) => void;
  onTambah: () => void;
  onEdit: (u: ItemPengguna) => void;
  onHapus: (u: ItemPengguna) => void;
  onToggleBlokir: (u: ItemPengguna) => void;
}

export function TabelPengguna({
  pengguna,
  bagian,
  isLoading,
  isPending,
  searchQuery,
  filterRole,
  filterBagian,
  onUbahSearch,
  onUbahFilterRole,
  onUbahFilterBagian,
  onTambah,
  onEdit,
  onHapus,
  onToggleBlokir,
}: PropsTabelPengguna) {
  const filteredUsers = pengguna.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q));

    const matchesRole = filterRole === "ALL" || u.role === filterRole;

    const matchesDept =
      filterBagian === "ALL" ||
      (u.role === "ADMIN_UTAMA" && filterBagian === "ALL") ||
      u.department === filterBagian;

    return matchesSearch && matchesRole && matchesDept;
  });

  const totalAdminUtama = pengguna.filter((u) => u.role === "ADMIN_UTAMA").length;
  const totalAdminBagian = pengguna.filter((u) => u.role === "ADMIN_BAGIAN").length;
  const totalActive = pengguna.filter((u) => u.isActive).length;

  const formatDateTime = (val: Date | string | null) => {
    if (!val) return "Belum Pernah";
    const d = new Date(val);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kelola Pengguna Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar akun operator aplikasi cuti PG Trangkil (Admin Utama & Admin Bagian)
          </p>
        </div>

        <Button
          onClick={onTambah}
          size="default"
          className="font-semibold shadow-xs self-start sm:self-center"
        >
          <UserPlus className="h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Pengguna"
          value={`${pengguna.length} Akun`}
          subtitle="Akun terdaftar"
          icon={UserCog}
          variant="sky"
        />

        <StatCard
          title="Admin Utama"
          value={`${totalAdminUtama} Akun`}
          subtitle="Hak akses penuh"
          icon={ShieldCheck}
          variant="indigo"
        />

        <StatCard
          title="Admin Bagian"
          value={`${totalAdminBagian} Akun`}
          subtitle="Hak akses bagian"
          icon={Building2}
          variant="purple"
        />

        <StatCard
          title="User Aktif"
          value={`${totalActive} Akun`}
          subtitle="Dapat login"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/90 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100/90 bg-gradient-to-r from-sky-50/50 via-slate-50/30 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[#0093dc]" />
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
                onChange={(e) => onUbahSearch(e.target.value)}
                className="pl-8 pr-8 h-8.5 text-xs bg-white rounded-full focus-visible:ring-[#0084c7]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onUbahSearch("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={filterRole}
              onChange={(e) => onUbahFilterRole(e.target.value)}
              className="h-8.5 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 font-medium focus:border-[#0084c7] focus:outline-none"
            >
              <option value="ALL">Semua Role</option>
              <option value="ADMIN_UTAMA">Admin Utama</option>
              <option value="ADMIN_BAGIAN">Admin Bagian</option>
            </select>

            <select
              value={filterBagian}
              onChange={(e) => onUbahFilterBagian(e.target.value)}
              className="h-8.5 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 font-medium focus:border-[#0084c7] focus:outline-none"
            >
              <option value="ALL">Semua Bagian</option>
              {bagian.map((d) => (
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
              <Loader2 className="h-5 w-5 animate-spin text-[#0084c7]" />
              Memuat data pengguna dari database...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Tidak ada data pengguna yang sesuai dengan filter pencarian.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center text-xs font-semibold">NO</TableHead>
                  <TableHead className="text-xs font-semibold">USERNAME</TableHead>
                  <TableHead className="text-xs font-semibold">NAMA LENGKAP</TableHead>
                  <TableHead className="text-xs font-semibold">ROLE / HAK AKSES</TableHead>
                  <TableHead className="text-xs font-semibold">BAGIAN</TableHead>
                  <TableHead className="text-xs font-semibold">STATUS</TableHead>
                  <TableHead className="text-xs font-semibold">LOGIN TERAKHIR</TableHead>
                  <TableHead className="text-right text-xs font-semibold w-28">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u, idx) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-center text-xs text-slate-500 font-mono">
                      {idx + 1}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      <Badge variant="code" className="text-[10px] px-2 py-0.5">
                        @{u.username}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-bold text-slate-900">
                      {u.fullName}
                    </TableCell>

                    <TableCell>
                      {u.role === "ADMIN_UTAMA" ? (
                        <Badge variant="default" className="text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin Utama
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-700 border-slate-300 text-[10px] gap-1">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          Admin Bagian
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-700">
                      {u.role === "ADMIN_UTAMA" ? (
                        <span className="text-slate-400 italic">Semua Bagian (ALL)</span>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-bold" title={u.department || "-"}>
                          {formatSingkatanBagian(u.department)}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {u.isActive ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold gap-1">
                          <Ban className="h-3 w-3 text-red-600" />
                          Diblokir
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDateTime(u.lastLoginAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={u.isActive ? "Blokir / Ban Akun ini" : "Aktifkan Akun kembali (Unban)"}
                          onClick={() => onToggleBlokir(u)}
                          disabled={isPending}
                          className={`h-7 w-7 p-0 ${u.isActive ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700" : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
                        >
                          {u.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit / Ubah Data User"
                          onClick={() => onEdit(u)}
                          className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          title="Hapus Akun User"
                          onClick={() => onHapus(u)}
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
    </div>
  );
}

// ==================== MODAL TAMBAH ====================

interface PropsModalTambahPengguna {
  terbuka: boolean;
  isPending: boolean;
  bagian: PilihanBagianPengguna[];
  username: string;
  fullName: string;
  password: string;
  role: "ADMIN_UTAMA" | "ADMIN_BAGIAN";
  department: string;
  showPassword: boolean;
  onUbahUsername: (val: string) => void;
  onUbahFullName: (val: string) => void;
  onUbahPassword: (val: string) => void;
  onUbahRole: (val: "ADMIN_UTAMA" | "ADMIN_BAGIAN") => void;
  onUbahDepartment: (val: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

export function ModalTambahPengguna({
  terbuka,
  isPending,
  bagian,
  username,
  fullName,
  password,
  role,
  department,
  showPassword,
  onUbahUsername,
  onUbahFullName,
  onUbahPassword,
  onUbahRole,
  onUbahDepartment,
  onToggleShowPassword,
  onSubmit,
  onTutup,
}: PropsModalTambahPengguna) {
  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Tambah Akun Pengguna Baru
          </DialogTitle>
          <DialogDescription>
            Buat akun operator baru untuk mengakses sistem cuti PG Trangkil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="createUsername" required className="text-xs font-medium text-slate-700">
                Username
              </Label>
              <Input
                id="createUsername"
                type="text"
                placeholder="Contoh: admin_tan"
                value={username}
                onChange={(e) => onUbahUsername(e.target.value.toLowerCase())}
                disabled={isPending}
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="createFullName" required className="text-xs font-medium text-slate-700">
                Nama Lengkap
              </Label>
              <Input
                id="createFullName"
                type="text"
                placeholder="Nama lengkap operator"
                value={fullName}
                onChange={(e) => onUbahFullName(e.target.value)}
                disabled={isPending}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="createPassword" required className="text-xs font-medium text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="createPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => onUbahPassword(e.target.value)}
                disabled={isPending}
                required
                className="h-9 text-xs pr-9"
              />
              <button
                type="button"
                onClick={onToggleShowPassword}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="createRole" required className="text-xs font-medium text-slate-700">
                Role / Peran
              </Label>
              <select
                id="createRole"
                value={role}
                onChange={(e) => onUbahRole(e.target.value as "ADMIN_UTAMA" | "ADMIN_BAGIAN")}
                disabled={isPending}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none"
              >
                <option value="ADMIN_BAGIAN">Admin Bagian (Unit Kerja)</option>
                <option value="ADMIN_UTAMA">Admin Utama (Akses Penuh)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="createDept" required className="text-xs font-medium text-slate-700">
                Bagian
              </Label>
              <select
                id="createDept"
                value={role === "ADMIN_UTAMA" ? "ALL" : department}
                onChange={(e) => onUbahDepartment(e.target.value)}
                disabled={isPending || role === "ADMIN_UTAMA"}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                {role === "ADMIN_UTAMA" ? (
                  <option value="ALL">Semua Bagian (ALL)</option>
                ) : (
                  bagian.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onTutup}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="font-semibold gap-1.5"
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
  );
}

// ==================== MODAL EDIT ====================

interface PropsModalEditPengguna {
  terbuka: boolean;
  isPending: boolean;
  bagian: PilihanBagianPengguna[];
  username: string;
  fullName: string;
  password: string;
  role: "ADMIN_UTAMA" | "ADMIN_BAGIAN";
  department: string;
  showPassword: boolean;
  onUbahUsername: (val: string) => void;
  onUbahFullName: (val: string) => void;
  onUbahPassword: (val: string) => void;
  onUbahRole: (val: "ADMIN_UTAMA" | "ADMIN_BAGIAN") => void;
  onUbahDepartment: (val: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

export function ModalEditPengguna({
  terbuka,
  isPending,
  bagian,
  username,
  fullName,
  password,
  role,
  department,
  showPassword,
  onUbahUsername,
  onUbahFullName,
  onUbahPassword,
  onUbahRole,
  onUbahDepartment,
  onToggleShowPassword,
  onSubmit,
  onTutup,
}: PropsModalEditPengguna) {
  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Pencil className="h-5 w-5 text-amber-600" />
            Edit / Ubah Data Pengguna
          </DialogTitle>
          <DialogDescription>
            Perbarui profil akun, hak akses role/bagian, atau ganti password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="editUsername" required className="text-xs font-medium text-slate-700">
                Username
              </Label>
              <Input
                id="editUsername"
                type="text"
                value={username}
                onChange={(e) => onUbahUsername(e.target.value.toLowerCase())}
                disabled={isPending}
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editFullName" required className="text-xs font-medium text-slate-700">
                Nama Lengkap
              </Label>
              <Input
                id="editFullName"
                type="text"
                value={fullName}
                onChange={(e) => onUbahFullName(e.target.value)}
                disabled={isPending}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="editPassword" className="text-xs font-medium text-slate-700">
              Password Baru (Opsional)
            </Label>
            <div className="relative">
              <Input
                id="editPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Kosongkan jika tidak ingin mengubah password"
                value={password}
                onChange={(e) => onUbahPassword(e.target.value)}
                disabled={isPending}
                className="h-9 text-xs pr-9"
              />
              <button
                type="button"
                onClick={onToggleShowPassword}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="editRole" required className="text-xs font-medium text-slate-700">
                Role / Peran
              </Label>
              <select
                id="editRole"
                value={role}
                onChange={(e) => onUbahRole(e.target.value as "ADMIN_UTAMA" | "ADMIN_BAGIAN")}
                disabled={isPending}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none"
              >
                <option value="ADMIN_BAGIAN">Admin Bagian (Unit Kerja)</option>
                <option value="ADMIN_UTAMA">Admin Utama (Akses Penuh)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="editDept" required className="text-xs font-medium text-slate-700">
                Bagian
              </Label>
              <select
                id="editDept"
                value={role === "ADMIN_UTAMA" ? "ALL" : department}
                onChange={(e) => onUbahDepartment(e.target.value)}
                disabled={isPending || role === "ADMIN_UTAMA"}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                {role === "ADMIN_UTAMA" ? (
                  <option value="ALL">Semua Bagian (ALL)</option>
                ) : (
                  bagian.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onTutup}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
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
  );
}

// ==================== MODAL BLOKIR ====================

interface PropsModalBlokirPengguna {
  pengguna: ItemPengguna | null;
  isPending: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export function ModalBlokirPengguna({
  pengguna,
  isPending,
  onKonfirmasi,
  onBatal,
}: PropsModalBlokirPengguna) {
  return (
    <Dialog open={!!pengguna} onOpenChange={(open) => !open && onBatal()}>
      <DialogContent onClose={onBatal} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Ban className={`h-5 w-5 ${pengguna?.isActive ? "text-amber-600" : "text-emerald-600"}`} />
            {pengguna?.isActive ? "Blokir (Ban) Akun Pengguna" : "Buka Blokir (Unban) Akun Pengguna"}
          </DialogTitle>
          <DialogDescription>
            {pengguna?.isActive
              ? "Memblokir akun akan mencegah pengguna ini untuk dapat login ke dalam sistem. Fitur ini khusus wewenang Admin Utama."
              : "Mengaktifkan kembali akun agar pengguna ini diizinkan login ke sistem."}
          </DialogDescription>
        </DialogHeader>

        {pengguna && (
          <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${pengguna.isActive ? "bg-amber-50/80 border-amber-200 text-amber-950" : "bg-emerald-50/80 border-emerald-200 text-emerald-950"}`}>
            <div>
              <strong>Username:</strong> <span className="font-mono">@{pengguna.username}</span>
            </div>
            <div>
              <strong>Nama Lengkap:</strong> {pengguna.fullName}
            </div>
            <div>
              <strong>Role & Bagian:</strong> {pengguna.role === "ADMIN_UTAMA" ? "Admin Utama (ALL)" : `Admin Bagian (${pengguna.department || "-"})`}
            </div>
            <div>
              <strong>Status Saat Ini:</strong>{" "}
              <span className={pengguna.isActive ? "font-bold text-emerald-700" : "font-bold text-red-600"}>
                {pengguna.isActive ? "Aktif" : "Diblokir (Banned)"}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBatal}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onKonfirmasi}
            disabled={isPending}
            className={`gap-1.5 text-white ${pengguna?.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses...
              </>
            ) : pengguna?.isActive ? (
              <>
                <Ban className="h-3.5 w-3.5" />
                Ya, Blokir Akun
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ya, Aktifkan Akun
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MODAL HAPUS ====================

interface PropsModalHapusPengguna {
  pengguna: ItemPengguna | null;
  isPending: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export function ModalHapusPengguna({
  pengguna,
  isPending,
  onKonfirmasi,
  onBatal,
}: PropsModalHapusPengguna) {
  return (
    <Dialog open={!!pengguna} onOpenChange={(open) => !open && onBatal()}>
      <DialogContent onClose={onBatal} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
            <Trash2 className="h-5 w-5" />
            Hapus Akun Pengguna
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen?
          </DialogDescription>
        </DialogHeader>

        {pengguna && (
          <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
            <div>
              <strong>Username:</strong> <span className="font-mono font-bold">@{pengguna.username}</span>
            </div>
            <div>
              <strong>Nama Lengkap:</strong> {pengguna.fullName}
            </div>
            <div>
              <strong>Role & Bagian:</strong> {pengguna.role === "ADMIN_UTAMA" ? "Admin Utama" : `Admin Bagian (${pengguna.department || "-"})`}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBatal}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onKonfirmasi}
            disabled={isPending}
            variant="destructive"
            className="gap-1.5"
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
  );
}
