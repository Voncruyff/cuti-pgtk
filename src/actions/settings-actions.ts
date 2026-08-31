"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { ActionResult } from "@/actions/leave-actions";
import { revalidatePath } from "next/cache";

export interface SystemSettingsData {
  // 1. Kebijakan Cuti
  leavePolicy: {
    defaultAnnualDays: number;
    defaultLongLeaveDays: number;
    activePeriodYear: number;
    maxAccumulatedDays: number;
    longLeaveIntervalYears: number;
  };
  // 2. Profil Perusahaan & Penandatangan
  companyProfile: {
    companyName: string;
    unitName: string;
    location: string;
    hrManagerName: string;
    hrManagerNip: string;
    hrManagerTitle: string;
    generalManagerName: string;
    generalManagerNip: string;
  };
  // 3. User Info
  currentUser: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    department?: string | null;
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
    defaultAnnualDays: 12,
    defaultLongLeaveDays: 22,
    activePeriodYear: 2026,
    maxAccumulatedDays: 36,
    longLeaveIntervalYears: 6,
  },
  companyProfile: {
    companyName: "PT KEBON AGUNG",
    unitName: "PABRIK GULA TRANGKIL",
    location: "Trangkil, Pati, Jawa Tengah",
    hrManagerName: "Hendra Wijaya, S.E.",
    hrManagerNip: "198503152010011002",
    hrManagerTitle: "Kepala Bagian SDM & Umum",
    generalManagerName: "Ir. Bambang Santoso, M.M.",
    generalManagerNip: "197805122003121001",
  },
};

/**
 * Mengambil seluruh data pengaturan sistem
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

    return {
      success: true,
      data: {
        leavePolicy: systemConfigStore.leavePolicy,
        companyProfile: systemConfigStore.companyProfile,
        currentUser: {
          id: user.id,
          username: user.username,
          fullName: user.fullName || user.username,
          role: user.role,
          department: user.department,
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
 * Memperbarui Kebijakan Cuti
 */
export async function updateLeavePolicySettingsAction(payload: {
  defaultAnnualDays: number;
  defaultLongLeaveDays: number;
  activePeriodYear: number;
  maxAccumulatedDays: number;
  longLeaveIntervalYears: number;
}): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Hanya Admin Utama yang berwenang mengubah kebijakan cuti." };
  }

  systemConfigStore.leavePolicy = {
    defaultAnnualDays: Number(payload.defaultAnnualDays) || 12,
    defaultLongLeaveDays: Number(payload.defaultLongLeaveDays) || 22,
    activePeriodYear: Number(payload.activePeriodYear) || 2026,
    maxAccumulatedDays: Number(payload.maxAccumulatedDays) || 36,
    longLeaveIntervalYears: Number(payload.longLeaveIntervalYears) || 6,
  };

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Kebijakan dan standar kuota cuti berhasil disimpan.",
  };
}

/**
 * Memperbarui Profil Perusahaan & Pejabat Penandatangan
 */
export async function updateCompanyProfileSettingsAction(payload: {
  companyName: string;
  unitName: string;
  location: string;
  hrManagerName: string;
  hrManagerNip: string;
  hrManagerTitle: string;
  generalManagerName: string;
  generalManagerNip: string;
}): Promise<ActionResult<void>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Hanya Admin Utama yang berwenang mengubah profil perusahaan." };
  }

  systemConfigStore.companyProfile = {
    companyName: payload.companyName.trim() || "PT KEBON AGUNG",
    unitName: payload.unitName.trim() || "PABRIK GULA TRANGKIL",
    location: payload.location.trim() || "Trangkil, Pati, Jawa Tengah",
    hrManagerName: payload.hrManagerName.trim() || "-",
    hrManagerNip: payload.hrManagerNip.trim() || "-",
    hrManagerTitle: payload.hrManagerTitle.trim() || "Kepala Bagian SDM",
    generalManagerName: payload.generalManagerName.trim() || "-",
    generalManagerNip: payload.generalManagerNip.trim() || "-",
  };

  revalidatePath("/settings");
  revalidatePath("/reports");

  return {
    success: true,
    message: "Profil perusahaan dan pejabat penandatangan berhasil diperbarui.",
  };
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
 * Ekspor Seluruh Cadangan Data Sistem (JSON Backup)
 */
export async function exportSystemBackupDataAction(): Promise<
  ActionResult<{
    fileName: string;
    jsonContent: string;
    totalRecords: number;
  }>
> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Akses ditolak. Hanya Admin Utama yang dapat mengunduh cadangan sistem." };
  }

  try {
    const [departments, stations, employees, leaveBalances] = await Promise.all([
      prisma.department.findMany({ orderBy: { code: "asc" } }),
      prisma.station.findMany({ orderBy: { code: "asc" } }),
      prisma.employee.findMany({ orderBy: { nip: "asc" } }),
      prisma.leaveBalance.findMany({ orderBy: { nip: "asc" } }),
    ]);

    let activities: any[] = [];
    try {
      activities = await prisma.$queryRaw`SELECT * FROM aktivitas_saldo ORDER BY tgl_transaksi DESC`;
    } catch {
      activities = [];
    }

    const totalRecords =
      departments.length +
      stations.length +
      employees.length +
      leaveBalances.length +
      activities.length;

    const backupPayload = {
      system: "SIP-CUTI PG TRANGKIL",
      exportedAt: new Date().toISOString(),
      exportedBy: {
        username: user.username,
        role: user.role,
      },
      metadata: {
        totalDepartments: departments.length,
        totalStations: stations.length,
        totalEmployees: employees.length,
        totalLeaveBalances: leaveBalances.length,
        totalActivities: activities.length,
        totalRecords,
      },
      config: systemConfigStore,
      data: {
        departments,
        stations,
        employees,
        leaveBalances,
        activities,
      },
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `backup_sip_cuti_pgtk_${dateStr}.json`;

    return {
      success: true,
      message: `Cadangan data (${totalRecords} record) berhasil dibuat.`,
      data: {
        fileName,
        jsonContent: JSON.stringify(backupPayload, null, 2),
        totalRecords,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Gagal membuat berkas cadangan data.",
    };
  }
}
