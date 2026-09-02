"use client";

import React, { useState, useEffect, useTransition } from "react";
import { AtSign, Loader2, Check } from "lucide-react";
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

interface ModalUbahUsernameProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  currentFullName: string;
  onSuccess: (newUsername: string) => void;
}

export function ModalUbahUsername({
  open,
  onOpenChange,
  currentUsername,
  currentFullName,
  onSuccess,
}: ModalUbahUsernameProps) {
  const [username, setUsername] = useState(currentUsername);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setUsername(currentUsername);
    }
  }, [open, currentUsername]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      toast.error("Username minimal 3 karakter.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      toast.error("Username hanya boleh memuat huruf, angka, dan garis bawah (_).");
      return;
    }

    if (cleanUsername === currentUsername) {
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfileInfoAction({
        username: cleanUsername,
        fullName: currentFullName,
      });

      if (res.success) {
        toast.success(res.message || "Username berhasil diperbarui!");
        onSuccess(cleanUsername);
        onOpenChange(false);
      } else {
        toast.error(res.message || "Gagal memperbarui username.");
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
              <AtSign className="h-5 w-5 text-[#0084c7]" />
              Ubah Username Login
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui username unik akun yang digunakan untuk login ke aplikasi.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="input-modal-username" className="text-xs font-semibold text-slate-700">
              Username Baru
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">@</span>
              <Input
                id="input-modal-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="nama_pengguna"
                className="h-9 text-xs pl-7 font-mono font-bold"
                disabled={isPending}
                required
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Gunakan huruf kecil, angka, dan garis bawah (_). Minimal 3 karakter.
            </p>
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
                  Simpan Username
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
