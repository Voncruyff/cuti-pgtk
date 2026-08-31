import bcrypt from "bcryptjs";
import { UserRole } from "@/types/auth";
import { LeaveBalanceSummary } from "@/types/domain";

export interface MockUser {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockDepartment {
  id: string;
  code: string;
  name: string;
  headEmployeeId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockEmployee {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  departmentId: string;
  employmentStatus: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockLeaveType {
  id: string;
  code: "ANNUAL" | "LONG_LEAVE" | "INHALDAGEN";
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockLeaveRequestDetail {
  id: string;
  leaveRequestId: string;
  leaveTypeId: string;
  days: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockLeaveRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  requestDate: Date;
  startDate: Date;
  endDate: Date | null;
  purpose: string;
  notes: string | null;
  status: "SUBMITTED" | "APPROVED" | "CANCELLED" | "VOID";
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  details?: MockLeaveRequestDetail[];
}

export interface MockLeaveTransaction {
  id: string;
  employeeId: string;
  leaveRequestId: string | null;
  leaveTypeId: string;
  transactionType:
    | "OPENING_BALANCE"
    | "ADD_BALANCE"
    | "LEAVE_USAGE"
    | "MASS_GRANT"
    | "CORRECTION"
    | "REVERSAL"
    | "HOLIDAY_COMPENSATION"
    | "MIGRATION";
  transactionDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  amount: number; // Signed: +12, -1, -3
  description: string;
  notes: string | null;
  createdById: string;
  isVoid: boolean;
  voidedById: string | null;
  voidedAt: Date | null;
  voidReason: string | null;
  batchId: string | null;
  correctedTransactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockHoliday {
  id: string;
  date: Date;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface MockSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

// In-Memory Database Holder for Next.js Server Runtime
class MockDatabase {
  users: MockUser[] = [];
  departments: MockDepartment[] = [];
  employees: MockEmployee[] = [];
  leaveTypes: MockLeaveType[] = [];
  leaveRequests: MockLeaveRequest[] = [];
  leaveRequestDetails: MockLeaveRequestDetail[] = [];
  leaveTransactions: MockLeaveTransaction[] = [];
  holidays: MockHoliday[] = [];
  auditLogs: MockAuditLog[] = [];
  settings: MockSetting[] = [];

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // 1. Initial Users
    const salt = "$2a$10$wT5g8K9bZ8R1mP7Q6sN0eO1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o";
    const defaultPasswordHash = bcrypt.hashSync("admin123", 10);
    const operatorPasswordHash = bcrypt.hashSync("operator123", 10);
    const viewerPasswordHash = bcrypt.hashSync("viewer123", 10);

    this.users = [
      {
        id: "usr-admin-1",
        username: "admin",
        passwordHash: defaultPasswordHash,
        fullName: "Administrator Utama",
        role: "ADMIN_UTAMA",
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-operator-1",
        username: "admin_a",
        passwordHash: operatorPasswordHash,
        fullName: "Admin Bagian A",
        role: "ADMIN_BAGIAN",
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-viewer-1",
        username: "admin_b",
        passwordHash: viewerPasswordHash,
        fullName: "Admin Bagian B",
        role: "ADMIN_BAGIAN",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 2. Master Leave Types
    this.leaveTypes = [
      {
        id: "lt-annual",
        code: "ANNUAL",
        name: "Cuti Tahunan",
        description: "Jatah Cuti Tahunan Pegawai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "lt-long",
        code: "LONG_LEAVE",
        name: "Cuti Besar",
        description: "Jatah Cuti Besar Pegawai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "lt-inhaldagen",
        code: "INHALDAGEN",
        name: "Inhaldagen",
        description: "Jatah Saldo Cuti Inhaldagen",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 3. Master Departments PG Trangkil
    this.departments = [
      {
        id: "dept-pimpinan",
        code: "PIMPINAN",
        name: "Pimpinan",
        headEmployeeId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "dept-tuk",
        code: "TUK",
        name: "Tata Usaha & Keuangan (TUK)",
        headEmployeeId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "dept-tan",
        code: "TAN",
        name: "Tanaman (TAN)",
        headEmployeeId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "dept-tek",
        code: "TEK",
        name: "Teknik (TEK)",
        headEmployeeId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "dept-pab",
        code: "PAB",
        name: "Pabrikasi (PAB)",
        headEmployeeId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 4. Master Employees (Pimpinan) - Dikosongkan untuk fokus data pimpinan resmi
    this.employees = [];

    // 5. Initial Ledger Transactions - Dikosongkan
    this.leaveTransactions = [];

    // 6. Master Holidays
    this.holidays = [
      {
        id: "hol-1",
        date: new Date(2026, 0, 1),
        name: "Tahun Baru 2026 Masehi",
        type: "NASIONAL",
        description: "Libur Nasional Tahun Baru",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "hol-2",
        date: new Date(2026, 2, 20),
        name: "Hari Raya Idul Fitri 1447 H",
        type: "NASIONAL",
        description: "Hari Raya Idul Fitri",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "hol-3",
        date: new Date(2026, 7, 17),
        name: "Hari Kemerdekaan RI Ke-81",
        type: "NASIONAL",
        description: "HUT Kemerdekaan Republik Indonesia",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 7. Initial Settings
    this.settings = [
      {
        id: "set-1",
        key: "COMPANY_NAME",
        value: "PG TRANGKIL PATI",
        description: "Nama Perusahaan pada Dokumen",
        updatedAt: new Date(),
      },
      {
        id: "set-2",
        key: "APP_TITLE",
        value: "Sistem Cuti Karyawan Pimpinan",
        description: "Judul Aplikasi",
        updatedAt: new Date(),
      },
    ];

    // 8. Initial Audit Logs
    this.auditLogs = [
      {
        id: "aud-1",
        userId: "usr-admin-1",
        action: "INIT_SYSTEM",
        entityType: "SYSTEM",
        entityId: null,
        description: "Inisialisasi sistem cuti PG Trangkil dengan data master awal.",
        oldValues: null,
        newValues: null,
        ipAddress: "127.0.0.1",
        userAgent: "System Initializer",
        createdAt: new Date(),
      },
    ];

    this.initialized = true;
  }

  // --- BALANCES CALCULATION (LEDGER-BASED SOURCE OF TRUTH) ---
  calculateBalances(employeeId: string): LeaveBalanceSummary {
    const activeTxs = this.leaveTransactions.filter(
      (tx) => tx.employeeId === employeeId && !tx.isVoid
    );

    let annual = 0;
    let longLeave = 0;
    let inhaldagen = 0;

    for (const tx of activeTxs) {
      if (tx.leaveTypeId === "lt-annual") {
        annual += Number(tx.amount);
      } else if (tx.leaveTypeId === "lt-long") {
        longLeave += Number(tx.amount);
      } else if (tx.leaveTypeId === "lt-inhaldagen") {
        inhaldagen += Number(tx.amount);
      }
    }

    return {
      annual,
      longLeave,
      inhaldagen,
      total: annual + longLeave + inhaldagen,
    };
  }

  // --- EMPLOYEES ---
  getEmployees() {
    return this.employees.map((emp) => {
      const dept = this.departments.find((d) => d.id === emp.departmentId);
      const balances = this.calculateBalances(emp.id);
      return {
        ...emp,
        department: dept || { id: "", code: "-", name: "Tanpa Bagian" },
        balances,
      };
    });
  }

  findEmployeeById(id: string) {
    const emp = this.employees.find((e) => e.id === id);
    if (!emp) return null;
    const dept = this.departments.find((d) => d.id === emp.departmentId);
    const balances = this.calculateBalances(emp.id);
    return {
      ...emp,
      department: dept || { id: "", code: "-", name: "Tanpa Bagian" },
      balances,
    };
  }

  findEmployeeByNumber(nip: string) {
    const emp = this.employees.find(
      (e) => e.employeeNumber.toLowerCase() === nip.toLowerCase().trim()
    );
    if (!emp) return null;
    return this.findEmployeeById(emp.id);
  }

  searchEmployees(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return this.getEmployees();

    return this.getEmployees().filter(
      (emp) =>
        emp.employeeNumber.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        emp.department.name.toLowerCase().includes(q)
    );
  }

  createEmployee(data: {
    employeeNumber: string;
    name: string;
    position: string;
    departmentId: string;
    employmentStatus?: string;
  }) {
    const newEmp: MockEmployee = {
      id: `emp-${Date.now()}`,
      employeeNumber: data.employeeNumber.trim(),
      name: data.name.trim(),
      position: data.position.trim(),
      departmentId: data.departmentId,
      employmentStatus: data.employmentStatus || "PIMPINAN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.push(newEmp);
    return this.findEmployeeById(newEmp.id);
  }

  updateEmployee(
    id: string,
    data: Partial<{
      employeeNumber: string;
      name: string;
      position: string;
      departmentId: string;
      employmentStatus: string;
      isActive: boolean;
    }>
  ) {
    const index = this.employees.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.employees[index] = {
      ...this.employees[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.findEmployeeById(id);
  }

  deleteEmployee(id: string) {
    const index = this.employees.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.employees.splice(index, 1);
    // Hapus juga transaksi cutinya
    this.leaveTransactions = this.leaveTransactions.filter((t) => t.employeeId !== id);
    this.leaveRequests = this.leaveRequests.filter((r) => r.employeeId !== id);
    return true;
  }

  clearAllEmployees() {
    this.employees = [];
    this.leaveTransactions = [];
    this.leaveRequests = [];
    this.leaveRequestDetails = [];
  }

  // --- DEPARTMENTS ---
  getDepartments() {
    return this.departments.map((dept) => {
      const head = dept.headEmployeeId
        ? this.employees.find((e) => e.id === dept.headEmployeeId)
        : null;
      const count = this.employees.filter(
        (e) => e.departmentId === dept.id && e.isActive
      ).length;
      return {
        ...dept,
        headEmployee: head || null,
        activeEmployeeCount: count,
      };
    });
  }

  createDepartment(data: { code: string; name: string; headEmployeeId?: string | null }) {
    const newDept: MockDepartment = {
      id: `dept-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      headEmployeeId: data.headEmployeeId || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.departments.push(newDept);
    return newDept;
  }

  updateDepartment(
    id: string,
    data: Partial<{ code: string; name: string; headEmployeeId: string | null; isActive: boolean }>
  ) {
    const index = this.departments.findIndex((d) => d.id === id);
    if (index === -1) return null;
    this.departments[index] = {
      ...this.departments[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.departments[index];
  }

  // --- LEAVE TYPES ---
  getLeaveTypes(): MockLeaveType[] {
    return [...this.leaveTypes];
  }

  // --- USERS ---
  getUsers() {
    return this.users.map(({ passwordHash, ...rest }) => rest);
  }

  findUserByUsername(username: string) {
    return (
      this.users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase().trim()
      ) || null
    );
  }

  createUser(data: {
    username: string;
    passwordPlain: string;
    fullName: string;
    role: UserRole;
  }) {
    const newUser: MockUser = {
      id: `usr-${Date.now()}`,
      username: data.username.toLowerCase().trim(),
      passwordHash: bcrypt.hashSync(data.passwordPlain, 10),
      fullName: data.fullName.trim(),
      role: data.role,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    const { passwordHash, ...rest } = newUser;
    return rest;
  }

  updateUser(
    id: string,
    data: Partial<{
      passwordPlain: string;
      fullName: string;
      role: UserRole;
      isActive: boolean;
    }>
  ) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    if (data.passwordPlain) {
      this.users[index].passwordHash = bcrypt.hashSync(data.passwordPlain, 10);
    }
    if (data.fullName !== undefined) this.users[index].fullName = data.fullName;
    if (data.role !== undefined) this.users[index].role = data.role;
    if (data.isActive !== undefined) this.users[index].isActive = data.isActive;
    this.users[index].updatedAt = new Date();

    const { passwordHash, ...rest } = this.users[index];
    return rest;
  }

  // --- TRANSACTIONS & LEAVE ---
  getTransactions(employeeId?: string) {
    let txs = [...this.leaveTransactions];
    if (employeeId) {
      txs = txs.filter((t) => t.employeeId === employeeId);
    }
    txs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return txs.map((tx) => {
      const emp = this.employees.find((e) => e.id === tx.employeeId);
      const dept = emp ? this.departments.find((d) => d.id === emp.departmentId) : null;
      const leaveType = this.leaveTypes.find((lt) => lt.id === tx.leaveTypeId);
      const creator = this.users.find((u) => u.id === tx.createdById);

      return {
        ...tx,
        employee: {
          id: emp?.id || "",
          name: emp?.name || "-",
          employeeNumber: emp?.employeeNumber || "-",
          department: dept || { name: "-" },
        },
        leaveType: leaveType || { code: "ANNUAL", name: "Cuti" },
        createdBy: creator || { fullName: "System", username: "system" },
      };
    });
  }

  addTransaction(data: {
    employeeId: string;
    leaveTypeId: string;
    transactionType: MockLeaveTransaction["transactionType"];
    transactionDate: Date;
    startDate?: Date | null;
    endDate?: Date | null;
    amount: number;
    description: string;
    notes?: string | null;
    createdById: string;
    leaveRequestId?: string | null;
  }) {
    const newTx: MockLeaveTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      employeeId: data.employeeId,
      leaveRequestId: data.leaveRequestId || null,
      leaveTypeId: data.leaveTypeId,
      transactionType: data.transactionType,
      transactionDate: data.transactionDate,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      amount: data.amount,
      description: data.description,
      notes: data.notes || null,
      createdById: data.createdById,
      isVoid: false,
      voidedById: null,
      voidedAt: null,
      voidReason: null,
      batchId: null,
      correctedTransactionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leaveTransactions.push(newTx);
    return newTx;
  }

  voidTransaction(txId: string, voidedById: string, reason: string) {
    const target = this.leaveTransactions.find((t) => t.id === txId);
    if (!target || target.isVoid) return null;

    target.isVoid = true;
    target.voidedById = voidedById;
    target.voidedAt = new Date();
    target.voidReason = reason;

    // Create reversal transaction to restore balance
    const reversalTx = this.addTransaction({
      employeeId: target.employeeId,
      leaveTypeId: target.leaveTypeId,
      transactionType: "REVERSAL",
      transactionDate: new Date(),
      amount: -target.amount, // Inverse amount
      description: `Reversal / Pembatalan: ${target.description}`,
      notes: `Alasan: ${reason}`,
      createdById: voidedById,
      leaveRequestId: target.leaveRequestId,
    });

    return { target, reversalTx };
  }

  // --- LEAVE REQUESTS ---
  getLeaveRequests(employeeId?: string) {
    let reqs = [...this.leaveRequests];
    if (employeeId) {
      reqs = reqs.filter((r) => r.employeeId === employeeId);
    }
    reqs.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());

    return reqs.map((req) => {
      const emp = this.employees.find((e) => e.id === req.employeeId);
      const creator = this.users.find((u) => u.id === req.createdById);
      const details = this.leaveRequestDetails
        .filter((d) => d.leaveRequestId === req.id)
        .map((d) => ({
          ...d,
          leaveType: this.leaveTypes.find((lt) => lt.id === d.leaveTypeId)!,
        }));

      return {
        ...req,
        employee: emp,
        createdBy: creator,
        details,
      };
    });
  }

  createLeaveRequest(data: {
    employeeId: string;
    requestDate: Date;
    startDate: Date;
    endDate?: Date | null;
    purpose: string;
    notes?: string | null;
    createdById: string;
    items: { leaveTypeId: string; days: number }[];
    requestNumber?: string;
  }) {
    const count = this.leaveRequests.length + 1;
    const yearMonth = `${data.requestDate.getFullYear()}${String(
      data.requestDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const reqNumber = data.requestNumber || `CT-${yearMonth}-${String(count).padStart(4, "0")}`;

    const newReq: MockLeaveRequest = {
      id: `req-${Date.now()}`,
      requestNumber: reqNumber,
      employeeId: data.employeeId,
      requestDate: data.requestDate,
      startDate: data.startDate,
      endDate: data.endDate || null,
      purpose: data.purpose,
      notes: data.notes || null,
      status: "APPROVED",
      createdById: data.createdById,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.leaveRequests.push(newReq);

    // Save details and negative ledger transactions
    for (const item of data.items) {
      if (item.days <= 0) continue;

      const detail: MockLeaveRequestDetail = {
        id: `det-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        leaveRequestId: newReq.id,
        leaveTypeId: item.leaveTypeId,
        days: item.days,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.leaveRequestDetails.push(detail);

      const lt = this.leaveTypes.find((t) => t.id === item.leaveTypeId);
      const ltName = lt ? lt.name : "Cuti";

      // Ledger deduction: negative amount
      this.addTransaction({
        employeeId: data.employeeId,
        leaveTypeId: item.leaveTypeId,
        transactionType: "LEAVE_USAGE",
        transactionDate: data.requestDate,
        startDate: data.startDate,
        endDate: data.endDate || null,
        amount: -item.days,
        description: `Ambil ${ltName} (${data.purpose})`,
        notes: data.notes,
        createdById: data.createdById,
        leaveRequestId: newReq.id,
      });
    }

    return newReq;
  }

  // --- AUDIT ---
  logAudit(data: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    description: string;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const log: MockAuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ? String(data.entityId) : null,
      description: data.description,
      oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
      newValues: data.newValues ? JSON.stringify(data.newValues) : null,
      ipAddress: data.ipAddress || "127.0.0.1",
      userAgent: data.userAgent || null,
      createdAt: new Date(),
    };
    this.auditLogs.unshift(log);
    return log;
  }

  getAuditLogs() {
    return this.auditLogs.map((log) => {
      const user = log.userId ? this.users.find((u) => u.id === log.userId) : null;
      return {
        ...log,
        user: user || null,
      };
    });
  }
}

// Global Singleton for Mock DB across Hot-Reloads
const globalForMock = globalThis as unknown as {
  mockDb: MockDatabase | undefined;
};

export const mockDb = new MockDatabase();
globalForMock.mockDb = mockDb;

