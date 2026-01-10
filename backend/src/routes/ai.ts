/**
 * @fileoverview Rutas de API para la capa de Inteligencia Artificial.
 * 
 * Proporciona endpoints estructurados para que un LLM (Gemini)
 * entienda el contexto financiero del usuario sin alucinar.
 * 
 * Librería: @google/genai (gemini-3-pro-preview)
 * 
 * @module routes/ai
 */

import express, { Response } from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/ai/context
 * 
 * Devuelve resumen financiero estructurado para LLM.
 * Optimizado para que Gemini entienda la situación sin alucinar.
 * 
 * ESTRUCTURA DE RESPUESTA:
 * - financial_health: Métricas clave de salud financiera
 * - upcoming_obligations: Próximos pagos (ordenados por urgencia)
 * - top_expenses: Categorías con más gasto (últimos 30 días)
 * - natural_summary: Texto en español para el modelo
 * 
 * @route GET /api/ai/context
 * @returns {Object} Contexto financiero estructurado
 */
router.get('/context', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Obtener cuentas del usuario
    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        statements: {
          where: { status: 'PENDING' },
          orderBy: { paymentDueDate: 'asc' },
          take: 5
        }
      }
    });

    // Calcular activos y pasivos
    const assets = accounts
      .filter(a => a.type !== 'CREDIT')
      .reduce((sum, a) => sum + a.balance, 0);

    const liabilities = accounts
      .filter(a => a.type === 'CREDIT')
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);

    const netWorth = assets - liabilities;
    const debtRatio = assets > 0 ? liabilities / assets : 0;

    // Gasto promedio mensual (últimos 30 días)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentExpenses = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: thirtyDaysAgo },
        deletedAt: null
      },
      _sum: { amount: true }
    });

    const burnRate = recentExpenses._sum.amount || 0;
    const runwayDays = burnRate > 0 ? Math.floor(assets / (burnRate / 30)) : 999;

    // Ingresos del período
    const recentIncome = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'income',
        date: { gte: thirtyDaysAgo },
        deletedAt: null
      },
      _sum: { amount: true }
    });

    const monthlyIncome = recentIncome._sum.amount || 0;
    const savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - burnRate) / monthlyIncome) * 100
      : 0;

    // Próximos pagos (statements + recurrentes)
    const upcomingObligations: Array<{
      desc: string;
      amount: number;
      dueDate: Date;
      dueInDays: number;
      type: string;
    }> = [];

    // Agregar pagos de TDC pendientes
    for (const account of accounts) {
      for (const statement of account.statements) {
        const dueInDays = Math.ceil(
          (statement.paymentDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        upcomingObligations.push({
          desc: `Pago TDC ${account.name}`,
          amount: statement.totalDue - statement.paidAmount,
          dueDate: statement.paymentDueDate,
          dueInDays,
          type: 'credit_card'
        });
      }
    }

    // Agregar recurrentes próximos
    const upcomingRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        active: true,
        type: 'expense',
        nextDueDate: { lte: subDays(new Date(), -30) } // Próximos 30 días
      },
      orderBy: { nextDueDate: 'asc' },
      take: 10
    });

    for (const rec of upcomingRecurring) {
      const dueInDays = Math.ceil(
        (rec.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      upcomingObligations.push({
        desc: rec.description,
        amount: rec.amount,
        dueDate: rec.nextDueDate,
        dueInDays,
        type: 'recurring'
      });
    }

    // Ordenar por urgencia
    upcomingObligations.sort((a, b) => a.dueInDays - b.dueInDays);

    // Top categorías de gasto
    const topCategories = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'expense',
        date: { gte: thirtyDaysAgo },
        deletedAt: null
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: topCategories.map(c => c.categoryId!).filter(Boolean) } }
    });

    const topExpenses = topCategories.map(tc => {
      const cat = categories.find(c => c.id === tc.categoryId);
      return {
        category: cat?.name || 'Sin categoría',
        amount: tc._sum.amount || 0,
        percentage: burnRate > 0 ? ((tc._sum.amount || 0) / burnRate) * 100 : 0
      };
    });

    // Generar resumen en lenguaje natural
    const warnings: string[] = [];
    if (runwayDays < 90) warnings.push('⚠️ Menos de 3 meses de runway');
    if (debtRatio > 0.5) warnings.push('⚠️ Ratio de deuda alto (>50%)');
    if (savingsRate < 10) warnings.push('⚠️ Tasa de ahorro baja (<10%)');

    const naturalSummary = `
El usuario tiene un patrimonio neto de $${netWorth.toLocaleString()}.
Activos líquidos: $${assets.toLocaleString()}, Deudas: $${liabilities.toLocaleString()}.
Gasto mensual promedio: $${burnRate.toLocaleString()}.
Ingreso mensual: $${monthlyIncome.toLocaleString()}.
Tasa de ahorro: ${savingsRate.toFixed(1)}%.
Runway: ${runwayDays} días sin ingresos.
${warnings.join('\n')}
${upcomingObligations.length > 0
        ? `Próximo pago: ${upcomingObligations[0].desc} por $${upcomingObligations[0].amount.toLocaleString()} en ${upcomingObligations[0].dueInDays} días.`
        : 'Sin pagos próximos registrados.'}
    `.trim();

    res.json({
      financial_health: {
        net_worth: netWorth,
        total_assets: assets,
        total_liabilities: liabilities,
        burn_rate_monthly: burnRate,
        monthly_income: monthlyIncome,
        savings_rate: Math.round(savingsRate * 100) / 100,
        runway_days: runwayDays,
        debt_ratio: Math.round(debtRatio * 100) / 100
      },
      upcoming_obligations: upcomingObligations.slice(0, 10),
      top_expenses_last_30d: topExpenses,
      warnings,
      natural_summary: naturalSummary,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[AI Context] Error:', error);
    res.status(500).json({
      message: 'Error generando contexto financiero',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/query/safe-to-spend
 * 
 * Calcula cuánto puede gastar el usuario HOY de forma segura.
 * 
 * FÓRMULA:
 * Safe-to-Spend = Liquidez - Compromisos del mes - Buffer de seguridad (10%)
 * 
 * @route GET /api/ai/query/safe-to-spend
 * @returns {Object} { safeToSpend, breakdown }
 */
router.get('/query/safe-to-spend', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const today = new Date();
    const monthEnd = endOfMonth(today);

    // 1. Obtener liquidez inmediata (efectivo + débito)
    const liquidAccounts = await prisma.account.findMany({
      where: {
        userId,
        type: { in: ['DEBIT', 'CASH'] }
      }
    });

    const liquidCash = liquidAccounts.reduce((sum, a) => sum + a.balance, 0);

    // 2. Obtener compromisos hasta fin de mes
    // a) Pagos de TDC pendientes
    const pendingStatements = await prisma.creditCardStatement.findMany({
      where: {
        account: { userId },
        status: 'PENDING',
        paymentDueDate: { lte: monthEnd }
      }
    });

    const creditCardDue = pendingStatements.reduce(
      (sum, s) => sum + (s.totalDue - s.paidAmount),
      0
    );

    // b) Recurrentes hasta fin de mes
    const recurringDue = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        active: true,
        type: 'expense',
        nextDueDate: { gte: today, lte: monthEnd }
      }
    });

    const recurringTotal = recurringDue.reduce((sum, r) => sum + r.amount, 0);

    // 3. Calcular compromisos totales
    const totalLiabilities = creditCardDue + recurringTotal;

    // 4. Buffer de seguridad (10% de liquidez)
    const safetyBuffer = liquidCash * 0.10;

    // 5. Safe-to-Spend
    const safeToSpend = Math.max(0, liquidCash - totalLiabilities - safetyBuffer);

    res.json({
      safeToSpend: Math.round(safeToSpend * 100) / 100,
      breakdown: {
        liquidCash,
        creditCardDue,
        recurringDue: recurringTotal,
        totalLiabilities,
        safetyBuffer: Math.round(safetyBuffer * 100) / 100
      },
      message: safeToSpend > 0
        ? `Puedes gastar hasta $${safeToSpend.toLocaleString()} de forma segura.`
        : 'No tienes margen de gasto seguro este mes. Prioriza tus compromisos.',
      calculated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Safe-to-Spend] Error:', error);
    res.status(500).json({
      message: 'Error calculando Safe-to-Spend',
      error: error.message
    });
  }
});

export default router;
