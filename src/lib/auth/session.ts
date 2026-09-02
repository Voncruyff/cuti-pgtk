import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SessionUser, UserRole } from "@/types/auth";

const COOKIE_NAME = "cuti_pgtk_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default_super_secret_dev_key_32_characters_long"
);
const EXPIRES_IN = "8h";

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    department: user.department ?? null,
    fotoProfil: user.fotoProfil ?? null,
    isActive: user.isActive,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
      department: (payload.department as string | null) ?? null,
      fotoProfil: (payload.fotoProfil as string | null) ?? null,
      isActive: payload.isActive as boolean,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !user.isActive) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=unauthorized");
  }
  return user;
}
