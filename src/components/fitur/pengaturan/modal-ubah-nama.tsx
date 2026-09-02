"use client";

import React, { useState, useEffect, useTransition } from "react";
import { User, Loader2, Check } from "lucide-react";
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
import { updateUserProfileInfoAction } from "@/actions/aksi-pengaturan";

interface ModalUbahNamaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFullName: string;
  currentUsername: string;
  onSuccess: (newFullName: string) => void;
}

export function ModalUbahNama({
  open,
  onOpenChange,
  currentFullName,
  currentUsername,
  onSuccess,
}: ModalUbahNamaProps) {
  const [fullName, setFullName] = useState(currentFullName);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setFullName(currentFullName);
    }
  }, [open, currentFullName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      toast.error("Nama minimal 2 karakter.");
      return;
    }

    if (cleanName === currentFullName) {
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfileInfoAction({
        username: currentUsername,
        fullName: cleanName,
      });

      if (res.success) {
        toast.success(res.message || "Nama berhasil diperbarui!");
        onSuccess(cleanName);
        onOpenChange(false);
      } else {
        toast.error(res.message || "Gagal memperbarui nama.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-5 sm:p-6"
        onClose={() => {
          if (!isPending) {
            onOpenChange(false);
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5 text-[#0084c7]" />
              Ubah Nama
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui nama akun Anda yang digunakan pada sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="input-modal-fullName" className="text-xs font-semibold text-slate-700">
              Nama
            </Label>
            <Input
              id="input-modal-fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Janoko"
              className="h-9 text-xs font-medium"
              disabled={isPending}
              required
              autoFocus
            />
          </div>

          <DialogFooter className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="cursor-pointer text-xs h-9 px-4 rounded-lg font-medium text-slate-600"
            >
              Batal
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="font-semibold shadow-xs gap-1.5 cursor-pointer text-xs h-9 px-4 rounded-lg bg-[#0084c7] hover:bg-[#0073ad] text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
