import { join } from "node:path"
import { z } from "zod"
import type { ContextoHerramienta, ResultadoHerramienta } from "./contrato.ts"
import { leerJson, rutas } from "./fuentes.ts"

// Estado persistido de cada caso en out/<caso>/ (DEC-04, DEC-05, DEC-26).
// Módulo interno: no exporta herramientas.

export const esquemaCampoMapeado = z.object({
  etiqueta: z.string(),
  obligatorio: z.boolean(),
  estado: z.enum(["lleno", "faltante", "requiere_confirmacion"]),
  ruta: z.string().nullable(),
  valor: z.union([z.string(), z.number()]).nullable(),
  confianza: z.number(),
  nota: z.string().optional(),
  decisionUsuario: z.enum(["aceptar", "descartar"]).optional(),
  sesionDecision: z.string().optional(),
})

export const esquemaMapeoGuardado = z.object({
  caso: z.string(),
  campos: z.array(esquemaCampoMapeado),
})

export const esquemaEstadoPaquete = z.object({
  caso: z.string(),
  listo_para_firma: z.boolean(),
  motivos: z.array(z.string()),
  adjuntos: z.array(z.string()),
})

export type MapeoGuardado = z.infer<typeof esquemaMapeoGuardado>
export type EstadoPaquete = z.infer<typeof esquemaEstadoPaquete>

export const archivoMapeo = (ctx: ContextoHerramienta, caso: string) => join(rutas.salidaCaso(ctx.directory, caso), "mapeo.json")
export const archivoEstado = (ctx: ContextoHerramienta, caso: string) =>
  join(rutas.salidaCaso(ctx.directory, caso), "estado-paquete.json")

export async function guardarJson(destino: string, contenido: unknown): Promise<void> {
  await Bun.write(destino, JSON.stringify(contenido, null, 2))
}

export async function leerMapeo(ctx: ContextoHerramienta, caso: string): Promise<ResultadoHerramienta<MapeoGuardado>> {
  const ruta = archivoMapeo(ctx, caso)
  if (!(await Bun.file(ruta).exists())) return { ok: false, error: "Primero mapea los campos del caso." }
  return leerJson(ruta, esquemaMapeoGuardado, "el mapeo registrado del caso")
}

export async function leerEstadoPaquete(ctx: ContextoHerramienta, caso: string): Promise<ResultadoHerramienta<EstadoPaquete>> {
  const ruta = archivoEstado(ctx, caso)
  if (!(await Bun.file(ruta).exists())) return { ok: false, error: "Primero arma el paquete para firma." }
  return leerJson(ruta, esquemaEstadoPaquete, "el estado del paquete")
}
