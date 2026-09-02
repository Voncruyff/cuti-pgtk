"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImg, PixelCrop } from "@/lib/utils/image-crop";
import { toast } from "sonner";

interface ModalCropFotoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onSaveCroppedImage: (file: File) => Promise<boolean | void>;
  onChangeImageFile?: (file: File) => void;
}

export function ModalCropFoto({
  open,
  onOpenChange,
  imageSrc,
  onSaveCroppedImage,
}: ModalCropFotoProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Gagal memproses area pemotongan foto.");
      return;
    }

    try {
      setIsProcessing(true);

      // Potong dan kompresi gambar agar selalu di bawah 1 MB
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        "avatar-profile.webp",
        512
      );

      // Verifikasi ukuran berkas
      if (croppedFile.size > 1024 * 1024) {
        toast.error("Ukuran foto melebihi 1 MB. Harap sesuaikan kembali.");
        setIsProcessing(false);
        return;
      }

      const success = await onSaveCroppedImage(croppedFile);
      if (success !== false) {
        onOpenChange(false);
        handleReset();
      }
    } catch (err: any) {
      console.error("Gagal menyimpan foto crop:", err);
      toast.error(err.message || "Terjadi kesalahan saat memotong dan mengompresi foto.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm sm:max-w-md p-5"
        onClose={() => {
          if (!isProcessing) {
            onOpenChange(false);
            handleReset();
          }
        }}
      >
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base font-bold text-slate-900">
            Sesuaikan Foto Profil
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Geser dan atur perbesaran untuk posisi terbaik.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Area Interaktif Cropper dengan mask lingkaran */}
          <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner border border-slate-200">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                minZoom={1}
                maxZoom={3}
                classes={{
                  containerClassName: "rounded-2xl",
                  cropAreaClassName: "!border-2 !border-sky-400 !shadow-2xl",
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                Tidak ada gambar yang dipilih
              </div>
            )}
          </div>

          {/* Kontrol Minimalis: Slider Zoom + Tombol Putar */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <ZoomOut className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-label="Zoom"
              disabled={isProcessing}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0084c7]"
            />
            <ZoomIn className="h-4 w-4 text-slate-400 shrink-0" />

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              disabled={isProcessing}
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
              title="Putar 90°"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              handleReset();
            }}
            disabled={isProcessing}
            className="cursor-pointer text-xs h-9 px-4 rounded-lg font-medium text-slate-600"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isProcessing || !imageSrc}
            className="font-semibold shadow-xs gap-1.5 cursor-pointer text-xs h-9 px-4 rounded-lg bg-[#0084c7] hover:bg-[#0073ad] text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Simpan Foto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
