export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  description,
}: LogAuditParams) {
  // Simple console audit logging for lightweight user-only phase
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT LOG ${timestamp}] [${action}] User: ${userId || "ANONYMOUS"} -> ${description}`);
}
