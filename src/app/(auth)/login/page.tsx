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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        {/* Main Card */}
        <Card className="border-slate-200/90 shadow-xl rounded-2xl overflow-hidden bg-white">
          <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-b from-sky-50/70 via-white to-transparent border-b border-slate-100">
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
            <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight">
              Sistem Informasi Pengelolaan Cuti
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium">
              SIP-CUTI — Pimpinan & Pelaksana
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 pb-6 px-6">
            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username field */}
              <div className="space-y-1.5">
                <Label htmlFor="username" required>
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
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
                  <p className="text-[11px] text-red-600">{errors.username.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
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
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
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
                  <p className="text-[11px] text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full mt-2 h-10 font-medium"
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
          <div className="mt-4 rounded-md border border-slate-200 bg-white/80 p-3 text-[11px] text-slate-600 text-center shadow-2xs">
            <p className="font-semibold text-slate-800 mb-1.5">Akun Pengujian (Database MySQL):</p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-700 text-left">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                <span className="font-semibold block text-blue-700 font-sans">Admin Utama (ALL)</span>
                <span className="text-slate-800">admin</span> / <span className="text-slate-500">admin123</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                <span className="font-semibold block text-emerald-700 font-sans">Admin Bagian A</span>
                <span className="text-slate-800">admin_a</span> / <span className="text-slate-500">admin123</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                <span className="font-semibold block text-emerald-700 font-sans">Admin Bagian B</span>
                <span className="text-slate-800">admin_b</span> / <span className="text-slate-500">admin123</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                <span className="font-semibold block text-emerald-700 font-sans">Admin Bagian C</span>
                <span className="text-slate-800">admin_c</span> / <span className="text-slate-500">admin123</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
