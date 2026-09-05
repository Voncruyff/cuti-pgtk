"use client";

import React, { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Save,
  Loader2,
  Info,
  Clock,
  Award,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSystemSettingsAction,
  updateLeavePolicySettingsAction,
} from "@/actions/aksi-pengaturan";

export function KomponenAutomasiSaldo() {
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

  // 3. Inhaldagen State (Khusus Masa Berlaku / Kedaluwarsa)
  const [inhaldagenAutoEnabled, setInhaldagenAutoEnabled] = useState(true);
  const [inhaldagenExpiryYears, setInhaldagenExpiryYears] = useState(1);
  const [inhaldagenExpiryMonths, setInhaldagenExpiryMonths] = useState(1);
  const [inhaldagenExpiryUnit, setInhaldagenExpiryUnit] = useState<"HARI" | "BULAN" | "TAHUN">("BULAN");
  const [inhaldagenStatus, setInhaldagenStatus] = useState<"AKTIF" | "NONAKTIF">("AKTIF");

  // Fallbacks
  const [defaultInhaldagenDays, setDefaultInhaldagenDays] = useState(6);
  const [inhaldagenEligibleYears, setInhaldagenEligibleYears] = useState(0);
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

      // 3. Inhaldagen (Masa Berlaku Kedaluwarsa)
      const inhaldagenActive = policy.inhaldagenAutoEnabled !== false && policy.inhaldagenStatus !== "NONAKTIF";
      setInhaldagenAutoEnabled(inhaldagenActive);
      setInhaldagenStatus(inhaldagenActive ? "AKTIF" : "NONAKTIF");
      setInhaldagenExpiryYears(policy.inhaldagenExpiryYears ?? (policy.inhaldagenExpiryMonths ?? 1));
      setInhaldagenExpiryUnit(policy.inhaldagenExpiryUnit || "BULAN");
      setInhaldagenExpiryMonths(policy.inhaldagenExpiryMonths ?? 1);
      setDefaultInhaldagenDays(policy.defaultInhaldagenDays ?? 6);
      setInhaldagenEligibleYears(policy.inhaldagenEligibleYears ?? 0);
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

        // 3. Inhaldagen
        inhaldagenName: "Cuti Inhaldagen",
        inhaldagenAutoEnabled,
        inhaldagenExpiryYears,
        inhaldagenExpiryMonths:
          inhaldagenExpiryUnit === "TAHUN"
            ? inhaldagenExpiryYears * 12
            : inhaldagenExpiryUnit === "HARI"
            ? Math.max(1, Math.round(inhaldagenExpiryYears / 30))
            : inhaldagenExpiryYears,
        inhaldagenExpiryUnit,
        inhaldagenStatus: inhaldagenAutoEnabled ? "AKTIF" : "NONAKTIF",
        defaultInhaldagenDays,
        inhaldagenEligibleYears,
        activePeriodYear,
        maxAccumulatedDays,
      });

      if (res.success) {
        toast.success(res.message || "Pengaturan berhasil disimpan.");
        loadSettings();
      } else {
        toast.error(res.message || "Gagal menyimpan pengaturan.");
      }
    });
  };

  if (isLoadingSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#0084c7]" />
          <p className="text-xs font-medium text-slate-500">
            Memuat ketentuan otomasi saldo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSavePolicy} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* ======================================================== */}
        {/* 1. CUTI TAHUNAN                                          */}
        {/* ======================================================== */}
        <Card
          className={`border transition-all duration-200 flex flex-col justify-between rounded-xl shadow-xs overflow-hidden ${
            !annualAutoEnabled
              ? "bg-slate-50/50 border-slate-200"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          {/* Card Header: Ringkas & Tidak Menumpuk */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-sky-50/50 via-white to-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0084c7] font-bold text-xs shrink-0">
                <CalendarDays className="h-4 w-4 text-[#0084c7]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">Cuti Tahunan</h3>
                <p className="text-[11px] text-slate-500 truncate">Akrual kuota otomatis tahunan</p>
              </div>
            </div>

            {/* Toggle Switch Simple */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  annualAutoEnabled ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {annualAutoEnabled ? "Aktif" : "Nonaktif"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={annualAutoEnabled}
                title={annualAutoEnabled ? "Nonaktifkan otomasi cuti tahunan" : "Aktifkan otomasi cuti tahunan"}
                onClick={() => {
                  const next = !annualAutoEnabled;
                  setAnnualAutoEnabled(next);
                  setAnnualStatus(next ? "AKTIF" : "NONAKTIF");
                  toast.info(next ? "Otomasi Cuti Tahunan diaktifkan." : "Otomasi Cuti Tahunan dinonaktifkan.");
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0084c7] ${
                  annualAutoEnabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    annualAutoEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between gap-4">
            {!annualAutoEnabled ? (
              <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 p-3 flex items-start gap-2 text-xs text-amber-800">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  Status <strong>Nonaktif</strong>. Sistem tidak akan menambah saldo tahunan secara otomatis.
                </p>
              </div>
            ) : null}

            <div
              className={`space-y-3.5 transition-all duration-200 ${
                !annualAutoEnabled ? "opacity-40 pointer-events-none select-none grayscale-[40%]" : ""
              }`}
            >
              {/* Row 1: Jumlah Kuota & Syarat Masa Kerja */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Jumlah Kuota
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#0084c7] focus-within:ring-1 focus-within:ring-[#0084c7] h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={defaultAnnualDays}
                      onChange={(e) => setDefaultAnnualDays(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-slate-800 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={defaultAnnualUnit}
                      onChange={(e) => setDefaultAnnualUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="HARI">Hari</option>
                      <option value="BULAN">Bulan</option>
                      <option value="TAHUN">Tahun</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Syarat Masa Kerja
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#0084c7] focus-within:ring-1 focus-within:ring-[#0084c7] h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={annualEligibleYears}
                      onChange={(e) => setAnnualEligibleYears(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-slate-800 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={annualEligibleUnit}
                      onChange={(e) => setAnnualEligibleUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="TAHUN">Tahun</option>
                      <option value="BULAN">Bulan</option>
                      <option value="HARI">Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Siklus Pemberian & Masa Berlaku */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Siklus Pemberian
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#0084c7] focus-within:ring-1 focus-within:ring-[#0084c7] h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={annualRepeatYears}
                      onChange={(e) => setAnnualRepeatYears(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-slate-800 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={annualRepeatUnit}
                      onChange={(e) => setAnnualRepeatUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="TAHUN">Tahun</option>
                      <option value="BULAN">Bulan</option>
                      <option value="HARI">Hari</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Masa Berlaku
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-[#0084c7] focus-within:ring-1 focus-within:ring-[#0084c7] h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={annualExpiryYears}
                      onChange={(e) => setAnnualExpiryYears(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-slate-800 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={annualExpiryUnit}
                      onChange={(e) => setAnnualExpiryUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="TAHUN">Tahun</option>
                      <option value="BULAN">Bulan</option>
                      <option value="HARI">Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Carry Over Box */}
              <div className="rounded-lg bg-slate-50/70 border border-slate-200/80 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700">Carry Over Sisa Saldo</div>
                    <div className="text-[10px] text-slate-500">Alihkan sisa saldo ke periode baru</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={annualCarryOver}
                    onClick={() => setAnnualCarryOver(!annualCarryOver)}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      annualCarryOver ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        annualCarryOver ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {annualCarryOver && (
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 animate-in fade-in-50 duration-150">
                    <span className="text-[11px] font-medium text-slate-600 shrink-0">
                      Batas Maksimal:
                    </span>
                    <div className="flex items-center rounded-md border border-slate-200 bg-white h-7 overflow-hidden w-36 shadow-2xs">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={annualMaxCarryOver}
                        onChange={(e) => setAnnualMaxCarryOver(Number(e.target.value))}
                        className="w-full h-full px-2 text-xs font-semibold text-slate-800 outline-none text-right"
                        required
                      />
                      <select
                        value={annualCarryOverUnit}
                        onChange={(e) => setAnnualCarryOverUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-full bg-slate-50 border-l border-slate-200 px-1.5 text-[10px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Simpan */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => handleSavePolicy()}
                disabled={isPending}
                size="sm"
                className="h-8 px-3 text-xs font-semibold shadow-2xs"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Simpan Cuti Tahunan
              </Button>
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* 2. CUTI BESAR / PANJANG                                  */}
        {/* ======================================================== */}
        <Card
          className={`border transition-all duration-200 flex flex-col justify-between rounded-xl shadow-xs overflow-hidden ${
            !longLeaveAutoEnabled
              ? "bg-slate-50/50 border-slate-200"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          {/* Card Header: Ringkas & Tidy */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/50 via-white to-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                <Award className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">Cuti Besar</h3>
                <p className="text-[11px] text-slate-500 truncate">Istirahat panjang kelipatan dinas</p>
              </div>
            </div>

            {/* Toggle Switch Simple */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  longLeaveAutoEnabled ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {longLeaveAutoEnabled ? "Aktif" : "Nonaktif"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={longLeaveAutoEnabled}
                title={longLeaveAutoEnabled ? "Nonaktifkan otomasi cuti besar" : "Aktifkan otomasi cuti besar"}
                onClick={() => {
                  const next = !longLeaveAutoEnabled;
                  setLongLeaveAutoEnabled(next);
                  setLongLeaveStatus(next ? "AKTIF" : "NONAKTIF");
                  toast.info(next ? "Otomasi Cuti Besar diaktifkan." : "Otomasi Cuti Besar dinonaktifkan.");
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                  longLeaveAutoEnabled ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    longLeaveAutoEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between gap-4">
            {!longLeaveAutoEnabled ? (
              <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 p-3 flex items-start gap-2 text-xs text-amber-800">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  Status <strong>Nonaktif</strong>. Sistem tidak akan menambah saldo cuti besar secara otomatis.
                </p>
              </div>
            ) : null}

            <div
              className={`space-y-3.5 transition-all duration-200 ${
                !longLeaveAutoEnabled ? "opacity-40 pointer-events-none select-none grayscale-[40%]" : ""
              }`}
            >
              {/* Row 1: Jumlah Kuota & Syarat Masa Kerja */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Jumlah Kuota
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={defaultLongLeaveDays}
                      onChange={(e) => setDefaultLongLeaveDays(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-indigo-950 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={defaultLongLeaveUnit}
                      onChange={(e) => setDefaultLongLeaveUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="HARI">Hari</option>
                      <option value="BULAN">Bulan</option>
                      <option value="TAHUN">Tahun</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Syarat Masa Kerja
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={longLeaveEligibleYears}
                      onChange={(e) => setLongLeaveEligibleYears(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-slate-800 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={longLeaveEligibleUnit}
                      onChange={(e) => setLongLeaveEligibleUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="TAHUN">Tahun</option>
                      <option value="BULAN">Bulan</option>
                      <option value="HARI">Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Siklus Pemberian & Masa Berlaku */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Siklus Pemberian
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={longLeaveRepeatYears}
                      onChange={(e) => setLongLeaveRepeatYears(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-slate-800 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={longLeaveRepeatUnit}
                      onChange={(e) => setLongLeaveRepeatUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="TAHUN">Tahun</option>
                      <option value="BULAN">Bulan</option>
                      <option value="HARI">Hari</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 block truncate">
                    Masa Berlaku
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 h-8 overflow-hidden shadow-2xs">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={longLeaveExpiryYears}
                      onChange={(e) => setLongLeaveExpiryYears(Number(e.target.value))}
                      className="w-full h-full px-2.5 text-xs font-semibold text-slate-800 bg-transparent outline-none"
                      required
                    />
                    <select
                      value={longLeaveExpiryUnit}
                      onChange={(e) => setLongLeaveExpiryUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                      className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <option value="TAHUN">Tahun</option>
                      <option value="BULAN">Bulan</option>
                      <option value="HARI">Hari</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Carry Over Box */}
              <div className="rounded-lg bg-slate-50/70 border border-slate-200/80 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700">Carry Over Sisa Saldo</div>
                    <div className="text-[10px] text-slate-500">Standar cuti besar: tanpa carry over</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={longLeaveCarryOver}
                    onClick={() => setLongLeaveCarryOver(!longLeaveCarryOver)}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      longLeaveCarryOver ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        longLeaveCarryOver ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {longLeaveCarryOver && (
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 animate-in fade-in-50 duration-150">
                    <span className="text-[11px] font-medium text-slate-600 shrink-0">
                      Batas Maksimal:
                    </span>
                    <div className="flex items-center rounded-md border border-slate-200 bg-white h-7 overflow-hidden w-36 shadow-2xs">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={longLeaveMaxCarryOver}
                        onChange={(e) => setLongLeaveMaxCarryOver(Number(e.target.value))}
                        className="w-full h-full px-2 text-xs font-semibold text-slate-800 outline-none text-right"
                        required
                      />
                      <select
                        value={longLeaveCarryOverUnit}
                        onChange={(e) => setLongLeaveCarryOverUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                        className="h-full bg-slate-50 border-l border-slate-200 px-1.5 text-[10px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer"
                      >
                        <option value="HARI">Hari</option>
                        <option value="BULAN">Bulan</option>
                        <option value="TAHUN">Tahun</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Simpan */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => handleSavePolicy()}
                disabled={isPending}
                size="sm"
                className="h-8 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Simpan Cuti Besar
              </Button>
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* 3. CUTI INHALDAGEN (KEDALUWARSA / EXPIRED SAJA)         */}
        {/* ======================================================== */}
        <Card
          className={`border transition-all duration-200 flex flex-col justify-between rounded-xl shadow-xs overflow-hidden ${
            !inhaldagenAutoEnabled
              ? "bg-slate-50/50 border-slate-200"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          {/* Card Header: Ringkas & Tidy */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/50 via-white to-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">Cuti Inhaldagen</h3>
                <p className="text-[11px] text-slate-500 truncate">Masa berlaku kompensasi piket</p>
              </div>
            </div>

            {/* Toggle Switch Simple */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  inhaldagenAutoEnabled ? "text-amber-600" : "text-slate-400"
                }`}
              >
                {inhaldagenAutoEnabled ? "Aktif" : "Nonaktif"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={inhaldagenAutoEnabled}
                title={inhaldagenAutoEnabled ? "Nonaktifkan batas kedaluwarsa inhaldagen" : "Aktifkan batas kedaluwarsa inhaldagen"}
                onClick={() => {
                  const next = !inhaldagenAutoEnabled;
                  setInhaldagenAutoEnabled(next);
                  setInhaldagenStatus(next ? "AKTIF" : "NONAKTIF");
                  toast.info(next ? "Batas Kedaluwarsa Inhaldagen diaktifkan." : "Batas Kedaluwarsa Inhaldagen dinonaktifkan.");
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  inhaldagenAutoEnabled ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    inhaldagenAutoEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex-1 flex flex-col justify-between gap-4">
            {!inhaldagenAutoEnabled ? (
              <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 p-3 flex items-start gap-2 text-xs text-amber-800">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  Batas kedaluwarsa <strong>Nonaktif</strong>. Saldo inhaldagen pimpinan tidak akan hangus otomatis.
                </p>
              </div>
            ) : null}

            <div
              className={`space-y-3.5 transition-all duration-200 ${
                !inhaldagenAutoEnabled ? "opacity-40 pointer-events-none select-none grayscale-[40%]" : ""
              }`}
            >
              {/* Input Masa Berlaku (Kedaluwarsa) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block truncate">
                  Masa Berlaku Kuota
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600 h-8 overflow-hidden shadow-2xs">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={inhaldagenExpiryYears}
                    onChange={(e) => setInhaldagenExpiryYears(Number(e.target.value))}
                    className="w-full h-full px-2.5 text-xs font-semibold text-amber-950 bg-transparent outline-none"
                    required
                  />
                  <select
                    value={inhaldagenExpiryUnit}
                    onChange={(e) => setInhaldagenExpiryUnit(e.target.value as "HARI" | "BULAN" | "TAHUN")}
                    className="h-full bg-slate-50 border-l border-slate-200 px-2 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <option value="BULAN">Bulan</option>
                    <option value="TAHUN">Tahun</option>
                    <option value="HARI">Hari</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-400">Dihitung sejak tanggal penugasan di hari libur</p>
              </div>

              {/* Tabel Ringkas Ketentuan Inhaldagen */}
              <div className="rounded-lg bg-slate-50/80 border border-slate-200/80 p-3 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Ketentuan Khusus Inhaldagen</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Penerima</span>
                    <span className="font-semibold text-slate-800">Khusus Pimpinan</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Pemberian</span>
                    <span className="font-semibold text-slate-800">Manual via Tambah Saldo</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Kedaluwarsa</span>
                    <span className="font-semibold text-amber-700">Hangus otomatis setelah batas waktu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Simpan */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => handleSavePolicy()}
                disabled={isPending}
                size="sm"
                className="h-8 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Simpan Cuti Inhaldagen
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
