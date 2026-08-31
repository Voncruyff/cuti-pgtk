"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { ActionResult } from "@/actions/leave-actions";
import { revalidatePath } from "next/cache";

export interface MassProcessFilters {
  category?: string; // ALL / PIMPINAN / PELAKSANA
  department?: string; // ALL / Department Code or Name
  station?: string; // ALL / Station Code or Name
}

export interface PreviewEmployeeItem {
  id: string;
  nip: string;
  nama: string;
  category: string;
  bagian: string;
  stasiun: string;
  currentAnnual: number;
  currentLongLeave: number;
  currentInhaldagen: number;
  currentTotal: number;
  newAnnual?: number;
  newLongLeave?: number;
  newTotal?: number;
}

export interface MassProcessHistoryItem {
  id: string;
  tglTransaksi: string;
  jenisProses: string;
  uraian: string;
  jumlahKaryawan: number;
  totalHariPerKaryawan: number;
  operator: string;
}

/**
 * Mengambil metadata untuk form filter proses massal
 */
export async function getMassProcessMetaAction(): Promise<
  ActionResult<{
    departments: { id: string; code: string; name: string }[];
    stations: { id: string; code: string; name: string; departmentName: string }[];
    totalActiveEmployees: number;
  }>
> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Akses ditolak. Hanya Admin Utama yang berwenang." };
  }

  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });

    const stations = await prisma.station.findMany({
      where: { isActive: true },
      include: { department: true },
      orderBy: { code: "asc" },
    });

    const totalActiveEmployees = await prisma.employee.count({
      where: { isActive: true },
    });

    return {
      success: true,
      data: {
        departments,
        stations: stations.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          departmentName: s.department?.name || "-",
        })),
        totalActiveEmployees,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal memuat metadata." };
  }
}

/**
 * Pratinjau Karyawan yang akan terdampak Proses Massal (Dry Run)
 */
export async function previewMassProcessEmployeesAction(
  filters: MassProcessFilters,
  actionType: "ANNUAL" | "LONG_LEAVE" | "ROLL_FORWARD",
  amount: number = 12
): Promise<ActionResult<{ items: PreviewEmployeeItem[]; totalCount: number }>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Akses ditolak. Hanya Admin Utama yang berwenang." };
  }

  try {
    const whereClause: any = { isActive: true };

    if (filters.category && filters.category !== "ALL") {
      whereClause.category = filters.category.toUpperCase();
    }

    if (filters.department && filters.department !== "ALL") {
      whereClause.bagian = { contains: filters.department };
    }

    if (filters.station && filters.station !== "ALL") {
      whereClause.stasiun = { contains: filters.station };
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        leaveBalance: true,
      },
      orderBy: { nip: "asc" },
    });

    const items: PreviewEmployeeItem[] = employees.map((emp) => {
      const b = emp.leaveBalance;
      const currentAnnual = b?.cutiTahunan ?? 0;
      const currentLongLeave = b?.cutiBesar ?? 0;
      const currentInhaldagen = b?.inhaldagen ?? 0;
      const currentTotal = currentAnnual + currentLongLeave + currentInhaldagen;

      let newAnnual = currentAnnual;
      let newLongLeave = currentLongLeave;
      let newTotal = currentTotal;

      if (actionType === "ANNUAL") {
        newAnnual = currentAnnual + amount;
        newTotal = newAnnual + currentLongLeave + currentInhaldagen;
      } else if (actionType === "LONG_LEAVE") {
        newLongLeave = currentLongLeave + amount;
        newTotal = currentAnnual + newLongLeave + currentInhaldagen;
      } else if (actionType === "ROLL_FORWARD") {
        newAnnual = amount; // Reset atau alokasi baru
        newTotal = newAnnual + currentLongLeave + currentInhaldagen;
      }

      return {
        id: emp.id,
        nip: emp.nip,
        nama: emp.nama,
        category: emp.category,
        bagian: emp.bagian,
        stasiun: emp.stasiun || "-",
        currentAnnual,
        currentLongLeave,
        currentInhaldagen,
        currentTotal,
        newAnnual,
        newLongLeave,
        newTotal,
      };
    });

    return {
      success: true,
      data: {
        items,
        totalCount: items.length,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal memproses pratinjau." };
  }
}

/**
 * Eksekusi Pemberian Cuti Tahunan Massal
 */
