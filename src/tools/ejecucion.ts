import { relative, sep } from "node:path"
import { type ContextoHerramienta, type ResultadoHerramienta, exito, fallo } from "./contrato.ts"
import { registrar } from "./registro.ts"

// Envoltura común de las herramientas: registro (RN5) y captura de errores
// inesperados (HU-5). Módulo interno: no exporta herramientas.

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
  return resultado.ok ? exito(resultado.data) : fallo(resultado.error)
}

export function error<T>(mensaje: string): Salida<T> {
  return { resultado: { ok: false, error: mensaje }, resumen: mensaje }
}

export function rutaRelativa(ctx: ContextoHerramienta, absoluta: string): string {
  return relative(ctx.directory, absoluta).split(sep).join("/")
}
