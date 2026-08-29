"use server";

import { prisma } from "@/lib/db/prisma";
import { mockDb } from "@/lib/mock-db";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/validation/leave-schema";
import { getLeadersAction } from "@/actions/employee-actions";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export async function getEmployeesForLeaveAction() {
  const user = await requireAuth();

  try {
    const leadersRes = await getLeadersAction();
    let employees = (leadersRes.data || []).filter((e: any) => e.isActive !== false);

    // If user is Admin Bagian, filter only employees in their department
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      employees = employees.filter((e: any) => {
        const deptName = (e.department?.name || "").toLowerCase();
        const deptCode = (e.department?.code || "").toLowerCase();
        return (
          deptName.includes(userDept) ||
          userDept.includes(deptName) ||
          deptCode === userDept
        );
      });
    }

    return {
      success: true,
      data: employees,
    };
  } catch (error) {
    console.error("getEmployeesForLeaveAction error:", error);
    return {
      success: false,
      message: "Gagal memuat data karyawan dari database.",
      data: [],
    };
  }
}

export async function getEmployeeBalanceAction(employeeId: string) {
  await requireAuth();

  try {
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        station: true,
        leaveBalance: true,
      },
    });

    if (!emp) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan di database.",
      };
    }

    const balances = emp.leaveBalance
      ? {
          annual: emp.leaveBalance.cutiTahunan,
          longLeave: emp.leaveBalance.cutiBesar,
          inhaldagen: emp.leaveBalance.inhaldagen,
          total: emp.leaveBalance.total,
        }
      : {
          annual: 12,
          longLeave: 0,
          inhaldagen: 0,
          total: 12,
        };

    return {
      success: true,
      data: {
        employee: {
          id: emp.id,
          employeeNumber: emp.nip,
          name: emp.nama,
          position: emp.jabatan,
          category: emp.category,
          department: {
            id: emp.bagian,
            code: "-",
            name: emp.bagian,
          },
          stasiun: emp.stasiun || emp.station?.name || "-",
          balances,
        },
        balances,
      },
    };
  } catch (error) {
    console.error("getEmployeeBalanceAction error:", error);
    return {
      success: false,
      message: "Gagal mengambil saldo cuti dari database.",
    };
  }
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
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { leaveBalance: true },
    });

    if (!employee || !employee.isActive) {
      return {
        success: false,
        message: "Data karyawan tidak valid atau sedang tidak aktif di database.",
      };
    }

    // Role check: If Admin Bagian, ensure employee is in their department
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      const empDept = employee.bagian.toLowerCase();
      if (!empDept.includes(userDept) && !userDept.includes(empDept)) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk menginput cuti karyawan ${user.department}.`,
        };
      }
    }

    const currentAnnual = employee.leaveBalance?.cutiTahunan ?? 12;
    const currentLongLeave = employee.leaveBalance?.cutiBesar ?? 0;
    const currentInhaldagen = employee.leaveBalance?.inhaldagen ?? 0;

    // Balance check
    if (annualDays > currentAnnual) {
      return {
        success: false,
        message: `Saldo Cuti Tahunan tidak mencukupi. (Diminta: ${annualDays} hari, Saldo: ${currentAnnual} hari)`,
      };
    }
    if (longLeaveDays > currentLongLeave) {
      return {
        success: false,
        message: `Saldo Cuti Besar tidak mencukupi. (Diminta: ${longLeaveDays} hari, Saldo: ${currentLongLeave} hari)`,
      };
    }
    if (inhaldagenDays > currentInhaldagen) {
      return {
        success: false,
        message: `Saldo Inhaldagen tidak mencukupi. (Diminta: ${inhaldagenDays} hari, Saldo: ${currentInhaldagen} hari)`,
      };
    }

    const newAnnual = currentAnnual - annualDays;
    const newLongLeave = currentLongLeave - longLeaveDays;
    const newInhaldagen = currentInhaldagen - inhaldagenDays;
    const newTotal = newAnnual + newLongLeave + newInhaldagen;

    // Update MySQL saldo_cuti table
    await prisma.leaveBalance.upsert({
      where: { nip: employee.nip },
      create: {
        nip: employee.nip,
        nama: employee.nama,
        cutiTahunan: newAnnual,
        cutiBesar: newLongLeave,
        inhaldagen: newInhaldagen,
        total: newTotal,
        periode: new Date().getFullYear(),
      },
      update: {
        nama: employee.nama,
        cutiTahunan: newAnnual,
        cutiBesar: newLongLeave,
        inhaldagen: newInhaldagen,
        total: newTotal,
      },
    });

    const totalDays = annualDays + longLeaveDays + inhaldagenDays;
    const now = new Date();
    const requestNumber = `CT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const reqId = `req-${Date.now()}`;

    // Also update mockDb if available in memory
    try {
      const leaveTypes = mockDb.getLeaveTypes();
      const annualLt = leaveTypes.find((lt) => lt.code === "ANNUAL");
      const longLt = leaveTypes.find((lt) => lt.code === "LONG_LEAVE");
      const inhaldagenLt = leaveTypes.find((lt) => lt.code === "INHALDAGEN");

      const items: { leaveTypeId: string; days: number }[] = [];
      if (annualDays > 0 && annualLt) items.push({ leaveTypeId: annualLt.id, days: annualDays });
      if (longLeaveDays > 0 && longLt) items.push({ leaveTypeId: longLt.id, days: longLeaveDays });
      if (inhaldagenDays > 0 && inhaldagenLt) items.push({ leaveTypeId: inhaldagenLt.id, days: inhaldagenDays });

      mockDb.createLeaveRequest({
        employeeId,
        requestDate: new Date(requestDate),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        purpose,
        notes: notes || null,
        createdById: user.id,
        items,
      });
    } catch (mockErr) {
      console.error("MockDb leave request sync warning:", mockErr);
    }

    // Log Audit
    await logAudit({
      userId: user.id,
      action: "CREATE_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: reqId,
      description: `Pengambilan cuti ${employee.nama} (${employee.nip}) sebanyak ${totalDays} hari dengan No: ${requestNumber}.`,
      newValues: {
        requestNumber,
        employeeName: employee.nama,
        totalDays,
        annualDays,
        longLeaveDays,
        inhaldagenDays,
      },
    });

    return {
      success: true,
      message: `Permohonan cuti berhasil disimpan dengan No: ${requestNumber}`,
      data: {
        requestNumber,
        leaveRequestId: reqId,
      },
    };
  } catch (error) {
    console.error("Create leave request error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses permohonan cuti di database.",
    };
  }
}

export async function getEmployeeTransactionsAction(employeeId: string) {
  await requireAuth();

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return {
        success: false,
        message: "Karyawan tidak ditemukan di database.",
      };
    }

    const transactions = mockDb.getTransactions(employeeId);

    return {
      success: true,
      data: {
        employee: {
          id: employee.id,
          employeeNumber: employee.nip,
          name: employee.nama,
          department: { name: employee.bagian },
        },
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
