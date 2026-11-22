import { join, relative, sep } from "node:path"
import { type Guia, orientar } from "../knowledge/flujo.ts"
import type { ContextoHerramienta, ResultadoHerramienta } from "./contrato.ts"
import { registrar } from "./registro.ts"

// Envoltura común de las herramientas: registro (RN5), captura de errores
// inesperados (HU-5) y gancho posterior que agrega el paso siguiente y las guías
// de variante (DEC-28). Módulo interno: no exporta herramientas.

export interface Salida<T> {
  resultado: ResultadoHerramienta<T>
  resumen: string
}

export async function ejecutar<T>(
  ctx: ContextoHerramienta,
  herramienta: string,
  caso: string,
  cuerpo: () => Promise<Salida<T>>,
): Promise<string> {
  let salida: Salida<T>
  try {
    salida = await cuerpo()
  } catch {
    salida = {
      resultado: {
        ok: false,
        error: `Ocurrió un error inesperado al ejecutar ${herramienta}. Intente de nuevo o revise los archivos del caso.`,
      },
      resumen: "error inesperado",
    }
  }
  const { resultado } = salida
  await registrar(ctx, { herramienta, caso, ok: resultado.ok, resumen: resultado.ok ? salida.resumen : resultado.error })

  const orientacion = orientar(herramienta, caso, resultado)
  const guia = await leerGuias(ctx, orientacion.guias)
  return JSON.stringify({ ...resultado, siguiente_paso: orientacion.siguiente_paso, ...(guia ? { guia } : {}) })
}

/** Las guías se leen solo cuando la variante aplica, para no cargar contexto innecesario. */
async function leerGuias(ctx: ContextoHerramienta, guias: Guia[]): Promise<string> {
  const textos: string[] = []
  for (const guia of guias) {
    const archivo = Bun.file(join(ctx.directory, "src", "knowledge", "variantes", `${guia}.md`))
    if (await archivo.exists()) textos.push((await archivo.text()).trim())
  }
  return textos.join("\n\n")
}

export function error<T>(mensaje: string): Salida<T> {
  return { resultado: { ok: false, error: mensaje }, resumen: mensaje }
}

export function rutaRelativa(ctx: ContextoHerramienta, absoluta: string): string {
  return relative(ctx.directory, absoluta).split(sep).join("/")
}
