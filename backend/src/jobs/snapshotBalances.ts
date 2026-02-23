/**
 * @fileoverview Job para crear snapshots diarios de balances de cuentas.
 * 
 * PROPÓSITO:
 * Este job se ejecuta cada noche y guarda una "foto" del balance de cada
 * cuenta. Esto permite graficar el patrimonio neto histórico en O(1)
 * sin tener que recalcular miles de transacciones.
 * 
 * EJECUCIÓN: Diario a las 23:55 (antes de medianoche)
 * CRON: "55 23 * * *"
 * 
 * @module jobs/snapshotBalances
 */

import prisma from '../services/database';
import { startOfDay } from 'date-fns';

/**
 * Crea snapshots del balance actual de todas las cuentas del sistema.
 * 
 * BENEFICIOS:
 * - Consultar patrimonio de hace 6 meses es instantáneo
 * - Permite gráficas de evolución patrimonial
 * - Detecta tendencias de gastos vs ingresos
 * - No modifica balances reales, solo registra
 * 
 * @returns {Promise<{ created: number; skipped: number; errors: number }>}
 *   Estadísticas de la ejecución
 * 
 * @example
 * const stats = await createDailyAccountSnapshots();
 * console.log(`Creados: ${stats.created}, Omitidos: ${stats.skipped}`);
 */
export async function createDailyAccountSnapshots(): Promise<{
  created: number;
  skipped: number;
  errors: number;
}> {
  const today = startOfDay(new Date());

  console.log(`[SnapshotJob] Iniciando snapshots para ${today.toISOString().split('T')[0]}`);

  // Obtener todas las cuentas con sus usuarios
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      userId: true,
      balance: true,
      name: true,
      type: true
    }
  });

  let created = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const upserts = accounts.map(account =>
      prisma.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: account.id,
            date: today
          }
        },
        update: { balance: account.balance },
        create: {
          accountId: account.id,
          balance: account.balance,
          date: today
        }
      })
    );

    // Ejecuta todos los upserts en una sola transacción segura
    await prisma.$transaction(upserts);
    created = accounts.length;
  } catch (error) {
    console.error(`[SnapshotJob] Error crítico durante el guardado de snapshots masivo:`, error);
    errors = accounts.length;
  }

  console.log(
    `[SnapshotJob] Completado: ` +
    `${created} creados/actualizados, ` +
    `${skipped} omitidos, ` +
    `${errors} errores`
  );

  return { created, skipped, errors };
}

/**
 * Obtiene el historial de snapshots de una cuenta específica.
 * Útil para generar gráficas de evolución de balance.
 * 
 * @param {string} accountId - ID de la cuenta
 * @param {number} days - Número de días hacia atrás (default: 30)
 * @returns {Promise<Array<{ date: Date; balance: number }>>}
 * 
 * @example
 * const history = await getAccountBalanceHistory('account-123', 90);
 * // Retorna últimos 90 días de balances
 */
export async function getAccountBalanceHistory(
  accountId: string,
  days: number = 30
): Promise<Array<{ date: Date; balance: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await prisma.accountSnapshot.findMany({
    where: {
      accountId,
      date: { gte: startOfDay(startDate) }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      balance: true
    }
  });

  return snapshots;
}

/**
 * Obtiene el Net Worth histórico de un usuario.
 * Suma todos los activos y resta pasivos por fecha.
 * 
 * @param {string} userId - ID del usuario
 * @param {number} days - Número de días hacia atrás (default: 30)
 * @returns {Promise<Array<{ date: Date; netWorth: number; assets: number; liabilities: number }>>}
 * 
 * @example
 * const netWorthHistory = await getUserNetWorthHistory('user-123', 180);
 * // Retorna Net Worth de los últimos 6 meses
 */
export async function getUserNetWorthHistory(
  userId: string,
  days: number = 30
): Promise<Array<{ date: Date; netWorth: number; assets: number; liabilities: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Obtener cuentas del usuario con sus snapshots
  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      snapshots: {
        where: { date: { gte: startOfDay(startDate) } },
        orderBy: { date: 'asc' }
      }
    }
  });

  // Agrupar por fecha
  const dateMap = new Map<string, { assets: number; liabilities: number }>();

  for (const account of accounts) {
    const isLiability = account.type === 'CREDIT';

    for (const snapshot of account.snapshots) {
      const dateKey = snapshot.date.toISOString().split('T')[0];

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { assets: 0, liabilities: 0 });
      }

      const entry = dateMap.get(dateKey)!;

      if (isLiability) {
        entry.liabilities += Math.abs(snapshot.balance);
      } else {
        entry.assets += snapshot.balance;
      }
    }
  }

  // Convertir a array ordenado
  return Array.from(dateMap.entries())
    .map(([dateStr, { assets, liabilities }]) => ({
      date: new Date(dateStr),
      netWorth: assets - liabilities,
      assets,
      liabilities
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Ejecuta el job manualmente (para testing o ejecución ad-hoc).
 */
if (require.main === module) {
  createDailyAccountSnapshots()
    .then(result => {
      console.log('Resultado:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}
