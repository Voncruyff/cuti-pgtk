"use client";

import {
  Factory as FactoryIcon,
  PlusCircle,
  Search,
  CheckCircle2,
  Pencil,
  Trash2,
  Loader2,
  X,
  Building2,
  RefreshCw,
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
import type { StationItem } from "@/actions/aksi-stasiun";

export interface PilihanBagianStasiun {
  id: string;
  code: string;
  name: string;
}

function getWarnaBadgeBagian(code: string) {
  const c = code.toUpperCase();
  if (c === "TUK") return "bg-blue-50 text-blue-700 border-blue-200";
  if (c === "TEK" || c.includes("TEK")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (c === "PAB" || c.includes("PAB")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (c === "TAN" || c.includes("TAN")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

// ==================== TABEL STASIUN ====================

interface PropsTabelStasiun {
  stasiun: StationItem[];
  bagian: PilihanBagianStasiun[];
  isLoading: boolean;
  isPending: boolean;
  searchQuery: string;
  filterBagian: string;
  onUbahSearch: (val: string) => void;
  onUbahFilterBagian: (val: string) => void;
  onMuatUlang: () => void;
  onTambah: () => void;
  onEdit: (s: StationItem) => void;
  onHapus: (s: StationItem) => void;
}

export function TabelStasiun({
  stasiun,
  bagian,
  isLoading,
  isPending,
  searchQuery,
  filterBagian,
  onUbahSearch,
  onUbahFilterBagian,
  onMuatUlang,
  onTambah,
  onEdit,
  onHapus,
}: PropsTabelStasiun) {
  const stasiunFiltered = stasiun.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const cocokSearch =
      q === "" ||
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.departmentName.toLowerCase().includes(q);
    const cocokBagian = filterBagian === "ALL" || s.departmentId === filterBagian;
    return cocokSearch && cocokBagian;
  });

  const totalAktif = stasiun.filter((s) => s.isActive).length;

  const formatTanggal = (val: Date | string) => {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(val));
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 border-b border-slate-200/80 pb-3">
        <Button onClick={onTambah} size="default" className="font-semibold shadow-xs self-start sm:self-center">
          <PlusCircle className="h-4 w-4" />
          Tambah Stasiun
        </Button>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard title="Total Master Stasiun" value={isLoading ? "..." : `${stasiun.length} Stasiun`} subtitle="Titik operasional" icon={FactoryIcon} variant="sky" />
        <StatCard title="Stasiun Aktif" value={isLoading ? "..." : `${totalAktif} Aktif`} subtitle="Status operasional" icon={CheckCircle2} variant="emerald" />
        <StatCard title="Bagian Induk" value={isLoading ? "..." : `${bagian.length} Bagian`} subtitle="Unit kerja penaung" icon={Building2} variant="purple" />
      </div>

      {/* Tabel Utama */}
      <Card className="border-slate-200/90 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100/90 bg-gradient-to-r from-sky-50/50 via-slate-50/30 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FactoryIcon className="h-4 w-4 text-[#0084c7]" />
              Tabel Master Stasiun PG Trangkil
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Total {stasiunFiltered.length} dari {stasiun.length} stasiun terdata di sistem</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input type="text" placeholder="Cari kode / nama stasiun..." value={searchQuery} onChange={(e) => onUbahSearch(e.target.value)} className="pl-8 pr-8 h-8.5 text-xs bg-white rounded-full focus-visible:ring-[#0084c7]" />
              {searchQuery && (
                <button type="button" onClick={() => onUbahSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select
              value={filterBagian}
              onChange={(e) => onUbahFilterBagian(e.target.value)}
              className="h-8.5 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 font-medium focus:border-[#0084c7] focus:outline-none"
            >
              <option value="ALL">Semua Bagian</option>
              {bagian.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={onMuatUlang} disabled={isLoading} title="Muat ulang data" className="h-8 w-8 p-0 text-slate-500">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4 select-none">
              <div className="flex items-center justify-center p-4 gap-3 text-xs font-semibold text-sky-800 bg-sky-50/70 rounded-xl border border-sky-100/90 shadow-2xs">
                <Loader2 className="h-4 w-4 animate-spin text-[#0084c7]" />
                <span>Sedang mengambil dan menyinkronkan data master stasiun...</span>
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-8 bg-slate-200/80 rounded" />
                      <div className="h-6 w-24 bg-sky-100/70 rounded-full" />
                      <div className="h-4 w-40 bg-slate-200 rounded" />
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="h-5 w-28 bg-slate-100 rounded-full" />
                      <div className="h-5 w-24 bg-slate-100 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                      <div className="h-7 w-7 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : stasiunFiltered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3"><FactoryIcon className="h-6 w-6" /></div>
              <h3 className="text-sm font-semibold text-slate-800">{stasiun.length === 0 ? "Belum Ada Data Stasiun" : "Tidak Ada Data yang Sesuai"}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {stasiun.length === 0 ? "Klik '+ Tambah Stasiun' untuk menambahkan master stasiun pertama." : `Tidak ditemukan stasiun dengan kata kunci "${searchQuery}".`}
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
                  {stasiunFiltered.map((s, index) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-center text-xs font-medium text-slate-400 font-mono">{index + 1}</TableCell>
                      <TableCell><Badge variant="code" className="text-xs px-2.5 py-0.5">{s.code}</Badge></TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-bold border ${getWarnaBadgeBagian(s.departmentCode)}`} title={s.departmentName}>
                          <Building2 className="h-3 w-3 mr-1 opacity-70" />
                          {s.departmentCode || s.departmentName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">{formatTanggal(s.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" title="Edit Data Stasiun" onClick={() => onEdit(s)} className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Hapus Stasiun" onClick={() => onHapus(s)} disabled={isPending} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700">
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
    </div>
  );
}

// ==================== MODAL TAMBAH ====================

interface PropsModalTambahStasiun {
  terbuka: boolean;
  isPending: boolean;
  bagian: PilihanBagianStasiun[];
  kode: string;
  nama: string;
  bagianId: string;
  aktif: boolean;
  onUbahKode: (val: string) => void;
  onUbahNama: (val: string) => void;
  onUbahBagianId: (val: string) => void;
  onUbahAktif: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

export function ModalTambahStasiun({
  terbuka,
  isPending,
  bagian,
  kode,
  nama,
  bagianId,
  aktif,
  onUbahKode,
  onUbahNama,
  onUbahBagianId,
  onUbahAktif,
  onSubmit,
  onTutup,
}: PropsModalTambahStasiun) {
  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FactoryIcon className="h-5 w-5 text-blue-600" />
            Tambah Master Stasiun Baru
          </DialogTitle>
          <DialogDescription>Masukkan Kode Stasiun dan Nama Stasiun lalu pilih Bagian induknya.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="tambah-kode-stasiun" required className="text-xs font-medium text-slate-700">Kode Stasiun</Label>
            <Input id="tambah-kode-stasiun" type="text" placeholder="Contoh: 14000" value={kode} onChange={(e) => onUbahKode(e.target.value.toUpperCase())} disabled={isPending} required className="h-9 text-xs font-mono" />
            <p className="text-[10px] text-slate-400">Kode identifikasi stasiun kerja PG Trangkil.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="tambah-nama-stasiun" required className="text-xs font-medium text-slate-700">Nama Stasiun</Label>
            <Input id="tambah-nama-stasiun" type="text" placeholder="Contoh: Gilingan" value={nama} onChange={(e) => onUbahNama(e.target.value.toUpperCase())} disabled={isPending} required className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tambah-bagian-stasiun" required className="text-xs font-medium text-slate-700">Bagian Induk</Label>
            <select id="tambah-bagian-stasiun" value={bagianId} onChange={(e) => onUbahBagianId(e.target.value)} disabled={isPending} required className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none">
              <option value="" disabled>-- Pilih Bagian Induk --</option>
              {bagian.map((d) => (<option key={d.id} value={d.id}>{d.code} - {d.name}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="tambah-aktif-stasiun" checked={aktif} onChange={(e) => onUbahAktif(e.target.checked)} disabled={isPending} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
            <Label htmlFor="tambah-aktif-stasiun" className="text-xs font-normal cursor-pointer text-slate-700">Stasiun aktif dan operasional</Label>
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onTutup} disabled={isPending}>Batal</Button>
            <Button type="submit" disabled={isPending} className="font-semibold gap-1.5">
              {isPending ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Menyimpan...</>) : (<><CheckCircle2 className="h-3.5 w-3.5" />Simpan Stasiun Baru</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MODAL EDIT ====================

interface PropsModalEditStasiun {
  terbuka: boolean;
  isPending: boolean;
  bagian: PilihanBagianStasiun[];
  kode: string;
  nama: string;
  bagianId: string;
  aktif: boolean;
  onUbahKode: (val: string) => void;
  onUbahNama: (val: string) => void;
  onUbahBagianId: (val: string) => void;
  onUbahAktif: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

export function ModalEditStasiun({
  terbuka,
  isPending,
  bagian,
  kode,
  nama,
  bagianId,
  aktif,
  onUbahKode,
  onUbahNama,
  onUbahBagianId,
  onUbahAktif,
  onSubmit,
  onTutup,
}: PropsModalEditStasiun) {
  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900"><Pencil className="h-5 w-5 text-amber-600" />Edit Data Stasiun</DialogTitle>
          <DialogDescription>Perbarui kode stasiun, nama stasiun, Bagian induk, atau status keaktifan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-kode-stasiun" required className="text-xs font-medium text-slate-700">Kode Stasiun</Label>
            <Input id="edit-kode-stasiun" type="text" value={kode} onChange={(e) => onUbahKode(e.target.value.toUpperCase())} disabled={isPending} required className="h-9 text-xs font-mono" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-nama-stasiun" required className="text-xs font-medium text-slate-700">Nama Stasiun</Label>
            <Input id="edit-nama-stasiun" type="text" value={nama} onChange={(e) => onUbahNama(e.target.value.toUpperCase())} disabled={isPending} required className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-bagian-stasiun" required className="text-xs font-medium text-slate-700">Bagian Induk</Label>
            <select id="edit-bagian-stasiun" value={bagianId} onChange={(e) => onUbahBagianId(e.target.value)} disabled={isPending} required className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none">
              <option value="" disabled>-- Pilih Bagian Induk --</option>
              {bagian.map((d) => (<option key={d.id} value={d.id}>{d.code} - {d.name}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="edit-aktif-stasiun" checked={aktif} onChange={(e) => onUbahAktif(e.target.checked)} disabled={isPending} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
            <Label htmlFor="edit-aktif-stasiun" className="text-xs font-normal cursor-pointer text-slate-700">Stasiun aktif dan operasional</Label>
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onTutup} disabled={isPending}>Batal</Button>
            <Button type="submit" disabled={isPending} className="font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
              {isPending ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Memperbarui...</>) : (<><CheckCircle2 className="h-3.5 w-3.5" />Simpan Perubahan</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MODAL HAPUS ====================

interface PropsModalHapusStasiun {
  stasiun: StationItem | null;
  isPending: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export function ModalHapusStasiun({ stasiun, isPending, onKonfirmasi, onBatal }: PropsModalHapusStasiun) {
  return (
    <Dialog open={!!stasiun} onOpenChange={(open) => !open && onBatal()}>
      <DialogContent onClose={onBatal} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600"><Trash2 className="h-5 w-5" />Hapus Data Stasiun</DialogTitle>
          <DialogDescription>Apakah Anda yakin ingin menghapus data stasiun ini dari master database?</DialogDescription>
        </DialogHeader>
        {stasiun && (
          <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
            <div><strong>Kode Stasiun:</strong> <span className="font-mono font-bold">{stasiun.code}</span></div>
            <div><strong>Nama Stasiun:</strong> {stasiun.name}</div>
            <div><strong>Bagian Induk:</strong> {stasiun.departmentName}</div>
          </div>
        )}
        <DialogFooter className="gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onBatal} disabled={isPending}>Batal</Button>
          <Button type="button" onClick={onKonfirmasi} disabled={isPending} variant="destructive" className="gap-1.5">
            {isPending ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Menghapus...</>) : (<><Trash2 className="h-3.5 w-3.5" />Ya, Hapus Stasiun</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
