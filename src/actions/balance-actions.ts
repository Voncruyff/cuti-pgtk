"use server";

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
    const employee = mockDb.findEmployeeById(employeeId);
    if (!employee || !employee.isActive) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan atau sedang tidak aktif.",
      };
    }

    // Role verification: If user is Admin Bagian, ensure employee is in their department
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      if (employee.department.name.toLowerCase() !== user.department.toLowerCase()) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk menambah saldo karyawan ${user.department}.`,
        };
      }
    }

    // Find Leave Type
    const leaveTypes = mockDb.getLeaveTypes();
    const targetLt = leaveTypes.find((lt) => lt.code === leaveTypeCode);
    if (!targetLt) {
      return {
        success: false,
        message: "Jenis cuti tidak valid.",
      };
    }

    const txType = leaveTypeCode === "INHALDAGEN" ? "HOLIDAY_COMPENSATION" : "ADD_BALANCE";

    // Add positive ledger transaction
    const newTx = mockDb.addTransaction({
      employeeId,
      leaveTypeId: targetLt.id,
      transactionType: txType,
      transactionDate: new Date(transactionDate),
      amount: Number(amount),
      description,
      notes: notes || null,
      createdById: user.id,
    });

    // Calculate updated balances
    const updatedBalances = mockDb.calculateBalances(employeeId);

    // Audit log
    await logAudit({
      userId: user.id,
      action: "ADD_LEAVE_BALANCE",
      entityType: "LEAVE_TRANSACTION",
      entityId: newTx.id,
      description: `Penambahan saldo ${targetLt.name} untuk ${employee.name} (${employee.employeeNumber}) sebanyak +${amount} hari.`,
      newValues: {
        transactionId: newTx.id,
        employeeName: employee.name,
        leaveType: targetLt.name,
        amountAdded: amount,
        newBalances: updatedBalances,
      },
    });

    return {
      success: true,
      message: `Saldo ${targetLt.name} atas nama ${employee.name} berhasil ditambah +${amount} hari!`,
      data: {
        transactionId: newTx.id,
        newBalances: updatedBalances,
      },
    };
  } catch (error) {
    console.error("Add leave balance error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses penambahan saldo cuti.",
    };
  }
}