export async function executeMassAnnualLeaveAllocationAction(payload: {
  filters: MassProcessFilters;
  amount: number;
  year: number;
  uraian?: string;
}): Promise<ActionResult<{ affectedCount: number }>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Akses ditolak. Hanya Admin Utama yang berwenang." };
  }

  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: "Jumlah hari cuti tahunan harus berupa angka positif." };
  }

  try {
    const whereClause: any = { isActive: true };
    if (payload.filters.category && payload.filters.category !== "ALL") {
      whereClause.category = payload.filters.category.toUpperCase();
    }
    if (payload.filters.department && payload.filters.department !== "ALL") {
      whereClause.bagian = { contains: payload.filters.department };
    }
    if (payload.filters.station && payload.filters.station !== "ALL") {
      whereClause.stasiun = { contains: payload.filters.station };
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: { leaveBalance: true },
    });

    if (employees.length === 0) {
      return { success: false, message: "Tidak ada karyawan yang sesuai dengan kriteria filter." };
    }

    const uraianTeks =
      payload.uraian && payload.uraian.trim() !== ""
        ? payload.uraian.trim()
        : `Pemberian Cuti Tahunan Massal Periode ${payload.year} (+${amount} Hari)`;

    const now = new Date();

    // Jalankan update saldo & insert aktivitas_saldo secara transaksional
    for (const emp of employees) {
      const b = emp.leaveBalance;
      const prevAnnual = b?.cutiTahunan ?? 0;
      const prevLongLeave = b?.cutiBesar ?? 0;
      const prevInhaldagen = b?.inhaldagen ?? 0;

      const newAnnual = prevAnnual + amount;
      const newTotal = newAnnual + prevLongLeave + prevInhaldagen;

      // Upsert saldo_cuti
      await prisma.leaveBalance.upsert({
        where: { nip: emp.nip },
        create: {
          nip: emp.nip,
          nama: emp.nama,
          cutiTahunan: newAnnual,
          cutiBesar: prevLongLeave,
          inhaldagen: prevInhaldagen,
          total: newTotal,
          periode: payload.year,
        },
        update: {
          cutiTahunan: newAnnual,
          total: newTotal,
          periode: payload.year,
        },
      });

      // Insert ke aktivitas_saldo
      await prisma.$executeRaw`
        INSERT INTO aktivitas_saldo 
        (id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID()},
          ${emp.nip},
          ${emp.nama},
          'TAMBAH_SALDO',
          ${uraianTeks},
          ${now},
          ${amount},
          0,
          0,
          ${amount},
          'Pemberian Cuti Tahunan Massal',
          ${now},
          ${now}
        )
      `;
    }

    revalidatePath("/mass-process");
    revalidatePath("/dashboard");
    revalidatePath("/leave/details");
    revalidatePath("/reports");

    return {
      success: true,
      message: `Berhasil menambahkan cuti tahunan (+${amount} hari) untuk ${employees.length} karyawan.`,
      data: { affectedCount: employees.length },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal mengeksekusi penambahan cuti massal." };
  }
}

/**
 * Eksekusi Pemberian Cuti Besar Massal
 */
export async function executeMassLongLeaveAllocationAction(payload: {
  filters: MassProcessFilters;
  amount: number;
  uraian?: string;
}): Promise<ActionResult<{ affectedCount: number }>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Akses ditolak. Hanya Admin Utama yang berwenang." };
  }

  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: "Jumlah hari cuti besar harus berupa angka positif." };
  }

  try {
    const whereClause: any = { isActive: true };
    if (payload.filters.category && payload.filters.category !== "ALL") {
      whereClause.category = payload.filters.category.toUpperCase();
    }
    if (payload.filters.department && payload.filters.department !== "ALL") {
      whereClause.bagian = { contains: payload.filters.department };
    }
    if (payload.filters.station && payload.filters.station !== "ALL") {
      whereClause.stasiun = { contains: payload.filters.station };
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: { leaveBalance: true },
    });

    if (employees.length === 0) {
      return { success: false, message: "Tidak ada karyawan yang sesuai dengan kriteria filter." };
    }

    const uraianTeks =
      payload.uraian && payload.uraian.trim() !== ""
        ? payload.uraian.trim()
        : `Pemberian Hak Cuti Besar Massal (+${amount} Hari)`;

    const now = new Date();

    for (const emp of employees) {
      const b = emp.leaveBalance;
      const prevAnnual = b?.cutiTahunan ?? 0;
      const prevLongLeave = b?.cutiBesar ?? 0;
      const prevInhaldagen = b?.inhaldagen ?? 0;

      const newLongLeave = prevLongLeave + amount;
      const newTotal = prevAnnual + newLongLeave + prevInhaldagen;

      await prisma.leaveBalance.upsert({
        where: { nip: emp.nip },
        create: {
          nip: emp.nip,
          nama: emp.nama,
          cutiTahunan: prevAnnual,
          cutiBesar: newLongLeave,
          inhaldagen: prevInhaldagen,
          total: newTotal,
          periode: b?.periode ?? new Date().getFullYear(),
        },
        update: {
          cutiBesar: newLongLeave,
          total: newTotal,
        },
      });

      await prisma.$executeRaw`
        INSERT INTO aktivitas_saldo 
        (id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID()},
          ${emp.nip},
          ${emp.nama},
          'TAMBAH_SALDO',
          ${uraianTeks},
          ${now},
          0,
          ${amount},
          0,
          ${amount},
          'Pemberian Cuti Besar Massal',
          ${now},
          ${now}
        )
      `;
    }

    revalidatePath("/mass-process");
    revalidatePath("/dashboard");
    revalidatePath("/leave/details");

    return {
      success: true,
      message: `Berhasil menambahkan cuti besar (+${amount} hari) untuk ${employees.length} karyawan.`,
      data: { affectedCount: employees.length },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal mengeksekusi cuti besar massal." };
  }
}

