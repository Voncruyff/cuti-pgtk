"use client";

import { UserPlus, Pencil, Trash2, Loader2, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ItemKaryawan, PilihanBagian, PilihanStasiun } from "./tabel-karyawan";

// ==================== MODAL TAMBAH ====================

interface PropsModalTambahKaryawan {
  terbuka: boolean;
  isPending: boolean;
  bagian: PilihanBagian[];
  stasiun: PilihanStasiun[];
  // Form state
  nip: string;
  nama: string;
  jabatan: string;
  kategori: "PIMPINAN" | "PELAKSANA";
  bagianId: string;
  stasiunId: string;
  tglPengangkatan: string;
  onUbahNip: (val: string) => void;
  onUbahNama: (val: string) => void;
  onUbahJabatan: (val: string) => void;
  onUbahKategori: (val: "PIMPINAN" | "PELAKSANA") => void;
  onUbahBagianId: (val: string) => void;
  onUbahStasiunId: (val: string) => void;
  onUbahTglPengangkatan: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

function getStasiunUntukBagian(stasiun: PilihanStasiun[], bagian: PilihanBagian[], deptId: string) {
  if (!deptId) return stasiun;
  const targetBagian = bagian.find((d) => d.id === deptId || d.name === deptId || d.code === deptId);
  return stasiun.filter(
    (s) =>
      s.departmentId === deptId ||
      (targetBagian && s.departmentName.toLowerCase() === targetBagian.name.toLowerCase())
  );
}

export function ModalTambahKaryawan({
  terbuka, isPending, bagian, stasiun,
  nip, nama, jabatan, kategori, bagianId, stasiunId, tglPengangkatan,
  onUbahNip, onUbahNama, onUbahJabatan, onUbahKategori, onUbahBagianId, onUbahStasiunId, onUbahTglPengangkatan,
  onSubmit, onTutup,
}: PropsModalTambahKaryawan) {
  const stasiunTersedia = getStasiunUntukBagian(stasiun, bagian, bagianId);

  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Tambah Master Karyawan Baru
          </DialogTitle>
          <DialogDescription>
            Lengkapi data karyawan, jenis pimpinan/pelaksana, bagian, dan stasiun kerja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3.5 pt-2">
          {/* Jenis Karyawan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Jenis Karyawan</Label>
            <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-lg border border-slate-200/80 gap-1">
              <button type="button" onClick={() => onUbahKategori("PIMPINAN")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${kategori === "PIMPINAN" ? "bg-white text-[#0084c7] font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}>
                Karyawan Pimpinan
              </button>
              <button type="button" onClick={() => onUbahKategori("PELAKSANA")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${kategori === "PELAKSANA" ? "bg-white text-emerald-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}>
                Karyawan Pelaksana
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tambah-nip" required className="text-xs font-medium text-slate-700">NIP Karyawan</Label>
              <Input id="tambah-nip" type="text" placeholder="Contoh: 1042" value={nip} onChange={(e) => onUbahNip(e.target.value)} required disabled={isPending} className="h-9 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tambah-nama" required className="text-xs font-medium text-slate-700">Nama Lengkap</Label>
              <Input id="tambah-nama" type="text" placeholder="Nama lengkap karyawan" value={nama} onChange={(e) => onUbahNama(e.target.value)} required disabled={isPending} className="h-9 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tambah-jabatan" className="text-xs font-medium text-slate-700">Jabatan</Label>
            <Input id="tambah-jabatan" type="text" placeholder="Contoh: Operator Gilingan" value={jabatan} onChange={(e) => onUbahJabatan(e.target.value)} disabled={isPending} className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tambah-bagian" required className="text-xs font-medium text-slate-700">Bagian Induk</Label>
              <select id="tambah-bagian" value={bagianId} onChange={(e) => { onUbahBagianId(e.target.value); onUbahStasiunId(""); }} required disabled={isPending}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none">
                <option value="" disabled>-- Pilih Bagian --</option>
                {bagian.map((d) => (<option key={d.id} value={d.id}>{d.code} - {d.name}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tambah-stasiun" className="text-xs font-medium text-slate-700">Stasiun Kerja (Opsional)</Label>
              <select id="tambah-stasiun" value={stasiunId} onChange={(e) => onUbahStasiunId(e.target.value)} disabled={isPending}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none">
                <option value="">-- Pilih Stasiun (Opsional) --</option>
                {stasiunTersedia.map((st) => (<option key={st.id} value={st.id}>{st.name} ({st.code})</option>))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tambah-tgl-pengangkatan" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Tanggal Pengangkatan
            </Label>
            <Input id="tambah-tgl-pengangkatan" type="date" value={tglPengangkatan} onChange={(e) => onUbahTglPengangkatan(e.target.value)} disabled={isPending} className="h-9 text-xs" />
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onTutup} disabled={isPending}>Batal</Button>
            <Button type="submit" disabled={isPending} className="font-semibold gap-1.5">
              {isPending ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Menyimpan...</>) : (<><CheckCircle2 className="h-3.5 w-3.5" />Simpan Karyawan Baru</>)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MODAL EDIT ====================

interface PropsModalEditKaryawan {
  terbuka: boolean;
  isPending: boolean;
  bagian: PilihanBagian[];
  stasiun: PilihanStasiun[];
  nip: string;
  nama: string;
  jabatan: string;
  kategori: "PIMPINAN" | "PELAKSANA";
  bagianId: string;
  stasiunId: string;
  tglPengangkatan: string;
  onUbahNip: (val: string) => void;
  onUbahNama: (val: string) => void;
  onUbahJabatan: (val: string) => void;
  onUbahKategori: (val: "PIMPINAN" | "PELAKSANA") => void;
  onUbahBagianId: (val: string) => void;
  onUbahStasiunId: (val: string) => void;
  onUbahTglPengangkatan: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTutup: () => void;
}

export function ModalEditKaryawan({
  terbuka, isPending, bagian, stasiun,
  nip, nama, jabatan, kategori, bagianId, stasiunId, tglPengangkatan,
  onUbahNip, onUbahNama, onUbahJabatan, onUbahKategori, onUbahBagianId, onUbahStasiunId, onUbahTglPengangkatan,
  onSubmit, onTutup,
}: PropsModalEditKaryawan) {
  const stasiunTersedia = getStasiunUntukBagian(stasiun, bagian, bagianId);

  return (
    <Dialog open={terbuka} onOpenChange={onTutup}>
      <DialogContent onClose={onTutup} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Pencil className="h-5 w-5 text-amber-600" />
            Edit Data Karyawan
          </DialogTitle>
          <DialogDescription>
            Perbarui klasifikasi jenis, bagian, stasiun, atau data karyawan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3.5 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Jenis Karyawan</Label>
            <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-lg border border-slate-200/80 gap-1">
              <button type="button" onClick={() => onUbahKategori("PIMPINAN")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${kategori === "PIMPINAN" ? "bg-white text-[#0084c7] font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}>
                Karyawan Pimpinan
              </button>
              <button type="button" onClick={() => onUbahKategori("PELAKSANA")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${kategori === "PELAKSANA" ? "bg-white text-emerald-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}>
                Karyawan Pelaksana
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-nip" required className="text-xs font-medium text-slate-700">NIP Karyawan</Label>
              <Input id="edit-nip" type="text" value={nip} onChange={(e) => onUbahNip(e.target.value)} required disabled={isPending} className="h-9 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-nama" required className="text-xs font-medium text-slate-700">Nama Lengkap</Label>
              <Input id="edit-nama" type="text" value={nama} onChange={(e) => onUbahNama(e.target.value)} required disabled={isPending} className="h-9 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-jabatan" className="text-xs font-medium text-slate-700">Jabatan</Label>
            <Input id="edit-jabatan" type="text" placeholder="Contoh: Operator Gilingan" value={jabatan} onChange={(e) => onUbahJabatan(e.target.value)} disabled={isPending} className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-bagian" required className="text-xs font-medium text-slate-700">Bagian Induk</Label>
              <select id="edit-bagian" value={bagianId} onChange={(e) => { onUbahBagianId(e.target.value); onUbahStasiunId(""); }} required disabled={isPending}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none">
                <option value="" disabled>-- Pilih Bagian --</option>
                {bagian.map((d) => (<option key={d.id} value={d.id}>{d.code} - {d.name}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-stasiun" className="text-xs font-medium text-slate-700">Stasiun Kerja (Opsional)</Label>
              <select id="edit-stasiun" value={stasiunId} onChange={(e) => onUbahStasiunId(e.target.value)} disabled={isPending}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-[#0084c7] focus:outline-none">
                <option value="">-- Pilih Stasiun (Opsional) --</option>
                {stasiunTersedia.map((st) => (<option key={st.id} value={st.id}>{st.name} ({st.code})</option>))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-tgl-pengangkatan" className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              Tanggal Pengangkatan
            </Label>
            <Input id="edit-tgl-pengangkatan" type="date" value={tglPengangkatan} onChange={(e) => onUbahTglPengangkatan(e.target.value)} disabled={isPending} className="h-9 text-xs" />
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

interface PropsModalHapusKaryawan {
  karyawan: ItemKaryawan | null;
  isPending: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export function ModalHapusKaryawan({ karyawan, isPending, onKonfirmasi, onBatal }: PropsModalHapusKaryawan) {
  return (
    <Dialog open={!!karyawan} onOpenChange={(open) => !open && onBatal()}>
      <DialogContent onClose={onBatal} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
            <Trash2 className="h-5 w-5" />
            Hapus Data Karyawan
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus karyawan ini dari database master?
          </DialogDescription>
        </DialogHeader>

        {karyawan && (
          <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 text-xs text-red-900 space-y-1">
            <div><strong>NIP:</strong> <span className="font-mono font-bold">{karyawan.employeeNumber}</span></div>
            <div><strong>Nama:</strong> {karyawan.name}</div>
            <div><strong>Jenis:</strong> {karyawan.category === "PELAKSANA" ? "Karyawan Pelaksana" : "Karyawan Pimpinan"}</div>
            <div><strong>Bagian / Stasiun:</strong> {karyawan.department.name} / {karyawan.stasiun || "-"}</div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onBatal} disabled={isPending}>Batal</Button>
          <Button type="button" onClick={onKonfirmasi} disabled={isPending} variant="destructive" className="gap-1.5">
            {isPending ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Menghapus...</>) : (<><Trash2 className="h-3.5 w-3.5" />Ya, Hapus Karyawan</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
