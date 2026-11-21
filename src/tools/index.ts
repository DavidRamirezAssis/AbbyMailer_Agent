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

export const herramientas: ReadonlyMap<string, HerramientaRegistrada> = registrar(
  "proveedor",
  proveedor as unknown as Record<string, HerramientaRegistrada>,
)
