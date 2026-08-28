export type LeaveTypeCode = "ANNUAL" | "LONG_LEAVE" | "INHALDAGEN";

export type LeaveTransactionTypeCode =
  | "OPENING_BALANCE"
  | "ADD_BALANCE"
  | "LEAVE_USAGE"
  | "MASS_GRANT"
  | "CORRECTION"
  | "REVERSAL"
  | "HOLIDAY_COMPENSATION"
  | "MIGRATION";

export type LeaveRequestStatusCode =
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "VOID";

export interface LeaveBalanceSummary {
  annual: number;
  longLeave: number;
  inhaldagen: number;
  total: number;
}

export interface EmployeeWithDepartment {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  employmentStatus: string;
  isActive: boolean;
}

export interface EmployeeSearchResult extends EmployeeWithDepartment {
  balances: LeaveBalanceSummary;
}
