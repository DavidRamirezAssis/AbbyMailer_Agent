import type { UsoTokens } from "./adapter.ts"

// Tarifas de referencia en USD por millón de tokens (DEC-21), para el indicador
// de costo de la interfaz (DEC-29). Es una estimación: no descuenta la lectura
// de caché, por lo que el costo real es igual o menor.

interface Tarifa {
  entrada: number
  salida: number
}

const TARIFAS: Readonly<Record<string, Tarifa>> = {
  "claude-haiku-5-5": { entrada: 0.1, salida: 0.5 },
  "claude-sonnet-5-5": { entrada: 2, salida: 10 },
  "claude-opus-5-5": { entrada: 4, salida: 20 },
}

export function estimarCostoUsd(modelo: string, uso: UsoTokens): number | null {
  const tarifa = TARIFAS[modelo]
  if (tarifa === undefined) return null
  const costo = (uso.tokensEntrada * tarifa.entrada + uso.tokensSalida * tarifa.salida) / 1_000_000
  return Math.round(costo * 1_000_000) / 1_000_000
}
