export type UserRole = "ADMIN_UTAMA" | "ADMIN_BAGIAN";

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  department?: string | null;
  isActive: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: SessionUser | null;
}
