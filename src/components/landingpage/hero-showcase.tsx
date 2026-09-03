"use client";

import { useState } from "react";
import {
  CalendarCheck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroShowcase() {
  const [activeTab, setActiveTab] = useState<"tahunan" | "besar" | "inhaldagen">("tahunan");

  const tabData = {
    tahunan: {
      nama: "Cuti Tahunan",
      saldo: "12 Hari",
      status: "Tersedia Penuh",
      deskripsi: "Hak cuti reguler 12 hari kerja per tahun kalender",
      progress: "100%",
      color: "from-sky-500 to-blue-600",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    },
    besar: {
      nama: "Cuti Besar",
      saldo: "21 Hari",
      status: "Masa Kerja 6 Tahun",
      deskripsi: "Hak istirahat panjang kelipatan 6 tahun kerja aktif",
      progress: "100%",
      color: "from-purple-500 to-indigo-600",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
    inhaldagen: {
      nama: "Inhaldagen",
      saldo: "4 Hari",
      status: "Kompensasi Kerja",
      deskripsi: "Kompensasi penugasan shift hari libur atau giling",
      progress: "80%",
      color: "from-emerald-500 to-teal-600",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
  };

  const current = tabData[activeTab];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Decorative Blur Background Glows */}
      <div className="absolute -top-6 -left-6 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Showcase Container */}
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Mock Browser Header Bar */}
        <div className="bg-slate-900/90 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
            </div>
            <span className="text-[11px] font-mono text-slate-300 ml-2 font-medium">
              sip-cuti.pgtrangkil.co.id
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live System
            </span>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-5 space-y-4">
          {/* Top User Card Simulation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#0084c7] to-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                HI
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  Hendra Indrawan, S.T.
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  NIP: 4100 • Bagian Teknik (Gilingan)
                </p>
              </div>
            </div>
            <Badge className="bg-sky-50 text-[#0084c7] border-sky-200 text-[10px] font-bold">
              PIMPINAN
            </Badge>
          </div>

          {/* Tab Switcher Simulation */}
          <div className="flex p-1 bg-slate-100/90 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("tahunan")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "tahunan"
                  ? "bg-white text-[#0084c7] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tahunan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("besar")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "besar"
                  ? "bg-white text-[#0084c7] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cuti Besar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("inhaldagen")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "inhaldagen"
                  ? "bg-white text-[#0084c7] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inhaldagen
            </button>
          </div>

          {/* Active Balance Highlight Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Sisa Saldo Kuota Aktif
                </span>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {current.saldo}
                </div>
              </div>
              <Badge variant="outline" className={`${current.badgeColor} font-bold text-[10px]`}>
                {current.status}
              </Badge>
            </div>

            <p className="text-[11px] text-slate-600">
              {current.deskripsi}
            </p>

            {/* Progress Bar Visual */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                <span>Ketersediaan Hak Cuti</span>
                <span>{current.progress}</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${current.color} rounded-full transition-all duration-500`}
                  style={{ width: current.progress }}
                />
              </div>
            </div>
          </div>

          {/* Quick Ledger Entry Item */}
          <div className="rounded-xl border border-slate-100 p-3 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Otomasi Kuota Terverifikasi
                </p>
                <p className="text-[10px] text-slate-400">
                  Sinkronisasi database MySQL realtime
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
              AKTIF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
