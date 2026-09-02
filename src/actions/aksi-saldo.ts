"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { addBalanceSchema, AddBalanceInput } from "@/lib/validation/balance-schema";
import type { ActionResult } from "@/types/actions";

export async function addLeaveBalanceAction(
  data: AddBalanceInput
): Promise<ActionResult<{ transactionId: string; newBalances: { annual: number; longLeave: number; inhaldagen: number; total: number } }>> {
  const user = await requireAuth();

  const validation = addBalanceSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi formulir penambahan saldo gagal. Mohon periksa kembali isian Anda.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { employeeId, leaveTypeCode, amount, transactionDate, description, notes } = validation.data;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { leaveBalance: true },
    });

    if (!employee || !employee.isActive) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan di database atau sedang tidak aktif.",
      };
    }

    // Role verification: If user is Admin Bagian, ensure employee is in their department
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      const empDept = employee.bagian.toLowerCase();
      if (!empDept.includes(userDept) && !userDept.includes(empDept)) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk menambah saldo karyawan ${user.department}.`,
        };
      }
    }

    let annual = employee.leaveBalance?.cutiTahunan ?? 12;
    let longLeave = employee.leaveBalance?.cutiBesar ?? 0;
    let inhaldagen = employee.leaveBalance?.inhaldagen ?? 0;

    if (leaveTypeCode === "ANNUAL") {
      annual += Number(amount);
    } else if (leaveTypeCode === "LONG_LEAVE") {
      longLeave += Number(amount);
    } else if (leaveTypeCode === "INHALDAGEN") {
      inhaldagen += Number(amount);
    }

    const total = annual + longLeave + inhaldagen;

    // Save to MySQL saldo_cuti table
    await prisma.leaveBalance.upsert({
      where: { nip: employee.nip },
      create: {
        nip: employee.nip,
        nama: employee.nama,
        cutiTahunan: annual,
        cutiBesar: longLeave,
        inhaldagen,
        total,
        periode: new Date().getFullYear(),
      },
      update: {
        nama: employee.nama,
        cutiTahunan: annual,
        cutiBesar: longLeave,
        inhaldagen,
        total,
      },
    });

    const updatedBalances = {
      annual,
      longLeave,
      inhaldagen,
      total,
    };

    const targetName =
      leaveTypeCode === "ANNUAL"
        ? "Cuti Tahunan"
        : leaveTypeCode === "LONG_LEAVE"
        ? "Cuti Besar"
        : "Inhaldagen";

    const txId = `tx-${Date.now()}`;

    // Audit log
    await logAudit({
      userId: user.id,
      action: "ADD_LEAVE_BALANCE",
      entityType: "LEAVE_TRANSACTION",
      entityId: txId,
      description: `Penambahan saldo ${targetName} untuk ${employee.nama} (${employee.nip}) sebanyak +${amount} hari.`,
      newValues: {
        transactionId: txId,
        employeeName: employee.nama,
        leaveType: targetName,
        amountAdded: amount,
        newBalances: updatedBalances,
      },
    });

    return {
      success: true,
      message: `Saldo ${targetName} atas nama ${employee.nama} berhasil ditambah +${amount} hari!`,
      data: {
        transactionId: txId,
        newBalances: updatedBalances,
      },
    };
  } catch (error) {
    console.error("Add leave balance error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses penambahan saldo cuti di database.",
    };
  }
}

export interface AddMultipleBalanceInput {
  employeeId: string;
  annualAmount: number;
  longLeaveAmount: number;
  inhaldagenAmount: number;
  transactionDate: string;
  description: string;
  notes?: string;
}

export interface BalanceAddHistoryItem {
  id: string;
  employeeId: string;
  transactionDate: string;
  description: string;
  annualDays: number;
  longLeaveDays: number;
  inhaldagenDays: number;
  totalDays: number;
  notes: string | null;
  createdByName: string;
  createdAt: string;
}

export async function addMultipleLeaveBalanceAction(
  data: AddMultipleBalanceInput
): Promise<ActionResult<{ transactionId: string; newBalances: { annual: number; longLeave: number; inhaldagen: number; total: number } }>> {
  const user = await requireAuth();

  const {
    employeeId,
    annualAmount = 0,
    longLeaveAmount = 0,
    inhaldagenAmount = 0,
    transactionDate,
    description = "Penambahan Saldo",
    notes,
  } = data;

  const effectiveDesc = description?.trim() || "Penambahan Saldo";

  const totalAdded = annualAmount + longLeaveAmount + inhaldagenAmount;
  if (totalAdded <= 0) {
    return {
      success: false,
      message: "Masukkan jumlah hari penambahan minimal 1 hari.",
    };
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { leaveBalance: true },
    });

    if (!employee || !employee.isActive) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan di database atau sedang tidak aktif.",
      };
    }

    // Role verification
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      const empDept = employee.bagian.toLowerCase();
      if (!empDept.includes(userDept) && !userDept.includes(empDept)) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk menambah saldo karyawan ${user.department}.`,
        };
      }
    }

    let annual = employee.leaveBalance?.cutiTahunan ?? 12;
    let longLeave = employee.leaveBalance?.cutiBesar ?? 0;
    let inhaldagen = employee.leaveBalance?.inhaldagen ?? 0;

    annual += Number(annualAmount) || 0;
    longLeave += Number(longLeaveAmount) || 0;
    inhaldagen += Number(inhaldagenAmount) || 0;

    const total = annual + longLeave + inhaldagen;

    // Save to MySQL saldo_cuti table
    await prisma.leaveBalance.upsert({
      where: { nip: employee.nip },
      create: {
        nip: employee.nip,
        nama: employee.nama,
        cutiTahunan: annual,
        cutiBesar: longLeave,
        inhaldagen,
        total,
        periode: new Date().getFullYear(),
      },
      update: {
        nama: employee.nama,
        cutiTahunan: annual,
        cutiBesar: longLeave,
        inhaldagen,
        total,
      },
    });

    const updatedBalances = {
      annual,
      longLeave,
      inhaldagen,
      total,
    };

    const txId = `tx-${Date.now()}`;

    const typesList: string[] = [];
    if (annualAmount > 0) typesList.push("Cuti Tahunan");
    if (longLeaveAmount > 0) typesList.push("Cuti Besar");
    if (inhaldagenAmount > 0) typesList.push("Inhaldagen");
    const uraianStr = `Penambahan Saldo ${typesList.join(" & ") || "Cuti"}`;

    // Simpan langsung ke tabel MySQL `aktivitas_saldo`
    try {
      await prisma.$executeRaw`
        INSERT INTO aktivitas_saldo (
          id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at
        ) VALUES (
          ${txId}, ${employee.nip}, ${employee.nama}, 'TAMBAH_SALDO', ${uraianStr}, ${new Date(transactionDate)}, NULL, 
          ${annualAmount}, ${longLeaveAmount}, ${inhaldagenAmount}, ${totalAdded}, 'Penambahan Saldo', NOW(), NOW()
        )
      `;
    } catch (dbErr) {
      console.error("Gagal simpan ke tabel aktivitas_saldo:", dbErr);
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: "ADD_LEAVE_BALANCE",
      entityType: "LEAVE_TRANSACTION",
      entityId: txId,
      description: `Penambahan saldo untuk ${employee.nama} (${employee.nip}) total +${totalAdded} hari (Tahunan: +${annualAmount}, Besar: +${longLeaveAmount}, Inhaldagen: +${inhaldagenAmount}).`,
      newValues: {
        transactionId: txId,
        employeeName: employee.nama,
        annualAdded: annualAmount,
        longLeaveAdded: longLeaveAmount,
        inhaldagenAdded: inhaldagenAmount,
        totalAdded,
        newBalances: updatedBalances,
      },
    });

    return {
      success: true,
      message: `Saldo cuti atas nama ${employee.nama} berhasil ditambah +${totalAdded} hari!`,
      data: {
        transactionId: txId,
        newBalances: updatedBalances,
      },
    };
  } catch (error) {
    console.error("Add multiple leave balance error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses penambahan saldo cuti.",
    };
  }
}

