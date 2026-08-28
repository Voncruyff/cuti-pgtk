"use server";

import { prisma } from "@/lib/db/prisma";
import { mockDb } from "@/lib/mock-db";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { ActionResult } from "@/actions/leave-actions";
import { z } from "zod";

const leaderSchema = z.object({
  employeeNumber: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama karyawan wajib diisi"),
  position: z.string().optional().default("-"),
  departmentId: z.string().min(1, "Bagian wajib dipilih"),
  initialAnnual: z.coerce.number().min(0).default(12),
  initialLongLeave: z.coerce.number().min(0).default(0),
  initialInhaldagen: z.coerce.number().min(0).default(0),
});

export type LeaderInput = z.infer<typeof leaderSchema>;

export async function getLeadersAction() {
  await requireAuth();

  try {
    const dbEmployees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });

    const departments = await prisma.department.findMany();

    // Map each DB employee and sync to mockDb for leave ledger calculations
    const result = dbEmployees.map((emp) => {
      const dept = departments.find(
        (d) => d.id === emp.bagian || d.name.toLowerCase() === emp.bagian.toLowerCase()
      );

      // Keep mockDb synchronized
      const existingInMock = mockDb.findEmployeeById(emp.id);
      if (!existingInMock) {
        mockDb.employees.push({
          id: emp.id,
          employeeNumber: emp.nip,
          name: emp.nama,
          position: emp.jabatan || "-",
          departmentId: dept?.id || "dept-tuk",
          employmentStatus: "PIMPINAN",
          isActive: emp.isActive,
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt,
        });
      }

      const balances = mockDb.calculateBalances(emp.id);

      return {
        id: emp.id,
        employeeNumber: emp.nip,
        name: emp.nama,
        position: emp.jabatan || "-",
        departmentId: dept?.id || emp.bagian,
        department: {
          id: dept?.id || emp.bagian,
          code: dept?.code || "-",
          name: dept?.name || emp.bagian || "-",
        },
        balances,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get leaders error:", error);
    // Fallback to mockDb if database connection issue
    return {
      success: true,
      data: mockDb.getEmployees(),
    };
  }
}

export async function getDepartmentsAction() {
  await requireAuth();

  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    if (departments.length > 0) {
      return {
        success: true,
        data: departments,
      };
    }
  } catch (err) {
    console.warn("Falling back to mock departments:", err);
  }

  return {
    success: true,
    data: mockDb.getDepartments(),
  };
}

export async function createLeaderAction(
  data: LeaderInput
): Promise<ActionResult<{ employeeId: string }>> {
  const user = await requireAuth();

  const validation = leaderSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data karyawan gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const {
    employeeNumber,
    name,
    position,
    departmentId,
    initialAnnual,
    initialLongLeave,
    initialInhaldagen,
  } = validation.data;

  try {
    // Check if NIP already exists in MySQL
    const existing = await prisma.employee.findUnique({
      where: { nip: employeeNumber.trim() },
    });

    if (existing) {
      return {
        success: false,
        message: `Karyawan dengan NIP ${employeeNumber} sudah terdaftar (${existing.nama}).`,
      };
    }

    // Resolve department name (wajib)
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    const deptName = dept ? dept.name : departmentId;
    const resolvedDeptId = dept ? dept.id : departmentId;

    const pos = position && position.trim() ? position.trim() : "-";

    // 1. Insert into MySQL employees table
    const createdEmp = await prisma.employee.create({
      data: {
        nip: employeeNumber.trim(),
        nama: name.trim(),
        jabatan: pos,
        bagian: deptName,
        isActive: true,
      },
    });

    // 2. Sync to mockDb for leave ledger
    mockDb.employees.push({
      id: createdEmp.id,
      employeeNumber: createdEmp.nip,
      name: createdEmp.nama,
      position: createdEmp.jabatan,
      departmentId: resolvedDeptId,
      employmentStatus: "PIMPINAN",
      isActive: true,
      createdAt: createdEmp.createdAt,
      updatedAt: createdEmp.updatedAt,
    });

    // 3. Opening Balances in Ledger
    const leaveTypes = mockDb.getLeaveTypes();
    const annualLt = leaveTypes.find((lt) => lt.code === "ANNUAL");
    const longLt = leaveTypes.find((lt) => lt.code === "LONG_LEAVE");
    const inhaldagenLt = leaveTypes.find((lt) => lt.code === "INHALDAGEN");
    const now = new Date();

    if (initialAnnual > 0 && annualLt) {
      mockDb.addTransaction({
        employeeId: createdEmp.id,
        leaveTypeId: annualLt.id,
        transactionType: "OPENING_BALANCE",
        transactionDate: now,
        amount: initialAnnual,
        description: "Saldo Awal Cuti Tahunan",
        createdById: user.id,
      });
    }

    if (initialLongLeave > 0 && longLt) {
      mockDb.addTransaction({
        employeeId: createdEmp.id,
        leaveTypeId: longLt.id,
        transactionType: "OPENING_BALANCE",
        transactionDate: now,
        amount: initialLongLeave,
        description: "Saldo Awal Cuti Besar",
        createdById: user.id,
      });
    }

    if (initialInhaldagen > 0 && inhaldagenLt) {
      mockDb.addTransaction({
        employeeId: createdEmp.id,
        leaveTypeId: inhaldagenLt.id,
        transactionType: "OPENING_BALANCE",
        transactionDate: now,
        amount: initialInhaldagen,
        description: "Saldo Awal Inhaldagen",
        createdById: user.id,
      });
    }

    // 4. Audit Log
    await logAudit({
      userId: user.id,
      action: "CREATE_EMPLOYEE",
      entityType: "EMPLOYEE",
      entityId: createdEmp.id,
      description: `Menambahkan karyawan baru: ${createdEmp.nama} (NIP: ${createdEmp.nip}, ${createdEmp.jabatan} - ${createdEmp.bagian}).`,
      newValues: {
        nip: createdEmp.nip,
        nama: createdEmp.nama,
        jabatan: createdEmp.jabatan,
        bagian: createdEmp.bagian,
        initialAnnual,
        initialLongLeave,
        initialInhaldagen,
      },
    });

    return {
      success: true,
      message: `Data karyawan ${createdEmp.nama} berhasil disimpan ke database MySQL!`,
      data: {
        employeeId: createdEmp.id,
      },
    };
  } catch (error) {
    console.error("Create employee error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menambahkan data karyawan ke database.",
    };
  }
}

