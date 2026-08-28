"use server";

import { prisma } from "@/lib/db/prisma";
import { mockDb } from "@/lib/mock-db";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { ActionResult } from "@/actions/leave-actions";
import { z } from "zod";

const departmentSchema = z.object({
  code: z
    .string()
    .min(2, "Kode bagian minimal 2 karakter")
    .max(20, "Kode bagian maksimal 20 karakter")
    .regex(/^[A-Z0-9_-]+$/, "Kode bagian hanya boleh huruf kapital, angka, strip, atau underscore"),
  name: z.string().min(2, "Nama bagian minimal 2 karakter").max(150, "Nama bagian maksimal 150 karakter"),
  isActive: z.boolean().default(true),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

export async function getDepartmentsListAction() {
  await requireAuth();

  try {
    const departments = await prisma.department.findMany({
      orderBy: { code: "asc" },
    });

    const employees = await prisma.employee.findMany();

    // Map departments with employee count
    const data = departments.map((dept) => {
      const count = employees.filter(
        (e) =>
          e.bagian === dept.name ||
          e.bagian === dept.code ||
          e.bagian?.toLowerCase() === dept.name.toLowerCase()
      ).length;

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        isActive: dept.isActive,
        employeeCount: count,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
      };
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get departments error:", error);
    return {
      success: false,
      message: "Gagal memuat data bagian.",
      data: [],
    };
  }
}

export async function createDepartmentAction(
  data: DepartmentInput
): Promise<ActionResult<{ departmentId: string }>> {
  const user = await requireAuth();

  const validation = departmentSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data bagian gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { code, name, isActive } = validation.data;
  const formattedCode = code.toUpperCase().trim();
  const formattedName = name.trim();

  try {
    // Cek duplikasi kode bagian di database
    const existingCode = await prisma.department.findUnique({
      where: { code: formattedCode },
    });

    if (existingCode) {
      return {
        success: false,
        message: `Kode bagian '${formattedCode}' sudah digunakan oleh bagian lain (${existingCode.name}).`,
      };
    }

    const created = await prisma.department.create({
      data: {
        code: formattedCode,
        name: formattedName,
        isActive,
      },
    });

    // Sinkronisasi ke mockDb
    mockDb.departments.push({
      id: created.id,
      code: created.code,
      name: created.name,
      headEmployeeId: null,
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE_DEPARTMENT",
      entityType: "DEPARTMENT",
      entityId: created.id,
      description: `Menambahkan master bagian baru: ${created.name} (Kode: ${created.code}).`,
    });

    return {
      success: true,
      message: `Bagian '${created.name}' (${created.code}) berhasil ditambahkan ke database!`,
      data: {
        departmentId: created.id,
      },
    };
  } catch (error) {
    console.error("Create department error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menambahkan bagian baru.",
    };
  }
}

export async function updateDepartmentAction(
  id: string,
  data: DepartmentInput
): Promise<ActionResult> {
  const user = await requireAuth();

  const validation = departmentSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data bagian gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { code, name, isActive } = validation.data;
  const formattedCode = code.toUpperCase().trim();
  const formattedName = name.trim();

  try {
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data bagian tidak ditemukan.",
      };
    }

    // Cek duplikasi kode
    if (formattedCode !== existing.code) {
      const duplicate = await prisma.department.findUnique({
        where: { code: formattedCode },
      });
      if (duplicate && duplicate.id !== id) {
        return {
          success: false,
          message: `Kode bagian '${formattedCode}' sudah digunakan oleh bagian lain (${duplicate.name}).`,
        };
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        code: formattedCode,
        name: formattedName,
        isActive,
      },
    });

    // Jika nama bagian berubah, sinkronkan juga nama bagian pada data karyawan terkait
    if (existing.name !== updated.name) {
      await prisma.employee.updateMany({
        where: { bagian: existing.name },
        data: { bagian: updated.name },
      });
    }

    // Sinkronisasi ke mockDb
    const mockIndex = mockDb.departments.findIndex((d) => d.id === id);
    if (mockIndex !== -1) {
      mockDb.departments[mockIndex] = {
        ...mockDb.departments[mockIndex],
        code: updated.code,
        name: updated.name,
        isActive: updated.isActive,
        updatedAt: new Date(),
      };
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE_DEPARTMENT",
      entityType: "DEPARTMENT",
      entityId: id,
      description: `Memperbarui data bagian: ${updated.name} (Kode: ${updated.code}).`,
      oldValues: { code: existing.code, name: existing.name, isActive: existing.isActive },
      newValues: { code: updated.code, name: updated.name, isActive: updated.isActive },
    });

    return {
      success: true,
      message: `Bagian '${updated.name}' berhasil diperbarui!`,
      data: updated,
    };
  } catch (error) {
    console.error("Update department error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui data bagian.",
    };
  }
}

export async function deleteDepartmentAction(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data bagian tidak ditemukan.",
      };
    }

    // Cek apakah masih ada karyawan di bagian ini
    const empCount = await prisma.employee.count({
      where: {
        OR: [
          { bagian: existing.name },
          { bagian: existing.code },
        ],
      },
    });

    if (empCount > 0) {
      return {
        success: false,
        message: `Tidak dapat menghapus '${existing.name}' karena masih terdapat ${empCount} karyawan yang terdaftar di bagian ini. Silakan pindahkan karyawan terlebih dahulu.`,
      };
    }

    await prisma.department.delete({
      where: { id },
    });

    // Sinkronisasi ke mockDb
    mockDb.departments = mockDb.departments.filter((d) => d.id !== id);

    await logAudit({
      userId: user.id,
      action: "DELETE_DEPARTMENT",
      entityType: "DEPARTMENT",
      entityId: id,
      description: `Menghapus master bagian: ${existing.name} (Kode: ${existing.code}).`,
    });

    return {
      success: true,
      message: `Bagian '${existing.name}' berhasil dihapus dari database!`,
    };
  } catch (error) {
    console.error("Delete department error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus data bagian.",
    };
  }
}
