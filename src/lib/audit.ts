import type { Prisma } from "@prisma/client";
import { db } from "./db";

/**
 * Records an admin action for the audit log. Deliberately best-effort: a
 * logging failure must never block or fail the actual admin action, so
 * errors are caught and logged, not thrown.
 */
export async function logAudit(params: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log entry", error);
  }
}