export async function updateLeaderAction(
  id: string,
  data: {
    employeeNumber: string;
    name: string;
    position?: string;
    departmentId?: string;
  }
): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan di database.",
      };
    }

    // Check duplicate NIP in MySQL
    if (data.employeeNumber.trim().toLowerCase() !== existing.nip.toLowerCase()) {
      const duplicate = await prisma.employee.findUnique({
        where: { nip: data.employeeNumber.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        return {
          success: false,
          message: `NIP ${data.employeeNumber} sudah digunakan oleh karyawan lain (${duplicate.nama}).`,
        };
      }
    }

    // Resolve department
    let deptName = existing.bagian;
    if (data.departmentId && data.departmentId.trim()) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      deptName = dept ? dept.name : data.departmentId;
    } else if (data.departmentId === "") {
      deptName = "-";
    }

    const pos = data.position && data.position.trim() ? data.position.trim() : "-";

    // 1. Update MySQL
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        nip: data.employeeNumber.trim(),
        nama: data.name.trim(),
        jabatan: pos,
        bagian: deptName,
      },
    });

    // 2. Sync to mockDb
    mockDb.updateEmployee(id, {
      employeeNumber: updated.nip,
      name: updated.nama,
      position: updated.jabatan,
      departmentId: data.departmentId || "dept-tuk",
    });

    // 3. Audit Log
    await logAudit({
      userId: user.id,
      action: "UPDATE_EMPLOYEE",
      entityType: "EMPLOYEE",
      entityId: id,
      description: `Memperbarui data karyawan: ${updated.nama} (NIP: ${updated.nip}).`,
      oldValues: {
        nip: existing.nip,
        nama: existing.nama,
        jabatan: existing.jabatan,
        bagian: existing.bagian,
      },
      newValues: {
        nip: updated.nip,
        nama: updated.nama,
        jabatan: updated.jabatan,
        bagian: updated.bagian,
      },
    });

    return {
      success: true,
      message: `Data karyawan ${updated.nama} berhasil diperbarui di database!`,
      data: updated,
    };
  } catch (error) {
    console.error("Update employee error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui data karyawan.",
    };
  }
}

export async function deleteLeaderAction(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan.",
      };
    }

    // 1. Delete from MySQL
    await prisma.employee.delete({
      where: { id },
    });

    // 2. Delete from mockDb
    mockDb.deleteEmployee(id);

    // 3. Audit Log
    await logAudit({
      userId: user.id,
      action: "DELETE_EMPLOYEE",
      entityType: "EMPLOYEE",
      entityId: id,
      description: `Menghapus data karyawan: ${existing.nama} (NIP: ${existing.nip}).`,
    });

    return {
      success: true,
      message: `Data karyawan ${existing.nama} berhasil dihapus dari database!`,
    };
  } catch (error) {
    console.error("Delete employee error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus data karyawan dari database.",
    };
  }
}
