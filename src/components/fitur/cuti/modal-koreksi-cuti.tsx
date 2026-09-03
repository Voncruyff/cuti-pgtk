"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Pencil,
  AlertCircle,
  Loader2,
  CalendarDays,
  User,
  Building2,
  Factory,
  Briefcase,
  CheckCircle2,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MultiDatePicker } from "@/components/bersama/pemilih-tanggal";
import { StepperHari } from "@/components/bersama/stepper-hari";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import {
  LeaveRequestCorrectionItem,
  updateLeaveRequestCorrectionAction,
} from "@/actions/aksi-koreksi";

interface ModalKoreksiCutiProps {
  item: LeaveRequestCorrectionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRequestCancel?: (item: LeaveRequestCorrectionItem) => void;
}

function parseDatesToIso(datesList?: string[]): string[] {
  if (!datesList || datesList.length === 0) return [];
  return datesList.map((str) => {
    if (str.includes("/")) {
      const parts = str.split("/");
      if (parts.length === 3) {
        const [day, m, y] = parts;
        return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    return str;
  });
}

export function ModalKoreksiCuti({
  item,
  isOpen,
  onClose,
  onSuccess,
  onRequestCancel,
}: ModalKoreksiCutiProps) {
  const [isPending, startTransition] = useTransition();

  const [requestDate, setRequestDate] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [annualDays, setAnnualDays] = useState<number>(0);
  const [longLeaveDays, setLongLeaveDays] = useState<number>(0);
  const [inhaldagenDays, setInhaldagenDays] = useState<number>(0);
  const [purpose, setPurpose] = useState<string>("");

  const isPelaksana = item?.category?.toUpperCase() === "PELAKSANA";

  // Hitung batas saldo maksimal yang tersedia untuk koreksi transaksi ini:
  // Saldo saat ini + kuota hari yang sedang dikoreksi
  const maxAnnual = (item?.currentBalances?.annual ?? 0) + (item?.annualDays ?? 0);
  const maxLongLeave = (item?.currentBalances?.longLeave ?? 0) + (item?.longLeaveDays ?? 0);
  const maxInhaldagen = isPelaksana
    ? 0
    : (item?.currentBalances?.inhaldagen ?? 0) + (item?.inhaldagenDays ?? 0);

  // Inisialisasi data saat modal dibuka
  useEffect(() => {
    if (item && isOpen) {
      const rawDate = item.requestDate ? item.requestDate.split("T")[0] : "";
      setRequestDate(rawDate);
      setSelectedDates(parseDatesToIso(item.selectedDates));
      setAnnualDays(item.annualDays || 0);
      setLongLeaveDays(item.longLeaveDays || 0);
      setInhaldagenDays(item.inhaldagenDays || 0);
      setPurpose(item.purpose || "");
    }
  }, [item, isOpen]);

  // Handler perubahan tanggal pada kalender (manual allocation)
  const handleDatesChange = (dates: string[]) => {
    setSelectedDates(dates);
    if (dates.length === 0) {
      setAnnualDays(0);
      setLongLeaveDays(0);
      setInhaldagenDays(0);
    }
  };

  const totalAllocated = annualDays + longLeaveDays + inhaldagenDays;
  const remainingAnnual = maxAnnual - (Number(annualDays) || 0);
  const remainingLongLeave = maxLongLeave - (Number(longLeaveDays) || 0);
  const remainingInhaldagen = isPelaksana ? 0 : maxInhaldagen - (Number(inhaldagenDays) || 0);
  const isAllocationMismatch = selectedDates.length > 0 && totalAllocated !== selectedDates.length;
  const isExceedingAnnual = remainingAnnual < 0;
  const isExceedingLongLeave = remainingLongLeave < 0;
  const isExceedingInhaldagen = !isPelaksana && remainingInhaldagen < 0;
  const hasInvalidAllocation = isExceedingAnnual || isExceedingLongLeave || isExceedingInhaldagen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!requestDate) {
      toast.error("Silakan isi tanggal permohonan.");
      return;
    }

    if (selectedDates.length === 0) {
      toast.error("Silakan pilih minimal 1 tanggal cuti di kalender.");
      return;
    }

    if (isAllocationMismatch) {
      toast.error(
        `Total alokasi (${totalAllocated} hari) tidak sama dengan jumlah tanggal yang dipilih (${selectedDates.length} hari).`
      );
      return;
    }

    if (hasInvalidAllocation) {
      toast.error("Alokasi cuti melebihi saldo yang tersedia!");
      return;
    }

    if (!purpose.trim()) {
      toast.error("Mohon isi alasan / keperluan cuti.");
      return;
    }

    startTransition(async () => {
      const res = await updateLeaveRequestCorrectionAction({
        activityId: item.id,
        employeeId: item.employeeId || item.employeeNumber,
        requestDate,
        selectedDates,
        annualDays: Number(annualDays) || 0,
        longLeaveDays: Number(longLeaveDays) || 0,
        inhaldagenDays: Number(inhaldagenDays) || 0,
        purpose: purpose.trim(),
      });

      if (res.success) {
        toast.success(res.message || "Koreksi permohonan cuti berhasil disimpan!");
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Gagal menyimpan koreksi permohonan cuti.");
      }
    });
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent
        onClose={onClose}
        className="max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6"
      >
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100 pr-8">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Pencil className="h-4 w-4" />
            </span>
            Koreksi Tanggal Cuti
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Perbarui tanggal cuti atau sesuaikan alokasi saldo. Perubahan hari akan otomatis menyesuaikan saldo karyawan.
          </DialogDescription>
        </DialogHeader>

        {/* Info Ringkas Karyawan */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Nama:</span>
              <span className="font-semibold text-slate-900">{item.employeeName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Bagian:</span>
              <span className="font-semibold text-slate-900">{item.department}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Factory className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Stasiun:</span>
              <span className="font-semibold text-slate-800">{item.station || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Kategori:</span>
              <Badge
                variant="secondary"
                className={`text-[10px] font-bold uppercase tracking-wider py-0 px-2 ${
                  isPelaksana
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {item.category || "PIMPINAN"}
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Kalender Multi Date Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Pilih Tanggal Cuti di Kalender (Klik tanggal untuk menambah / membatalkan):{" "}
              <span className="text-red-500">*</span>
            </Label>
            <MultiDatePicker
              selectedDates={selectedDates}
              onChange={handleDatesChange}
              disabled={isPending}
            />
          </div>

          {/* Alokasi Hari per Jenis Cuti */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                  Alokasi Hari per Jenis Cuti
                </h4>
                <p className="text-[11px] text-slate-500">
                  Bagikan kuota cuti sesuai jumlah tanggal yang dipilih
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-medium text-slate-600">
                  <span className="text-slate-400">Dipilih:</span>
                  <span className="font-bold text-blue-600">{selectedDates.length} hari</span>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xs text-[11px] font-medium transition-colors",
                    isAllocationMismatch
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "bg-emerald-50 border-emerald-300 text-emerald-800"
                  )}
                >
                  <span className="opacity-70">Alokasi:</span>
                  <span className="font-bold">{totalAllocated} hari</span>
                </div>
              </div>
            </div>

            {isAllocationMismatch && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-800">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>
                  Total alokasi ({totalAllocated} hari) belum sesuai dengan {selectedDates.length} tanggal yang dipilih.
                </span>
              </div>
            )}

            {/* Dedicated Card: Sisa Saldo Setelah Cuti */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-blue-600" />
                  Sisa Saldo Setelah Cuti
                </span>
                <span className="text-[10px] text-slate-400">
                  Otomatis terpotong sesuai alokasi
                </span>
              </div>

              <div className={`grid grid-cols-1 ${isPelaksana ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
                {/* Tahunan Stat */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100/70">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">Tahunan</span>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <motion.span
                      key={remainingAnnual}
                      initial={{ scale: 1.25, color: "#2563eb" }}
                      animate={{ scale: 1, color: "#1d4ed8" }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-bold text-blue-700"
                    >
                      <AnimatedNumber value={Math.max(0, remainingAnnual)} />
                    </motion.span>
                    <span className="text-[10px] text-slate-400">/ {maxAnnual} hr</span>
                  </div>
                </div>

                {/* Besar Stat */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 border border-purple-100/70">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">Besar</span>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <motion.span
                      key={remainingLongLeave}
                      initial={{ scale: 1.25, color: "#9333ea" }}
                      animate={{ scale: 1, color: "#7e22ce" }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-bold text-purple-700"
                    >
                      <AnimatedNumber value={Math.max(0, remainingLongLeave)} />
                    </motion.span>
                    <span className="text-[10px] text-slate-400">/ {maxLongLeave} hr</span>
                  </div>
                </div>

                {/* Inhaldagen Stat */}
                {!isPelaksana && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/70">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-700">Inhaldagen</span>
                    </div>
                    <div className="flex items-baseline gap-1 font-mono">
                      <motion.span
                        key={remainingInhaldagen}
                        initial={{ scale: 1.25, color: "#059669" }}
                        animate={{ scale: 1, color: "#047857" }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-bold text-emerald-700"
                      >
                        <AnimatedNumber value={Math.max(0, remainingInhaldagen)} />
                      </motion.span>
                      <span className="text-[10px] text-slate-400">/ {maxInhaldagen} hr</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`grid grid-cols-1 ${
                isPelaksana ? "sm:grid-cols-2" : "sm:grid-cols-3"
              } gap-2.5`}
            >
              {/* Tahunan Card */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-semibold text-slate-800">Cuti Tahunan</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    Maks {maxAnnual}
                  </span>
                </div>
                <StepperHari
                  id="annualDaysCorrection"
                  min={0}
                  max={maxAnnual}
                  value={annualDays}
                  onChange={setAnnualDays}
                  disabled={isPending}
                  isError={isExceedingAnnual}
                />
                {isExceedingAnnual && (
                  <p className="text-[10px] text-red-600 font-medium">Melebihi batas saldo!</p>
                )}
              </div>

              {/* Cuti Besar Card */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="font-semibold text-slate-800">Cuti Besar</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    Maks {maxLongLeave}
                  </span>
                </div>
                <StepperHari
                  id="longLeaveDaysCorrection"
                  min={0}
                  max={maxLongLeave}
                  value={longLeaveDays}
                  onChange={setLongLeaveDays}
                  disabled={isPending}
                  isError={isExceedingLongLeave}
                />
                {isExceedingLongLeave && (
                  <p className="text-[10px] text-red-600 font-medium">Melebihi batas saldo!</p>
                )}
              </div>

              {/* Inhaldagen Card (Hanya Pimpinan) */}
              {!isPelaksana && (
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-800">Inhaldagen</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      Maks {maxInhaldagen}
                    </span>
                  </div>
                  <StepperHari
                    id="inhaldagenDaysCorrection"
                    min={0}
                    max={maxInhaldagen}
                    value={inhaldagenDays}
                    onChange={setInhaldagenDays}
                    disabled={isPending}
                    isError={isExceedingInhaldagen}
                  />
                  {isExceedingInhaldagen && (
                    <p className="text-[10px] text-red-600 font-medium">Melebihi batas saldo!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Keperluan / Alasan Cuti */}
          <div className="space-y-1">
            <Label htmlFor="editPurpose" className="text-xs font-semibold text-slate-700">
              Alasan / Keperluan Cuti: <span className="text-red-500">*</span>
            </Label>
            <Input
              id="editPurpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isPending}
              placeholder="Contoh: Acara keluarga di luar kota"
              required
              className="h-9 text-xs font-medium bg-white"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div>
              {onRequestCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (item) {
                      onClose();
                      onRequestCancel(item);
                    }
                  }}
                  disabled={isPending}
                  className="w-full sm:w-auto h-9 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-red-600" />
                  Batalkan Cuti Ini
                </Button>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="h-9 text-xs"
              >
                Tutup
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || isAllocationMismatch || hasInvalidAllocation || selectedDates.length === 0}
                className="gap-1.5 h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