/**
 * Eksekusi Pergantian Periode Tahun (Roll-Forward)
 */
export async function executeMassRollForwardAction(payload: {
  newYear: number;
  defaultAnnualAmount: number;
  resetAnnual: boolean;
  uraian?: string;
}): Promise<ActionResult<{ affectedCount: number }>> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Akses ditolak. Hanya Admin Utama yang berwenang." };
  }

  const newYear = Number(payload.newYear);
  const defaultAnnual = Number(payload.defaultAnnualAmount);

  if (isNaN(newYear) || newYear < 2020 || newYear > 2100) {
    return { success: false, message: "Tahun periode baru tidak valid." };
  }

  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { leaveBalance: true },
    });

    if (employees.length === 0) {
      return { success: false, message: "Tidak ada data karyawan aktif." };
    }

    const uraianTeks =
      payload.uraian && payload.uraian.trim() !== ""
        ? payload.uraian.trim()
        : `Roll-Forward Saldo ke Periode Tahun ${newYear}${payload.resetAnnual ? ` (Reset Kuota Tahunan: ${defaultAnnual} Hari)` : ""}`;

    const now = new Date();

    for (const emp of employees) {
      const b = emp.leaveBalance;
      const prevLongLeave = b?.cutiBesar ?? 0;
      const prevInhaldagen = b?.inhaldagen ?? 0;
      const newAnnual = payload.resetAnnual ? defaultAnnual : (b?.cutiTahunan ?? 0);
      const newTotal = newAnnual + prevLongLeave + prevInhaldagen;

      await prisma.leaveBalance.upsert({
        where: { nip: emp.nip },
        create: {
          nip: emp.nip,
          nama: emp.nama,
          cutiTahunan: newAnnual,
          cutiBesar: prevLongLeave,
          inhaldagen: prevInhaldagen,
          total: newTotal,
          periode: newYear,
        },
        update: {
          cutiTahunan: newAnnual,
          total: newTotal,
          periode: newYear,
        },
      });

      await prisma.$executeRaw`
        INSERT INTO aktivitas_saldo 
        (id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID()},
          ${emp.nip},
          ${emp.nama},
          'TAMBAH_SALDO',
          ${uraianTeks},
          ${now},
          ${payload.resetAnnual ? defaultAnnual : 0},
          0,
          0,
          ${payload.resetAnnual ? defaultAnnual : 0},
          'Pergantian Periode Tahun',
          ${now},
          ${now}
        )
      `;
    }

    revalidatePath("/mass-process");
    revalidatePath("/dashboard");
    revalidatePath("/leave/details");
    revalidatePath("/reports");

    return {
      success: true,
      message: `Berhasil melakukan roll-forward periode ke tahun ${newYear} untuk ${employees.length} karyawan.`,
      data: { affectedCount: employees.length },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal melakukan roll-forward periode." };
  }
}

/**
 * Mengambil Riwayat Log Eksekusi Proses Massal
 */
export async function getMassProcessHistoryAction(): Promise<
  ActionResult<MassProcessHistoryItem[]>
> {
  const user = await requireAuth();
  if (user.role !== "ADMIN_UTAMA") {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const rows: any[] = await prisma.$queryRaw`
      SELECT 
        DATE(tgl_transaksi) as tgl_group,
        uraian,
        jenis_transaksi,
        COUNT(DISTINCT nip) as jumlah_karyawan,
        MAX(total_hari) as total_hari_per_karyawan,
        MAX(created_at) as latest_created_at
      FROM aktivitas_saldo
      WHERE jenis_transaksi = 'TAMBAH_SALDO' 
        AND (uraian LIKE '%Massal%' OR uraian LIKE '%Roll-Forward%' OR uraian LIKE '%Periode%')
      GROUP BY DATE(tgl_transaksi), uraian, jenis_transaksi
      ORDER BY latest_created_at DESC
      LIMIT 20
    `;

    const items: MassProcessHistoryItem[] = rows.map((r, index) => ({
      id: `history-${index + 1}`,
      tglTransaksi: new Date(r.latest_created_at || r.tgl_group).toISOString(),
      jenisProses: r.uraian.includes("Besar")
        ? "Cuti Besar Massal"
        : r.uraian.includes("Roll-Forward")
        ? "Pergantian Periode"
        : "Cuti Tahunan Massal",
      uraian: r.uraian,
      jumlahKaryawan: Number(r.jumlah_karyawan || 0),
      totalHariPerKaryawan: Number(r.total_hari_per_karyawan || 0),
      operator: "Admin Utama",
    }));

    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal memuat riwayat proses massal." };
  }
}
