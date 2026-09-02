"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  Loader2,
  Camera,
  Trash2,
  UserCog,
  Building2,
  AtSign,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSystemSettingsAction,
  updateUserProfilePhotoAction,
  deleteUserProfilePhotoAction,
  SystemSettingsData,
} from "@/actions/aksi-pengaturan";
import { ModalCropFoto } from "@/components/fitur/pengaturan/modal-crop-foto";
import { ModalUbahPassword } from "@/components/fitur/pengaturan/modal-ubah-password";
import { ModalUbahNama } from "@/components/fitur/pengaturan/modal-ubah-nama";
import { ModalUbahUsername } from "@/components/fitur/pengaturan/modal-ubah-username";

export default function PengaturanKeamananPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SystemSettingsData["currentUser"] | null>(null);

  // Profile Data State
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  // Modals State
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Profile Photo State & Crop Modal
  const [isPendingPhoto, startTransitionPhoto] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropModalImage, setCropModalImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    const res = await getSystemSettingsAction();
    if (res.success && res.data) {
      const u = res.data.currentUser;
      setCurrentUser(u);
      setUsername(u.username);
      setFullName(u.fullName);
      setPhotoPreview(u.fotoProfil || null);
    } else {
      toast.error(res.message || "Gagal memuat info kredensial pengguna.");
    }
    setIsLoading(false);
  };

  // Helper inisial nama avatar jika foto tidak ada
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // 1. Tangani Pemilihan Berkas Foto -> Buka Modal Pop-up Crop
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.");
      return;
    }

    // Bersihkan URL lama jika ada
    if (cropModalImage && cropModalImage.startsWith("blob:")) {
      URL.revokeObjectURL(cropModalImage);
    }

    const localUrl = URL.createObjectURL(file);
    setCropModalImage(localUrl);
    setIsCropModalOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 2. Simpan Foto Hasil Crop & Kompresi (< 1 MB)
  const handleSaveCroppedPhoto = async (croppedFile: File): Promise<boolean> => {
    return new Promise((resolve) => {
      startTransitionPhoto(async () => {
        if (croppedFile.size > 1024 * 1024) {
          toast.error("Ukuran berkas melebihi 1 MB. Silakan kurangi ukuran foto.");
          resolve(false);
          return;
        }

        const formData = new FormData();
        formData.append("photo", croppedFile);

        const res = await updateUserProfilePhotoAction(formData);
        if (res.success && res.data) {
          setPhotoPreview(res.data.fotoProfil);
          const sizeKb = (croppedFile.size / 1024).toFixed(0);
          toast.success(`Foto profil berhasil diperbarui! (${sizeKb} KB)`);
          router.refresh();
          await loadUser();
          resolve(true);
        } else {
          toast.error(res.message || "Gagal mengunggah foto profil.");
          resolve(false);
        }
      });
    });
  };

  // 3. Hapus Foto Profil
  const handleDeletePhoto = () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus foto profil dan kembali ke avatar inisial?")) {
      return;
    }

    startTransitionPhoto(async () => {
      const res = await deleteUserProfilePhotoAction();
      if (res.success) {
        setPhotoPreview(null);
        toast.success(res.message || "Foto profil berhasil dihapus.");
        router.refresh();
        await loadUser();
      } else {
        toast.error(res.message || "Gagal menghapus foto profil.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#0084c7]" />
          <p className="text-xs font-semibold text-slate-600">
            Memuat informasi akun & keamanan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid Utama: Card Profil di Kiri & Card Edit di Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= CARD PROFIL DI KIRI ================= */}
        <Card className="lg:col-span-4 border-slate-200/80 shadow-xs overflow-hidden bg-white">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0084c7]" />
              Profil Pengguna
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Identitas avatar dan kredensial akun aktif Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 flex flex-col items-center text-center">
            {/* Avatar Interaktif dengan Ikon Kamera & Klik untuk Pop-up Crop */}
            <div
              className="relative group cursor-pointer mb-3"
              onClick={() => fileInputRef.current?.click()}
              title="Klik untuk memilih dan memotong foto profil"
            >
              <div className="w-24 h-24 rounded-full ring-4 ring-sky-50 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center transition-transform group-hover:scale-102">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={fullName || username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#0084c7] to-[#0093dc] text-white text-3xl font-extrabold flex items-center justify-center select-none shadow-inner">
                    {getInitials(fullName || username)}
                  </div>
                )}
              </div>

              {/* Overlay Hover */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white backdrop-blur-2xs">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-semibold mt-0.5">Ubah</span>
              </div>

              {/* Badge Kamera Kecil di Sudut Avatar */}
              <button
                type="button"
                aria-label="Pilih foto profil"
                className="absolute bottom-0 right-0 p-1.5 bg-[#0084c7] text-white rounded-full shadow-md hover:bg-[#0073ad] transition-colors border-2 border-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              {/* Status Loading Unggah Foto */}
              {isPendingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-2xs">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Nama Lengkap & Username */}
            <h2 className="text-base font-bold text-slate-900 leading-tight truncate max-w-full">
              {fullName || "Nama Pengguna"}
            </h2>
            <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
              @{username || "username"}
            </p>

            {/* Badges Role & Status */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 mb-4">
              <Badge
                variant={currentUser?.role === "ADMIN_UTAMA" ? "default" : "secondary"}
                className="text-[10px] px-2.5 py-0.5 font-semibold gap-1"
              >
                <Shield className="h-3 w-3" />
                {currentUser?.role === "ADMIN_UTAMA"
                  ? "Admin Utama (ALL)"
                  : `Admin Bagian ${currentUser?.department || ""}`}
              </Badge>

              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                Aktif
              </Badge>

              {currentUser?.department && (
                <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-200 gap-1 font-medium">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  {currentUser.department}
                </Badge>
              )}
            </div>

            {/* Tombol Aksi Cepat Foto Profil */}
            <div className="w-full flex flex-col gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPendingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-xs font-semibold gap-1.5 border-sky-200 text-[#0084c7] hover:bg-sky-50 cursor-pointer h-9"
              >
                <Camera className="h-3.5 w-3.5" />
                {photoPreview ? "Ganti Foto Profil" : "Unggah Foto Profil"}
              </Button>

              {photoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPendingPhoto}
                  onClick={handleDeletePhoto}
                  className="w-full text-xs font-semibold gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer h-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Foto
                </Button>
              )}
            </div>

            {/* Input Berkas Tersembunyi */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* ================= CARD INFORMASI AKUN DI KANAN ================= */}
        <div className="lg:col-span-8">
          <Card className="border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCog className="h-4 w-4 text-[#0084c7]" />
                Pengaturan Informasi Akun & Keamanan
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Kelola identitas akun, username login, serta kata sandi Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-3.5">
              {/* ITEM 1: NAMA LENGKAP & GELAR */}
              <button
                type="button"
                onClick={() => setIsNameModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-sky-50/70 hover:border-sky-300 transition-all duration-200 group cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs group-hover:border-sky-300 group-hover:bg-sky-100/50 transition-colors shrink-0">
                    <User className="h-4 w-4 text-slate-600 group-hover:text-[#0084c7]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500 truncate">
                      Nama
                    </p>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#0084c7] transition-colors truncate">
                      {fullName || "Belum diatur"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-[#0084c7] shrink-0 pl-2 transition-colors">
                  <span className="hidden sm:inline">Ubah Nama</span>
                  <div className="p-1 rounded-full group-hover:bg-sky-100 transition-colors">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>

              {/* ITEM 2: USERNAME LOGIN */}
              <button
                type="button"
                onClick={() => setIsUsernameModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-sky-50/70 hover:border-sky-300 transition-all duration-200 group cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs group-hover:border-sky-300 group-hover:bg-sky-100/50 transition-colors shrink-0">
                    <AtSign className="h-4 w-4 text-slate-600 group-hover:text-[#0084c7]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500 truncate">
                      Username Akun Login
                    </p>
                    <p className="text-xs font-bold font-mono text-slate-900 group-hover:text-[#0084c7] transition-colors truncate">
                      @{username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-[#0084c7] shrink-0 pl-2 transition-colors">
                  <span className="hidden sm:inline">Ubah Username</span>
                  <div className="p-1 rounded-full group-hover:bg-sky-100 transition-colors">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>

              {/* ITEM 3: GANTI KATA SANDI */}
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-sky-50/70 hover:border-sky-300 transition-all duration-200 group cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs group-hover:border-sky-300 group-hover:bg-sky-100/50 transition-colors shrink-0">
                    <KeyRound className="h-4 w-4 text-slate-600 group-hover:text-[#0084c7]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500 truncate">
                      Keamanan Akun
                    </p>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#0084c7] transition-colors truncate">
                      Ganti Kata Sandi Akun
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-[#0084c7] shrink-0 pl-2 transition-colors">
                  <span className="hidden sm:inline">Ubah Sandi</span>
                  <div className="p-1 rounded-full group-hover:bg-sky-100 transition-colors">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL 1: UBAH NAMA LENGKAP */}
      <ModalUbahNama
        open={isNameModalOpen}
        onOpenChange={setIsNameModalOpen}
        currentFullName={fullName}
        currentUsername={username}
        onSuccess={(newName) => {
          setFullName(newName);
          router.refresh();
        }}
      />

      {/* MODAL 2: UBAH USERNAME */}
      <ModalUbahUsername
        open={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        currentUsername={username}
        currentFullName={fullName}
        onSuccess={(newUsername) => {
          setUsername(newUsername);
          router.refresh();
        }}
      />

      {/* MODAL 3: CROP & EDIT FOTO PROFIL (< 1 MB) */}
      <ModalCropFoto
        open={isCropModalOpen}
        onOpenChange={setIsCropModalOpen}
        imageSrc={cropModalImage}
        onSaveCroppedImage={handleSaveCroppedPhoto}
      />

      {/* MODAL 4: GANTI KATA SANDI */}
      <ModalUbahPassword
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
      />
    </div>
  );
}