export async function getEmployeeBalanceAddHistoryAction(
  employeeId: string
): Promise<ActionResult<BalanceAddHistoryItem[]>> {
  await requireAuth();

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (employee) {
      try {
        const rows: any[] = await prisma.$queryRaw`
          SELECT id, nip, jenis_transaksi, tgl_transaksi, cuti_tahunan, cuti_besar, inhaldagen, total_hari, created_at
          FROM aktivitas_saldo
          WHERE nip = ${employee.nip} AND jenis_transaksi = 'TAMBAH_SALDO'
          ORDER BY created_at ASC
        `;

        if (rows && rows.length > 0) {
          const items: BalanceAddHistoryItem[] = rows.map((r) => {
            const inputDate = r.tgl_transaksi ? new Date(r.tgl_transaksi) : new Date(r.created_at);
            return {
              id: r.id,
              employeeId: employee.id,
              transactionDate: inputDate.toISOString(),
              description: "Penambahan Saldo",
              annualDays: Number(r.cuti_tahunan) || 0,
              longLeaveDays: Number(r.cuti_besar) || 0,
              inhaldagenDays: Number(r.inhaldagen) || 0,
              totalDays: Number(r.total_hari) || 0,
              notes: null,
              createdByName: "Admin",
              createdAt: new Date(r.created_at).toISOString(),
            };
          });

          return {
            success: true,
            data: items,
          };
        }
      } catch (sqlErr) {
        console.error("Querying aktivitas_saldo error:", sqlErr);
      }
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("Get balance add history error:", error);
    return {
      success: false,
      message: "Gagal memuat riwayat penambahan saldo.",
      data: [],
    };
  }
}
