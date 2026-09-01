"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { ActionResult } from "@/actions/leave-actions";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN_UTAMA", "ADMIN_BAGIAN"]),
  department: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["ADMIN_UTAMA", "ADMIN_BAGIAN"]),
  department: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function getUsersAction() {
  const currentUser = await requireAuth();

  // Hanya Admin Utama yang boleh mengelola akun user
  if (currentUser.role !== "ADMIN_UTAMA") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Admin Utama yang dapat mengelola data user.",
      data: [],
    };
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Get users error:", error);
    return {
      success: false,
      message: "Gagal memuat data user.",
      data: [],
    };
  }
}

export async function createUserAction(
  data: CreateUserInput
): Promise<ActionResult<{ userId: string }>> {
  const currentUser = await requireAuth();

  if (currentUser.role !== "ADMIN_UTAMA") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Admin Utama yang dapat menambah user.",
    };
  }

  const validation = createUserSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi gagal. Mohon periksa kembali isian Anda.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { username, fullName, password, role, department, isActive } = validation.data;

  try {
    // Cek username sudah ada atau belum
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      return {
        success: false,
        message: `Username '${username}' sudah digunakan oleh akun lain.`,
      };
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const dept = role === "ADMIN_UTAMA" ? "ALL" : department || "TUK";

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        fullName: fullName.trim(),
        passwordHash,
        role: role as UserRole,
        department: dept,
        isActive,
      },
    });

    await logAudit({
      userId: currentUser.id,
      action: "CREATE_USER",
      entityType: "USER",
      entityId: newUser.id,
      description: `Membuat akun user baru: ${newUser.username} (${newUser.fullName}, Role: ${newUser.role}, Bagian: ${newUser.department}).`,
    });

    return {
      success: true,
      message: `User '${newUser.username}' berhasil dibuat!`,
      data: {
        userId: newUser.id,
      },
    };
  } catch (error) {
    console.error("Create user error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menyimpan user baru.",
    };
  }
}

export async function updateUserAction(
  id: string,
  data: UpdateUserInput
): Promise<ActionResult> {
  const currentUser = await requireAuth();

  if (currentUser.role !== "ADMIN_UTAMA") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Admin Utama yang dapat mengubah data user.",
    };
  }

  const validation = updateUserSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data user gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { username, fullName, password, role, department, isActive } = validation.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "User tidak ditemukan.",
      };
    }

    // Cek duplikasi username
    if (username.toLowerCase().trim() !== existing.username.toLowerCase()) {
      const duplicate = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });
      if (duplicate && duplicate.id !== id) {
        return {
          success: false,
          message: `Username '${username}' sudah digunakan oleh user lain.`,
        };
      }
    }

    // Proteksi: jangan sampai akun yang sedang login menonaktifkan dirinya sendiri
    if (currentUser.id === id && !isActive) {
      return {
        success: false,
        message: "Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan saat ini.",
      };
    }

    const updateData: {
      username: string;
      fullName: string;
      role: UserRole;
      department: string;
      isActive: boolean;
      passwordHash?: string;
    } = {
      username: username.toLowerCase().trim(),
      fullName: fullName.trim(),
      role: role as UserRole,
      department: role === "ADMIN_UTAMA" ? "ALL" : department || "TUK",
      isActive,
    };

    // Jika ada password baru yang diinput
    if (password && password.trim().length >= 6) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(password.trim(), saltRounds);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: currentUser.id,
      action: "UPDATE_USER",
      entityType: "USER",
      entityId: id,
      description: `Memperbarui akun user: ${updated.username} (${updated.fullName}).`,
    });

    return {
      success: true,
      message: `Data user '${updated.username}' berhasil diperbarui!`,
      data: updated,
    };
  } catch (error) {
    console.error("Update user error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui user.",
    };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const currentUser = await requireAuth();

  if (currentUser.role !== "ADMIN_UTAMA") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Admin Utama yang dapat menghapus user.",
    };
  }

  // Proteksi: Mencegah menghapus akun sendiri
  if (currentUser.id === id) {
    return {
      success: false,
      message: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.",
    };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "User tidak ditemukan.",
      };
    }

    await prisma.user.delete({
      where: { id },
    });

    await logAudit({
      userId: currentUser.id,
      action: "DELETE_USER",
      entityType: "USER",
      entityId: id,
      description: `Menghapus akun user: ${existing.username} (${existing.fullName}).`,
    });

    return {
      success: true,
      message: `User '${existing.username}' berhasil dihapus dari database!`,
    };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus user.",
    };
  }
}

export async function toggleBanUserAction(id: string): Promise<ActionResult> {
  const currentUser = await requireAuth();

  if (currentUser.role !== "ADMIN_UTAMA") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Admin Utama yang memiliki wewenang untuk memblokir atau mengaktifkan akun pengguna.",
    };
  }

  if (currentUser.id === id) {
    return {
      success: false,
      message: "Anda tidak dapat memblokir/menonaktifkan akun Anda sendiri yang sedang aktif digunakan.",
    };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "User tidak ditemukan di database.",
      };
    }

    const newActiveState = !existing.isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: newActiveState },
    });

    await logAudit({
      userId: currentUser.id,
      action: newActiveState ? "UNBAN_USER" : "BAN_USER",
      entityType: "USER",
      entityId: id,
      description: newActiveState
        ? `Membuka blokir (Unban) akun user: ${updated.username} (${updated.fullName}).`
        : `Memblokir (Ban) akun user: ${updated.username} (${updated.fullName}).`,
    });

    return {
      success: true,
      message: newActiveState
        ? `Akun '${updated.username}' berhasil diaktifkan kembali (Unban).`
        : `Akun '${updated.username}' telah berhasil diblokir (Banned)!`,
      data: updated,
    };
  } catch (error) {
    console.error("Toggle ban user error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses status blokir akun.",
    };
  }
}
