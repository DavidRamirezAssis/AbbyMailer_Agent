import { appendFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import type { ContextoHerramienta } from "./contrato.ts"
import { nombreCasoValido, rutas } from "./fuentes.ts"

// Registro de ejecución (CA4 y RN5, DEC-13): out/log.jsonl global y out/<caso>/log.jsonl.
// El resumen nunca contiene valores sensibles: solo conteos y estados.

export interface EntradaRegistro {
  herramienta: string
  caso: string
  ok: boolean
  resumen: string
}

export async function registrar(ctx: ContextoHerramienta, entrada: EntradaRegistro): Promise<void> {
  const linea = JSON.stringify({ ts: new Date().toISOString(), sessionId: ctx.sessionId, ...entrada }) + "\n"
  try {
    const salida = rutas.salida(ctx.directory)
    await mkdir(salida, { recursive: true })
    await appendFile(join(salida, "log.jsonl"), linea)
    if (nombreCasoValido(entrada.caso)) {
      const carpeta = rutas.salidaCaso(ctx.directory, entrada.caso)
      await mkdir(carpeta, { recursive: true })
      await appendFile(join(carpeta, "log.jsonl"), linea)
    }
  } catch {
    // El registro nunca interrumpe la herramienta: un fallo de escritura se ignora.
  }
}
