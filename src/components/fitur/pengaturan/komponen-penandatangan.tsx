"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  UserCheck,
  Save,
  Loader2,
  Building2,
  User,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getSignatoriesAction,
  updateSignatoriesAction,
} from "@/actions/aksi-pengaturan";

interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
}

interface SignatoryRow {
  tempId: string;
  departmentId: string;
  namaPimpinan: string;
  jabatanPimpinan: string;
}

export function KomponenPenandatangan() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Form State: Pemimpin Unit
  const [namaPemimpin, setNamaPemimpin] = useState("Ir. Bambang Santoso, M.M.");
  const [jabatanPemimpin, setJabatanPemimpin] = useState("General Manager");

  // Form State: Master Bagian & Dynamic Rows
  const [allDepartments, setAllDepartments] = useState<DepartmentInfo[]>([]);
  const [signatoryRows, setSignatoryRows] = useState<SignatoryRow[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getSignatoriesAction();
    if (res.success && res.data) {
      setNamaPemimpin(res.data.leader.namaPemimpin || "");
      setJabatanPemimpin(res.data.leader.jabatanPemimpin || "General Manager");

      const depts = res.data.allDepartments || [];
      setAllDepartments(depts);

      const sigs = res.data.signatories || [];
      if (sigs.length > 0) {
        setSignatoryRows(
          sigs.map((s) => ({
            tempId: s.id,
            departmentId: s.departmentId,
            namaPimpinan: s.nama,
            jabatanPimpinan: s.jabatan,
          }))
        );
      } else if (depts.length > 0) {
        setSignatoryRows([
          {
            tempId: `row-${Date.now()}`,
            departmentId: depts[0].id,
            namaPimpinan: "",
            jabatanPimpinan: `Kepala Bagian ${depts[0].name}`,
          },
        ]);
      }
    } else {
      toast.error(res.message || "Gagal memuat data penandatanganan.");
    }
    setIsLoading(false);
  };

  // Cek apakah seluruh bagian yang ada di Master Bagian sudah terpakai
  const isAllDepartmentsUsed =
    allDepartments.length > 0 &&
    allDepartments.every((d) => signatoryRows.some((r) => r.departmentId === d.id));

  // Tambah baris TTD baru
  const handleAddRow = () => {
    // Cari bagian yang belum dipilih di baris yang sudah ada
    const usedDeptIds = new Set(signatoryRows.map((r) => r.departmentId));
    const availableDept = allDepartments.find((d) => !usedDeptIds.has(d.id));

    if (!availableDept) {
      toast.warning("Semua bagian sudah memiliki pimpinan / pejabat penandatangan.");
      return;
    }

    const defaultDeptId = availableDept.id;
    const defaultJabatan = `Kepala Bagian ${availableDept.name}`;

    setSignatoryRows((prev) => [
      ...prev,
      {
        tempId: `row-${Date.now()}-${Math.random()}`,
        departmentId: defaultDeptId,
        namaPimpinan: "",
        jabatanPimpinan: defaultJabatan,
      },
    ]);
  };

  // Hapus baris TTD
  const handleRemoveRow = (indexToRemove: number) => {
    setSignatoryRows((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Ubah bagian pada selector dropdown suatu baris
  const handleDepartmentChange = (index: number, newDeptId: string) => {
    const isAlreadyUsedElsewhere = signatoryRows.some(
      (r, i) => i !== index && r.departmentId === newDeptId
    );
    if (isAlreadyUsedElsewhere) {
      toast.warning("Bagian ini sudah dipilih pada baris penandatangan lain.");
      return;
    }

    const selectedDept = allDepartments.find((d) => d.id === newDeptId);
    setSignatoryRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          const autoTitle = selectedDept ? `Kepala Bagian ${selectedDept.name}` : "";
          const shouldUpdateJabatan =
            !row.jabatanPimpinan || row.jabatanPimpinan.startsWith("Kepala Bagian");
          return {
            ...row,
            departmentId: newDeptId,
            jabatanPimpinan: shouldUpdateJabatan ? autoTitle : row.jabatanPimpinan,
          };
        }
        return row;
      })
    );
  };

  // Ubah input nama atau jabatan suatu baris
  const handleRowFieldChange = (
    index: number,
    field: "namaPimpinan" | "jabatanPimpinan",
    value: string
  ) => {
    setSignatoryRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateSignatoriesAction({
        namaPemimpin,
        jabatanPemimpin,
        signatories: signatoryRows.map((r) => ({
          departmentId: r.departmentId,
          nama: r.namaPimpinan,
          jabatan: r.jabatanPimpinan,
        })),
      });

      if (res.success) {
        toast.success(res.message || "Data penandatanganan berhasil disimpan ke database.");
        loadData();
      } else {
        toast.error(res.message || "Gagal memperbarui data penandatanganan.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#0789D1]" />
          <p className="text-xs font-semibold text-slate-600">
            Memuat data penandatanganan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll}>
      <Card className="border border-[#E8F5FC] shadow-2xs rounded-2xl bg-white overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/50 via-slate-50/20 to-transparent border-b border-[#E8F5FC]">
          <CardTitle className="text-sm font-bold text-[#263238] flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#0789D1]" />
            Pejabat Penandatanganan Dokumen Cuti
          </CardTitle>
          <CardDescription className="text-xs text-[#6B7280]">
            Pengaturan nama dan jabatan pimpinan unit kerja serta pimpinan bagian yang dicantumkan pada kolom tanda tangan dokumen cuti.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* SEKSI 1: PEMIMPIN UNIT KERJA / PABRIK (TANPA NIP) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="h-3.5 w-3.5 text-[#0789D1]" />
              <h3 className="text-xs font-bold text-[#263238]">
                Pemimpin Unit Kerja / Pabrik
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#263238]">
                  Nama Pemimpin & Gelar
                </Label>
                <Input
                  type="text"
                  value={namaPemimpin}
                  onChange={(e) => setNamaPemimpin(e.target.value)}
                  className="h-9 text-xs font-medium"
                  placeholder="Contoh: Ir. Bambang Santoso, M.M."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#263238]">
                  Jabatan Pemimpin
                </Label>
                <Input
                  type="text"
                  value={jabatanPemimpin}
                  onChange={(e) => setJabatanPemimpin(e.target.value)}
                  className="h-9 text-xs"
                  placeholder="Contoh: General Manager"
                  required
                />
              </div>
            </div>
          </div>

          {/* SEKSI 2: PIMPINAN BAGIAN DENGAN TOMBOL + UNTUK TAMBAH TTD LAIN DI BAWAH (TANPA NIP) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#0789D1]" />
                <h3 className="text-xs font-bold text-[#263238]">
                  Pimpinan Bagian / Penandatangan Dokumen
                </h3>
              </div>
              <span className="text-[11px] text-[#6B7280]">
                Pilih bagian pada selector di kolom nama untuk menentukan pimpinan masing-masing bagian
              </span>
            </div>

            {/* DAFTAR BARIS PENANDATANGAN */}
            <div className="space-y-3">
              {signatoryRows.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    Belum ada baris penandatangan bagian yang ditambahkan.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    className="mt-2 text-xs text-[#0789D1] border-[#0789D1]/30 hover:bg-sky-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Tambah TTD
                  </Button>
                </div>
              ) : (
                signatoryRows.map((row, index) => {
                  return (
                    <div
                      key={row.tempId}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Kolom 1: Nama Pimpinan dengan Selector Master Bagian terintegrasi di kanan */}
                      <div className="sm:col-span-6 space-y-1.5">
                        <Label className="text-[11px] font-semibold text-[#263238] flex items-center justify-between">
                          <span>Nama Pimpinan / TTD #{index + 1}</span>
                        </Label>
                        <div className="relative flex items-center">
                          <Input
                            type="text"
                            value={row.namaPimpinan}
                            onChange={(e) =>
                              handleRowFieldChange(index, "namaPimpinan", e.target.value)
                            }
                            placeholder="Nama & gelar pimpinan"
                            className="h-9 text-xs pr-36 font-medium bg-white"
                          />
                          <div className="absolute right-1 top-1 bottom-1 flex items-center">
                            <select
                              value={row.departmentId}
                              onChange={(e) =>
                                handleDepartmentChange(index, e.target.value)
                              }
                              className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-[#0084c7] focus:outline-none focus:ring-1 focus:ring-[#0084c7] cursor-pointer transition-colors max-w-[135px]"
                              title="Pilih Master Bagian"
                            >
                              {allDepartments.map((d) => {
                                const isUsedElsewhere = signatoryRows.some(
                                  (r, i) => i !== index && r.departmentId === d.id
                                );
                                return (
                                  <option
                                    key={d.id}
                                    value={d.id}
                                    disabled={isUsedElsewhere}
                                  >
                                    {d.code} - {d.name} {isUsedElsewhere ? "(Sudah terdaftar)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Kolom 2: Jabatan Pimpinan */}
                      <div className="sm:col-span-5 space-y-1.5">
                        <Label className="text-[11px] font-semibold text-[#263238]">
                          Jabatan
                        </Label>
                        <Input
                          type="text"
                          value={row.jabatanPimpinan}
                          onChange={(e) =>
                            handleRowFieldChange(index, "jabatanPimpinan", e.target.value)
                          }
                          placeholder="Contoh: Kepala Bagian Tanaman"
                          className="h-9 text-xs bg-white"
                        />
                      </div>

                      {/* Kolom 3: Tombol Hapus Baris */}
                      <div className="sm:col-span-1 flex items-center justify-end sm:justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(index)}
                          className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Hapus baris penandatangan ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* TOMBOL + TAMBAH TTD LAIN DI BAWAH */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRow}
                disabled={isAllDepartmentsUsed}
                className={`w-full border-dashed text-xs font-semibold h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all mt-2 ${
                  isAllDepartmentsUsed
                    ? "border-slate-200 bg-slate-100/80 text-slate-400 cursor-not-allowed opacity-60 select-none shadow-none"
                    : "border-sky-300 hover:border-[#0789D1] bg-sky-50/30 text-[#0789D1] hover:bg-sky-50 hover:text-[#005B96] cursor-pointer"
                }`}
                title={
                  isAllDepartmentsUsed
                    ? "Semua bagian sudah memiliki pejabat penandatangan"
                    : "Tambah baris penandatangan"
                }
              >
                <Plus className="h-4 w-4" />
                Tambah TTD
              </Button>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="flex items-center justify-end pt-3 border-t border-[#E8F5FC]">
            <Button
              type="submit"
              disabled={isPending}
              size="default"
              className="bg-[#0789D1] hover:bg-[#005B96] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer w-full sm:w-auto px-5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Simpan Penandatanganan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
