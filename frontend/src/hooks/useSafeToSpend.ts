/**
 * @fileoverview Hook para calcular "Safe-to-Spend" (Liquidez segura).
 * 
 * Este hook calcula cuánto puede gastar el usuario HOY de forma segura,
 * considerando sus compromisos hasta fin de mes y un buffer de emergencia.
 * 
 * FÓRMULA:
 * Safe-to-Spend = Liquidez - Compromisos del mes - Buffer (10%)
 * 
 * DONDE:
 * - Liquidez: Suma de cuentas DEBIT + CASH
 * - Compromisos: Pagos fijos + TDC pendientes hasta fin de mes
 * - Buffer: 10% de liquidez como colchón de emergencia
 * 
 * @module hooks/useSafeToSpend
 */

import { useMemo } from 'react';
import { isWithinInterval, endOfMonth } from 'date-fns';

/**
 * Estructura de una cuenta financiera.
 */
interface Account {
  id: string;
  type: string;
  balance: number;
}

/**
 * Estructura de un compromiso financiero.
 */
interface Commitment {
  id: string;
  amount: number;
  dueDate: Date;
  description?: string;
  type: 'credit_card' | 'recurring' | 'loan';
}

/**
 * Resultado del hook useSafeToSpend.
 */
interface SafeToSpendResult {
  /** Monto seguro para gastar */
  safeToSpend: number;
  /** Liquidez total disponible */
  liquidCash: number;
  /** Total de compromisos hasta fin de mes */
  totalCommitments: number;
  /** Buffer de seguridad (10% de liquidez) */
  safetyBuffer: number;
  /** Porcentaje de liquidez comprometida */
  commitmentPercent: number;
  /** Estado de salud: 'healthy' | 'warning' | 'danger' */
  status: 'healthy' | 'warning' | 'danger';
  /** Mensaje descriptivo */
  message: string;
}

/**
 * Hook que calcula cuánto puede gastar el usuario de forma segura.
 * 
 * @param {Account[]} accounts - Lista de cuentas del usuario
 * @param {Commitment[]} upcomingCommitments - Pagos programados
 * @returns {SafeToSpendResult} Resultado con monto seguro y breakdown
 * 
 * @example
 * const { safeToSpend, status, message } = useSafeToSpend(accounts, commitments);
 * 
 * return (
 *   <div className={`status-${status}`}>
 *     <h2>${safeToSpend.toLocaleString()}</h2>
 *     <p>{message}</p>
 *   </div>
 * );
 */
export function useSafeToSpend(
  accounts: Account[],
  upcomingCommitments: Commitment[]
): SafeToSpendResult {
  return useMemo(() => {
    // 1. Calcular liquidez inmediata (efectivo + débito)
    const liquidCash = accounts
      .filter(a => a.type === 'DEBIT' || a.type === 'CASH')
      .reduce((sum, a) => sum + a.balance, 0);

    // 2. Filtrar compromisos hasta fin de mes
    const today = new Date();
    const monthEnd = endOfMonth(today);

    const thisMonthCommitments = upcomingCommitments.filter(c =>
      isWithinInterval(new Date(c.dueDate), { start: today, end: monthEnd })
    );

    const totalCommitments = thisMonthCommitments.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    // 3. Buffer de seguridad (10% de liquidez)
    const safetyBuffer = liquidCash * 0.10;

    // 4. Safe-to-Spend
    const safeToSpend = Math.max(0, liquidCash - totalCommitments - safetyBuffer);

    // 5. Calcular porcentaje comprometido
    const commitmentPercent = liquidCash > 0
      ? (totalCommitments / liquidCash) * 100
      : 0;

    // 6. Determinar estado de salud
    let status: 'healthy' | 'warning' | 'danger';
    let message: string;

    if (safeToSpend <= 0) {
      status = 'danger';
      message = 'Sin margen de gasto seguro. Prioriza tus compromisos.';
    } else if (commitmentPercent > 70) {
      status = 'warning';
      message = `Disponible: $${safeToSpend.toLocaleString()}. Más del 70% comprometido.`;
    } else if (commitmentPercent > 50) {
      status = 'warning';
      message = `Disponible: $${safeToSpend.toLocaleString()}. Gasto moderado recomendado.`;
    } else {
      status = 'healthy';
      message = `Puedes gastar hasta $${safeToSpend.toLocaleString()} de forma segura.`;
    }

    return {
      safeToSpend: Math.round(safeToSpend * 100) / 100,
      liquidCash,
      totalCommitments,
      safetyBuffer: Math.round(safetyBuffer * 100) / 100,
      commitmentPercent: Math.round(commitmentPercent * 100) / 100,
      status,
      message
    };
  }, [accounts, upcomingCommitments]);
}

/**
 * Hook simplificado que solo retorna el monto safe-to-spend.
 * Útil cuando no necesitas el breakdown completo.
 * 
 * @param {Account[]} accounts - Cuentas del usuario
 * @param {Commitment[]} commitments - Compromisos
 * @returns {number} Monto seguro para gastar
 */
export function useSafeToSpendAmount(
  accounts: Account[],
  commitments: Commitment[]
): number {
  const result = useSafeToSpend(accounts, commitments);
  return result.safeToSpend;
}
