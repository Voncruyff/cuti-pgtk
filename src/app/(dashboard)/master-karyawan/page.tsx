"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Factory } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TabelKaryawan, type ItemKaryawan, type PilihanBagian, type PilihanStasiun } from "@/components/fitur/master-karyawan/tabel-karyawan";
import { ModalTambahKaryawan, ModalEditKaryawan, ModalHapusKaryawan } from "@/components/fitur/master-karyawan/modal-karyawan";
import {
  getEmployeePageDataAction,
  createLeaderAction,
  updateLeaderAction,
  deleteLeaderAction,
} from "@/actions/aksi-karyawan";

export default function HalamanMasterKaryawan() {
  const [isPending, startTransition] = useTransition();
  const [karyawan, setKaryawan] = useState<ItemKaryawan[]>([]);
  const [bagian, setBagian] = useState<PilihanBagian[]>([]);
  const [stasiun, setStasiun] = useState<PilihanStasiun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [tabKategori, setTabKategori] = useState<"ALL" | "PIMPINAN" | "PELAKSANA">("ALL");
  const [filterBagian, setFilterBagian] = useState("ALL");
  const [filterStasiun, setFilterStasiun] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Tambah State
  const [isTambahTerbuka, setIsTambahTerbuka] = useState(false);
  const [nip, setNip] = useState("");
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [kategori, setKategori] = useState<"PIMPINAN" | "PELAKSANA">("PIMPINAN");
  const [bagianId, setBagianId] = useState("");
  const [stasiunId, setStasiunId] = useState("");
  const [tglPengangkatan, setTglPengangkatan] = useState("");

  // Modal Edit State
  const [isEditTerbuka, setIsEditTerbuka] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNip, setEditNip] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editJabatan, setEditJabatan] = useState("");
  const [editKategori, setEditKategori] = useState<"PIMPINAN" | "PELAKSANA">("PIMPINAN");
  const [editBagianId, setEditBagianId] = useState("");
  const [editStasiunId, setEditStasiunId] = useState("");
  const [editTglPengangkatan, setEditTglPengangkatan] = useState("");

  // Modal Hapus State
  const [hapusKaryawan, setHapusKaryawan] = useState<ItemKaryawan | null>(null);

  const muatData = async () => {
    setIsLoading(true);
    try {
      const res = await getEmployeePageDataAction();
      if (res.employees) setKaryawan(res.employees as unknown as ItemKaryawan[]);
      if (res.departments) setBagian(res.departments as PilihanBagian[]);
      if (res.stations) setStasiun(res.stations as PilihanStasiun[]);
    } catch (err) {
      console.error("Load karyawan error:", err);
      toast.error("Gagal memuat data master karyawan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { muatData(); }, []);

  const resetFormTambah = () => {
    setNip(""); setNama(""); setJabatan(""); setTglPengangkatan("");
  };

  const handleTambah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip.trim() || !nama.trim() || !bagianId) {
      toast.error("NIP, Nama Lengkap, dan Bagian wajib diisi.");
      return;
    }
    const selectedSt = stasiun.find((s) => s.id === stasiunId);
    const namaStasiun = selectedSt ? selectedSt.name : (stasiunId || null);

    startTransition(async () => {
      const res = await createLeaderAction({
        employeeNumber: nip.trim(),
        name: nama.trim(),
        position: jabatan.trim(),
        category: kategori,
        departmentId: bagianId,
        stationId: stasiunId || null,
        stasiun: namaStasiun,
        appointmentDate: tglPengangkatan || null,
        initialAnnual: 0, initialLongLeave: 0, initialInhaldagen: 0,
      });
      if (res.success) {
        toast.success(res.message || "Data karyawan berhasil ditambahkan!");
        setIsTambahTerbuka(false);
        resetFormTambah();
        muatData();
      } else {
        toast.error(res.message || "Gagal menambahkan data karyawan.");
      }
    });
  };

  const handleBukaEdit = (item: ItemKaryawan) => {
    setEditingId(item.id);
    setEditNip(item.employeeNumber);
    setEditNama(item.name);
    setEditJabatan(item.position === "-" ? "" : item.position);
    setEditKategori((item.category as "PIMPINAN" | "PELAKSANA") || "PIMPINAN");
    setEditBagianId(item.departmentId || (bagian[0]?.id ?? ""));
    const matchSt = stasiun.find((s) => s.id === item.stationId || (item.stasiun && s.name.toLowerCase() === item.stasiun.toLowerCase()));
    setEditStasiunId(matchSt ? matchSt.id : (item.stationId || ""));
    setEditTglPengangkatan(item.appointmentDate ? new Date(item.appointmentDate).toISOString().split("T")[0] : "");
    setIsEditTerbuka(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editNip.trim() || !editNama.trim() || !editBagianId) {
      toast.error("NIP, Nama Lengkap, dan Bagian wajib diisi.");
      return;
    }
    const selectedSt = stasiun.find((s) => s.id === editStasiunId);
    const namaStasiun = selectedSt ? selectedSt.name : (editStasiunId || null);

    startTransition(async () => {
      const res = await updateLeaderAction(editingId, {
        employeeNumber: editNip.trim(),
        name: editNama.trim(),
        position: editJabatan.trim(),
        category: editKategori,
        departmentId: editBagianId,
        stationId: editStasiunId || null,
        stasiun: namaStasiun,
        appointmentDate: editTglPengangkatan || null,
      });
      if (res.success) {
        toast.success(res.message || "Data karyawan berhasil diperbarui!");
        setIsEditTerbuka(false);
        setEditingId(null);
        muatData();
      } else {
        toast.error(res.message || "Gagal memperbarui data karyawan.");
      }
    });
  };

  const handleHapus = () => {
    if (!hapusKaryawan) return;
    startTransition(async () => {
      const res = await deleteLeaderAction(hapusKaryawan.id);
      if (res.success) {
        toast.success(res.message || "Data karyawan berhasil dihapus.");
        setKaryawan((prev) => prev.filter((e) => e.id !== hapusKaryawan.id));
        setHapusKaryawan(null);
      } else {
        toast.error(res.message || "Gagal menghapus data karyawan.");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/stasiun">
          <Button variant="outline" size="default" className="font-medium text-slate-700">
            <Factory className="h-4 w-4 text-slate-500" />
            Master Stasiun
          </Button>
        </Link>
      </div>

      <TabelKaryawan
        karyawan={karyawan}
        bagian={bagian}
        stasiun={stasiun}
        isLoading={isLoading}
        isPending={isPending}
        tabKategori={tabKategori}
        filterBagian={filterBagian}
        filterStasiun={filterStasiun}
        searchQuery={searchQuery}
        onUbahTabKategori={setTabKategori}
        onUbahFilterBagian={setFilterBagian}
        onUbahFilterStasiun={setFilterStasiun}
        onUbahSearch={setSearchQuery}
        onMuatUlang={muatData}
        onTambah={() => {
          if (tabKategori === "PELAKSANA") setKategori("PELAKSANA"); else setKategori("PIMPINAN");
          if (filterBagian !== "ALL") setBagianId(filterBagian);
          else if (bagian.length > 0) setBagianId(bagian[0].id);
          setIsTambahTerbuka(true);
        }}
        onEdit={handleBukaEdit}
        onHapus={setHapusKaryawan}
      />

      <ModalTambahKaryawan
        terbuka={isTambahTerbuka}
        isPending={isPending}
        bagian={bagian}
        stasiun={stasiun}
        nip={nip} nama={nama} jabatan={jabatan} kategori={kategori} bagianId={bagianId} stasiunId={stasiunId} tglPengangkatan={tglPengangkatan}
        onUbahNip={setNip} onUbahNama={setNama} onUbahJabatan={setJabatan} onUbahKategori={setKategori}
        onUbahBagianId={setBagianId} onUbahStasiunId={setStasiunId} onUbahTglPengangkatan={setTglPengangkatan}
        onSubmit={handleTambah}
        onTutup={() => setIsTambahTerbuka(false)}
      />

      <ModalEditKaryawan
        terbuka={isEditTerbuka}
        isPending={isPending}
        bagian={bagian}
        stasiun={stasiun}
        nip={editNip} nama={editNama} jabatan={editJabatan} kategori={editKategori} bagianId={editBagianId} stasiunId={editStasiunId} tglPengangkatan={editTglPengangkatan}
        onUbahNip={setEditNip} onUbahNama={setEditNama} onUbahJabatan={setEditJabatan} onUbahKategori={setEditKategori}
        onUbahBagianId={setEditBagianId} onUbahStasiunId={setEditStasiunId} onUbahTglPengangkatan={setEditTglPengangkatan}
        onSubmit={handleEdit}
        onTutup={() => setIsEditTerbuka(false)}
      />

      <ModalHapusKaryawan
        karyawan={hapusKaryawan}
        isPending={isPending}
        onKonfirmasi={handleHapus}
        onBatal={() => setHapusKaryawan(null)}
      />
    </>
  );
}
