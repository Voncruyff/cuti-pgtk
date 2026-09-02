"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import type { ActionResult } from "@/types/actions";
import { z } from "zod";

const stationSchema = z.object({
  code: z
    .string()
    .min(2, "Kode stasiun minimal 2 karakter")
    .max(20, "Kode stasiun maksimal 20 karakter")
    .regex(/^[A-Z0-9_-]+$/, "Kode stasiun hanya boleh huruf kapital, angka, strip, atau underscore"),
  name: z
    .string()
    .min(2, "Nama stasiun minimal 2 karakter")
    .max(150, "Nama stasiun maksimal 150 karakter"),
  departmentId: z.string().min(1, "Bagian wajib dipilih"),
  isActive: z.boolean().default(true),
});

export type StationInput = z.infer<typeof stationSchema>;

export interface StationItem {
  id: string;
  code: string;
  name: string;
  departmentId: string | null;
  departmentName: string;
  departmentCode: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export async function getStationsListAction() {
  await requireAuth();

  try {
    const stations = await prisma.station.findMany({
      include: {
        department: true,
      },
      orderBy: { code: "asc" },
    });

    const data: StationItem[] = stations.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      departmentId: s.departmentId,
      departmentName: s.department?.name || "Belum Ditentukan",
      departmentCode: s.department?.code || "-",
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get stations error:", error);
    return {
      success: false,
      message: "Gagal memuat data master stasiun.",
      data: [],
    };
  }
}

export async function getDepartmentsSelectorAction() {
  await requireAuth();

  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    return {
      success: true,
      data: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
      })),
    };
  } catch (error) {
    console.error("Get departments selector error:", error);
    return {
      success: false,
      message: "Gagal memuat opsi bagian.",
      data: [],
    };
  }
}

export async function createStationAction(
  data: StationInput
): Promise<ActionResult<{ stationId: string }>> {
  const user = await requireAuth();

  const validation = stationSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data stasiun gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { code, name, departmentId, isActive } = validation.data;
  const formattedCode = code.toUpperCase().trim();
  const formattedName = name.trim();

  try {
    // Cek duplikasi kode stasiun di database
    const existingCode = await prisma.station.findUnique({
      where: { code: formattedCode },
    });

    if (existingCode) {
      return {
        success: false,
        message: `Kode stasiun '${formattedCode}' sudah digunakan oleh stasiun '${existingCode.name}'.`,
      };
    }

    const created = await prisma.station.create({
      data: {
        code: formattedCode,
        name: formattedName,
        departmentId: departmentId || null,
        isActive,
      },
      include: {
        department: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE_STATION",
      entityType: "STATION",
      entityId: created.id,
      description: `Menambahkan master stasiun baru: ${created.name} (Kode: ${created.code}, Bagian: ${created.department?.name || "-"}).`,
    });

    return {
      success: true,
      message: `Stasiun '${created.name}' (${created.code}) berhasil ditambahkan!`,
      data: {
        stationId: created.id,
      },
    };
  } catch (error) {
    console.error("Create station error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menambahkan stasiun baru.",
    };
  }
}

export async function updateStationAction(
  id: string,
  data: StationInput
): Promise<ActionResult> {
  const user = await requireAuth();

  const validation = stationSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data stasiun gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { code, name, departmentId, isActive } = validation.data;
  const formattedCode = code.toUpperCase().trim();
  const formattedName = name.trim();

  try {
    const existing = await prisma.station.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data stasiun tidak ditemukan.",
      };
    }

    // Cek duplikasi kode jika kode berubah
    if (formattedCode !== existing.code) {
      const duplicate = await prisma.station.findUnique({
        where: { code: formattedCode },
      });
      if (duplicate && duplicate.id !== id) {
        return {
          success: false,
          message: `Kode stasiun '${formattedCode}' sudah digunakan oleh stasiun lain (${duplicate.name}).`,
        };
      }
    }

    const updated = await prisma.station.update({
      where: { id },
      data: {
        code: formattedCode,
        name: formattedName,
        departmentId: departmentId || null,
        isActive,
      },
      include: {
        department: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE_STATION",
      entityType: "STATION",
      entityId: id,
      description: `Memperbarui data stasiun: ${updated.name} (Kode: ${updated.code}).`,
      oldValues: {
        code: existing.code,
        name: existing.name,
        departmentId: existing.departmentId,
        isActive: existing.isActive,
      },
      newValues: {
        code: updated.code,
        name: updated.name,
        departmentId: updated.departmentId,
        isActive: updated.isActive,
      },
    });

    return {
      success: true,
      message: `Stasiun '${updated.name}' berhasil diperbarui!`,
      data: updated,
    };
  } catch (error) {
    console.error("Update station error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui data stasiun.",
    };
  }
}

export async function deleteStationAction(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const existing = await prisma.station.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data stasiun tidak ditemukan.",
      };
    }

    await prisma.station.delete({
      where: { id },
    });

    await logAudit({
      userId: user.id,
      action: "DELETE_STATION",
      entityType: "STATION",
      entityId: id,
      description: `Menghapus master stasiun: ${existing.name} (Kode: ${existing.code}).`,
    });

    return {
      success: true,
      message: `Stasiun '${existing.name}' (${existing.code}) berhasil dihapus!`,
    };
  } catch (error) {
    console.error("Delete station error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus data stasiun.",
    };
  }
}
