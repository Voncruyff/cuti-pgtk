"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Factory, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  TabelBagian,
  ModalTambahBagian,
  ModalEditBagian,
  ModalHapusBagian,
  type ItemBagian,
} from "@/components/fitur/master-bagian/komponen-bagian";
import {
  getDepartmentsListAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from "@/actions/aksi-bagian";

export function KomponenHalamanBagian() {
  const [isPending, startTransition] = useTransition();
  const [bagian, setBagian] = useState<ItemBagian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Tambah
  const [isTambahTerbuka, setIsTambahTerbuka] = useState(false);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [aktif, setAktif] = useState(true);

  // Modal Edit
  const [isEditTerbuka, setIsEditTerbuka] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKode, setEditKode] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editAktif, setEditAktif] = useState(true);

  // Modal Hapus
  const [hapusBagian, setHapusBagian] = useState<ItemBagian | null>(null);

  const muatData = async () => {
    setIsLoading(true);
    try {
      const res = await getDepartmentsListAction();
      if (res.success && res.data) setBagian(res.data as ItemBagian[]);
      else toast.error(res.message || "Gagal memuat data bagian.");
    } catch (err) {
      console.error("Load bagian error:", err);
      toast.error("Terjadi kesalahan saat memuat data bagian.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const handleTambah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !nama.trim()) {
      toast.error("Kode dan Nama Bagian wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await createDepartmentAction({
        code: kode.trim().toUpperCase(),
        name: nama.trim(),
        isActive: aktif,
      });
      if (res.success) {
        toast.success(res.message || "Bagian baru berhasil ditambahkan!");
        setIsTambahTerbuka(false);
        setKode("");
        setNama("");
        setAktif(true);
        muatData();
      } else {
        toast.error(res.message || "Gagal menambahkan bagian.");
      }
    });
  };

  const handleBukaEdit = (item: ItemBagian) => {
    setEditingId(item.id);
    setEditKode(item.code);
    setEditNama(item.name);
    setEditAktif(item.isActive);
    setIsEditTerbuka(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editKode.trim() || !editNama.trim()) {
      toast.error("Kode dan Nama Bagian wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await updateDepartmentAction(editingId, {
        code: editKode.trim().toUpperCase(),
        name: editNama.trim(),
        isActive: editAktif,
      });
      if (res.success) {
        toast.success(res.message || "Data bagian berhasil diperbarui!");
        setIsEditTerbuka(false);
        setEditingId(null);
        muatData();
      } else {
        toast.error(res.message || "Gagal memperbarui data bagian.");
      }
    });
  };

  const handleHapus = () => {
    if (!hapusBagian) return;
    startTransition(async () => {
      const res = await deleteDepartmentAction(hapusBagian.id);
      if (res.success) {
        toast.success(res.message || "Bagian berhasil dihapus.");
        setBagian((prev) => prev.filter((d) => d.id !== hapusBagian.id));
        setHapusBagian(null);
      } else {
        toast.error(res.message || "Gagal menghapus bagian.");
      }
    });
  };

  return (
    <>
      {/* Tab Navigasi Stasiun & Bagian */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg border border-slate-200/80 w-fit mb-4">
        <Link
          href="/master-stasiun"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0077b6] hover:bg-white/50 rounded-md transition-colors"
        >
          <Factory className="h-3.5 w-3.5" />
          Master Stasiun
        </Link>
        <Link
          href="/master-bagian"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-white text-[#0084c7] shadow-2xs"
        >
          <Building2 className="h-3.5 w-3.5" />
          Master Bagian
          <span className="h-4.5 px-1.5 text-[10px] bg-sky-50 text-[#0084c7] font-bold rounded-md border border-sky-100 flex items-center justify-center">
            {bagian.length}
          </span>
        </Link>
      </div>

      <TabelBagian
        bagian={bagian}
        isLoading={isLoading}
        isPending={isPending}
        searchQuery={searchQuery}
        onUbahSearch={setSearchQuery}
        onTambah={() => setIsTambahTerbuka(true)}
        onEdit={handleBukaEdit}
        onHapus={setHapusBagian}
      />

      <ModalTambahBagian
        terbuka={isTambahTerbuka}
        isPending={isPending}
        kode={kode}
        nama={nama}
        aktif={aktif}
        onUbahKode={setKode}
        onUbahNama={setNama}
        onUbahAktif={setAktif}
        onSubmit={handleTambah}
        onTutup={() => setIsTambahTerbuka(false)}
      />

      <ModalEditBagian
        terbuka={isEditTerbuka}
        isPending={isPending}
        kode={editKode}
        nama={editNama}
        aktif={editAktif}
        onUbahKode={setEditKode}
        onUbahNama={setEditNama}
        onUbahAktif={setEditAktif}
        onSubmit={handleEdit}
        onTutup={() => setIsEditTerbuka(false)}
      />

      <ModalHapusBagian
        bagian={hapusBagian}
        isPending={isPending}
        onKonfirmasi={handleHapus}
        onBatal={() => setHapusBagian(null)}
      />
    </>
  );
}
