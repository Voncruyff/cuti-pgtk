"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Building2, Factory } from "lucide-react";
import { toast } from "sonner";
import {
  getStationsListAction,
  getDepartmentsSelectorAction,
  createStationAction,
  updateStationAction,
  deleteStationAction,
  type StationItem,
} from "@/actions/aksi-stasiun";
import {
  TabelStasiun,
  ModalTambahStasiun,
  ModalEditStasiun,
  ModalHapusStasiun,
  type PilihanBagianStasiun,
} from "@/components/fitur/master-stasiun/komponen-stasiun";

export default function HalamanMasterStasiun() {
  const [isPending, startTransition] = useTransition();
  const [stasiun, setStasiun] = useState<StationItem[]>([]);
  const [bagian, setBagian] = useState<PilihanBagianStasiun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBagian, setFilterBagian] = useState("ALL");

  // Modal Tambah
  const [isTambahTerbuka, setIsTambahTerbuka] = useState(false);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [bagianId, setBagianId] = useState("");
  const [aktif, setAktif] = useState(true);

  // Modal Edit
  const [isEditTerbuka, setIsEditTerbuka] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKode, setEditKode] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editBagianId, setEditBagianId] = useState("");
  const [editAktif, setEditAktif] = useState(true);

  // Modal Hapus
  const [hapusStasiun, setHapusStasiun] = useState<StationItem | null>(null);

  const muatData = async () => {
    setIsLoading(true);
    try {
      const [stasiunRes, bagianRes] = await Promise.all([
        getStationsListAction(),
        getDepartmentsSelectorAction(),
      ]);
      if (stasiunRes.success && stasiunRes.data) setStasiun(stasiunRes.data);
      else toast.error(stasiunRes.message || "Gagal memuat data stasiun.");
      if (bagianRes.success && bagianRes.data) {
        setBagian(bagianRes.data);
        if (bagianRes.data.length > 0 && !bagianId) setBagianId(bagianRes.data[0].id);
      }
    } catch (err) {
      console.error("Load stasiun error:", err);
      toast.error("Terjadi kesalahan saat memuat data master stasiun.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    muatData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTambah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !nama.trim()) { toast.error("Kode dan Nama Stasiun wajib diisi."); return; }
    if (!bagianId) { toast.error("Silakan pilih Bagian induk."); return; }
    startTransition(async () => {
      const res = await createStationAction({ code: kode.trim().toUpperCase(), name: nama.trim().toUpperCase(), departmentId: bagianId, isActive: aktif });
      if (res.success) {
        toast.success(res.message || "Stasiun baru berhasil ditambahkan!");
        setIsTambahTerbuka(false);
        setKode(""); setNama(""); setAktif(true);
        muatData();
      } else {
        toast.error(res.message || "Gagal menambahkan stasiun.");
      }
    });
  };

  const handleBukaEdit = (s: StationItem) => {
    setEditingId(s.id); setEditKode(s.code); setEditNama(s.name);
    setEditBagianId(s.departmentId || (bagian[0]?.id ?? ""));
    setEditAktif(s.isActive);
    setIsEditTerbuka(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editKode.trim() || !editNama.trim()) { toast.error("Kode dan Nama Stasiun wajib diisi."); return; }
    if (!editBagianId) { toast.error("Silakan pilih Bagian induk."); return; }
    startTransition(async () => {
      const res = await updateStationAction(editingId, { code: editKode.trim().toUpperCase(), name: editNama.trim().toUpperCase(), departmentId: editBagianId, isActive: editAktif });
      if (res.success) {
        toast.success(res.message || "Data stasiun berhasil diperbarui!");
        setIsEditTerbuka(false); setEditingId(null);
        muatData();
      } else {
        toast.error(res.message || "Gagal memperbarui data stasiun.");
      }
    });
  };

  const handleHapus = () => {
    if (!hapusStasiun) return;
    startTransition(async () => {
      const res = await deleteStationAction(hapusStasiun.id);
      if (res.success) {
        toast.success(res.message || "Stasiun berhasil dihapus.");
        setStasiun((prev) => prev.filter((s) => s.id !== hapusStasiun.id));
        setHapusStasiun(null);
      } else {
        toast.error(res.message || "Gagal menghapus stasiun.");
      }
    });
  };

  return (
    <>
      {/* Tab Navigasi */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg border border-slate-200/80 w-fit mb-4">
        <Link href="/master-stasiun" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-white text-[#0084c7] shadow-2xs">
          <Factory className="h-3.5 w-3.5" />
          Master Stasiun
          <span className="h-4.5 px-1.5 text-[10px] bg-sky-50 text-[#0084c7] font-bold rounded-md border border-sky-100 flex items-center justify-center">{stasiun.length}</span>
        </Link>
        <Link href="/master-bagian" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0077b6] hover:bg-white/50 rounded-md transition-colors">
          <Building2 className="h-3.5 w-3.5" />
          Master Bagian
          <span className="h-4.5 px-1.5 text-[10px] bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center justify-center">{bagian.length}</span>
        </Link>
      </div>

      <TabelStasiun
        stasiun={stasiun}
        bagian={bagian}
        isLoading={isLoading}
        isPending={isPending}
        searchQuery={searchQuery}
        filterBagian={filterBagian}
        onUbahSearch={setSearchQuery}
        onUbahFilterBagian={setFilterBagian}
        onMuatUlang={muatData}
        onTambah={() => {
          if (bagian.length > 0 && !bagianId) setBagianId(bagian[0].id);
          setIsTambahTerbuka(true);
        }}
        onEdit={handleBukaEdit}
        onHapus={setHapusStasiun}
      />

      <ModalTambahStasiun
        terbuka={isTambahTerbuka}
        isPending={isPending}
        bagian={bagian}
        kode={kode}
        nama={nama}
        bagianId={bagianId}
        aktif={aktif}
        onUbahKode={setKode}
        onUbahNama={setNama}
        onUbahBagianId={setBagianId}
        onUbahAktif={setAktif}
        onSubmit={handleTambah}
        onTutup={() => setIsTambahTerbuka(false)}
      />

      <ModalEditStasiun
        terbuka={isEditTerbuka}
        isPending={isPending}
        bagian={bagian}
        kode={editKode}
        nama={editNama}
        bagianId={editBagianId}
        aktif={editAktif}
        onUbahKode={setEditKode}
        onUbahNama={setEditNama}
        onUbahBagianId={setEditBagianId}
        onUbahAktif={setEditAktif}
        onSubmit={handleEdit}
        onTutup={() => setIsEditTerbuka(false)}
      />

      <ModalHapusStasiun
        stasiun={hapusStasiun}
        isPending={isPending}
        onKonfirmasi={handleHapus}
        onBatal={() => setHapusStasiun(null)}
      />
    </>
  );
}
