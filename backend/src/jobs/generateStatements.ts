/**
 * @fileoverview Job para generar estados de cuenta de tarjetas de crédito.
 * 
 * PROPÓSITO:
 * Este job se ejecuta diariamente y detecta las tarjetas de crédito cuyo día
 * de corte coincide con el día actual. Para cada una, "congela" el estado de
 * cuenta creando un registro inmutable que no cambiará aunque se modifiquen
 * transacciones después.
 * 
 * EJECUCIÓN: Diario a las 00:05 (después de medianoche)
 * CRON: "5 0 * * *"
 * 
 * @module jobs/generateStatements
 */

import prisma from '../services/database';
import { addMonths, startOfDay, addDays, setDate } from 'date-fns';

/**
 * Genera estados de cuenta para todas las tarjetas de crédito
 * cuyo día de corte sea hoy.
 * 
 * FLUJO:
 * 1. Buscar cuentas CREDIT cuyo cutoffDay == día actual
 * 2. Para cada cuenta:
 *    a. Calcular cycleStart (día después del corte anterior)
 *    b. Sumar transacciones no facturadas del ciclo
 *    c. Calcular cuotas MSI que tocan este mes
 *    d. Crear CreditCardStatement inmutable
 *    e. Vincular transacciones al statement
 * 3. Registrar en AuditLog
 * 
 * @returns {Promise<{ processed: number; statements: string[] }>}
 *   Retorna el número de cuentas procesadas y los IDs de statements creados
 * 
 * @example
 * // Ejecutar manualmente o via cron
 * const result = await generateCreditCardStatements();
 * console.log(`Procesadas ${result.processed} tarjetas`);
 */
export async function generateCreditCardStatements(): Promise<{
  processed: number;
  statements: string[];
}> {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const createdStatements: string[] = [];

  console.log(`[StatementJob] Iniciando - Buscando cuentas con cutoffDay = ${dayOfMonth}`);

  // 1. Buscar tarjetas que cortan hoy
  const accountsToCut = await prisma.account.findMany({
    where: {
      type: 'CREDIT',
      cutoffDay: dayOfMonth
    },
    include: {
      installmentPurchases: {
        where: {
          paidAmount: { lt: prisma.installmentPurchase.fields.totalAmount }
        }
      },
      user: {
        select: { id: true, name: true }
      }
    }
  });

  console.log(`[StatementJob] Encontradas ${accountsToCut.length} tarjetas para procesar`);

  for (const account of accountsToCut) {
    try {
      const statement = await prisma.$transaction(async (tx) => {
        // 2a. Calcular fechas del ciclo
        const cycleEnd = startOfDay(today);
        const cycleStart = addDays(addMonths(cycleEnd, -1), 1);

        // Calcular fecha de pago (paymentDay o 20 días después del corte)
        let paymentDueDate = startOfDay(new Date(today));
        paymentDueDate = setDate(paymentDueDate, account.paymentDay || today.getDate() + 20);

        if (paymentDueDate <= today) {
          paymentDueDate = addMonths(paymentDueDate, 1);
        }

        // 2b. Sumar transacciones regulares no facturadas
        const regularTransactions = await tx.transaction.findMany({
          where: {
            accountId: account.id,
            statementId: null,
            installmentPurchaseId: null,
            date: { gte: cycleStart, lte: cycleEnd },
            deletedAt: null,
            type: 'expense'
          }
        });

        const regularAmount = regularTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        // 2c. Calcular MSI que tocan este mes
        let msiAmount = 0;
        for (const msi of account.installmentPurchases) {
          const remainingInstallments = msi.installments - msi.paidInstallments;
          if (remainingInstallments > 0) {
            msiAmount += msi.monthlyPayment;
          }
        }

        const totalDue = regularAmount + msiAmount;

        // Calcular pago mínimo (5% del total o $200, lo que sea mayor)
        const minimumPayment = Math.max(totalDue * 0.05, 200);

        // 2d. Crear Statement inmutable
        const newStatement = await tx.creditCardStatement.create({
          data: {
            accountId: account.id,
            cycleStart,
            cycleEnd,
            paymentDueDate,
            totalDue,
            minimumPayment,
            regularAmount,
            msiAmount,
            status: 'PENDING'
          }
        });

        // 2e. Vincular transacciones al statement
        const txIds = regularTransactions.map((t: { id: string }) => t.id);
        if (txIds.length > 0) {
          await tx.transaction.updateMany({
            where: { id: { in: txIds } },
            data: { statementId: newStatement.id }
          });
        }

        // 3. Registrar en AuditLog
        await tx.auditLog.create({
          data: {
            userId: account.userId,
            action: 'CREATE',
            entityType: 'CreditCardStatement',
            entityId: newStatement.id,
            newValue: {
              accountName: account.name,
              totalDue,
              regularAmount,
              msiAmount,
              cycleEnd: cycleEnd.toISOString(),
              paymentDueDate: paymentDueDate.toISOString()
            }
          }
        });

        return newStatement;
      });

      createdStatements.push(statement.id);

      console.log(
        `[StatementJob] ✓ ${account.name}: ` +
        `$${statement.totalDue.toLocaleString()} ` +
        `(Vence: ${statement.paymentDueDate.toLocaleDateString()})`
      );

    } catch (error) {
      console.error(`[StatementJob] ✗ Error procesando ${account.name}:`, error);
    }
  }

  console.log(`[StatementJob] Completado: ${createdStatements.length} statements creados`);

  return {
    processed: accountsToCut.length,
    statements: createdStatements
  };
}

/**
 * Ejecuta el job manualmente (para testing o ejecución ad-hoc).
 * Solo se ejecuta si el archivo se corre directamente.
 */
if (require.main === module) {
  generateCreditCardStatements()
    .then(result => {
      console.log('Resultado:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}
