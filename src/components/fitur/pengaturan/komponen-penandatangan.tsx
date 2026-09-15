"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  UserCheck,
  Save,
  Loader2,
  Building2,
  User,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge";
import {
  getSignatoriesAction,
  updateSignatoriesAction,
} from "@/actions/aksi-pengaturan";

interface DepartmentSignatoryRow {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  namaPimpinan: string;
  jabatanPimpinan: string;
}

export function KomponenPenandatangan() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Form State: Pemimpin Unit
  const [namaPemimpin, setNamaPemimpin] = useState("Ir. Bambang Santoso, M.M.");
  const [jabatanPemimpin, setJabatanPemimpin] = useState("General Manager");

  // Form State: 1 Pejabat Penandatangan Resmi per Bagian
  const [signatoryRows, setSignatoryRows] = useState<DepartmentSignatoryRow[]>([]);

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
      const sigs = res.data.signatories || [];

      // Setiap bagian di Master Bagian memiliki tepat 1 entri penandatangan resmi
      const rows: DepartmentSignatoryRow[] = depts.map((d) => {
        const found = sigs.find((s) => s.departmentId === d.id);
        return {
          departmentId: d.id,
          departmentCode: d.code,
          departmentName: d.name,
          namaPimpinan: found?.nama || "",
          jabatanPimpinan: found?.jabatan || `Kepala Bagian ${d.name}`,
        };
      });

      setSignatoryRows(rows);
    } else {
      toast.error(res.message || "Gagal memuat data penandatanganan.");
    }
    setIsLoading(false);
  };

  // Ubah input nama atau jabatan untuk bagian tertentu
  const handleRowFieldChange = (
    deptId: string,
    field: "namaPimpinan" | "jabatanPimpinan",
    value: string
  ) => {
    setSignatoryRows((prev) =>
      prev.map((row) =>
        row.departmentId === deptId ? { ...row, [field]: value } : row
      )
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
        toast.success(res.message || "Data penandatanganan berhasil disimpan.");
        await loadData();
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
            Memuat data penandatanganan resmi...
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
            Pengaturan nama dan jabatan pimpinan unit kerja serta kepala bagian untuk pengesahan formulir permohonan dan laporan cuti.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* SEKSI 1: PEMIMPIN UNIT KERJA / PABRIK */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="h-3.5 w-3.5 text-[#0789D1]" />
              <h3 className="text-xs font-bold text-[#263238]">
                Pemimpin Unit Kerja / Pabrik Gula
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
                  className="h-9 text-xs font-medium bg-white"
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
                  className="h-9 text-xs bg-white"
                  placeholder="Contoh: General Manager"
                  required
                />
              </div>
            </div>
          </div>

          {/* SEKSI 2: 1 KEPALA BAGIAN RESMI UNTUK SETIAP BAGIAN KERJA */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#0789D1]" />
                <h3 className="text-xs font-bold text-[#263238]">
                  Kepala Bagian / Penandatangan Dokumen Tiap Bagian
                </h3>
              </div>
              <span className="text-[11px] text-[#6B7280]">
                Setiap bagian kerja memiliki tepat 1 pejabat penandatangan resmi
              </span>
            </div>

            {/* DAFTAR BAGIAN (1 BAGIAN = 1 TTD RESMI) */}
            <div className="space-y-3">
              {signatoryRows.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    Belum ada data bagian di Master Bagian. Silakan tambahkan bagian terlebih dahulu.
                  </p>
                </div>
              ) : (
                signatoryRows.map((row, index) => {
                  return (
                    <div
                      key={row.departmentId}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Kolom Info Bagian */}
                      <div className="sm:col-span-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="default"
                            className="text-[10px] font-mono font-bold bg-[#0789D1] text-white px-2 py-0.5"
                          >
                            {row.departmentCode}
                          </Badge>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {row.departmentName}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          TTD #{index + 1} • Kepala Bagian
                        </p>
                      </div>

                      {/* Kolom 1: Nama Kepala Bagian & Gelar */}
                      <div className="sm:col-span-5 space-y-1.5">
                        <Label className="text-[11px] font-semibold text-[#263238]">
                          Nama Kepala Bagian & Gelar
                        </Label>
                        <Input
                          type="text"
                          value={row.namaPimpinan}
                          onChange={(e) =>
                            handleRowFieldChange(row.departmentId, "namaPimpinan", e.target.value)
                          }
                          placeholder={`Nama & gelar Kepala Bagian ${row.departmentCode}`}
                          className="h-9 text-xs font-medium bg-white"
                          required
                        />
                      </div>

                      {/* Kolom 2: Jabatan Resmi */}
                      <div className="sm:col-span-4 space-y-1.5">
                        <Label className="text-[11px] font-semibold text-[#263238]">
                          Jabatan
                        </Label>
                        <Input
                          type="text"
                          value={row.jabatanPimpinan}
                          onChange={(e) =>
                            handleRowFieldChange(row.departmentId, "jabatanPimpinan", e.target.value)
                          }
                          placeholder={`Contoh: Kepala Bagian ${row.departmentName}`}
                          className="h-9 text-xs bg-white"
                          required
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E8F5FC]">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Perubahan tanda tangan akan otomatis diterapkan pada lembar cetak cuti & laporan.</span>
            </div>

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
