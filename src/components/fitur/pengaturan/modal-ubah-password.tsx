"use client";

import React, { useState, useTransition } from "react";
import { Lock, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changeUserPasswordAction } from "@/actions/aksi-pengaturan";

interface ModalUbahPasswordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModalUbahPassword({ open, onOpenChange }: ModalUbahPasswordProps) {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Kata sandi saat ini wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    startTransition(async () => {
      const res = await changeUserPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        toast.success(res.message || "Kata sandi berhasil diperbarui!");
        handleReset();
        onOpenChange(false);
      } else {
        toast.error(res.message || "Gagal mengubah kata sandi.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-5 sm:p-6"
        onClose={() => {
          if (!isPending) {
            handleReset();
            onOpenChange(false);
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900">
              <KeyRound className="h-5 w-5 text-[#0084c7]" />
              Ubah Kata Sandi Akun
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Masukkan kata sandi saat ini dan tentukan kata sandi baru untuk mengamankan akses akun Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5">
            {/* Kata Sandi Saat Ini */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Kata Sandi Saat Ini</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="h-9 text-xs pr-9"
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Kata Sandi Baru */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Kata Sandi Baru</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="h-9 text-xs pr-9"
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="h-9 text-xs pr-9"
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              disabled={isPending}
              className="cursor-pointer text-xs"
            >
              Batal
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="font-semibold shadow-xs gap-1.5 cursor-pointer text-xs bg-[#0084c7] hover:bg-[#0073ad] text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Simpan Kata Sandi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
