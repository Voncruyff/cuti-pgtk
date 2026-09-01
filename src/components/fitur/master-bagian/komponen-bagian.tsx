"use client";

import {
  Building2,
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  X,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/bersama/kartu-statistik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

export interface ItemBagian {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PropsTabelBagian {
  bagian: ItemBagian[];
  isLoading: boolean;
  isPending: boolean;
  searchQuery: string;
  onUbahSearch: (val: string) => void;
  onTambah: () => void;
  onEdit: (item: ItemBagian) => void;
  onHapus: (item: ItemBagian) => void;
}

export function TabelBagian({
  bagian, isLoading, isPending, searchQuery,
  onUbahSearch, onTambah, onEdit, onHapus,
}: PropsTabelBagian) {
  const bagianFiltered = bagian.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    return q === "" || d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q);
  });

  const totalAktif = bagian.filter((d) => d.isActive).length;

  const formatTanggal = (val: Date | string) => {
    const d = new Date(val);
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d);
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div />
        <Button onClick={onTambah} size="default" className="font-semibold shadow-xs self-start sm:self-center">
          <PlusCircle className="h-4 w-4" />
          Tambah Bagian
        </Button>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard title="Total Master Bagian" value={`${bagian.length} Bagian`} subtitle="Unit terdaftar" icon={Building2} variant="sky" />
        <StatCard title="Bagian Aktif" value={`${totalAktif} Bagian`} subtitle="Status operasional" icon={CheckCircle2} variant="emerald" />
        <StatCard title="Unit Kerja" value="PG Trangkil" subtitle="Pati, Jawa Tengah" icon={Building2} variant="purple" />
        <StatCard title="Sinkronisasi DB" value="Tersinkron" subtitle="Database MySQL" icon={Layers} variant="slate" />
      </div>

      {/* Tabel Utama */}
      <Card className="border-slate-200/90 shadow-xs">
        <CardHeader className="py-3.5 border-b border-slate-100/90 bg-gradient-to-r from-sky-50/50 via-slate-50/30 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#0084c7]" />
              Tabel Master Bagian PG Trangkil
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Daftar unit kerja operasional resmi PG Trangkil</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input type="text" placeholder="Cari kode / nama bagian..." value={searchQuery} onChange={(e) => onUbahSearch(e.target.value)} className="pl-8 pr-8 h-8.5 text-xs bg-white rounded-full focus-visible:ring-[#0084c7]" />
            {searchQuery && (
              <button type="button" onClick={() => onUbahSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#0084c7]" />
              Memuat data bagian dari database...
            </div>
          ) : bagianFiltered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {bagian.length === 0 ? "Belum Ada Bagian" : "Tidak Ada Data yang Sesuai"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {bagian.length === 0
                  ? "Klik '+ Tambah Bagian' untuk mulai menambahkan master bagian."
                  : `Tidak ditemukan bagian dengan kata kunci "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 text-[11px]">
                  <TableHead className="w-32 font-bold">KODE BAGIAN</TableHead>
                  <TableHead className="font-bold">NAMA BAGIAN / UNIT KERJA</TableHead>
                  <TableHead className="font-bold w-44">TANGGAL DIBUAT</TableHead>
                  <TableHead className="text-right font-bold w-24">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bagianFiltered.map((d) => (
                  <TableRow key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell><Badge variant="code" className="text-xs px-2.5 py-0.5">{d.code}</Badge></TableCell>
                    <TableCell className="text-xs font-bold text-slate-900">{d.name}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{formatTanggal(d.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Edit Bagian" onClick={() => onEdit(d)} className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Hapus Bagian" onClick={() => onHapus(d)} disabled={isPending} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700">
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

      {/* Modal bawaan di-render dari parent */}
    </div>
  );
}

// ==================== MODAL TAMBAH ====================

interface PropsModalTambahBagian {
  terbuka: boolean;
  isPending: boolean;
  kode: string;
  nama: string;
  aktif: boolean;
  onUbahKode: (val: string) => void;
  onUbahNama: (val: string) => void;
  onUbahAktif: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

export function ModalTambahBagian({ terbuka, isPending, kode, nama, aktif, onUbahKode, onUbahNama, onUbahAktif, onSubmit, onTutup }: PropsModalTambahBagian) {
  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-blue-600" />
            Tambah Master Bagian Baru
          </DialogTitle>
          <DialogDescription>Tambahkan data bagian atau unit kerja baru ke database PG Trangkil.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="tambah-kode-bagian" required className="text-xs font-medium text-slate-700">Kode Bagian</Label>
            <Input id="tambah-kode-bagian" type="text" placeholder="Contoh: SDM" value={kode} onChange={(e) => onUbahKode(e.target.value.toUpperCase())} disabled={isPending} required className="h-9 text-xs font-mono" />
            <p className="text-[10px] text-slate-400">Singkatan huruf kapital (contoh: PIMPINAN, TUK, TAN, TEK, PAB).</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="tambah-nama-bagian" required className="text-xs font-medium text-slate-700">Nama Bagian / Unit Kerja</Label>
            <Input id="tambah-nama-bagian" type="text" placeholder="Contoh: Sumber Daya Manusia (SDM)" value={nama} onChange={(e) => onUbahNama(e.target.value)} disabled={isPending} required className="h-9 text-xs" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="tambah-aktif-bagian" checked={aktif} onChange={(e) => onUbahAktif(e.target.checked)} disabled={isPending} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
            <Label htmlFor="tambah-aktif-bagian" className="text-xs font-normal cursor-pointer text-slate-700">Bagian aktif dan dapat dipilih saat input data karyawan</Label>
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onTutup} disabled={isPending}>Batal</Button>
            <Button type="submit" disabled={isPending} className="font-semibold gap-1.5">
              {isPending ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Menyimpan...</>) : (<><CheckCircle2 className="h-3.5 w-3.5" />Simpan Bagian Baru</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MODAL EDIT ====================

interface PropsModalEditBagian {
  terbuka: boolean;
  isPending: boolean;
  kode: string;
  nama: string;
  aktif: boolean;
  onUbahKode: (val: string) => void;
  onUbahNama: (val: string) => void;
  onUbahAktif: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

export function ModalEditBagian({ terbuka, isPending, kode, nama, aktif, onUbahKode, onUbahNama, onUbahAktif, onSubmit, onTutup }: PropsModalEditBagian) {
  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Pencil className="h-5 w-5 text-amber-600" />
            Edit / Ubah Data Bagian
          </DialogTitle>
          <DialogDescription>Perbarui kode singkatan, nama bagian, atau status keaktifan.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-kode-bagian" required className="text-xs font-medium text-slate-700">Kode Bagian</Label>
            <Input id="edit-kode-bagian" type="text" value={kode} onChange={(e) => onUbahKode(e.target.value.toUpperCase())} disabled={isPending} required className="h-9 text-xs font-mono" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-nama-bagian" required className="text-xs font-medium text-slate-700">Nama Bagian / Unit Kerja</Label>
            <Input id="edit-nama-bagian" type="text" value={nama} onChange={(e) => onUbahNama(e.target.value)} disabled={isPending} required className="h-9 text-xs" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="edit-aktif-bagian" checked={aktif} onChange={(e) => onUbahAktif(e.target.checked)} disabled={isPending} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
            <Label htmlFor="edit-aktif-bagian" className="text-xs font-normal cursor-pointer text-slate-700">Bagian aktif dan dapat dipilih</Label>
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

interface PropsModalHapusBagian {
  bagian: ItemBagian | null;
  isPending: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export function ModalHapusBagian({ bagian, isPending, onKonfirmasi, onBatal }: PropsModalHapusBagian) {
  return (
    <Dialog open={!!bagian} onOpenChange={(open) => !open && onBatal()}>
      <DialogContent onClose={onBatal} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
            <Trash2 className="h-5 w-5" />
            Hapus Data Bagian
          </DialogTitle>
          <DialogDescription>Apakah Anda yakin ingin menghapus bagian ini dari master database?</DialogDescription>
        </DialogHeader>

        {bagian && (
          <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
            <div><strong>Kode Bagian:</strong> <span className="font-mono">{bagian.code}</span></div>
            <div><strong>Nama Bagian:</strong> {bagian.name}</div>
            <div><strong>Jumlah Karyawan:</strong> {bagian.employeeCount} orang</div>
            {bagian.employeeCount > 0 && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Peringatan:</strong> Bagian ini memiliki {bagian.employeeCount} karyawan terdaftar dan tidak dapat dihapus sebelum karyawan dipindahkan ke bagian lain.</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onBatal} disabled={isPending}>Batal</Button>
          <Button type="button" onClick={onKonfirmasi} disabled={isPending || (bagian ? bagian.employeeCount > 0 : false)} variant="destructive" className="gap-1.5">
            {isPending ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Menghapus...</>) : (<><Trash2 className="h-3.5 w-3.5" />Ya, Hapus Bagian</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
