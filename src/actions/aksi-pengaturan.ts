"use server";

import path from "path";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, setSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import type { ActionResult } from "@/types/actions";
import { revalidatePath } from "next/cache";

export interface SystemSettingsData {
  // 1. Kebijakan Cuti
  leavePolicy: {
    // Cuti Tahunan
    annualName?: string;
    annualAutoEnabled?: boolean;
    defaultAnnualDays: number;
    annualEligibleYears: number;
    annualRepeatYears?: number;
    annualExpiryYears?: number;
    annualExpiryMonths: number;
    annualCarryOver?: boolean;
    annualMaxCarryOver?: number;
    annualStatus?: "AKTIF" | "NONAKTIF";
    defaultAnnualUnit?: "HARI" | "BULAN" | "TAHUN";
    annualEligibleUnit?: "HARI" | "BULAN" | "TAHUN";
    annualRepeatUnit?: "HARI" | "BULAN" | "TAHUN";
    annualExpiryUnit?: "HARI" | "BULAN" | "TAHUN";
    annualCarryOverUnit?: "HARI" | "BULAN" | "TAHUN";

    // Cuti Besar
    longLeaveName?: string;
    longLeaveAutoEnabled?: boolean;
    defaultLongLeaveDays: number;
    longLeaveEligibleYears: number;
    longLeaveIntervalYears: number;
    longLeaveRepeatYears?: number;
    longLeaveExpiryYears?: number;
    longLeaveExpiryMonths: number;
    longLeaveCarryOver?: boolean;
    longLeaveMaxCarryOver?: number;
    longLeaveStatus?: "AKTIF" | "NONAKTIF";
    defaultLongLeaveUnit?: "HARI" | "BULAN" | "TAHUN";
    longLeaveEligibleUnit?: "HARI" | "BULAN" | "TAHUN";
    longLeaveRepeatUnit?: "HARI" | "BULAN" | "TAHUN";
    longLeaveExpiryUnit?: "HARI" | "BULAN" | "TAHUN";
    longLeaveCarryOverUnit?: "HARI" | "BULAN" | "TAHUN";

    // Cuti Inhaldagen
    inhaldagenName?: string;
    inhaldagenAutoEnabled?: boolean;
    inhaldagenExpiryYears?: number;
    inhaldagenExpiryMonths: number;
    inhaldagenExpiryUnit?: "HARI" | "BULAN" | "TAHUN";
    inhaldagenStatus?: "AKTIF" | "NONAKTIF";
    defaultInhaldagenDays: number;
    inhaldagenEligibleYears: number;
    // Umum & Akumulasi
    activePeriodYear: number;
    maxAccumulatedDays: number;
  };
  // 2. Profil Perusahaan & Penandatangan
  companyProfile: {
    companyName: string;
    unitName: string;
    location: string;
    namaPemimpin: string;
    nipPemimpin: string;
    jabatanPemimpin: string;
    hrManagerName?: string;
    hrManagerNip?: string;
    hrManagerTitle?: string;
    generalManagerName?: string;
    generalManagerNip?: string;
  };
  // 3. User Info
  currentUser: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    department?: string | null;
    fotoProfil?: string | null;
  };
  // 4. Database Metrics
  systemMetrics: {
    totalEmployees: number;
    totalDepartments: number;
    totalStations: number;
    totalActivities: number;
    appVersion: string;
    databaseStatus: "CONNECTED" | "ERROR";
  };
}

// In-memory / persistent fallback config for company details & leave policies
let systemConfigStore = {
  leavePolicy: {
    // Cuti Tahunan
    annualName: "Cuti Tahunan",
    annualAutoEnabled: true,
    defaultAnnualDays: 12,
    annualEligibleYears: 1,
    annualRepeatYears: 1,
    annualExpiryYears: 1,
    annualExpiryMonths: 12,
    annualCarryOver: true,
    annualMaxCarryOver: 6,
    annualStatus: "AKTIF" as "AKTIF" | "NONAKTIF",
    defaultAnnualUnit: "HARI" as "HARI" | "BULAN" | "TAHUN",
    annualEligibleUnit: "TAHUN" as "HARI" | "BULAN" | "TAHUN",
    annualRepeatUnit: "TAHUN" as "HARI" | "BULAN" | "TAHUN",
    annualExpiryUnit: "TAHUN" as "HARI" | "BULAN" | "TAHUN",
    annualCarryOverUnit: "HARI" as "HARI" | "BULAN" | "TAHUN",

    // Cuti Besar
    longLeaveName: "Cuti Besar",
    longLeaveAutoEnabled: true,
    defaultLongLeaveDays: 30,
    longLeaveEligibleYears: 6,
    longLeaveIntervalYears: 6,
    longLeaveRepeatYears: 6,
    longLeaveExpiryYears: 3,
    longLeaveExpiryMonths: 36,
    longLeaveCarryOver: false,
    longLeaveMaxCarryOver: 0,
    longLeaveStatus: "AKTIF" as "AKTIF" | "NONAKTIF",
    defaultLongLeaveUnit: "HARI" as "HARI" | "BULAN" | "TAHUN",
    longLeaveEligibleUnit: "TAHUN" as "HARI" | "BULAN" | "TAHUN",
    longLeaveRepeatUnit: "TAHUN" as "HARI" | "BULAN" | "TAHUN",
    longLeaveExpiryUnit: "TAHUN" as "HARI" | "BULAN" | "TAHUN",
    longLeaveCarryOverUnit: "HARI" as "HARI" | "BULAN" | "TAHUN",

    // Inhaldagen
    inhaldagenName: "Cuti Inhaldagen",
    inhaldagenAutoEnabled: true,
    inhaldagenExpiryYears: 12,
    inhaldagenExpiryMonths: 12,
    inhaldagenExpiryUnit: "BULAN" as "HARI" | "BULAN" | "TAHUN",
    inhaldagenStatus: "AKTIF" as "AKTIF" | "NONAKTIF",
    defaultInhaldagenDays: 6,
    inhaldagenEligibleYears: 0,
    activePeriodYear: 2026,
    maxAccumulatedDays: 36,
  },
  companyProfile: {
    companyName: "PT KEBON AGUNG",
    unitName: "PABRIK GULA TRANGKIL",
    location: "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
    namaPemimpin: "Ir. Bambang Santoso, M.M.",
    nipPemimpin: "197805122003121001",
    jabatanPemimpin: "General Manager",
    hrManagerName: "Hendra Wijaya, S.E.",
    hrManagerNip: "198503152010011002",
    hrManagerTitle: "Kepala Bagian SDM & Umum",
    generalManagerName: "Ir. Bambang Santoso, M.M.",
    generalManagerNip: "197805122003121001",
  },
};

