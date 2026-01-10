/**
 * @fileoverview Servicio para cálculos de intereses de tarjetas de crédito.
 * 
 * Proporciona funciones para:
 * - Calcular intereses mensuales basados en tasa anual
 * - Calcular pago mínimo requerido
 * - Proyectar tiempo para pagar deuda completa
 * - Calcular costo total de llevar saldo
 * 
 * NOTA: Los bancos mexicanos usan fórmulas propietarias. Este servicio
 * proporciona aproximaciones estándar para proyecciones.
 * 
 * @module services/creditCardInterest
 */

/**
 * Calcula el interés mensual sobre un saldo de tarjeta de crédito.
 * 
 * FÓRMULA (Interés Simple Mensual):
 * Interés = Saldo × (Tasa Anual ÷ 12)
 * 
 * @param {number} balance - Saldo adeudado (siempre positivo)
 * @param {number} annualRate - Tasa anual en decimal (ej: 0.45 para 45% anual)
 * @returns {number} Interés del mes, redondeado a 2 decimales
 * 
 * @example
 * // Saldo de $10,000 con tasa de 45% anual
 * const interest = calculateMonthlyInterest(10000, 0.45);
 * // Retorna: 375.00 ($10,000 × 0.45 ÷ 12)
 */
export function calculateMonthlyInterest(
  balance: number,
  annualRate: number
): number {
  if (balance <= 0 || annualRate <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12;
  const interest = balance * monthlyRate;

  return Math.round(interest * 100) / 100;
}

/**
 * Calcula el pago mínimo requerido de una tarjeta de crédito.
 * 
 * FÓRMULA TÍPICA BANCOS MX:
 * Pago Mínimo = MAX(Saldo × 5%, $200)
 * 
 * Algunos bancos usan: 1.5% del saldo + intereses del mes
 * 
 * @param {number} balance - Saldo al corte
 * @param {number} percentRate - Porcentaje del saldo (default: 0.05 = 5%)
 * @param {number} fixedMinimum - Mínimo fijo en pesos (default: $200)
 * @returns {number} Pago mínimo requerido
 * 
 * @example
 * calculateMinimumPayment(5000);    // Retorna: 250 ($5000 × 5%)
 * calculateMinimumPayment(2000);    // Retorna: 200 (mínimo fijo)
 * calculateMinimumPayment(100000);  // Retorna: 5000 ($100,000 × 5%)
 */
export function calculateMinimumPayment(
  balance: number,
  percentRate: number = 0.05,
  fixedMinimum: number = 200
): number {
  if (balance <= 0) {
    return 0;
  }

  const percentPayment = balance * percentRate;
  return Math.max(percentPayment, fixedMinimum);
}

/**
 * Proyecta cuántos meses tardará en pagar la deuda con un pago fijo.
 * 
 * ADVERTENCIA: Si el pago mensual ≤ intereses, la deuda NUNCA se paga.
 * 
 * @param {number} balance - Saldo actual
 * @param {number} annualRate - Tasa anual en decimal (ej: 0.45)
 * @param {number} monthlyPayment - Pago mensual fijo
 * @returns {number} Meses para liquidar, o Infinity si pago insuficiente
 * 
 * @example
 * // Deuda de $10,000 al 45% pagando $500/mes
 * const months = projectedPayoffMonths(10000, 0.45, 500);
 * // Retorna: ~30 meses
 * 
 * // Pago menor al interés mensual
 * const bad = projectedPayoffMonths(10000, 0.45, 300);
 * // Retorna: Infinity (nunca paga)
 */
export function projectedPayoffMonths(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): number {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;

  const monthlyRate = annualRate / 12;
  const monthlyInterest = balance * monthlyRate;

  // Si el pago no cubre ni los intereses, nunca paga
  if (monthlyPayment <= monthlyInterest) {
    return Infinity;
  }

  // Fórmula de amortización
  // n = -log(1 - (P × r / PMT)) / log(1 + r)
  // Donde: P = principal, r = tasa mensual, PMT = pago mensual
  const months = -Math.log(1 - (balance * monthlyRate / monthlyPayment))
    / Math.log(1 + monthlyRate);

  return Math.ceil(months);
}

/**
 * Calcula el costo total de intereses al pagar solo el mínimo.
 * 
 * PROPÓSITO: Mostrar al usuario cuánto dinero "extra" pagará
 * si solo hace pagos mínimos.
 * 
 * @param {number} balance - Saldo al corte
 * @param {number} annualRate - Tasa anual
 * @param {number} minPaymentPercent - Porcentaje de pago mínimo (default: 5%)
 * @param {number} maxMonths - Límite de meses a simular (default: 120 = 10 años)
 * @returns {{ months: number; totalPaid: number; totalInterest: number }}
 * 
 * @example
 * const projection = calculateMinimumPaymentCost(10000, 0.45);
 * // Retorna algo como:
 * // { months: 48, totalPaid: 16500, totalInterest: 6500 }
 */
export function calculateMinimumPaymentCost(
  balance: number,
  annualRate: number,
  minPaymentPercent: number = 0.05,
  maxMonths: number = 120
): { months: number; totalPaid: number; totalInterest: number } {
  if (balance <= 0) {
    return { months: 0, totalPaid: 0, totalInterest: 0 };
  }

  let remainingBalance = balance;
  let totalPaid = 0;
  let months = 0;
  const monthlyRate = annualRate / 12;
  const fixedMinimum = 200;

  while (remainingBalance > 0 && months < maxMonths) {
    months++;

    // Interés del mes
    const interest = remainingBalance * monthlyRate;

    // Pago mínimo (decrece con el balance)
    const minPayment = Math.max(remainingBalance * minPaymentPercent, fixedMinimum);

    // Si el pago mínimo es mayor que la deuda + interés, solo pagar lo necesario
    const payment = Math.min(minPayment, remainingBalance + interest);

    totalPaid += payment;
    remainingBalance = remainingBalance + interest - payment;

    // Evitar balances negativos por redondeo
    if (remainingBalance < 0.01) {
      remainingBalance = 0;
    }
  }

  return {
    months,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round((totalPaid - balance) * 100) / 100
  };
}

/**
 * Genera tabla de amortización para pago fijo.
 * Útil para mostrar al usuario cómo se distribuye cada pago.
 * 
 * @param {number} balance - Saldo inicial
 * @param {number} annualRate - Tasa anual
 * @param {number} monthlyPayment - Pago mensual fijo
 * @param {number} maxMonths - Límite de filas (default: 60)
 * @returns {Array<{ month: number; payment: number; principal: number; interest: number; balance: number }>}
 * 
 * @example
 * const table = generateAmortizationTable(10000, 0.45, 500);
 * // [
 * //   { month: 1, payment: 500, principal: 125, interest: 375, balance: 9875 },
 * //   { month: 2, payment: 500, principal: 130.31, interest: 369.69, balance: 9744.69 },
 * //   ...
 * // ]
 */
export function generateAmortizationTable(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  maxMonths: number = 60
): Array<{
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  if (balance <= 0 || monthlyPayment <= 0) {
    return [];
  }

  const table: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> = [];

  let remainingBalance = balance;
  const monthlyRate = annualRate / 12;

  for (let month = 1; month <= maxMonths && remainingBalance > 0.01; month++) {
    const interest = remainingBalance * monthlyRate;

    // Último pago puede ser menor
    const actualPayment = Math.min(monthlyPayment, remainingBalance + interest);
    const principal = actualPayment - interest;

    remainingBalance = remainingBalance - principal;

    // Evitar balance negativo por redondeo
    if (remainingBalance < 0.01) {
      remainingBalance = 0;
    }

    table.push({
      month,
      payment: Math.round(actualPayment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(remainingBalance * 100) / 100
    });
  }

  return table;
}
