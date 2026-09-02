"use client";

import React, { useState, useCallback, useRef } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Upload,
  Loader2,
  Check,
  Image as ImageIcon,
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
  onChangeImageFile,
}: ModalCropFotoProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputAltRef = useRef<HTMLInputElement>(null);

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

  const handleSelectAlternativeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.");
      return;
    }

    if (onChangeImageFile) {
      onChangeImageFile(file);
      handleReset();
    }

    if (fileInputAltRef.current) {
      fileInputAltRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md sm:max-w-lg p-5 sm:p-6"
        onClose={() => {
          if (!isProcessing) {
            onOpenChange(false);
            handleReset();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900">
            <ImageIcon className="h-5 w-5 text-[#0084c7]" />
            Atur & Potong Foto Profil
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Geser posisi, sesuaikan zoom, atau putar gambar untuk mendapatkan tampilan avatar lingkaran yang sempurna.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {/* Area Interaktif Cropper dengan mask lingkaran */}
          <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden bg-slate-950/90 shadow-inner border border-slate-200">
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
                  containerClassName: "rounded-xl",
                  cropAreaClassName: "!border-2 !border-sky-400 !shadow-2xl",
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                Tidak ada gambar yang dipilih
              </div>
            )}
          </div>

          {/* Kontrol Zoom (Slider) */}
          <div className="space-y-1.5 bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ZoomIn className="h-3.5 w-3.5 text-[#0084c7]" />
                Perbesaran (Zoom)
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-500">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.2).toFixed(1)))}
                disabled={zoom <= 1 || isProcessing}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-40 cursor-pointer transition-colors"
                title="Perkecil"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

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

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.2).toFixed(1)))}
                disabled={zoom >= 3 || isProcessing}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-40 cursor-pointer transition-colors"
                title="Perbesar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bar Tombol Alat Bantu (Rotasi, Reset, Pilih File Lain) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotate}
                disabled={isProcessing}
                className="h-8 text-xs font-semibold gap-1.5 text-slate-700 cursor-pointer hover:bg-sky-50 hover:text-[#0084c7]"
              >
                <RotateCw className="h-3.5 w-3.5 text-slate-500" />
                Putar 90°
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isProcessing || (zoom === 1 && rotation === 0 && crop.x === 0 && crop.y === 0)}
                className="h-8 text-xs font-semibold gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>

            {onChangeImageFile && (
              <>
                <input
                  type="file"
                  ref={fileInputAltRef}
                  onChange={handleSelectAlternativeFile}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputAltRef.current?.click()}
                  disabled={isProcessing}
                  className="h-8 text-xs font-semibold gap-1.5 text-slate-700 hover:bg-slate-100 cursor-pointer border-dashed"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  Ganti Berkas
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Info Ukuran & Format */}
        <div className="bg-sky-50/70 border border-sky-100 rounded-lg px-3 py-2 text-[11px] text-sky-800 flex items-center justify-between">
          <span className="font-medium">Otomatis dioptimasi: Format WebP (512×512)</span>
          <span className="font-bold text-[#0084c7] bg-white px-2 py-0.5 rounded shadow-2xs">
            Ukuran &lt; 1 MB
          </span>
        </div>

        <DialogFooter className="mt-4 pt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              handleReset();
            }}
            disabled={isProcessing}
            className="cursor-pointer text-xs"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isProcessing || !imageSrc}
            className="font-semibold shadow-xs gap-1.5 cursor-pointer text-xs bg-[#0084c7] hover:bg-[#0073ad] text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Mengompresi & Menyimpan...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Terapkan & Simpan Foto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
