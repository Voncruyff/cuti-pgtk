"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Save,
  Loader2,
  Info,
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
  updateLeavePolicySettingsAction,
} from "@/actions/aksi-pengaturan";

export default function PengaturanKebijakanPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 1. Cuti Tahunan State
  const [annualAutoEnabled, setAnnualAutoEnabled] = useState(true);
  const [defaultAnnualDays, setDefaultAnnualDays] = useState(12);
  const [defaultAnnualUnit, setDefaultAnnualUnit] = useState<"HARI" | "BULAN" | "TAHUN">("HARI");
  const [annualEligibleYears, setAnnualEligibleYears] = useState(1);
  const [annualEligibleUnit, setAnnualEligibleUnit] = useState<"HARI" | "BULAN" | "TAHUN">("TAHUN");
  const [annualRepeatYears, setAnnualRepeatYears] = useState(1);
  const [annualRepeatUnit, setAnnualRepeatUnit] = useState<"HARI" | "BULAN" | "TAHUN">("TAHUN");
  const [annualExpiryYears, setAnnualExpiryYears] = useState(1);
  const [annualExpiryMonths, setAnnualExpiryMonths] = useState(12);
  const [annualExpiryUnit, setAnnualExpiryUnit] = useState<"HARI" | "BULAN" | "TAHUN">("TAHUN");
  const [annualCarryOver, setAnnualCarryOver] = useState(true);
  const [annualMaxCarryOver, setAnnualMaxCarryOver] = useState(6);
  const [annualCarryOverUnit, setAnnualCarryOverUnit] = useState<"HARI" | "BULAN" | "TAHUN">("HARI");
  const [annualStatus, setAnnualStatus] = useState<"AKTIF" | "NONAKTIF">("AKTIF");

  // 2. Cuti Besar State
  const [longLeaveAutoEnabled, setLongLeaveAutoEnabled] = useState(true);
  const [defaultLongLeaveDays, setDefaultLongLeaveDays] = useState(30);
  const [defaultLongLeaveUnit, setDefaultLongLeaveUnit] = useState<"HARI" | "BULAN" | "TAHUN">("HARI");
  const [longLeaveEligibleYears, setLongLeaveEligibleYears] = useState(6);
  const [longLeaveEligibleUnit, setLongLeaveEligibleUnit] = useState<"HARI" | "BULAN" | "TAHUN">("TAHUN");
  const [longLeaveRepeatYears, setLongLeaveRepeatYears] = useState(6);
  const [longLeaveRepeatUnit, setLongLeaveRepeatUnit] = useState<"HARI" | "BULAN" | "TAHUN">("TAHUN");
  const [longLeaveExpiryYears, setLongLeaveExpiryYears] = useState(3);
  const [longLeaveExpiryMonths, setLongLeaveExpiryMonths] = useState(36);
  const [longLeaveExpiryUnit, setLongLeaveExpiryUnit] = useState<"HARI" | "BULAN" | "TAHUN">("TAHUN");
  const [longLeaveCarryOver, setLongLeaveCarryOver] = useState(false);
  const [longLeaveMaxCarryOver, setLongLeaveMaxCarryOver] = useState(0);
  const [longLeaveCarryOverUnit, setLongLeaveCarryOverUnit] = useState<"HARI" | "BULAN" | "TAHUN">("HARI");
  const [longLeaveStatus, setLongLeaveStatus] = useState<"AKTIF" | "NONAKTIF">("AKTIF");

  // Fallbacks
  const [defaultInhaldagenDays, setDefaultInhaldagenDays] = useState(6);
  const [inhaldagenEligibleYears, setInhaldagenEligibleYears] = useState(0);
  const [inhaldagenExpiryMonths, setInhaldagenExpiryMonths] = useState(12);
  const [activePeriodYear, setActivePeriodYear] = useState(2026);
  const [maxAccumulatedDays, setMaxAccumulatedDays] = useState(36);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    const res = await getSystemSettingsAction();
    if (res.success && res.data) {
      const policy = res.data.leavePolicy;
      // Cuti Tahunan
      const annualActive = policy.annualAutoEnabled !== false && policy.annualStatus !== "NONAKTIF";
      setAnnualAutoEnabled(annualActive);
      setAnnualStatus(annualActive ? "AKTIF" : "NONAKTIF");
      setDefaultAnnualDays(policy.defaultAnnualDays ?? 12);
      setDefaultAnnualUnit(policy.defaultAnnualUnit || "HARI");
      setAnnualEligibleYears(policy.annualEligibleYears ?? 1);
      setAnnualEligibleUnit(policy.annualEligibleUnit || "TAHUN");
      setAnnualRepeatYears(policy.annualRepeatYears ?? 1);
      setAnnualRepeatUnit(policy.annualRepeatUnit || "TAHUN");
      const annualExpY = policy.annualExpiryYears ?? Math.max(1, Math.round((policy.annualExpiryMonths ?? 12) / 12));
      setAnnualExpiryYears(annualExpY);
      setAnnualExpiryMonths(policy.annualExpiryMonths ?? (annualExpY * 12));
      setAnnualExpiryUnit(policy.annualExpiryUnit || "TAHUN");
      setAnnualCarryOver(policy.annualCarryOver !== false);
      setAnnualMaxCarryOver(policy.annualMaxCarryOver ?? 6);
      setAnnualCarryOverUnit(policy.annualCarryOverUnit || "HARI");

      // Cuti Besar
      const longLeaveActive = policy.longLeaveAutoEnabled !== false && policy.longLeaveStatus !== "NONAKTIF";
      setLongLeaveAutoEnabled(longLeaveActive);
      setLongLeaveStatus(longLeaveActive ? "AKTIF" : "NONAKTIF");
      setDefaultLongLeaveDays(policy.defaultLongLeaveDays ?? 30);
      setDefaultLongLeaveUnit(policy.defaultLongLeaveUnit || "HARI");
      setLongLeaveEligibleYears(policy.longLeaveEligibleYears ?? 6);
      setLongLeaveEligibleUnit(policy.longLeaveEligibleUnit || "TAHUN");
      setLongLeaveRepeatYears(policy.longLeaveRepeatYears ?? policy.longLeaveIntervalYears ?? 6);
      setLongLeaveRepeatUnit(policy.longLeaveRepeatUnit || "TAHUN");
      const longLeaveExpY = policy.longLeaveExpiryYears ?? Math.max(1, Math.round((policy.longLeaveExpiryMonths ?? 36) / 12));
      setLongLeaveExpiryYears(longLeaveExpY);
      setLongLeaveExpiryMonths(policy.longLeaveExpiryMonths ?? (longLeaveExpY * 12));
      setLongLeaveExpiryUnit(policy.longLeaveExpiryUnit || "TAHUN");
      setLongLeaveCarryOver(policy.longLeaveCarryOver === true);
      setLongLeaveMaxCarryOver(policy.longLeaveMaxCarryOver ?? 0);
      setLongLeaveCarryOverUnit(policy.longLeaveCarryOverUnit || "HARI");

      // Fallbacks
      setDefaultInhaldagenDays(policy.defaultInhaldagenDays ?? 6);
      setInhaldagenEligibleYears(policy.inhaldagenEligibleYears ?? 0);
      setInhaldagenExpiryMonths(policy.inhaldagenExpiryMonths ?? 12);
      setActivePeriodYear(policy.activePeriodYear ?? 2026);
      setMaxAccumulatedDays(policy.maxAccumulatedDays ?? 36);
    } else {
      toast.error(res.message || "Gagal memuat ketentuan cuti.");
    }
    setIsLoadingSettings(false);
  };

  const handleSavePolicy = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    startTransition(async () => {
      const res = await updateLeavePolicySettingsAction({
        annualName: "Cuti Tahunan",
        annualAutoEnabled,
        defaultAnnualDays,
        defaultAnnualUnit,
        annualEligibleYears,
        annualEligibleUnit,
        annualRepeatYears,
        annualRepeatUnit,
        annualExpiryYears,
        annualExpiryMonths: annualExpiryUnit === "BULAN" ? annualExpiryYears : (annualExpiryYears * 12),
        annualExpiryUnit,
        annualCarryOver,
        annualMaxCarryOver,
        annualCarryOverUnit,
        annualStatus: annualAutoEnabled ? "AKTIF" : "NONAKTIF",

        longLeaveName: "Cuti Besar",
        longLeaveAutoEnabled,
        defaultLongLeaveDays,
        defaultLongLeaveUnit,
        longLeaveEligibleYears,
        longLeaveEligibleUnit,
        longLeaveIntervalYears: longLeaveRepeatYears,
        longLeaveRepeatYears,
        longLeaveRepeatUnit,
        longLeaveExpiryYears,
        longLeaveExpiryMonths: longLeaveExpiryUnit === "BULAN" ? longLeaveExpiryYears : (longLeaveExpiryYears * 12),
        longLeaveExpiryUnit,
        longLeaveCarryOver,
        longLeaveMaxCarryOver,
        longLeaveCarryOverUnit,
        longLeaveStatus: longLeaveAutoEnabled ? "AKTIF" : "NONAKTIF",

        defaultInhaldagenDays,
        inhaldagenEligibleYears,
        inhaldagenExpiryMonths,
        activePeriodYear,
        maxAccumulatedDays,
      });

      if (res.success) {
        toast.success(res.message || "Ketentuan saldo otomatis berhasil disimpan.");
        loadSettings();
      } else {
        toast.error(res.message || "Gagal menyimpan ketentuan saldo otomatis.");
      }
    });
  };

  if (isLoadingSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#0084c7]" />
          <p className="text-xs font-semibold text-slate-600">
            Memuat ketentuan saldo otomatis...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSavePolicy} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ======================================================== */}
        {/* 1. CUTI TAHUNAN                                          */}
        {/* ======================================================== */}
        <Card
          className={`border-slate-200/85 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
            !annualAutoEnabled ? "bg-slate-50/40 border-dashed" : "bg-white"
          }`}
        >
          <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/60 via-slate-50/20 to-transparent border-b border-slate-100 flex flex-row items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#0084c7]" />
                1. Saldo Otomatis Cuti Tahunan
              </CardTitle>
              <CardDescription className="text-xs">
                Pengaturan saldo otomatis cuti tahunan reguler bagi seluruh karyawan
              </CardDescription>
            </div>

            {/* Tombol ON / OFF Status Otomasi Cuti Tahunan */}
            <div className="flex items-center gap-2 shrink-0 bg-white/90 py-1.5 px-3 rounded-full border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-medium text-slate-600">
                Status Otomasi:
              </span>
              <span
                className={`text-xs font-bold transition-colors ${
                  annualAutoEnabled ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {annualAutoEnabled ? "Aktif" : "Nonaktif"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={annualAutoEnabled}
                title={annualAutoEnabled ? "Klik untuk menonaktifkan otomasi" : "Klik untuk mengaktifkan otomasi"}
                onClick={() => {
                  const next = !annualAutoEnabled;
                  setAnnualAutoEnabled(next);
                  setAnnualStatus(next ? "AKTIF" : "NONAKTIF");
                  toast.info(next ? "Otomasi Saldo Cuti Tahunan diaktifkan." : "Otomasi Saldo Cuti Tahunan dinonaktifkan.");
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0084c7] ${
                  annualAutoEnabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    annualAutoEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {!annualAutoEnabled && (
              <div className="rounded-lg bg-amber-50/90 border border-amber-200/80 p-2.5 flex items-center gap-2 text-xs text-amber-800 animate-in fade-in duration-200">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Status otomasi <strong>Nonaktif</strong>. Sistem tidak akan menambah saldo cuti secara otomatis.</span>
              </div>
            )}

            <div
              className={`space-y-3.5 transition-all duration-300 ${
                !annualAutoEnabled
                  ? "opacity-40 pointer-events-none select-none filter blur-[0.4px] grayscale-[40%]"
                  : "opacity-100"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Saldo Diberikan */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Saldo Diberikan
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={defaultAnnualDays}
                      onChange={(e) => setDefaultAnnualDays(Number(e.target.value))}
                      className="h-9 text-xs font-mono font-bold text-[#0084c7] pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={defaultAnnualUnit}
                        onChange={(e) => setDefaultAnnualUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-[#0084c7] focus:outline-none focus:ring-1 focus:ring-[#0084c7] cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Standar umum: 12 hari</p>
                </div>

                {/* Minimal Masa Kerja */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Minimal Masa Kerja
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={annualEligibleYears}
                      onChange={(e) => setAnnualEligibleYears(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={annualEligibleUnit}
                        onChange={(e) => setAnnualEligibleUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-[#0084c7] focus:outline-none focus:ring-1 focus:ring-[#0084c7] cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Syarat minimal hak cuti</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Diberikan Ulang Setiap */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Diberikan Ulang Setiap
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={annualRepeatYears}
                      onChange={(e) => setAnnualRepeatYears(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={annualRepeatUnit}
                        onChange={(e) => setAnnualRepeatUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-[#0084c7] focus:outline-none focus:ring-1 focus:ring-[#0084c7] cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Periode siklus kuota</p>
                </div>

                {/* Masa Berlaku */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Masa Berlaku
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={annualExpiryYears}
                      onChange={(e) => setAnnualExpiryYears(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={annualExpiryUnit}
                        onChange={(e) => setAnnualExpiryUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-[#0084c7] focus:outline-none focus:ring-1 focus:ring-[#0084c7] cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Masa aktif kedaluwarsa kuota</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Carry Over */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Carry Over (Sisa Saldo)
                  </Label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={annualCarryOver}
                    onClick={() => setAnnualCarryOver(!annualCarryOver)}
                    className={`h-9 w-full flex items-center justify-between px-3 rounded-md border text-xs font-semibold transition-all cursor-pointer select-none ${
                      annualCarryOver
                        ? "bg-emerald-50/60 border-emerald-300 text-emerald-700 shadow-2xs"
                        : "bg-slate-50/70 border-slate-200/80 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span>{annualCarryOver ? "Aktif" : "Tidak Aktif"}</span>
                    <span
                      className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        annualCarryOver ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          annualCarryOver ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400">Sisa saldo bisa dialihkan ke periode berikutnya</p>
                </div>

                {/* Maksimal Carry Over */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Maksimal Carry Over
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      disabled={!annualCarryOver}
                      value={annualMaxCarryOver}
                      onChange={(e) => setAnnualMaxCarryOver(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24 disabled:bg-slate-100 disabled:text-slate-400"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        disabled={!annualCarryOver}
                        value={annualCarryOverUnit}
                        onChange={(e) => setAnnualCarryOverUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-[#0084c7] focus:outline-none focus:ring-1 focus:ring-[#0084c7] disabled:opacity-50 disabled:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Maksimum sisa saldo dialihkan</p>
                </div>
              </div>
            </div>

            {/* Simpan Cuti Tahunan */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => handleSavePolicy()}
                disabled={isPending}
                size="sm"
                className="font-semibold text-xs shadow-2xs"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Simpan Cuti Tahunan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 2. CUTI BESAR / PANJANG                                  */}
        {/* ======================================================== */}
        <Card
          className={`border-slate-200/85 shadow-2xs flex flex-col justify-between transition-all duration-200 ${
            !longLeaveAutoEnabled ? "bg-slate-50/40 border-dashed" : "bg-white"
          }`}
        >
          <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-indigo-50/60 via-slate-50/20 to-transparent border-b border-slate-100 flex flex-row items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-indigo-600" />
                2. Saldo Otomatis Cuti Besar
              </CardTitle>
              <CardDescription className="text-xs">
                Pengaturan saldo otomatis istirahat panjang berkala sesuai masa kerja
              </CardDescription>
            </div>

            {/* Tombol ON / OFF Status Otomasi Cuti Besar */}
            <div className="flex items-center gap-2 shrink-0 bg-white/90 py-1.5 px-3 rounded-full border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-medium text-slate-600">
                Status Otomasi:
              </span>
              <span
                className={`text-xs font-bold transition-colors ${
                  longLeaveAutoEnabled ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {longLeaveAutoEnabled ? "Aktif" : "Nonaktif"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={longLeaveAutoEnabled}
                title={longLeaveAutoEnabled ? "Klik untuk menonaktifkan otomasi" : "Klik untuk mengaktifkan otomasi"}
                onClick={() => {
                  const next = !longLeaveAutoEnabled;
                  setLongLeaveAutoEnabled(next);
                  setLongLeaveStatus(next ? "AKTIF" : "NONAKTIF");
                  toast.info(next ? "Otomasi Saldo Cuti Besar diaktifkan." : "Otomasi Saldo Cuti Besar dinonaktifkan.");
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                  longLeaveAutoEnabled ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    longLeaveAutoEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {!longLeaveAutoEnabled && (
              <div className="rounded-lg bg-amber-50/90 border border-amber-200/80 p-2.5 flex items-center gap-2 text-xs text-amber-800 animate-in fade-in duration-200">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Status otomasi <strong>Nonaktif</strong>. Sistem tidak akan menambah saldo cuti besar secara otomatis.</span>
              </div>
            )}

            <div
              className={`space-y-3.5 transition-all duration-300 ${
                !longLeaveAutoEnabled
                  ? "opacity-40 pointer-events-none select-none filter blur-[0.4px] grayscale-[40%]"
                  : "opacity-100"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Saldo Diberikan */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Saldo Diberikan
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={defaultLongLeaveDays}
                      onChange={(e) => setDefaultLongLeaveDays(Number(e.target.value))}
                      className="h-9 text-xs font-mono font-bold text-indigo-700 pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={defaultLongLeaveUnit}
                        onChange={(e) => setDefaultLongLeaveUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Standar umum: 30 hari</p>
                </div>

                {/* Minimal Masa Kerja */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Minimal Masa Kerja
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={longLeaveEligibleYears}
                      onChange={(e) => setLongLeaveEligibleYears(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={longLeaveEligibleUnit}
                        onChange={(e) => setLongLeaveEligibleUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Syarat minimal masa dinas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Diberikan Ulang Setiap */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Diberikan Ulang Setiap
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={longLeaveRepeatYears}
                      onChange={(e) => setLongLeaveRepeatYears(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={longLeaveRepeatUnit}
                        onChange={(e) => setLongLeaveRepeatUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Setiap kelipatan masa dinas</p>
                </div>

                {/* Masa Berlaku */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Masa Berlaku
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={longLeaveExpiryYears}
                      onChange={(e) => setLongLeaveExpiryYears(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={longLeaveExpiryUnit}
                        onChange={(e) => setLongLeaveExpiryUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Masa aktif kedaluwarsa kuota</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Carry Over */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Carry Over (Sisa Saldo)
                  </Label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={longLeaveCarryOver}
                    onClick={() => setLongLeaveCarryOver(!longLeaveCarryOver)}
                    className={`h-9 w-full flex items-center justify-between px-3 rounded-md border text-xs font-semibold transition-all cursor-pointer select-none ${
                      longLeaveCarryOver
                        ? "bg-indigo-50/60 border-indigo-300 text-indigo-700 shadow-2xs"
                        : "bg-slate-50/70 border-slate-200/80 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span>{longLeaveCarryOver ? "Aktif" : "Tidak Aktif"}</span>
                    <span
                      className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        longLeaveCarryOver ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          longLeaveCarryOver ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400">Umumnya cuti besar tidak carry over</p>
                </div>

                {/* Maksimal Carry Over */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Maksimal Carry Over
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      disabled={!longLeaveCarryOver}
                      value={longLeaveMaxCarryOver}
                      onChange={(e) => setLongLeaveMaxCarryOver(Number(e.target.value))}
                      className="h-9 text-xs font-mono pr-24 disabled:bg-slate-100 disabled:text-slate-400"
                      required
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        disabled={!longLeaveCarryOver}
                        value={longLeaveCarryOverUnit}
                        onChange={(e) => setLongLeaveCarryOverUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-7 rounded border border-slate-200/80 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:opacity-50 disabled:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Maksimum sisa saldo dialihkan</p>
                </div>
              </div>
            </div>

            {/* Simpan Cuti Besar */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => handleSavePolicy()}
                disabled={isPending}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Simpan Cuti Besar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
