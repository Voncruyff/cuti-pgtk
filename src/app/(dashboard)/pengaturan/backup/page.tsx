"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Database,
  Download,
  Server,
  FileCheck2,
  Info,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSystemSettingsAction,
  exportSystemBackupDataAction,
  SystemSettingsData,
} from "@/actions/aksi-pengaturan";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "sky",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  variant?: "sky" | "emerald" | "slate";
}) {
  const colorMap = {
    sky: "bg-sky-50 text-[#0084c7] border-sky-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <Card className="border-slate-200/85 shadow-2xs">
      <CardContent className="p-4 flex items-center gap-3.5">
        <div className={`p-2.5 rounded-xl border ${colorMap[variant]} shrink-0 shadow-2xs`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">{title}</p>
          <p className="text-base font-bold tracking-tight text-slate-900 truncate">{value}</p>
          <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PengaturanBackupPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemSettingsData["systemMetrics"] | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    const res = await getSystemSettingsAction();
    if (res.success && res.data) {
      setSystemMetrics(res.data.systemMetrics);
    } else {
      toast.error(res.message || "Gagal memuat status sistem & database.");
    }
    setIsLoading(false);
  };

  const handleExportBackup = () => {
    startTransition(async () => {
      const res = await exportSystemBackupDataAction();
      if (res.success && res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_sipcuti_pgtk_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Cadangan data sistem berhasil diunduh.");
      } else {
        toast.error(res.message || "Gagal membuat berkas cadangan data.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#0084c7]" />
          <p className="text-xs font-semibold text-slate-600">
            Memuat status data & sistem...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Sistem & Metrik Database */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard
          title="Database MySQL"
          value="Terhubung"
          subtitle="Prisma ORM Client Active"
          icon={Server}
          variant="emerald"
        />

        <StatCard
          title="Total Transaksi Mutasi"
          value={`${systemMetrics?.totalActivities || 0} Record`}
          subtitle="Tabel aktivitas_saldo"
          icon={FileCheck2}
          variant="sky"
        />

        <StatCard
          title="Versi Aplikasi"
          value={systemMetrics?.appVersion || "v1.0.0"}
          subtitle="Next.js 15 (Turbopack)"
          icon={Info}
          variant="slate"
        />
      </div>

      {/* Card Download Backup */}
      <Card className="border-slate-200/85 shadow-2xs">
        <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-[#0084c7]" />
            Pusat Cadangan Data Sistem (JSON Export Backup)
          </CardTitle>
          <CardDescription className="text-xs">
            Ekspor seluruh data master karyawan, bagian, stasiun, saldo cuti, dan ledger riwayat transaksi dalam satu berkas cadangan aman.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-[#0084c7] border border-sky-100 shadow-xs">
            <Download className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900">
              Unduh Cadangan Lengkap SIP-CUTI
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Berkas cadangan dapat disimpan di media eksternal sebagai arsip cadangan keamanan data operasional PG Trangkil.
            </p>
          </div>
          <div className="pt-3">
            <Button
              onClick={handleExportBackup}
              disabled={isPending}
              size="default"
              className="font-semibold shadow-xs"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Unduh Berkas Cadangan (.JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
