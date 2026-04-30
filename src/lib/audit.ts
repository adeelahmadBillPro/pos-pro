import { prisma } from '@/lib/prisma'

interface AuditParams {
  userId: string
  action: string
  entity: string
  entityId?: string
  oldValues?: unknown
  newValues?: unknown
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValues: params.oldValues ? (params.oldValues as any) : undefined,
        newValues: params.newValues ? (params.newValues as any) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch {
    // Audit log should never break the main flow
    console.error('[AUDIT_LOG]', params)
  }
}
