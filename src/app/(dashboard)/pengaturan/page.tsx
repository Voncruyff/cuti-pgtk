"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Settings,
  Shield,
  Building2,
  CalendarDays,
  Database,
  Lock,
  Download,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  RefreshCw,
  UserCheck,
  Server,
  FileCheck2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/bersama/kartu-statistik";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSystemSettingsAction,
  updateLeavePolicySettingsAction,
  updateCompanyProfileSettingsAction,
  changeUserPasswordAction,
  exportSystemBackupDataAction,
  SystemSettingsData,
} from "@/actions/aksi-pengaturan";

export default function HalamanPengaturan() {
  const [activeTab, setActiveTab] = useState<"POLICY" | "PROFILE" | "SECURITY" | "BACKUP">("POLICY");
  const [isPending, startTransition] = useTransition();
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Settings State
  const [settingsData, setSettingsData] = useState<SystemSettingsData | null>(null);

  // Tab 1: Leave Policy Form State
  // 1. Cuti Tahunan
  const [defaultAnnualDays, setDefaultAnnualDays] = useState(12);
  const [annualEligibleYears, setAnnualEligibleYears] = useState(1);
  const [annualExpiryMonths, setAnnualExpiryMonths] = useState(12);

  // 2. Cuti Besar
  const [defaultLongLeaveDays, setDefaultLongLeaveDays] = useState(22);
  const [longLeaveIntervalYears, setLongLeaveIntervalYears] = useState(6);
  const [longLeaveExpiryMonths, setLongLeaveExpiryMonths] = useState(72);

  // 3. Cuti Inhaldagen
  const [defaultInhaldagenDays, setDefaultInhaldagenDays] = useState(6);
  const [inhaldagenEligibleYears, setInhaldagenEligibleYears] = useState(0);
  const [inhaldagenExpiryMonths, setInhaldagenExpiryMonths] = useState(12);

  // 4. Umum & Akumulasi
  const [activePeriodYear, setActivePeriodYear] = useState(2026);
  const [maxAccumulatedDays, setMaxAccumulatedDays] = useState(36);

  // Tab 2: Company Profile Form State
  const [companyName, setCompanyName] = useState("PT KEBON AGUNG");
  const [unitName, setUnitName] = useState("PABRIK GULA TRANGKIL");
  const [location, setLocation] = useState("Trangkil, Pati, Jawa Tengah");
  const [hrManagerName, setHrManagerName] = useState("Hendra Wijaya, S.E.");
  const [hrManagerNip, setHrManagerNip] = useState("198503152010011002");
  const [hrManagerTitle, setHrManagerTitle] = useState("Kepala Bagian SDM & Umum");
  const [generalManagerName, setGeneralManagerName] = useState("Ir. Bambang Santoso, M.M.");
  const [generalManagerNip, setGeneralManagerNip] = useState("197805122003121001");

  // Tab 3: Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load Settings on Mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    const res = await getSystemSettingsAction();
    if (res.success && res.data) {
      setSettingsData(res.data);
      const policy = res.data.leavePolicy;
      // Set Tab 1
      setDefaultAnnualDays(policy.defaultAnnualDays ?? 12);
      setAnnualEligibleYears(policy.annualEligibleYears ?? 1);
      setAnnualExpiryMonths(policy.annualExpiryMonths ?? 12);

      setDefaultLongLeaveDays(policy.defaultLongLeaveDays ?? 22);
      setLongLeaveIntervalYears(policy.longLeaveIntervalYears ?? 6);
      setLongLeaveExpiryMonths(policy.longLeaveExpiryMonths ?? 72);

      setDefaultInhaldagenDays(policy.defaultInhaldagenDays ?? 6);
      setInhaldagenEligibleYears(policy.inhaldagenEligibleYears ?? 0);
      setInhaldagenExpiryMonths(policy.inhaldagenExpiryMonths ?? 12);

      setActivePeriodYear(policy.activePeriodYear ?? 2026);
      setMaxAccumulatedDays(policy.maxAccumulatedDays ?? 36);

      // Set Tab 2
      setCompanyName(res.data.companyProfile.companyName);
      setUnitName(res.data.companyProfile.unitName);
      setLocation(res.data.companyProfile.location);
      setHrManagerName(res.data.companyProfile.hrManagerName);
      setHrManagerNip(res.data.companyProfile.hrManagerNip);
      setHrManagerTitle(res.data.companyProfile.hrManagerTitle);
      setGeneralManagerName(res.data.companyProfile.generalManagerName);
      setGeneralManagerNip(res.data.companyProfile.generalManagerNip);
    } else {
      toast.error(res.message || "Gagal memuat pengaturan sistem.");
    }
    setIsLoadingSettings(false);
  };

  // Save Leave Policy
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateLeavePolicySettingsAction({
        defaultAnnualDays,
        annualEligibleYears,
        annualExpiryMonths,
        defaultLongLeaveDays,
        longLeaveIntervalYears,
        longLeaveExpiryMonths,
        defaultInhaldagenDays,
        inhaldagenEligibleYears,
        inhaldagenExpiryMonths,
        activePeriodYear,
        maxAccumulatedDays,
      });
      if (res.success) {
        toast.success(res.message || "Kebijakan cuti berhasil disimpan.");
        loadSettings();
      } else {
        toast.error(res.message || "Gagal menyimpan kebijakan cuti.");
      }
    });
  };

  // Save Company Profile & Signers
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
        toast.success(res.message || "Profil perusahaan & penandatangan berhasil disimpan.");
        loadSettings();
      } else {
        toast.error(res.message || "Gagal menyimpan profil perusahaan.");
      }
    });
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak sesuai.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Kata sandi minimal harus 6 karakter.");
      return;
    }

    startTransition(async () => {
      const res = await changeUserPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (res.success) {
        toast.success(res.message || "Kata sandi akun Anda berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.message || "Gagal memperbarui kata sandi.");
      }
    });
  };

  // Download JSON Backup
  const handleExportBackup = async () => {
    startTransition(async () => {
      const res = await exportSystemBackupDataAction();
      if (res.success && res.data) {
        const { fileName, jsonContent } = res.data;
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Cadangan data ${fileName} berhasil diunduh.`);
      } else {
        toast.error(res.message || "Gagal membuat berkas cadangan.");
      }
    });
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi kebijakan kuota cuti, profil unit PG Trangkil, pejabat penandatangan, keamanan akun, dan backup data.
          </p>
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={loadSettings}
          disabled={isLoadingSettings}
          className="gap-1.5 self-start sm:self-center font-medium"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSettings ? "animate-spin" : ""}`} />
          Segarkan Data
        </Button>
      </div>

      {/* Tabs Switcher Segmented */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg border border-slate-200/80 overflow-x-auto w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("POLICY")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "POLICY"
              ? "bg-white text-[#0084c7] font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          1. Kebijakan & Kuota Cuti
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PROFILE")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "PROFILE"
              ? "bg-white text-[#0084c7] font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          2. Profil & Penandatangan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SECURITY")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "SECURITY"
              ? "bg-white text-[#0084c7] font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          3. Keamanan & Akun Saya
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BACKUP")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "BACKUP"
              ? "bg-white text-[#0084c7] font-bold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          4. Backup & Pemeliharaan
        </button>
      </div>

      {isLoadingSettings ? (
        <div className="flex items-center justify-center p-16 gap-2 text-xs text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#0084c7]" />
          Memuat konfigurasi sistem...
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: KEBIJAKAN & KUOTA CUTI                            */}
          {/* ======================================================== */}
          {activeTab === "POLICY" && (
            <form onSubmit={handleSavePolicy} className="space-y-6">
              {/* 1. CUTI TAHUNAN */}
              <Card className="border-slate-200/85 shadow-2xs">
                <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#0084c7]" />
                    1. Kebijakan Cuti Tahunan (Annual Leave)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Aturan dasar hak cuti tahunan reguler bagi seluruh karyawan (Pimpinan & Pelaksana).
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Standar Saldo Tahunan */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Default Saldo Kuota (Hari / Periode)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={defaultAnnualDays}
                        onChange={(e) => setDefaultAnnualDays(Number(e.target.value))}
                        className="h-9 text-xs font-mono font-bold text-[#0084c7]"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Standar umum: 12 hari kerja per tahun.</p>
                    </div>

                    {/* Syarat Masa Kerja Tahunan */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Diberikan Setelah Masa Kerja (Tahun)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={annualEligibleYears}
                        onChange={(e) => setAnnualEligibleYears(Number(e.target.value))}
                        className="h-9 text-xs font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Masa kerja minimal karyawan sebelum berhak cuti (standar: 1 th).</p>
                    </div>

                    {/* Masa Berlaku / Expired Tahunan */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Masa Berlaku / Expired (Bulan)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={36}
                        value={annualExpiryMonths}
                        onChange={(e) => setAnnualExpiryMonths(Number(e.target.value))}
                        className="h-9 text-xs font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Masa kedaluwarsa saldo tahunan (standar: 12 bulan / 1 periode).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. CUTI BESAR / PANJANG */}
              <Card className="border-slate-200/85 shadow-2xs">
                <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-indigo-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                    2. Kebijakan Cuti Besar / Cuti Panjang (Long Leave)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Hak istirahat panjang berkala yang diberikan setiap siklus masa kerja tertentu.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Standar Saldo Cuti Besar */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Default Saldo Kuota (Hari)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={defaultLongLeaveDays}
                        onChange={(e) => setDefaultLongLeaveDays(Number(e.target.value))}
                        className="h-9 text-xs font-mono font-bold text-indigo-700"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Standar umum: 22 hari kerja.</p>
                    </div>

                    {/* Siklus Interval Masa Kerja */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Diberikan Setiap Kelipatan (Tahun)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={longLeaveIntervalYears}
                        onChange={(e) => setLongLeaveIntervalYears(Number(e.target.value))}
                        className="h-9 text-xs font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Diberikan setiap kelipatan 6 tahun masa dinas.</p>
                    </div>

                    {/* Masa Berlaku / Expired Cuti Besar */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Masa Berlaku / Expired (Bulan)
                      </Label>
                      <Input
                        type="number"
                        min={12}
                        max={120}
                        value={longLeaveExpiryMonths}
                        onChange={(e) => setLongLeaveExpiryMonths(Number(e.target.value))}
                        className="h-9 text-xs font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Masa berlaku saldo cuti besar (standar: 72 bulan / 6 tahun).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. CUTI INHALDAGEN (KHUSUS PIMPINAN) */}
              <Card className="border-slate-200/85 shadow-2xs">
                <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-amber-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-amber-600" />
                    3. Kebijakan Cuti Inhaldagen (Khusus Karyawan Pimpinan)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pengganti hari libur/dinas khusus bagi pejabat dan karyawan tingkat pimpinan.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Standar Saldo Inhaldagen */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Default Saldo Kuota (Hari / Periode)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={defaultInhaldagenDays}
                        onChange={(e) => setDefaultInhaldagenDays(Number(e.target.value))}
                        className="h-9 text-xs font-mono font-bold text-amber-700"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Standar kuota inhaldagen (misal: 6 hari).</p>
                    </div>

                    {/* Syarat Masa Kerja Inhaldagen */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Syarat Masa Kerja (Tahun)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={inhaldagenEligibleYears}
                        onChange={(e) => setInhaldagenEligibleYears(Number(e.target.value))}
                        className="h-9 text-xs font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-400">0 = langsung aktif saat menjabat pimpinan.</p>
                    </div>

                    {/* Masa Berlaku Inhaldagen */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Masa Berlaku / Expired (Bulan)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={36}
                        value={inhaldagenExpiryMonths}
                        onChange={(e) => setInhaldagenExpiryMonths(Number(e.target.value))}
                        className="h-9 text-xs font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Masa kedaluwarsa saldo inhaldagen (standar: 12 bulan).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4. PERIODE & AKUMULASI */}
              <Card className="border-slate-200/85 shadow-2xs">
                <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-emerald-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    4. Ketentuan Periode & Batas Akumulasi Saldo Total
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pengaturan periode aktif operasional sistem dan pagu maksimum simpan saldo.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tahun Periode Aktif */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Periode Tahun Berjalan Aktif
                      </Label>
                      <Input
                        type="number"
                        value={activePeriodYear}
                        onChange={(e) => setActivePeriodYear(Number(e.target.value))}
                        className="h-9 text-xs font-mono font-bold text-slate-900"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Tahun acuan buku saldo saat ini.</p>
                    </div>

                    {/* Batas Maksimum Akumulasi */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Maksimum Akumulasi Saldo Total (Hari)
                      </Label>
                      <Input
                        type="number"
                        value={maxAccumulatedDays}
                        onChange={(e) => setMaxAccumulatedDays(Number(e.target.value))}
                        className="h-9 text-xs font-mono font-bold text-emerald-700"
                        required
                      />
                      <p className="text-[11px] text-slate-400">Batas atas akumulasi seluruh jenis saldo per karyawan.</p>
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
                      Simpan Seluruh Kebijakan Cuti
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PROFIL PERUSAHAAN & PENANDATANGAN                 */}
          {/* ======================================================== */}
          {activeTab === "PROFILE" && (
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

                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-[#0084c7]" />
                      Pejabat Penandatangan Dokumen Cuti (SDM)
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
          )}

          {/* ======================================================== */}
          {/* TAB 3: KEAMANAN & AKUN SAYA                              */}
          {/* ======================================================== */}
          {activeTab === "SECURITY" && (
            <div className="space-y-6">
              {/* Profil User Saat Ini */}
              <Card className="border-slate-200/85 shadow-2xs">
                <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#0084c7]" />
                    Informasi Akun Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] text-slate-400">Username Login</p>
                      <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                        @{settingsData?.currentUser.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Nama Lengkap</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        {settingsData?.currentUser.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Tingkat Akses / Role</p>
                      <Badge variant="default" className="mt-1 text-[10px]">
                        {settingsData?.currentUser.role === "ADMIN_UTAMA" ? "Admin Utama (ALL)" : "Admin Bagian"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Ganti Password */}
              <form onSubmit={handleChangePassword}>
                <Card className="border-slate-200/85 shadow-2xs">
                  <CardHeader className="py-3.5 px-5 bg-slate-50/60 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#0084c7]" />
                      Ubah Kata Sandi (Ganti Password)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Pastikan menggunakan kombinasi kata sandi yang aman dan tidak mudah ditebak.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1.5 max-w-md">
                      <Label className="text-xs font-semibold text-slate-700">Kata Sandi Saat Ini</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan kata sandi lama"
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Kata Sandi Baru</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="h-9 text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="h-9 text-xs"
                          required
                        />
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
                        Perbarui Kata Sandi
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: BACKUP & PEMELIHARAAN DATA                        */}
          {/* ======================================================== */}
          {activeTab === "BACKUP" && (
            <div className="space-y-6">
              {/* Status Sistem & Metrik Database (Standar Global Konsisten) */}
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
                  value={`${settingsData?.systemMetrics.totalActivities || 0} Record`}
                  subtitle="Tabel aktivitas_saldo"
                  icon={FileCheck2}
                  variant="sky"
                />

                <StatCard
                  title="Versi Aplikasi"
                  value={settingsData?.systemMetrics.appVersion || "v1.0.0"}
                  subtitle="Next.js 14 App Router"
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
          )}
        </>
      )}
    </div>
  );
}
