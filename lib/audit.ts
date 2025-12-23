import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { headers } from "next/headers";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "login"
  | "logout"
  | "export"
  | "import";

export interface AuditLogParams {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

/**
 * Logs an audit event to the database.
 *
 * @example
 * await logAudit({
 *   userId: session.user.id,
 *   action: "approve",
 *   entityType: "product",
 *   entityId: product.id,
 *   details: { previousStatus: "pending_review", newStatus: "live" }
 * });
 */
export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
}: AuditLogParams): Promise<void> {
  try {
    // Try to get request headers for IP and User Agent
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const headersList = await headers();
      ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        null;
      userAgent = headersList.get("user-agent") || null;
    } catch {
      // Headers not available (e.g., during static generation)
    }

    await db.insert(auditLogs).values({
      userId: userId || null,
      action,
      entityType,
      entityId: entityId || null,
      details: details || null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Log error but don't throw - audit logging should never break the main operation
    console.error("[Audit] Failed to log audit event:", error);
  }
}

/**
 * Log multiple audit events in a single transaction.
 * Useful for bulk operations like batch approval/rejection.
 */
export async function logAuditBatch(events: AuditLogParams[]): Promise<void> {
  if (events.length === 0) return;

  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const headersList = await headers();
      ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        null;
      userAgent = headersList.get("user-agent") || null;
    } catch {
      // Headers not available
    }

    const values = events.map((event) => ({
      userId: event.userId || null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId || null,
      details: event.details || null,
      ipAddress,
      userAgent,
    }));

    await db.insert(auditLogs).values(values);
  } catch (error) {
    console.error("[Audit] Failed to log batch audit events:", error);
  }
}

/**
 * Helper to create audit details for status changes
 */
export function createStatusChangeDetails(
  previousStatus: string,
  newStatus: string,
  additionalInfo?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    previousStatus,
    newStatus,
    ...additionalInfo,
  };
}
