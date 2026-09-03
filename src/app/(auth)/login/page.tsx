"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, LoginInput } from "@/lib/validation/auth-schema";
import { loginAction } from "@/actions/aksi-autentikasi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
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
        toast.success("Login berhasil.");
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
    <div className="flex min-h-screen items-center justify-center bg-[#F3F6F8] text-[#263238] p-4 relative overflow-hidden selection:bg-[#0789D1]/20 selection:text-[#005B96]">
      {/* Calm Non-Neon Ambient Glow Blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-[#0789D1]/10 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -right-32 w-[28rem] h-[28rem] bg-[#005B96]/8 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-1/3 w-80 h-80 bg-[#E8F5FC]/70 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Main Card with Subtle Glassmorphism */}
        <Card className="border-[#E8F5FC] shadow-[0_10px_40px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-b from-[#E8F5FC]/50 via-white to-transparent border-b border-[#E8F5FC]/80">
            <div className="w-full max-w-[240px] h-[38px] mx-auto mb-2.5 flex items-center justify-center">
              <Image
                src="/assets/PGTrangkilLogo.png"
                alt="PT Kebon Agung - PG Trangkil"
                width={240}
                height={38}
                priority
                className="h-9 w-auto max-w-[240px] object-contain mx-auto"
              />
            </div>
            <CardTitle className="text-base font-black text-[#263238] tracking-tight">
              Sistem Informasi Pengelolaan Cuti
            </CardTitle>
            <CardDescription className="text-xs text-[#6B7280] font-medium">
              SIP-CUTI — Pimpinan & Pelaksana
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 pb-6 px-6">
            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username field */}
              <div className="space-y-1.5">
                <Label htmlFor="username" required className="text-[#263238] font-medium text-xs">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6B7280]" />
                  <Input
                    id="username"
                    type="text"
                    autoFocus
                    autoComplete="username"
                    placeholder="Masukkan username"
                    className="pl-8"
                    disabled={isPending}
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-[11px] text-rose-700">{errors.username.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" required className="text-[#263238] font-medium text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6B7280]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="pl-8 pr-9"
                    disabled={isPending}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-2.5 text-[#6B7280] hover:text-[#263238] focus:outline-none cursor-pointer"
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
                  <p className="text-[11px] text-rose-700">{errors.password.message}</p>
                )}
              </div>

              {/* Submit button using Biru Utama (#0789D1) */}
              <Button
                type="submit"
                className="w-full mt-2 h-10 font-semibold bg-[#0789D1] hover:bg-[#005B96] text-white rounded-xl shadow-xs transition-colors"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Development Helper Badge */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-4 rounded-2xl border border-[#E8F5FC] bg-white/90 backdrop-blur-md p-3 text-[11px] text-[#6B7280] text-center shadow-xs">
            <p className="font-semibold text-[#263238] mb-1.5">Akun Pengujian (Database MySQL):</p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-left">
              <div className="bg-[#F3F6F8] p-2 rounded-xl border border-[#E8F5FC]">
                <span className="font-semibold block text-[#005B96] font-sans">Admin Utama (ALL)</span>
                <span className="text-[#263238]">admin</span> / <span className="text-[#6B7280]">admin123</span>
              </div>
              <div className="bg-[#F3F6F8] p-2 rounded-xl border border-[#E8F5FC]">
                <span className="font-semibold block text-[#0789D1] font-sans">Admin Bagian A</span>
                <span className="text-[#263238]">admin_a</span> / <span className="text-[#6B7280]">admin123</span>
              </div>
              <div className="bg-[#F3F6F8] p-2 rounded-xl border border-[#E8F5FC]">
                <span className="font-semibold block text-[#0789D1] font-sans">Admin Bagian B</span>
                <span className="text-[#263238]">admin_b</span> / <span className="text-[#6B7280]">admin123</span>
              </div>
              <div className="bg-[#F3F6F8] p-2 rounded-xl border border-[#E8F5FC]">
                <span className="font-semibold block text-[#0789D1] font-sans">Admin Bagian C</span>
                <span className="text-[#263238]">admin_c</span> / <span className="text-[#6B7280]">admin123</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
