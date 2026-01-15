/**
 * @fileoverview Servicio de auditoría para registrar cambios críticos.
 * 
 * PROPÓSITO:
 * Registrar de forma inmutable quién modificó qué, cuándo y por qué.
 * Crítico para soporte técnico, debugging y compliance.
 * 
 * @module services/auditService
 */

import prisma from './database';
import { Prisma } from '@prisma/client';

/**
 * Tipo de acción de auditoría.
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Opciones para crear un registro de auditoría.
 */
export interface AuditLogOptions {
  /** ID del usuario que realizó la acción */
  userId: string;
  /** Tipo de acción: CREATE, UPDATE, DELETE */
  action: AuditAction;
  /** Tipo de entidad afectada: Transaction, Account, etc. */
  entityType: string;
  /** ID de la entidad afectada */
  entityId: string;
  /** Estado anterior (opcional, para UPDATE/DELETE) */
  oldValue?: Record<string, unknown>;
  /** Estado nuevo (opcional, para CREATE/UPDATE) */
  newValue?: Record<string, unknown>;
  /** Dirección IP del cliente (opcional) */
  ipAddress?: string;
  /** User-Agent del navegador (opcional) */
  userAgent?: string;
}

/**
 * Crea un registro de auditoría.
 * 
 * @param {AuditLogOptions} options - Opciones del registro
 * @returns {Promise<string>} ID del registro creado
 * 
 * @example
 * await createAuditLog({
 *   userId: 'user-123',
 *   action: 'UPDATE',
 *   entityType: 'Transaction',
 *   entityId: 'tx-456',
 *   oldValue: { amount: 100 },
 *   newValue: { amount: 150 },
 *   ipAddress: req.ip
 * });
 */
export async function createAuditLog(options: AuditLogOptions): Promise<string> {
  const log = await prisma.auditLog.create({
    data: {
      userId: options.userId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      oldValue: options.oldValue as Prisma.JsonObject | undefined,
      newValue: options.newValue as Prisma.JsonObject | undefined,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    }
  });

  return log.id;
}

/**
 * Obtiene los logs de auditoría de una entidad específica.
 * 
 * @param {string} entityType - Tipo de entidad
 * @param {string} entityId - ID de la entidad
 * @returns {Promise<Array>} Lista de logs ordenados por fecha
 * 
 * @example
 * const history = await getEntityAuditLogs('Transaction', 'tx-123');
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string
): Promise<Array<{
  id: string;
  action: string;
  oldValue: Prisma.JsonValue | null;
  newValue: Prisma.JsonValue | null;
  createdAt: Date;
  user: { name: string; email: string };
}>> {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
      user: {
        select: { name: true, email: true }
      }
    }
  });
}

/**
 * Obtiene los logs de auditoría de un usuario.
 * 
 * @param {string} userId - ID del usuario
 * @param {number} limit - Cantidad máxima de registros (default: 100)
 * @returns {Promise<Array>} Logs del usuario
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<Array<{
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}>> {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true
    }
  });
}

/**
 * Middleware de Express para extraer IP y User-Agent.
 * Agrega req.auditInfo para uso en controladores.
 * 
 * @example
 * // En server.ts
 * app.use(auditInfoMiddleware);
 * 
 * // En controlador
 * const { ip, userAgent } = req.auditInfo;
 */
export function extractAuditInfo(req: any): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']
  };
}
