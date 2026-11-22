import type { z } from "zod"
import type { Herramienta } from "./contrato.ts"
import * as proveedor from "./proveedor.ts"

// Registro de herramientas con el nombre que ve el modelo: <archivo>_<export> (PRD §6.2).

export type HerramientaRegistrada = Herramienta<z.ZodRawShape>

function registrar(prefijo: string, modulo: Record<string, HerramientaRegistrada>): Map<string, HerramientaRegistrada> {
  const registro = new Map<string, HerramientaRegistrada>()
  for (const [nombre, herramienta] of Object.entries(modulo)) {
    registro.set(`${prefijo}_${nombre}`, herramienta)
  }
  return registro
}

/** Herramientas que modifican el estado del caso en out/ (las demás son de solo lectura). */
export const HERRAMIENTAS_CON_ESTADO: ReadonlySet<string> = new Set([
  "proveedor_mapear_campos",
  "proveedor_generar_formulario",
  "proveedor_armar_paquete",
  "proveedor_simular_envio",
])

export const herramientas: ReadonlyMap<string, HerramientaRegistrada> = registrar(
  "proveedor",
  proveedor as unknown as Record<string, HerramientaRegistrada>,
)
