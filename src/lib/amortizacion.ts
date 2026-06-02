// Fórmula de amortización francesa (cuota fija, sistema francés)
// IMPORTANTE: usa el mismo criterio de redondeo que generar_cuotas_amortizacion en SQL
// para que el preview del cliente coincida con la tabla generada en el servidor.

export interface CuotaPreview {
  numero: number
  capital: number
  interes: number
  cuotaTotal: number
  saldoRestante: number
}

/**
 * Calcula la cuota mensual fija (fórmula francesa).
 * @param monto      Capital del préstamo en COP (entero)
 * @param tasa       Tasa de interés mensual en decimal (ej: 0.015 = 1.5%)
 * @param plazo      Número de cuotas (meses)
 * @returns Cuota mensual redondeada al peso
 */
export function calcularCuotaMensual(
  monto: number,
  tasa: number,
  plazo: number
): number {
  if (tasa === 0) return Math.round(monto / plazo)
  // C = P * r / (1 - (1+r)^-n)
  return Math.round((monto * tasa) / (1 - Math.pow(1 + tasa, -plazo)))
}

/**
 * Genera la tabla de amortización completa.
 * La última cuota absorbe el residuo de redondeo exactamente como en el SQL.
 * @param monto      Capital del préstamo en COP (entero)
 * @param tasa       Tasa mensual en decimal
 * @param plazo      Número de cuotas
 * @returns          Array de cuotas con desglose capital/interés/saldo
 */
export function calcularAmortizacion(
  monto: number,
  tasa: number,
  plazo: number
): CuotaPreview[] {
  const cuotaFija = calcularCuotaMensual(monto, tasa, plazo)
  const cuotas: CuotaPreview[] = []
  let saldo = monto

  for (let i = 1; i <= plazo; i++) {
    const interes = Math.round(saldo * tasa)
    let capital: number
    let cuotaTotal: number

    if (i === plazo) {
      // Última cuota: el capital es el saldo restante
      capital = saldo
      cuotaTotal = saldo + interes
    } else {
      capital = cuotaFija - interes
      cuotaTotal = cuotaFija
    }

    saldo = saldo - capital

    cuotas.push({
      numero: i,
      capital,
      interes,
      cuotaTotal,
      saldoRestante: saldo,
    })
  }

  return cuotas
}

/**
 * Calcula el total de intereses del préstamo.
 */
export function calcularTotalIntereses(
  monto: number,
  tasa: number,
  plazo: number
): number {
  const cuotas = calcularAmortizacion(monto, tasa, plazo)
  return cuotas.reduce((sum, c) => sum + c.interes, 0)
}