/**
 * Mengambil seluruh data pengaturan sistem dari database MySQL
 */
export async function getSystemSettingsAction(): Promise<ActionResult<SystemSettingsData>> {
  const user = await requireAuth();

  try {
    const totalEmployees = await prisma.employee.count({ where: { isActive: true } });
    const totalDepartments = await prisma.department.count({ where: { isActive: true } });
    const totalStations = await prisma.station.count({ where: { isActive: true } });
    
    let totalActivities = 0;
    try {
      const actCount: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM aktivitas_saldo`;
      totalActivities = Number(actCount[0]?.count || 0);
    } catch {
      totalActivities = 0;
    }

    // 1. Ambil Kebijakan Otomasi Saldo dari Tabel otomasi_saldo_cuti
    let annualRecord = await prisma.otomasiSaldoCuti.findUnique({
      where: { jenisCuti: "CUTI_TAHUNAN" },
    });
    let longLeaveRecord = await prisma.otomasiSaldoCuti.findUnique({
      where: { jenisCuti: "CUTI_BESAR" },
    });
    let inhaldagenRecord = await prisma.otomasiSaldoCuti.findUnique({
      where: { jenisCuti: "INHALDAGEN" },
    });

    // Inisialisasi awal ke DB jika belum ada
    if (!annualRecord) {
      annualRecord = await prisma.otomasiSaldoCuti.create({
        data: {
          jenisCuti: "CUTI_TAHUNAN",
          namaKebijakan: "Cuti Tahunan",
          isOtomatisAktif: true,
          saldoDiberikan: 12,
          satuanSaldo: "HARI",
          minMasaKerja: 1,
          satuanMasaKerja: "TAHUN",
          siklusUlang: 1,
          satuanSiklus: "TAHUN",
          masaBerlaku: 1,
          satuanBerlaku: "TAHUN",
          isCarryOver: true,
          maxCarryOver: 6,
          satuanCarryOver: "HARI",
        },
      });
    }

    if (!longLeaveRecord) {
      longLeaveRecord = await prisma.otomasiSaldoCuti.create({
        data: {
          jenisCuti: "CUTI_BESAR",
          namaKebijakan: "Cuti Besar",
          isOtomatisAktif: true,
          saldoDiberikan: 30,
          satuanSaldo: "HARI",
          minMasaKerja: 6,
          satuanMasaKerja: "TAHUN",
          siklusUlang: 6,
          satuanSiklus: "TAHUN",
          masaBerlaku: 3,
          satuanBerlaku: "TAHUN",
          isCarryOver: false,
          maxCarryOver: 0,
          satuanCarryOver: "HARI",
        },
      });
    }

    if (!inhaldagenRecord) {
      inhaldagenRecord = await prisma.otomasiSaldoCuti.create({
        data: {
          jenisCuti: "INHALDAGEN",
          namaKebijakan: "Cuti Inhaldagen",
          isOtomatisAktif: true,
          saldoDiberikan: 0,
          satuanSaldo: "HARI",
          minMasaKerja: 0,
          satuanMasaKerja: "TAHUN",
          siklusUlang: 0,
          satuanSiklus: "TAHUN",
          masaBerlaku: 12,
          satuanBerlaku: "BULAN",
          isCarryOver: false,
          maxCarryOver: 0,
          satuanCarryOver: "HARI",
        },
      });
    }

    // 2. Ambil Profil Perusahaan dari Tabel profil_perusahaan
    let profileRecord = await prisma.profilPerusahaan.findUnique({
      where: { id: "DEFAULT_PROFILE" },
    });
    if (!profileRecord) {
      profileRecord = await prisma.profilPerusahaan.create({
        data: {
          id: "DEFAULT_PROFILE",
          companyName: "PT KEBON AGUNG",
          unitName: "PABRIK GULA TRANGKIL",
          location: "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
        },
      });
    }

    // 3. Ambil Data Penandatanganan Pemimpin dari Tabel penandatanganan
    let signatoryRecord = await prisma.penandatanganan.findFirst({
      where: { kategori: "PEMIMPIN" },
    });
    if (!signatoryRecord) {
      signatoryRecord = await prisma.penandatanganan.create({
        data: {
          id: "PEMIMPIN_UTAMA",
          kategori: "PEMIMPIN",
          nama: "Ir. Bambang Santoso, M.M.",
          jabatan: "General Manager",
          urutan: 0,
        },
      });
    }

    const leavePolicy = {
      annualName: annualRecord.namaKebijakan,
      annualAutoEnabled: annualRecord.isOtomatisAktif,
      defaultAnnualDays: annualRecord.saldoDiberikan,
      defaultAnnualUnit: (annualRecord.satuanSaldo || "HARI") as "HARI" | "BULAN" | "TAHUN",
      annualEligibleYears: annualRecord.minMasaKerja,
      annualEligibleUnit: (annualRecord.satuanMasaKerja || "TAHUN") as "HARI" | "BULAN" | "TAHUN",
      annualRepeatYears: annualRecord.siklusUlang,
      annualRepeatUnit: (annualRecord.satuanSiklus || "TAHUN") as "HARI" | "BULAN" | "TAHUN",
      annualExpiryYears: annualRecord.masaBerlaku,
      annualExpiryMonths: annualRecord.satuanBerlaku === "BULAN" ? annualRecord.masaBerlaku : (annualRecord.masaBerlaku * 12),
      annualExpiryUnit: (annualRecord.satuanBerlaku || "TAHUN") as "HARI" | "BULAN" | "TAHUN",
      annualCarryOver: annualRecord.isCarryOver,
      annualMaxCarryOver: annualRecord.maxCarryOver,
      annualCarryOverUnit: (annualRecord.satuanCarryOver || "HARI") as "HARI" | "BULAN" | "TAHUN",
      annualStatus: (annualRecord.isOtomatisAktif ? "AKTIF" : "NONAKTIF") as "AKTIF" | "NONAKTIF",

      longLeaveName: longLeaveRecord.namaKebijakan,
      longLeaveAutoEnabled: longLeaveRecord.isOtomatisAktif,
      defaultLongLeaveDays: longLeaveRecord.saldoDiberikan,
      defaultLongLeaveUnit: (longLeaveRecord.satuanSaldo || "HARI") as "HARI" | "BULAN" | "TAHUN",
      longLeaveEligibleYears: longLeaveRecord.minMasaKerja,
      longLeaveEligibleUnit: (longLeaveRecord.satuanMasaKerja || "TAHUN") as "HARI" | "BULAN" | "TAHUN",
      longLeaveIntervalYears: longLeaveRecord.siklusUlang,
      longLeaveRepeatYears: longLeaveRecord.siklusUlang,
      longLeaveRepeatUnit: (longLeaveRecord.satuanSiklus || "TAHUN") as "HARI" | "BULAN" | "TAHUN",
      longLeaveExpiryYears: longLeaveRecord.masaBerlaku,
      longLeaveExpiryMonths: longLeaveRecord.satuanBerlaku === "BULAN" ? longLeaveRecord.masaBerlaku : (longLeaveRecord.masaBerlaku * 12),
      longLeaveExpiryUnit: (longLeaveRecord.satuanBerlaku || "TAHUN") as "HARI" | "BULAN" | "TAHUN",
      longLeaveCarryOver: longLeaveRecord.isCarryOver,
      longLeaveMaxCarryOver: longLeaveRecord.maxCarryOver,
      longLeaveCarryOverUnit: (longLeaveRecord.satuanCarryOver || "HARI") as "HARI" | "BULAN" | "TAHUN",
      longLeaveStatus: (longLeaveRecord.isOtomatisAktif ? "AKTIF" : "NONAKTIF") as "AKTIF" | "NONAKTIF",

      inhaldagenName: inhaldagenRecord.namaKebijakan,
      inhaldagenAutoEnabled: inhaldagenRecord.isOtomatisAktif,
      inhaldagenExpiryYears: inhaldagenRecord.masaBerlaku,
      inhaldagenExpiryMonths: inhaldagenRecord.satuanBerlaku === "TAHUN" ? inhaldagenRecord.masaBerlaku * 12 : inhaldagenRecord.masaBerlaku,
      inhaldagenExpiryUnit: (inhaldagenRecord.satuanBerlaku || "BULAN") as "HARI" | "BULAN" | "TAHUN",
      inhaldagenStatus: (inhaldagenRecord.isOtomatisAktif ? "AKTIF" : "NONAKTIF") as "AKTIF" | "NONAKTIF",
      defaultInhaldagenDays: inhaldagenRecord.saldoDiberikan || 6,
      inhaldagenEligibleYears: inhaldagenRecord.minMasaKerja || 0,
      activePeriodYear: 2026,
      maxAccumulatedDays: 36,
    };

    const companyProfile = {
      companyName: profileRecord.companyName,
      unitName: profileRecord.unitName,
      location: profileRecord.location,
      namaPemimpin: signatoryRecord.nama,
      nipPemimpin: "-",
      jabatanPemimpin: signatoryRecord.jabatan,
      hrManagerName: "Hendra Wijaya, S.E.",
      hrManagerNip: "198503152010011002",
      hrManagerTitle: "Kepala Bagian SDM & Umum",
      generalManagerName: signatoryRecord.nama,
      generalManagerNip: "-",
    };

    // Sinkronkan cache in-memory fallback
    systemConfigStore.leavePolicy = leavePolicy;
    systemConfigStore.companyProfile = companyProfile;

    // Ambil data user terkini dari database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        department: true,
        fotoProfil: true,
      },
    });

    return {
      success: true,
      data: {
        leavePolicy,
        companyProfile,
        currentUser: {
          id: dbUser?.id || user.id,
          username: dbUser?.username || user.username,
          fullName: dbUser?.fullName || user.fullName || user.username,
          role: dbUser?.role || user.role,
          department: dbUser?.department ?? user.department,
          fotoProfil: dbUser?.fotoProfil ?? null,
        },
        systemMetrics: {
          totalEmployees,
          totalDepartments,
          totalStations,
          totalActivities,
          appVersion: "SIP-CUTI v1.2.0-PRO (Build 2026.08)",
          databaseStatus: "CONNECTED",
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal memuat pengaturan sistem.",
    };
  }
}

/**
 * Memperbarui Kebijakan Cuti ke Tabel otomasi_saldo_cuti di MySQL
 */
export async function updateLeavePolicySettingsAction(payload: {
  // Cuti Tahunan
  annualName?: string;
  annualAutoEnabled?: boolean;
  defaultAnnualDays: number;
  annualEligibleYears: number;
  annualRepeatYears?: number;
  annualExpiryYears?: number;
  annualExpiryMonths?: number;
  annualCarryOver?: boolean;
  annualMaxCarryOver?: number;
  annualStatus?: "AKTIF" | "NONAKTIF";
  defaultAnnualUnit?: "HARI" | "BULAN" | "TAHUN";
  annualEligibleUnit?: "HARI" | "BULAN" | "TAHUN";
  annualRepeatUnit?: "HARI" | "BULAN" | "TAHUN";
  annualExpiryUnit?: "HARI" | "BULAN" | "TAHUN";
  annualCarryOverUnit?: "HARI" | "BULAN" | "TAHUN";

  // Cuti Besar
  longLeaveName?: string;
  longLeaveAutoEnabled?: boolean;
  defaultLongLeaveDays: number;
  longLeaveEligibleYears?: number;
  longLeaveIntervalYears?: number;
  longLeaveRepeatYears?: number;
  longLeaveExpiryYears?: number;
  longLeaveExpiryMonths?: number;
  longLeaveCarryOver?: boolean;
  longLeaveMaxCarryOver?: number;
  longLeaveStatus?: "AKTIF" | "NONAKTIF";
  defaultLongLeaveUnit?: "HARI" | "BULAN" | "TAHUN";
  longLeaveEligibleUnit?: "HARI" | "BULAN" | "TAHUN";
  longLeaveRepeatUnit?: "HARI" | "BULAN" | "TAHUN";
  longLeaveExpiryUnit?: "HARI" | "BULAN" | "TAHUN";
  longLeaveCarryOverUnit?: "HARI" | "BULAN" | "TAHUN";

  // Inhaldagen
  inhaldagenName?: string;
  inhaldagenAutoEnabled?: boolean;
  inhaldagenExpiryYears?: number;
  inhaldagenExpiryMonths?: number;
  inhaldagenExpiryUnit?: "HARI" | "BULAN" | "TAHUN";
  inhaldagenStatus?: "AKTIF" | "NONAKTIF";

  // Fallback / legacy
  defaultInhaldagenDays?: number;
  inhaldagenEligibleYears?: number;
  activePeriodYear?: number;
  maxAccumulatedDays?: number;
}): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Hanya Admin Utama yang berwenang mengubah kebijakan cuti." };
  }

  try {
    // 1. Simpan/Perbarui Cuti Tahunan di DB
    await prisma.otomasiSaldoCuti.upsert({
      where: { jenisCuti: "CUTI_TAHUNAN" },
      update: {
        namaKebijakan: payload.annualName || "Cuti Tahunan",
        isOtomatisAktif: payload.annualAutoEnabled !== undefined ? Boolean(payload.annualAutoEnabled) : true,
        saldoDiberikan: Number(payload.defaultAnnualDays) || 12,
        satuanSaldo: payload.defaultAnnualUnit || "HARI",
        minMasaKerja: Number(payload.annualEligibleYears) ?? 1,
        satuanMasaKerja: payload.annualEligibleUnit || "TAHUN",
        siklusUlang: Number(payload.annualRepeatYears) || 1,
        satuanSiklus: payload.annualRepeatUnit || "TAHUN",
        masaBerlaku: Number(payload.annualExpiryYears) || 1,
        satuanBerlaku: payload.annualExpiryUnit || "TAHUN",
        isCarryOver: payload.annualCarryOver !== undefined ? Boolean(payload.annualCarryOver) : true,
        maxCarryOver: Number(payload.annualMaxCarryOver) ?? 6,
        satuanCarryOver: payload.annualCarryOverUnit || "HARI",
      },
      create: {
        jenisCuti: "CUTI_TAHUNAN",
        namaKebijakan: payload.annualName || "Cuti Tahunan",
        isOtomatisAktif: payload.annualAutoEnabled !== undefined ? Boolean(payload.annualAutoEnabled) : true,
        saldoDiberikan: Number(payload.defaultAnnualDays) || 12,
        satuanSaldo: payload.defaultAnnualUnit || "HARI",
        minMasaKerja: Number(payload.annualEligibleYears) ?? 1,
        satuanMasaKerja: payload.annualEligibleUnit || "TAHUN",
        siklusUlang: Number(payload.annualRepeatYears) || 1,
        satuanSiklus: payload.annualRepeatUnit || "TAHUN",
        masaBerlaku: Number(payload.annualExpiryYears) || 1,
        satuanBerlaku: payload.annualExpiryUnit || "TAHUN",
        isCarryOver: payload.annualCarryOver !== undefined ? Boolean(payload.annualCarryOver) : true,
        maxCarryOver: Number(payload.annualMaxCarryOver) ?? 6,
        satuanCarryOver: payload.annualCarryOverUnit || "HARI",
      },
    });

    // 2. Simpan/Perbarui Cuti Besar di DB
    await prisma.otomasiSaldoCuti.upsert({
      where: { jenisCuti: "CUTI_BESAR" },
      update: {
        namaKebijakan: payload.longLeaveName || "Cuti Besar",
        isOtomatisAktif: payload.longLeaveAutoEnabled !== undefined ? Boolean(payload.longLeaveAutoEnabled) : true,
        saldoDiberikan: Number(payload.defaultLongLeaveDays) || 30,
        satuanSaldo: payload.defaultLongLeaveUnit || "HARI",
        minMasaKerja: Number(payload.longLeaveEligibleYears ?? payload.longLeaveIntervalYears) || 6,
        satuanMasaKerja: payload.longLeaveEligibleUnit || "TAHUN",
        siklusUlang: Number(payload.longLeaveRepeatYears ?? payload.longLeaveIntervalYears) || 6,
        satuanSiklus: payload.longLeaveRepeatUnit || "TAHUN",
        masaBerlaku: Number(payload.longLeaveExpiryYears) || 3,
        satuanBerlaku: payload.longLeaveExpiryUnit || "TAHUN",
        isCarryOver: payload.longLeaveCarryOver !== undefined ? Boolean(payload.longLeaveCarryOver) : false,
        maxCarryOver: Number(payload.longLeaveMaxCarryOver) || 0,
        satuanCarryOver: payload.longLeaveCarryOverUnit || "HARI",
      },
      create: {
        jenisCuti: "CUTI_BESAR",
        namaKebijakan: payload.longLeaveName || "Cuti Besar",
        isOtomatisAktif: payload.longLeaveAutoEnabled !== undefined ? Boolean(payload.longLeaveAutoEnabled) : true,
        saldoDiberikan: Number(payload.defaultLongLeaveDays) || 30,
        satuanSaldo: payload.defaultLongLeaveUnit || "HARI",
        minMasaKerja: Number(payload.longLeaveEligibleYears ?? payload.longLeaveIntervalYears) || 6,
        satuanMasaKerja: payload.longLeaveEligibleUnit || "TAHUN",
        siklusUlang: Number(payload.longLeaveRepeatYears ?? payload.longLeaveIntervalYears) || 6,
        satuanSiklus: payload.longLeaveRepeatUnit || "TAHUN",
        masaBerlaku: Number(payload.longLeaveExpiryYears) || 3,
        satuanBerlaku: payload.longLeaveExpiryUnit || "TAHUN",
        isCarryOver: payload.longLeaveCarryOver !== undefined ? Boolean(payload.longLeaveCarryOver) : false,
        maxCarryOver: Number(payload.longLeaveMaxCarryOver) || 0,
        satuanCarryOver: payload.longLeaveCarryOverUnit || "HARI",
      },
    });

    // 3. Simpan/Perbarui Inhaldagen di DB
    await prisma.otomasiSaldoCuti.upsert({
      where: { jenisCuti: "INHALDAGEN" },
      update: {
        namaKebijakan: payload.inhaldagenName || "Cuti Inhaldagen",
        isOtomatisAktif: payload.inhaldagenAutoEnabled !== undefined ? Boolean(payload.inhaldagenAutoEnabled) : true,
        masaBerlaku: Number(payload.inhaldagenExpiryYears) || 12,
        satuanBerlaku: payload.inhaldagenExpiryUnit || "BULAN",
      },
      create: {
        jenisCuti: "INHALDAGEN",
        namaKebijakan: payload.inhaldagenName || "Cuti Inhaldagen",
        isOtomatisAktif: payload.inhaldagenAutoEnabled !== undefined ? Boolean(payload.inhaldagenAutoEnabled) : true,
        saldoDiberikan: 0,
        satuanSaldo: "HARI",
        minMasaKerja: 0,
        satuanMasaKerja: "TAHUN",
        siklusUlang: 0,
        satuanSiklus: "TAHUN",
        masaBerlaku: Number(payload.inhaldagenExpiryYears) || 12,
        satuanBerlaku: payload.inhaldagenExpiryUnit || "BULAN",
        isCarryOver: false,
        maxCarryOver: 0,
        satuanCarryOver: "HARI",
      },
    });

    revalidatePath("/settings");
    revalidatePath("/pengaturan");
    revalidatePath("/pengaturan/automasi-saldo");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Ketentuan saldo otomatis berhasil disimpan ke database.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal menyimpan ketentuan saldo ke database.",
    };
  }
}

/**
 * Memperbarui Profil Perusahaan & Pejabat Penandatangan ke Database
 */
export async function updateCompanyProfileSettingsAction(payload: {
  companyName: string;
  unitName: string;
  location: string;
  hrManagerName?: string;
  hrManagerNip?: string;
  hrManagerTitle?: string;
  generalManagerName?: string;
  generalManagerNip?: string;
  namaPemimpin?: string;
  nipPemimpin?: string;
  jabatanPemimpin?: string;
}): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Hanya Admin Utama yang berwenang mengubah profil perusahaan." };
  }

  try {
    await prisma.profilPerusahaan.upsert({
      where: { id: "DEFAULT_PROFILE" },
      update: {
        companyName: payload.companyName.trim() || "PT KEBON AGUNG",
        unitName: payload.unitName.trim() || "PABRIK GULA TRANGKIL",
        location: payload.location.trim() || "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
      },
      create: {
        id: "DEFAULT_PROFILE",
        companyName: payload.companyName.trim() || "PT KEBON AGUNG",
        unitName: payload.unitName.trim() || "PABRIK GULA TRANGKIL",
        location: payload.location.trim() || "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
      },
    });

    const namaPemimpin = payload.namaPemimpin || payload.generalManagerName;
    if (namaPemimpin) {
      const existingPemimpin = await prisma.penandatanganan.findFirst({
        where: { kategori: "PEMIMPIN" },
      });
      if (existingPemimpin) {
        await prisma.penandatanganan.update({
          where: { id: existingPemimpin.id },
          data: {
            nama: namaPemimpin.trim(),
            jabatan: payload.jabatanPemimpin?.trim() || "General Manager",
          },
        });
      } else {
        await prisma.penandatanganan.create({
          data: {
            id: "PEMIMPIN_UTAMA",
            kategori: "PEMIMPIN",
            nama: namaPemimpin.trim(),
            jabatan: payload.jabatanPemimpin?.trim() || "General Manager",
            urutan: 0,
          },
        });
      }
    }

    revalidatePath("/settings");
    revalidatePath("/pengaturan");
    revalidatePath("/pengaturan/profil-perusahaan");
    revalidatePath("/pengaturan/penandatangan");
    revalidatePath("/laporan-cuti");

    return {
      success: true,
      message: "Profil perusahaan berhasil diperbarui ke database.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal memperbarui profil perusahaan ke database.",
    };
  }
}

/**
 * Memperbarui HANYA Profil Unit & Lokasi Pabrik Gula (Tanpa mengubah penandatangan)
 */
export async function updateCompanyProfileOnlyAction(payload: {
  companyName: string;
  unitName: string;
  location: string;
}): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Hanya Admin Utama yang berwenang mengubah profil perusahaan." };
  }

  try {
    await prisma.profilPerusahaan.upsert({
      where: { id: "DEFAULT_PROFILE" },
      update: {
        companyName: payload.companyName.trim() || "PT KEBON AGUNG",
        unitName: payload.unitName.trim() || "PABRIK GULA TRANGKIL",
        location: payload.location.trim() || "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
      },
      create: {
        id: "DEFAULT_PROFILE",
        companyName: payload.companyName.trim() || "PT KEBON AGUNG",
        unitName: payload.unitName.trim() || "PABRIK GULA TRANGKIL",
        location: payload.location.trim() || "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153",
      },
    });

    revalidatePath("/settings");
    revalidatePath("/pengaturan");
    revalidatePath("/pengaturan/profil-perusahaan");
    revalidatePath("/laporan-cuti");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Profil Perusahaan berhasil diperbarui.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal memperbarui profil perusahaan.",
    };
  }
}

/**
 * Memperbarui Data Pejabat Penandatanganan ke Tabel penandatanganan di Database
 */
export async function updateSignatoriesAction(payload: {
  namaPemimpin: string;
  jabatanPemimpin: string;
  signatories?: Array<{
    id?: string;
    departmentId: string;
    nama: string;
    jabatan: string;
  }>;
  departmentSignatories?: Array<{
    id: string;
    namaPimpinan?: string | null;
    nipPimpinan?: string | null;
    jabatanPimpinan?: string | null;
  }>;
}): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Hanya Admin Utama yang berwenang mengubah penandatanganan." };
  }

  try {
    // 1. Update Pemimpin ke tabel penandatanganan (Kategori PEMIMPIN)
    const existingLeader = await prisma.penandatanganan.findFirst({
      where: { kategori: "PEMIMPIN" },
    });
    if (existingLeader) {
      await prisma.penandatanganan.update({
        where: { id: existingLeader.id },
        data: {
          nama: payload.namaPemimpin.trim() || "Ir. Bambang Santoso, M.M.",
          jabatan: payload.jabatanPemimpin.trim() || "General Manager",
        },
      });
    } else {
      await prisma.penandatanganan.create({
        data: {
          id: "PEMIMPIN_UTAMA",
          kategori: "PEMIMPIN",
          nama: payload.namaPemimpin.trim() || "Ir. Bambang Santoso, M.M.",
          jabatan: payload.jabatanPemimpin.trim() || "General Manager",
          urutan: 0,
        },
      });
    }

    // 2. Bersihkan penandatangan bagian lama di tabel penandatanganan
    await prisma.penandatanganan.deleteMany({
      where: { kategori: "BAGIAN" },
    });

    // 3. Masukkan penandatangan bagian baru ke tabel penandatanganan
    const rawSignatories =
      payload.signatories ||
      payload.departmentSignatories?.map((d) => ({
        departmentId: d.id,
        nama: d.namaPimpinan || "",
        jabatan: d.jabatanPimpinan || "",
      })) ||
      [];

    if (rawSignatories && rawSignatories.length > 0) {
      let urutan = 1;
      for (const sig of rawSignatories) {
        if (sig.nama && sig.nama.trim() !== "") {
          await prisma.penandatanganan.create({
            data: {
              kategori: "BAGIAN",
              nama: sig.nama.trim(),
              jabatan: sig.jabatan?.trim() || "Kepala Bagian",
              departmentId: sig.departmentId || null,
              urutan: urutan++,
            },
          });
        }
      }
    }

    // 4. Sinkronkan juga field pimpinan di tabel Department (bagian)
    const allDepts = await prisma.department.findMany();
    for (const dept of allDepts) {
      const sig = rawSignatories.find((s) => s.departmentId === dept.id);
      await prisma.department.update({
        where: { id: dept.id },
        data: {
          namaPimpinan: sig?.nama?.trim() || null,
          jabatanPimpinan: sig?.jabatan?.trim() || null,
        },
      });
    }

    revalidatePath("/settings");
    revalidatePath("/pengaturan");
    revalidatePath("/pengaturan/penandatangan");
    revalidatePath("/master-bagian");
    revalidatePath("/laporan-cuti");
    revalidatePath("/dashboard");
    revalidatePath("/rincian-cuti");
    revalidatePath("/ambil-cuti");
    revalidatePath("/koreksi-cuti");
    revalidatePath("/tambah-saldo-cuti");

    return {
      success: true,
      message: "Data penandatanganan berhasil disimpan ke database.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal memperbarui data penandatanganan.",
    };
  }
}

/**
 * Mengambil Data Penandatanganan: Pemimpin dan Seluruh Penandatangan Bagian dari Tabel penandatanganan
 */
export async function getSignatoriesAction(): Promise<ActionResult<{
  leader: {
    namaPemimpin: string;
    jabatanPemimpin: string;
  };
  signatories: Array<{
    id: string;
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    nama: string;
    jabatan: string;
  }>;
  allDepartments: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  departmentSignatories: Array<{
    id: string;
    code: string;
    name: string;
    namaPimpinan: string;
    nipPimpinan: string;
    jabatanPimpinan: string;
    isActive: boolean;
  }>;
}>> {
  try {
    let leader = await prisma.penandatanganan.findFirst({
      where: {
        OR: [
          { kategori: "PEMIMPIN" },
          { id: "PEMIMPIN_UTAMA" },
        ],
      },
      orderBy: { urutan: "asc" },
    });

    if (!leader) {
      leader = await prisma.penandatanganan.create({
        data: {
          id: "PEMIMPIN_UTAMA",
          kategori: "PEMIMPIN",
          nama: "Ir. Bambang Santoso, M.M.",
          jabatan: "General Manager",
          urutan: 0,
        },
      });
    }

    const allDepts = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        namaPimpinan: true,
        nipPimpinan: true,
        jabatanPimpinan: true,
        isActive: true,
      },
    });

    const dbSignatories = await prisma.penandatanganan.findMany({
      where: {
        kategori: "BAGIAN",
      },
      orderBy: { urutan: "asc" },
      include: {
        department: true,
      },
    });

    const validSignatories = dbSignatories.filter((s) => s.department !== null || Boolean(s.departmentId));

    return {
      success: true,
      data: {
        leader: {
          namaPemimpin: leader.nama,
          jabatanPemimpin: leader.jabatan,
        },
        signatories: validSignatories.map((s) => ({
          id: s.id,
          departmentId: s.departmentId || "",
          departmentCode: s.department?.code || "",
          departmentName: s.department?.name || "",
          nama: s.nama,
          jabatan: s.jabatan,
        })),
        allDepartments: allDepts.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
        })),
        departmentSignatories: allDepts.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          namaPimpinan: d.namaPimpinan || "",
          nipPimpinan: d.nipPimpinan || "",
          jabatanPimpinan: d.jabatanPimpinan || `Kepala Bagian ${d.name}`,
          isActive: d.isActive,
        })),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal memuat data penandatanganan.",
    };
  }
}

/**
 * Mengambil Profil Perusahaan (Unit, Lokasi/Alamat, dan Pejabat Penandatangan)
 */
export async function getCompanyProfileAction(): Promise<ActionResult<{
  companyName: string;
  unitName: string;
  location: string;
  namaPemimpin: string;
  nipPemimpin: string;
  jabatanPemimpin: string;
  hrManagerName: string;
  hrManagerNip: string;
  hrManagerTitle: string;
  generalManagerName: string;
  generalManagerNip: string;
  currentUserName: string;
}>> {
  const user = await requireAuth();

  try {
    const profileRecord = await prisma.profilPerusahaan.findUnique({
      where: { id: "DEFAULT_PROFILE" },
    });
    const leaderRecord = await prisma.penandatanganan.findFirst({
      where: { kategori: "PEMIMPIN" },
    });

    const companyName = profileRecord?.companyName || "PT KEBON AGUNG";
    const unitName = profileRecord?.unitName || "PABRIK GULA TRANGKIL";
    const location = profileRecord?.location || "Trangkil Lor, Desa Trangkil, Kecamatan Trangkil, Kabupaten Pati, Jawa Tengah 59153";
    const namaPemimpin = leaderRecord?.nama || "Ir. Bambang Santoso, M.M.";
    const nipPemimpin = "-";
    const jabatanPemimpin = leaderRecord?.jabatan || "General Manager";

    return {
      success: true,
      data: {
        companyName,
        unitName,
        location,
        namaPemimpin,
        nipPemimpin,
        jabatanPemimpin,
        hrManagerName: "Hendra Wijaya, S.E.",
        hrManagerNip: "198503152010011002",
        hrManagerTitle: "Kepala Bagian SDM & Umum",
        generalManagerName: namaPemimpin,
        generalManagerNip: nipPemimpin,
        currentUserName: user.fullName || user.username || "Administrator",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal mengambil profil perusahaan.",
    };
  }
}

/**
 * Mengubah Kata Sandi Akun Pengguna yang Sedang Login
 */
export async function changeUserPasswordAction(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult<void>> {
  const user = await requireAuth();

  if (!payload.currentPassword || !payload.newPassword) {
    return { success: false, message: "Semua kolom kata sandi wajib diisi." };
  }

  if (payload.newPassword.length < 6) {
    return { success: false, message: "Kata sandi baru minimal harus 6 karakter." };
  }

  if (payload.newPassword !== payload.confirmPassword) {
    return { success: false, message: "Konfirmasi kata sandi baru tidak cocok." };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, message: "Data pengguna tidak ditemukan." };
    }

    const isMatch = await bcrypt.compare(payload.currentPassword, dbUser.passwordHash);
    if (!isMatch) {
      return { success: false, message: "Kata sandi saat ini tidak sesuai." };
    }

    const newHashed = await bcrypt.hash(payload.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHashed },
    });

    return {
      success: true,
      message: "Kata sandi akun Anda berhasil diperbarui.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal memperbarui kata sandi.",
    };
  }
}

/**
 * Memperbarui Informasi Profil Akun (Username & Nama Lengkap)
 */
export async function updateUserProfileInfoAction(payload: {
  username: string;
  fullName: string;
}): Promise<ActionResult<{ username: string; fullName: string }>> {
  const user = await requireAuth();

  const cleanUsername = payload.username.trim().toLowerCase();
  const cleanFullName = payload.fullName.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: "Username minimal 3 karakter." };
  }

  if (cleanUsername.length > 50) {
    return { success: false, message: "Username maksimal 50 karakter." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return {
      success: false,
      message: "Username hanya boleh memuat huruf, angka, dan garis bawah (_).",
    };
  }

  if (!cleanFullName || cleanFullName.length < 2) {
    return { success: false, message: "Nama lengkap minimal 2 karakter." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existing) {
      return { success: false, message: "Akun pengguna tidak ditemukan." };
    }

    // Cek duplikasi username jika username berubah
    if (cleanUsername !== existing.username.toLowerCase()) {
      const duplicate = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });
      if (duplicate && duplicate.id !== user.id) {
        return {
          success: false,
          message: `Username '${cleanUsername}' sudah digunakan oleh pengguna lain.`,
        };
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: cleanUsername,
        fullName: cleanFullName,
      },
    });

    // Sinkronkan cookie sesi peramban
    await setSessionCookie({
      id: updated.id,
      username: updated.username,
      fullName: updated.fullName,
      role: updated.role,
      department: updated.department,
      fotoProfil: updated.fotoProfil,
      isActive: updated.isActive,
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE_PROFILE",
      entityType: "USER",
      entityId: user.id,
      description: `Memperbarui profil: Username (${existing.username} -> ${updated.username}), Nama (${existing.fullName} -> ${updated.fullName}).`,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/pengaturan/keamanan-akun");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Profil akun berhasil diperbarui.",
      data: {
        username: updated.username,
        fullName: updated.fullName,
      },
    };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return {
      success: false,
      message: error.message || "Gagal memperbarui profil pengguna.",
    };
  }
}

/**
 * Mengunggah dan Memperbarui Foto Profil Pengguna
 */
export async function updateUserProfilePhotoAction(
  formData: FormData
): Promise<ActionResult<{ fotoProfil: string }>> {
  const user = await requireAuth();

  try {
    const file = formData.get("photo") as File | null;
    if (!file) {
      return { success: false, message: "Tidak ada berkas foto yang dipilih." };
    }

    // Validasi format gambar
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        message: "Format berkas tidak valid. Harap pilih gambar bertipe JPG, PNG, atau WebP.",
      };
    }

    // Validasi ukuran berkas (maksimal 1MB)
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        message: "Ukuran berkas foto melebihi batas. Maksimal 1 MB.",
      };
    }

    // Buat direktori penyimpanan jika belum ada
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile");
    await fs.mkdir(uploadDir, { recursive: true });

    // Hapus foto lama jika ada
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fotoProfil: true },
    });

    if (existing?.fotoProfil && existing.fotoProfil.startsWith("/uploads/profile/")) {
      const oldPath = path.join(process.cwd(), "public", existing.fotoProfil.replace(/^\//, ""));
      try {
        await fs.unlink(oldPath);
      } catch {
        // Abaikan jika berkas lama tidak ditemukan
      }
    }

    // Tentukan ekstensi berkas
    let ext = "jpg";
    if (file.type === "image/png") ext = "png";
    if (file.type === "image/webp") ext = "webp";

    const fileName = `avatar-${user.id}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/profile/${fileName}`;

    // Simpan path ke database
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { fotoProfil: publicUrl },
    });

    // Sinkronkan cookie sesi
    await setSessionCookie({
      id: updated.id,
      username: updated.username,
      fullName: updated.fullName,
      role: updated.role,
      department: updated.department,
      fotoProfil: publicUrl,
      isActive: updated.isActive,
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE_AVATAR",
      entityType: "USER",
      entityId: user.id,
      description: `Memperbarui foto profil akun: ${publicUrl}.`,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/pengaturan/keamanan-akun");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Foto profil berhasil diperbarui.",
      data: { fotoProfil: publicUrl },
    };
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    return {
      success: false,
      message: error.message || "Terjadi kesalahan saat mengunggah foto profil.",
    };
  }
}

/**
 * Menghapus Foto Profil Pengguna (Kembali ke Inisial Default)
 */
export async function deleteUserProfilePhotoAction(): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fotoProfil: true },
    });

    if (existing?.fotoProfil && existing.fotoProfil.startsWith("/uploads/profile/")) {
      const oldPath = path.join(process.cwd(), "public", existing.fotoProfil.replace(/^\//, ""));
      try {
        await fs.unlink(oldPath);
      } catch {
        // Abaikan
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { fotoProfil: null },
    });

    // Sinkronkan cookie sesi
    await setSessionCookie({
      id: updated.id,
      username: updated.username,
      fullName: updated.fullName,
      role: updated.role,
      department: updated.department,
      fotoProfil: null,
      isActive: updated.isActive,
    });

    await logAudit({
      userId: user.id,
      action: "DELETE_AVATAR",
      entityType: "USER",
      entityId: user.id,
      description: "Menghapus foto profil akun.",
    });

    revalidatePath("/pengaturan");
    revalidatePath("/pengaturan/keamanan-akun");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Foto profil berhasil dihapus dan kembali ke inisial nama.",
    };
  } catch (error: any) {
    console.error("Delete avatar error:", error);
    return {
      success: false,
      message: error.message || "Gagal menghapus foto profil.",
    };
  }
}
