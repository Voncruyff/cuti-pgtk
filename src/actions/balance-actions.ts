"use server";

import { prisma } from "@/lib/db/prisma";
import { mockDb } from "@/lib/mock-db";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { addBalanceSchema, AddBalanceInput } from "@/lib/validation/balance-schema";
import { ActionResult } from "@/actions/leave-actions";

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

    // Also update mockDb if available in memory for ledger history
    try {
      const leaveTypes = mockDb.getLeaveTypes();
      const targetLt = leaveTypes.find((lt) => lt.code === leaveTypeCode);
      if (targetLt) {
        const txType = leaveTypeCode === "INHALDAGEN" ? "HOLIDAY_COMPENSATION" : "ADD_BALANCE";
        mockDb.addTransaction({
          employeeId,
          leaveTypeId: targetLt.id,
          transactionType: txType,
          transactionDate: new Date(transactionDate),
          amount: Number(amount),
          description,
          notes: notes || null,
          createdById: user.id,
        });
      }
    } catch (mockErr) {
      console.error("MockDb balance sync warning:", mockErr);
    }

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
