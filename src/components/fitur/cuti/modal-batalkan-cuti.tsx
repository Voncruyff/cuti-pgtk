"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  RotateCcw,
  Loader2,
  CalendarDays,
  User,
  Building2,
  CheckCircle2,
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
import {
  LeaveRequestCorrectionItem,
  voidLeaveRequestAction,
} from "@/actions/aksi-koreksi";
import { formatDateIndo } from "@/lib/utils";

interface ModalBatalkanCutiProps {
  item: LeaveRequestCorrectionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalBatalkanCuti({
  item,
  isOpen,
  onClose,
  onSuccess,
}: ModalBatalkanCutiProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancelLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    startTransition(async () => {
      const res = await voidLeaveRequestAction({
        leaveRequestId: item.id,
        reason: "Dibatalkan oleh Admin",
      });

      if (res.success) {
        toast.success(res.message || "Permohonan cuti berhasil dibatalkan dan saldo telah dikembalikan.");
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Gagal membatalkan permohonan cuti.");
      }
    });
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100 pr-8">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-red-700">
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Batalkan Permohonan Cuti
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Tindakan ini akan membatalkan permohonan cuti terpilih dan mengembalikan seluruh kuota hari cuti ke saldo karyawan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCancelLeave} className="space-y-4 mt-2">
          {/* Detail Transaksi yang Dibatalkan */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-medium">Karyawan:</span>
              <span className="font-bold text-slate-900">{item.employeeName} ({item.department})</span>
            </div>
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-2 gap-2">
              <span className="text-slate-500 font-medium shrink-0">Tanggal Cuti:</span>
              <span className="font-mono text-slate-800 text-right font-semibold">
                {item.selectedDates && item.selectedDates.length > 0
                  ? item.selectedDates.join(", ")
                  : `${formatDateIndo(item.startDate)} s/d ${formatDateIndo(item.endDate)}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Keperluan:</span>
              <span className="text-slate-800 italic">{item.purpose || "-"}</span>
            </div>
          </div>

          {/* Kuota yang akan dipulihkan */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <RotateCcw className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Saldo yang akan Dipulihkan:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[10px] text-slate-500 block">Tahunan</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">+{item.annualDays} hr</span>
              </div>
              <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[10px] text-slate-500 block">Cuti Besar</span>
                <span className="font-mono font-bold text-purple-700 text-sm">+{item.longLeaveDays} hr</span>
              </div>
              <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-center">
                <span className="text-[10px] text-slate-500 block">Inhaldagen</span>
                <span className="font-mono font-bold text-blue-700 text-sm">+{item.inhaldagenDays} hr</span>
              </div>
            </div>
            <div className="text-right pt-0.5">
              <span className="text-[11px] text-emerald-800 font-medium">
                Total dikembalikan: <strong className="font-mono font-bold text-emerald-900">+{item.totalDays} hari</strong>
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="gap-1.5 h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Membatalkan Cuti...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Konfirmasi Pembatalan Cuti
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
