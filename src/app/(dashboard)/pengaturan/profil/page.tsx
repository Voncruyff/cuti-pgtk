"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Building2,
  Save,
  UserCheck,
  Loader2,
  Users,
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
  getSystemSettingsAction,
  updateCompanyProfileSettingsAction,
} from "@/actions/aksi-pengaturan";

export default function PengaturanProfilPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [companyName, setCompanyName] = useState("PT KEBON AGUNG");
  const [unitName, setUnitName] = useState("PABRIK GULA TRANGKIL");
  const [location, setLocation] = useState("Trangkil, Pati, Jawa Tengah");
  const [hrManagerName, setHrManagerName] = useState("Hendra Wijaya, S.E.");
  const [hrManagerNip, setHrManagerNip] = useState("198503152010011002");
  const [hrManagerTitle, setHrManagerTitle] = useState("Kepala Bagian SDM & Umum");
  const [generalManagerName, setGeneralManagerName] = useState("Ir. Bambang Santoso, M.M.");
  const [generalManagerNip, setGeneralManagerNip] = useState("197805122003121001");

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
      setHrManagerName(p.hrManagerName);
      setHrManagerNip(p.hrManagerNip);
      setHrManagerTitle(p.hrManagerTitle);
      setGeneralManagerName(p.generalManagerName);
      setGeneralManagerNip(p.generalManagerNip);
    } else {
      toast.error(res.message || "Gagal memuat profil perusahaan.");
    }
    setIsLoading(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCompanyProfileSettingsAction({
        companyName,
        unitName,
        location,
        hrManagerName,
        hrManagerNip,
        hrManagerTitle,
        generalManagerName,
        generalManagerNip,
      });

      if (res.success) {
        toast.success(res.message || "Profil perusahaan berhasil diperbarui.");
        loadProfile();
      } else {
        toast.error(res.message || "Gagal memperbarui profil perusahaan.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#0084c7]" />
          <p className="text-xs font-semibold text-slate-600">
            Memuat profil perusahaan & penandatangan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <Card className="border-slate-200/85 shadow-2xs">
        <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0084c7]" />
            Informasi Unit & Pejabat Penandatangan Form
          </CardTitle>
          <CardDescription className="text-xs">
            Identitas instansi dan data pejabat yang dicantumkan pada cetak lembar permohonan & laporan cuti.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nama Perusahaan Induk</Label>
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-9 text-xs font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nama Unit Usaha / Pabrik</Label>
              <Input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="h-9 text-xs font-bold text-[#0084c7]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Lokasi / Alamat Pabrik Gula</Label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Pejabat SDM & Umum */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#0084c7]" />
              Pejabat Penandatangan Dokumen Cuti (SDM & Umum)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nama Lengkap & Gelar</Label>
                <Input
                  type="text"
                  value={hrManagerName}
                  onChange={(e) => setHrManagerName(e.target.value)}
                  className="h-9 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">NIP Pejabat</Label>
                <Input
                  type="text"
                  value={hrManagerNip}
                  onChange={(e) => setHrManagerNip(e.target.value)}
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Jabatan Penandatangan</Label>
                <Input
                  type="text"
                  value={hrManagerTitle}
                  onChange={(e) => setHrManagerTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pemimpin Pabrik / General Manager */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#0084c7]" />
              Pimpinan Unit Kerja / General Manager
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nama Pemimpin & Gelar</Label>
                <Input
                  type="text"
                  value={generalManagerName}
                  onChange={(e) => setGeneralManagerName(e.target.value)}
                  className="h-9 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">NIP Pemimpin</Label>
                <Input
                  type="text"
                  value={generalManagerNip}
                  onChange={(e) => setGeneralManagerNip(e.target.value)}
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <Button
              type="submit"
              disabled={isPending}
              size="default"
              className="font-semibold shadow-xs"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Profil & Penandatangan
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
