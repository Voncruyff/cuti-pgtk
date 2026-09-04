"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  getUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  toggleBanUserAction,
} from "@/actions/aksi-pengguna";
import { getDepartmentsAction } from "@/actions/aksi-karyawan";
import {
  TabelPengguna,
  ModalTambahPengguna,
  ModalEditPengguna,
  ModalHapusPengguna,
  ModalBlokirPengguna,
  type ItemPengguna,
  type PilihanBagianPengguna,
} from "@/components/fitur/kelola-user/komponen-pengguna";

export function KomponenHalamanUser() {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<ItemPengguna[]>([]);
  const [departments, setDepartments] = useState<PilihanBagianPengguna[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN_UTAMA" | "ADMIN_BAGIAN">("ADMIN_BAGIAN");
  const [department, setDepartment] = useState("TUK");
  const [showPassword, setShowPassword] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN_UTAMA" | "ADMIN_BAGIAN">("ADMIN_BAGIAN");
  const [editDepartment, setEditDepartment] = useState("TUK");
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState<ItemPengguna | null>(null);

  // Ban Modal State
  const [banningUser, setBanningUser] = useState<ItemPengguna | null>(null);

  // Load Data
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [res, deptRes] = await Promise.all([
        getUsersAction(),
        getDepartmentsAction(),
      ]);

      if (res.success && res.data) {
        setUsers(res.data as ItemPengguna[]);
      } else {
        toast.error(res.message || "Gagal memuat data pengguna.");
      }

      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data as PilihanBagianPengguna[]);
        if (deptRes.data.length > 0 && !department) {
          setDepartment(deptRes.data[0].code);
        }
      }
    } catch (err) {
      console.error("Load users error:", err);
      toast.error("Terjadi kesalahan saat memuat data pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle CREATE (C)
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !fullName.trim() || !password.trim()) {
      toast.error("Username, Nama Lengkap, dan Password wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createUserAction({
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        password: password.trim(),
        role,
        department: role === "ADMIN_UTAMA" ? "ALL" : department,
        isActive: true,
      });

      if (res.success) {
        toast.success(res.message || "User baru berhasil ditambahkan!");
        setIsAddModalOpen(false);

        // Reset
        setUsername("");
        setFullName("");
        setPassword("");
        setRole("ADMIN_BAGIAN");
        setDepartment(departments[0]?.code || "TUK");
        setShowPassword(false);

        loadUsers();
      } else {
        toast.error(res.message || "Gagal menambahkan user baru.");
      }
    });
  };

  // Open EDIT Modal (U)
  const handleOpenEditModal = (u: ItemPengguna) => {
    setEditingUserId(u.id);
    setEditUsername(u.username);
    setEditFullName(u.fullName);
    setEditPassword("");
    setEditRole(u.role);
    setEditDepartment(u.department || "TUK");
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  // Handle UPDATE (U)
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUserId) return;
    if (!editUsername.trim() || !editFullName.trim()) {
      toast.error("Username dan Nama Lengkap wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await updateUserAction(editingUserId, {
        username: editUsername.trim().toLowerCase(),
        fullName: editFullName.trim(),
        password: editPassword.trim() ? editPassword.trim() : undefined,
        role: editRole,
        department: editRole === "ADMIN_UTAMA" ? "ALL" : editDepartment,
        isActive: users.find((u) => u.id === editingUserId)?.isActive ?? true,
      });

      if (res.success) {
        toast.success(res.message || "Data user berhasil diperbarui!");
        setIsEditModalOpen(false);
        setEditingUserId(null);
        loadUsers();
      } else {
        toast.error(res.message || "Gagal memperbarui data user.");
      }
    });
  };

  // Handle DELETE (D)
  const handleConfirmDelete = () => {
    if (!deletingUser) return;

    startTransition(async () => {
      const res = await deleteUserAction(deletingUser.id);
      if (res.success) {
        toast.success(res.message || "User berhasil dihapus.");
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setDeletingUser(null);
      } else {
        toast.error(res.message || "Gagal menghapus user.");
      }
    });
  };

  // Handle TOGGLE BAN (Ban / Unban Account)
  const handleConfirmToggleBan = () => {
    if (!banningUser) return;

    startTransition(async () => {
      const res = await toggleBanUserAction(banningUser.id);
      if (res.success) {
        toast.success(res.message);
        setBanningUser(null);
        loadUsers();
      } else {
        toast.error(res.message || "Gagal memproses status blokir akun.");
      }
    });
  };

  return (
    <>
      <TabelPengguna
        pengguna={users}
        bagian={departments}
        isLoading={isLoading}
        isPending={isPending}
        searchQuery={searchQuery}
        filterRole={roleFilter}
        filterBagian={deptFilter}
        onUbahSearch={setSearchQuery}
        onUbahFilterRole={setRoleFilter}
        onUbahFilterBagian={setDeptFilter}
        onTambah={() => setIsAddModalOpen(true)}
        onEdit={handleOpenEditModal}
        onHapus={setDeletingUser}
        onToggleBlokir={setBanningUser}
      />

      <ModalTambahPengguna
        terbuka={isAddModalOpen}
        isPending={isPending}
        bagian={departments}
        username={username}
        fullName={fullName}
        password={password}
        role={role}
        department={department}
        showPassword={showPassword}
        onUbahUsername={setUsername}
        onUbahFullName={setFullName}
        onUbahPassword={setPassword}
        onUbahRole={setRole}
        onUbahDepartment={setDepartment}
        onToggleShowPassword={() => setShowPassword(!showPassword)}
        onSubmit={handleCreateUser}
        onTutup={() => setIsAddModalOpen(false)}
      />

      <ModalEditPengguna
        terbuka={isEditModalOpen}
        isPending={isPending}
        bagian={departments}
        username={editUsername}
        fullName={editFullName}
        password={editPassword}
        role={editRole}
        department={editDepartment}
        showPassword={showEditPassword}
        onUbahUsername={setEditUsername}
        onUbahFullName={setEditFullName}
        onUbahPassword={setEditPassword}
        onUbahRole={setEditRole}
        onUbahDepartment={setEditDepartment}
        onToggleShowPassword={() => setShowEditPassword(!showEditPassword)}
        onSubmit={handleUpdateUser}
        onTutup={() => setIsEditModalOpen(false)}
      />

      <ModalBlokirPengguna
        pengguna={banningUser}
        isPending={isPending}
        onKonfirmasi={handleConfirmToggleBan}
        onBatal={() => setBanningUser(null)}
      />

      <ModalHapusPengguna
        pengguna={deletingUser}
        isPending={isPending}
        onKonfirmasi={handleConfirmDelete}
        onBatal={() => setDeletingUser(null)}
      />
    </>
  );
}
