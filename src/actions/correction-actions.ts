"use server";

import { prisma } from "@/lib/db/prisma";
import { mockDb } from "@/lib/mock-db";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface LeaveRequestCorrectionItem {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  position: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  purpose: string;
  notes: string | null;
  status: "APPROVED" | "CANCELLED" | "PENDING";
  totalDays: number;
  annualDays: number;
  longLeaveDays: number;
  inhaldagenDays: number;
  createdByName: string;
  createdAt: string;
  cancelledAt?: string | null;
  cancelledByName?: string | null;
  cancelReason?: string | null;
}

export async function getLeaveRequestsForCorrectionAction(params?: {
  search?: string;
  department?: string;
  status?: string;
}) {
  const user = await requireAuth();

  try {
    const rawRequests = mockDb.getLeaveRequests();
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { station: true, leaveBalance: true },
    });

    const empMap = new Map(employees.map((e) => [e.id, e]));

    let items: LeaveRequestCorrectionItem[] = rawRequests.map((req) => {
      const emp: any = empMap.get(req.employeeId) || req.employee;
      const details = req.details || [];

      let annualDays = 0;
      let longLeaveDays = 0;
      let inhaldagenDays = 0;

      for (const d of details) {
        if (d.leaveType?.code === "ANNUAL") annualDays += d.days;
        else if (d.leaveType?.code === "LONG_LEAVE") longLeaveDays += d.days;
        else if (d.leaveType?.code === "INHALDAGEN") inhaldagenDays += d.days;
      }

      const totalDays = annualDays + longLeaveDays + inhaldagenDays || 1;

      return {
        id: req.id,
        requestNumber: req.requestNumber,
        employeeId: req.employeeId,
        employeeName: emp?.nama || emp?.name || "Karyawan",
        employeeNumber: emp?.nip || emp?.employeeNumber || "-",
        departmentName: emp?.bagian || emp?.department?.name || "-",
        position: emp?.jabatan || emp?.position || "-",
        requestDate: req.requestDate.toISOString(),
        startDate: req.startDate ? req.startDate.toISOString() : req.requestDate.toISOString(),
        endDate: req.endDate ? req.endDate.toISOString() : req.startDate ? req.startDate.toISOString() : req.requestDate.toISOString(),
        purpose: req.purpose,
        notes: req.notes,
        status: (req.status as "APPROVED" | "CANCELLED") || "APPROVED",
        totalDays,
        annualDays,
        longLeaveDays,
        inhaldagenDays,
        createdByName: req.createdBy?.fullName || req.createdBy?.username || "Admin",
        createdAt: req.createdAt.toISOString(),
      };
    });

    // Filter by department if Admin Bagian
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      items = items.filter((item) => {
        const itemDept = item.departmentName.toLowerCase();
        return itemDept.includes(userDept) || userDept.includes(itemDept);
      });
    } else if (params?.department && params.department !== "ALL") {
      const filterDept = params.department.toLowerCase();
      items = items.filter((item) => {
        const itemDept = item.departmentName.toLowerCase();
        return itemDept.includes(filterDept) || filterDept.includes(itemDept);
      });
    }

    // Filter by status
    if (params?.status && params.status !== "ALL") {
      items = items.filter((item) => item.status === params.status);
    }

    // Filter by search query
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeNumber.toLowerCase().includes(q) ||
          item.requestNumber.toLowerCase().includes(q) ||
          item.purpose.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error("getLeaveRequestsForCorrectionAction error:", error);
    return {
      success: false,
      message: "Gagal memuat data transaksi cuti untuk koreksi.",
      data: [],
    };
  }
}

