"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema, LoginInput } from "@/lib/validation/auth-schema";
import { setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import type { ActionResult } from "@/types/actions";

export async function loginAction(
  data: LoginInput
): Promise<ActionResult<{ redirectUrl: string }>> {
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi gagal. Mohon periksa input Anda.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return {
        success: false,
        message: "Username atau password tidak valid.",
      };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return {
        success: false,
        message: "Username atau password tidak valid.",
      };
    }

    // Update lastLoginAt in MySQL database
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set server session cookie
    await setSessionCookie({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      fotoProfil: user.fotoProfil,
      isActive: user.isActive,
    });

    // Log audit
    await logAudit({
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      description: `User ${user.username} (${user.fullName}) berhasil login.`,
    });

    return {
      success: true,
      data: { redirectUrl: "/dashboard" },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan pada server database. Pastikan MySQL aktif.",
    };
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await logAudit({
        userId: currentUser.id,
        action: "LOGOUT",
        entityType: "USER",
        entityId: currentUser.id,
        description: `User ${currentUser.username} logout dari sistem.`,
      });
    }

    await clearSessionCookie();
    return {
      success: true,
      message: "Berhasil keluar dari sistem.",
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      message: "Gagal logout.",
    };
  }
}
