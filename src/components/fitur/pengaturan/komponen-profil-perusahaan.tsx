"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Building2, Save, Loader2 } from "lucide-react";
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
  getSystemSettingsAction,
  updateCompanyProfileOnlyAction,
} from "@/actions/aksi-pengaturan";

export function KomponenProfilPerusahaan() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [companyName, setCompanyName] = useState("PT KEBON AGUNG");
  const [unitName, setUnitName] = useState("PABRIK GULA TRANGKIL");
  const [location, setLocation] = useState("Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    const res = await getSystemSettingsAction();
    if (res.success && res.data) {
      const p = res.data.companyProfile;
      setCompanyName(p.companyName);
      setUnitName(p.unitName);
      setLocation(p.location);
    } else {
      toast.error(res.message || "Gagal memuat profil pabrik gula.");
    }
    setIsLoading(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCompanyProfileOnlyAction({
        companyName,
        unitName,
        location,
      });

      if (res.success) {
        toast.success(res.message || "Profil Pabrik Gula berhasil diperbarui.");
        loadProfile();
      } else {
        toast.error(res.message || "Gagal memperbarui profil pabrik gula.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#0789D1]" />
          <p className="text-xs font-semibold text-slate-600">
            Memuat profil pabrik gula...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <Card className="border border-[#E8F5FC] shadow-2xs rounded-2xl bg-white overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/50 via-slate-50/20 to-transparent border-b border-[#E8F5FC]">
          <CardTitle className="text-sm font-bold text-[#263238] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0789D1]" />
            Identitas Unit & Profil Perusahaan
          </CardTitle>
          <CardDescription className="text-xs text-[#6B7280]">
            Identitas instansi dan lokasi pabrik gula yang dicantumkan pada kop cetak lembar permohonan & laporan cuti.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#263238]">Nama Perusahaan Induk</Label>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-9 text-xs font-bold"
                placeholder="Contoh: PT KEBON AGUNG"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#263238]">Nama Unit Usaha / Pabrik</Label>
              <Input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="h-9 text-xs font-bold text-[#0789D1]"
                placeholder="Contoh: PABRIK GULA TRANGKIL"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#263238]">Lokasi / Alamat Pabrik Gula</Label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 text-xs"
              placeholder="Contoh: Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153"
              required
            />
            <p className="text-[11px] text-[#6B7280]">
              Alamat ini akan otomatis tercantum pada kop surat cetak Laporan Cuti, Surat Izin Cuti, dan Kartu Histori Saldo.
            </p>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[#E8F5FC]">
            <Button
              type="submit"
              disabled={isPending}
              size="default"
              className="bg-[#0789D1] hover:bg-[#005B96] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Simpan Profil Perusahaan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
