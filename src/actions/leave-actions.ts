"use server";

import { mockDb } from "@/lib/mock-db";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/validation/leave-schema";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export async function getEmployeesForLeaveAction() {
  const user = await requireAuth();
  let employees = mockDb.getEmployees().filter((e) => e.isActive);

  // If user is Admin Bagian, filter only employees in their department
  if (user.role === "ADMIN_BAGIAN" && user.department) {
    employees = employees.filter(
      (e) => e.department.name.toLowerCase() === user.department?.toLowerCase()
    );
  }

  return {
    success: true,
    data: employees,
  };
}

export async function getEmployeeBalanceAction(employeeId: string) {
  await requireAuth();
  const emp = mockDb.findEmployeeById(employeeId);
  if (!emp) {
    return {
      success: false,
      message: "Karyawan tidak ditemukan",
    };
  }

  return {
    success: true,
    data: {
      employee: emp,
      balances: emp.balances,
    },
  };
}

export async function createLeaveRequestAction(
  data: LeaveRequestInput
): Promise<ActionResult<{ requestNumber: string; leaveRequestId: string }>> {
  const user = await requireAuth();

  const validation = leaveRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi formulir gagal. Mohon periksa kembali isian Anda.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const {
    employeeId,
    requestDate,
    startDate,
    endDate,
    annualDays,
    longLeaveDays,
    inhaldagenDays,
    purpose,
    notes,
  } = validation.data;

  try {
    const employee = mockDb.findEmployeeById(employeeId);
    if (!employee || !employee.isActive) {
      return {
        success: false,
        message: "Data karyawan tidak valid atau tidak aktif.",
      };
    }

    // Role check: If Admin Bagian, ensure employee is in their department
    if (user.role === "ADMIN_BAGIAN" && user.department) {
      if (employee.department.name.toLowerCase() !== user.department.toLowerCase()) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk menginput cuti karyawan ${user.department}.`,
        };
      }
    }

    // Balance check
    const currentBalances = employee.balances;
    if (annualDays > currentBalances.annual) {
      return {
        success: false,
        message: `Saldo Cuti Tahunan tidak mencukupi. (Diminta: ${annualDays} hari, Saldo: ${currentBalances.annual} hari)`,
      };
    }
    if (longLeaveDays > currentBalances.longLeave) {
      return {
        success: false,
        message: `Saldo Cuti Besar tidak mencukupi. (Diminta: ${longLeaveDays} hari, Saldo: ${currentBalances.longLeave} hari)`,
      };
    }
    if (inhaldagenDays > currentBalances.inhaldagen) {
      return {
        success: false,
        message: `Saldo Inhaldagen tidak mencukupi. (Diminta: ${inhaldagenDays} hari, Saldo: ${currentBalances.inhaldagen} hari)`,
      };
    }

    // Prepare leave items
    const leaveTypes = mockDb.getLeaveTypes();
    const annualLt = leaveTypes.find((lt) => lt.code === "ANNUAL");
    const longLt = leaveTypes.find((lt) => lt.code === "LONG_LEAVE");
    const inhaldagenLt = leaveTypes.find((lt) => lt.code === "INHALDAGEN");

    const items: { leaveTypeId: string; days: number }[] = [];
    if (annualDays > 0 && annualLt) items.push({ leaveTypeId: annualLt.id, days: annualDays });
    if (longLeaveDays > 0 && longLt) items.push({ leaveTypeId: longLt.id, days: longLeaveDays });
    if (inhaldagenDays > 0 && inhaldagenLt) items.push({ leaveTypeId: inhaldagenLt.id, days: inhaldagenDays });

    const totalDays = annualDays + longLeaveDays + inhaldagenDays;

    // Create leave request and deduct ledger
    const newReq = mockDb.createLeaveRequest({
      employeeId,
      requestDate: new Date(requestDate),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      purpose,
      notes: notes || null,
      createdById: user.id,
      items,
    });

    // Log Audit
    await logAudit({
      userId: user.id,
      action: "CREATE_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: newReq.id,
      description: `Pengambilan cuti ${employee.name} (${employee.employeeNumber}) sebanyak ${totalDays} hari dengan No: ${newReq.requestNumber}.`,
      newValues: {
        requestNumber: newReq.requestNumber,
        employeeName: employee.name,
        totalDays,
        annualDays,
        longLeaveDays,
        inhaldagenDays,
      },
    });

    return {
      success: true,
      message: `Permohonan cuti berhasil disimpan dengan No: ${newReq.requestNumber}`,
      data: {
        requestNumber: newReq.requestNumber,
        leaveRequestId: newReq.id,
      },
    };
  } catch (error) {
    console.error("Create leave request error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses permohonan cuti.",
    };
  }
}

export async function getEmployeeTransactionsAction(employeeId: string) {
  await requireAuth();

  try {
    const employee = mockDb.findEmployeeById(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Karyawan tidak ditemukan",
      };
    }

    const transactions = mockDb.getTransactions(employeeId);

    return {
      success: true,
      data: {
        employee,
        transactions,
      },
    };
  } catch (error) {
    console.error("Get transactions error:", error);
    return {
      success: false,
      message: "Gagal mengambil riwayat transaksi cuti.",
    };
  }
}