export async function voidLeaveRequestAction(data: {
  leaveRequestId: string;
  reason: string;
}): Promise<ActionResult<{ restoredDays: number; requestNumber: string }>> {
  const user = await requireAuth();

  if (!data.leaveRequestId) {
    return { success: false, message: "ID Permohonan cuti tidak valid." };
  }

  if (!data.reason || data.reason.trim().length < 3) {
    return { success: false, message: "Alasan pembatalan/koreksi minimal 3 karakter." };
  }

  try {
    const rawRequests = mockDb.getLeaveRequests();
    const targetReq = rawRequests.find((r) => r.id === data.leaveRequestId);

    if (!targetReq) {
      return { success: false, message: "Data permohonan cuti tidak ditemukan." };
    }

    if (targetReq.status === "CANCELLED") {
      return { success: false, message: "Permohonan cuti ini sudah dibatalkan sebelumnya." };
    }

    // Fetch employee from database
    const employee = await prisma.employee.findUnique({
      where: { id: targetReq.employeeId },
      include: { leaveBalance: true },
    });

    if (!employee) {
      return { success: false, message: "Data karyawan tidak ditemukan di database." };
    }

    // Role check
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      const empDept = employee.bagian.toLowerCase();
      if (!empDept.includes(userDept) && !userDept.includes(empDept)) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk mengoreksi cuti karyawan bagian ${user.department}.`,
        };
      }
    }

    // Calculate days to restore
    let annualDays = 0;
    let longLeaveDays = 0;
    let inhaldagenDays = 0;

    const details = targetReq.details || [];
    for (const d of details) {
      if (d.leaveType?.code === "ANNUAL") annualDays += d.days;
      else if (d.leaveType?.code === "LONG_LEAVE") longLeaveDays += d.days;
      else if (d.leaveType?.code === "INHALDAGEN") inhaldagenDays += d.days;
    }

    // If details empty in mock, try to parse from transactions
    const totalDaysToRestore = annualDays + longLeaveDays + inhaldagenDays || 1;
    if (annualDays === 0 && longLeaveDays === 0 && inhaldagenDays === 0) {
      annualDays = totalDaysToRestore;
    }

    // Update employee balance in database (+ restore days)
    const currentAnnual = employee.leaveBalance?.cutiTahunan ?? 12;
    const currentLong = employee.leaveBalance?.cutiBesar ?? 0;
    const currentInhal = employee.leaveBalance?.inhaldagen ?? 0;

    const restoredAnnual = currentAnnual + annualDays;
    const restoredLong = currentLong + longLeaveDays;
    const restoredInhal = currentInhal + inhaldagenDays;
    const restoredTotal = restoredAnnual + restoredLong + restoredInhal;

    await prisma.leaveBalance.upsert({
      where: { nip: employee.nip },
      create: {
        nip: employee.nip,
        nama: employee.nama,
        cutiTahunan: restoredAnnual,
        cutiBesar: restoredLong,
        inhaldagen: restoredInhal,
        total: restoredTotal,
        periode: new Date().getFullYear(),
      },
      update: {
        cutiTahunan: restoredAnnual,
        cutiBesar: restoredLong,
        inhaldagen: restoredInhal,
        total: restoredTotal,
      },
    });

    // Update status in mockDb
    targetReq.status = "CANCELLED";

    // Add Reversal transaction to mock ledger
    const leaveTypes = mockDb.getLeaveTypes();
    const annualLt = leaveTypes.find((lt) => lt.code === "ANNUAL");
    const longLt = leaveTypes.find((lt) => lt.code === "LONG_LEAVE");
    const inhalLt = leaveTypes.find((lt) => lt.code === "INHALDAGEN");

    if (annualDays > 0 && annualLt) {
      mockDb.addTransaction({
        employeeId: employee.id,
        leaveTypeId: annualLt.id,
        transactionType: "REVERSAL",
        transactionDate: new Date(),
        amount: annualDays,
        description: `Koreksi / Pembatalan Cuti No: ${targetReq.requestNumber}`,
        notes: `Alasan: ${data.reason.trim()}`,
        createdById: user.id,
        leaveRequestId: targetReq.id,
      });
    }

    if (longLeaveDays > 0 && longLt) {
      mockDb.addTransaction({
        employeeId: employee.id,
        leaveTypeId: longLt.id,
        transactionType: "REVERSAL",
        transactionDate: new Date(),
        amount: longLeaveDays,
        description: `Koreksi / Pembatalan Cuti Besar No: ${targetReq.requestNumber}`,
        notes: `Alasan: ${data.reason.trim()}`,
        createdById: user.id,
        leaveRequestId: targetReq.id,
      });
    }

    if (inhaldagenDays > 0 && inhalLt) {
      mockDb.addTransaction({
        employeeId: employee.id,
        leaveTypeId: inhalLt.id,
        transactionType: "REVERSAL",
        transactionDate: new Date(),
        amount: inhaldagenDays,
        description: `Koreksi / Pembatalan Inhaldagen No: ${targetReq.requestNumber}`,
        notes: `Alasan: ${data.reason.trim()}`,
        createdById: user.id,
        leaveRequestId: targetReq.id,
      });
    }

    // Log Audit
    await logAudit({
      userId: user.id,
      action: "VOID_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: targetReq.id,
      description: `Pembatalan / Koreksi Cuti ${employee.nama} (${employee.nip}) No: ${targetReq.requestNumber}. Saldo ${totalDaysToRestore} hari dipulihkan. Alasan: ${data.reason}`,
      newValues: {
        requestNumber: targetReq.requestNumber,
        employeeName: employee.nama,
        restoredDays: totalDaysToRestore,
        reason: data.reason,
      },
    });

    return {
      success: true,
      message: `Permohonan cuti No: ${targetReq.requestNumber} berhasil dibatalkan dan saldo ${totalDaysToRestore} hari telah dikembalikan.`,
      data: {
        restoredDays: totalDaysToRestore,
        requestNumber: targetReq.requestNumber,
      },
    };
  } catch (error) {
    console.error("voidLeaveRequestAction error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat membatalkan permohonan cuti di database.",
    };
  }
}
