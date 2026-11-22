import type { z } from "zod"
import * as agente from "./agente.ts"
import type { Herramienta } from "./contrato.ts"
import * as proveedor from "./proveedor.ts"

// Registro de herramientas con el nombre que ve el modelo: <archivo>_<export> (PRD §6.2).

export type HerramientaRegistrada = Herramienta<z.ZodRawShape>

function esHerramienta(valor: unknown): valor is HerramientaRegistrada {
  return typeof valor === "object" && valor !== null && "execute" in valor && "args" in valor && "description" in valor
}

function registrar(modulos: Record<string, Record<string, unknown>>): Map<string, HerramientaRegistrada> {
  const registro = new Map<string, HerramientaRegistrada>()
  for (const [prefijo, modulo] of Object.entries(modulos)) {
    for (const [nombre, valor] of Object.entries(modulo)) {
      if (esHerramienta(valor)) registro.set(`${prefijo}_${nombre}`, valor)
    }
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

/** Herramientas que cierran el turno para esperar la respuesta del usuario (DEC-24). */
export const HERRAMIENTA_CONFIRMACION = "agente_solicitar_confirmacion"
export const HERRAMIENTAS_DE_CIERRE: ReadonlySet<string> = new Set([HERRAMIENTA_CONFIRMACION])

export const herramientas: ReadonlyMap<string, HerramientaRegistrada> = registrar({ proveedor, agente })
