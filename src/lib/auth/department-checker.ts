import { prisma } from "@/lib/db/prisma";

export const KNOWN_DEPARTMENT_ALIASES: Record<string, string[]> = {
  TUK: [
    "tuk",
    "tata usaha & keuangan",
    "tata usaha dan keuangan",
    "tata usaha",
    "keuangan",
    "dept-tuk",
  ],
  TAN: [
    "tan",
    "tanaman",
    "dept-tan",
  ],
  TEK: [
    "tek",
    "teknik",
    "dept-tek",
  ],
  PAB: [
    "pab",
    "pabrikasi",
    "dept-pab",
  ],
};

/**
 * Mengambil daftar representasi/alias nama departemen yang diizinkan untuk departemen pengguna.
 * Jika departemen bernilai "ALL" atau kosong, kembalikan array kosong (menandakan akses seluruh bagian).
 */
export async function getAllowedDepartmentNames(
  userDepartment?: string | null
): Promise<string[]> {
  if (!userDepartment || userDepartment.trim() === "" || userDepartment.toUpperCase() === "ALL") {
    return [];
  }

  const raw = userDepartment.trim();
  const upper = raw.toUpperCase();
  const allowedSet = new Set<string>([raw.toLowerCase()]);

  // Tambahkan alias yang sudah diketahui secara statis
  if (KNOWN_DEPARTMENT_ALIASES[upper]) {
    for (const alias of KNOWN_DEPARTMENT_ALIASES[upper]) {
      allowedSet.add(alias.toLowerCase());
    }
  }

  // Cari di database untuk mencari relasi code, id, atau name
  try {
    const dept = await prisma.department.findFirst({
      where: {
        OR: [
          { code: { equals: raw } },
          { id: { equals: raw } },
          { name: { contains: raw } },
        ],
      },
    });

    if (dept) {
      allowedSet.add(dept.id.toLowerCase());
      allowedSet.add(dept.code.toLowerCase());
      allowedSet.add(dept.name.toLowerCase());
      allowedSet.add(dept.name.toLowerCase().replace(/&/g, "dan"));
      allowedSet.add(dept.name.toLowerCase().replace(/\bdan\b/g, "&"));
    }
  } catch (error) {
    console.error("Error fetching department aliases from DB:", error);
  }

  return Array.from(allowedSet);
}

/**
 * Memeriksa apakah bagian karyawan cocok dengan salah satu alias bagian yang diizinkan.
 */
export function isDepartmentMatch(
  empBagian: string | undefined | null,
  allowedNames: string[]
): boolean {
  // Jika allowedNames kosong, berarti user memiliki akses ALL (misalnya Admin Utama)
  if (!allowedNames || allowedNames.length === 0) {
    return true;
  }

  if (!empBagian) {
    return false;
  }

  const rawBagian = empBagian.toLowerCase().trim();
  const bagianDan = rawBagian.replace(/&/g, "dan");
  const bagianAmp = rawBagian.replace(/\bdan\b/g, "&");

  return allowedNames.some((item) => {
    const target = item.toLowerCase().trim();
    if (!target) return false;

    return (
      rawBagian === target ||
      bagianDan === target ||
      bagianAmp === target ||
      rawBagian.includes(target) ||
      target.includes(rawBagian) ||
      bagianDan.includes(target) ||
      bagianAmp.includes(target)
    );
  });
}

/**
 * Validasi otorisasi apakah user (berdasarkan role & department) boleh memproses karyawan di bagian tertentu.
 */
export async function checkDepartmentAuthorization(
  userRole: string,
  userDepartment: string | null | undefined,
  empBagian: string | null | undefined
): Promise<boolean> {
  if (userRole !== "ADMIN_BAGIAN") {
    return true;
  }

  if (!userDepartment || userDepartment.trim() === "" || userDepartment.toUpperCase() === "ALL") {
    return true;
  }

  // Quick check dengan alias statis
  const upper = userDepartment.trim().toUpperCase();
  const staticAliases = KNOWN_DEPARTMENT_ALIASES[upper];
  if (staticAliases && isDepartmentMatch(empBagian, staticAliases)) {
    return true;
  }

  // Dynamic check dengan database
  const allowedNames = await getAllowedDepartmentNames(userDepartment);
  return isDepartmentMatch(empBagian, allowedNames);
}
