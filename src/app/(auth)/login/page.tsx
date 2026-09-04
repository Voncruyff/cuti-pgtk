"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  Loader2,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, LoginInput } from "@/lib/validation/auth-schema";
import { loginAction } from "@/actions/aksi-autentikasi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await loginAction(data);
      if (res.success && res.data?.redirectUrl) {
        toast.success("Login berhasil. Mengalihkan ke dashboard...");
        router.push(res.data.redirectUrl);
        router.refresh();
      } else {
        const errorText = res.message || "Username atau password tidak valid.";
        setErrorMessage(errorText);
        toast.error(errorText);
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#F3F6F8] relative overflow-x-hidden font-sans selection:bg-[#0789D1]/20 selection:text-[#005B96] py-4 px-4">
      {/* Background Calm Ambient Blobs (Style Guide Section 4.3) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0789D1]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#005B96]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-[#E8F5FC]/70 rounded-full blur-3xl" />
      </div>

      {/* Main Form Center Area */}
      <main className="w-full flex-1 flex items-center justify-center relative z-10 my-auto">
        <div className="w-full max-w-[390px]">
          {/* Main Card with Minimalist Style Guide Architecture */}
          <Card className="border border-[#E8F5FC] shadow-[0_10px_35px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-3 pt-6 px-6 sm:px-7 border-b border-[#E8F5FC] bg-white">
              <div className="w-full max-w-[240px] h-10 mx-auto flex items-center justify-center">
                <Image
                  src="/assets/PGTrangkilLogo.png"
                  alt="PT Kebon Agung - PG Trangkil"
                  width={240}
                  height={40}
                  priority
                  className="h-9 w-auto object-contain mx-auto"
                />
              </div>

              <CardTitle className="text-base sm:text-lg font-bold text-[#263238] tracking-tight mt-2.5">
                Sistem Pengelolaan Cuti
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 pb-6 px-6 sm:px-8">
              {errorMessage && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200 shadow-2xs animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                {/* Username Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[#263238] font-semibold text-xs">
                    Username
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-[#6B7280] group-focus-within:text-[#0789D1] transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      autoFocus
                      autoComplete="username"
                      placeholder="Masukkan username"
                      className="pl-9 h-10 text-xs rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-[#0789D1]/20 focus-visible:border-[#0789D1] transition-all bg-white hover:border-slate-300"
                      disabled={isPending}
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-[11px] text-red-600 font-medium">{errors.username.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[#263238] font-semibold text-xs">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6B7280] group-focus-within:text-[#0789D1] transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      className="pl-9 pr-10 h-10 text-xs rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-[#0789D1]/20 focus-visible:border-[#0789D1] transition-all bg-white hover:border-slate-300"
                      disabled={isPending}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-2.5 p-1 rounded-md text-[#6B7280] hover:text-[#263238] hover:bg-slate-100 transition-all cursor-pointer focus:outline-none"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-red-600 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full mt-1.5 h-10 font-semibold bg-[#0789D1] hover:bg-[#005B96] text-white rounded-xl shadow-xs transition-colors cursor-pointer text-xs sm:text-sm"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memverifikasi Akun...
                    </>
                  ) : (
                    "Masuk ke Sistem"
                  )}
                </Button>
              </form>

              {/* Pemisah / Divider */}
              <div className="relative my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E8F5FC]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                  <span className="bg-white px-3 text-[#6B7280]">Akses Publik Tanpa Login</span>
                </div>
              </div>

              {/* Tombol Menuju Halaman "Daftar Karyawan Cuti" */}
              <Link href="/" className="block w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 rounded-xl border border-[#E8F5FC] bg-[#F3F6F8] hover:bg-[#E8F5FC] text-[#005B96] hover:text-[#0789D1] font-semibold text-xs gap-2 transition-all shadow-2xs cursor-pointer justify-center group"
                >
                  <CalendarDays className="h-4 w-4 text-[#0789D1] transition-transform group-hover:scale-110" />
                  <span>Daftar Karyawan Cuti</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#005B96] group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Hak Cipta & Info Perusahaan */}
      <footer className="w-full text-center py-3 px-4 text-[#6B7280] text-[11px] relative z-20 shrink-0">
        <p className="font-medium text-[11px]">
          PT Kebon Agung • Pabrik Gula Trangkil Pati, Jawa Tengah
        </p>
        <p className="text-[10px] text-[#6B7280]/80 mt-0.5">
          Sistem Pengelolaan Cuti © {new Date().getFullYear()}. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}

