import { mkdir, readdir, rm } from "node:fs/promises"
import { join } from "node:path"
import type { ContextoHerramienta, ResultadoHerramienta } from "./src/tools/contrato.ts"
import { armar_paquete, generar_formulario, leer_solicitud, mapear_campos, simular_envio } from "./src/tools/proveedor.ts"

// Verificación sin modelo (PRD §6.6): ejecuta todos los casos llamando
// directamente a las herramientas e imprime un resumen por caso.
// No requiere clave de ningún proveedor.

const RAIZ = import.meta.dir
const DIRECTORIO_CASOS = join(RAIZ, "fixtures", "reto-01", "casos")
const DIRECTORIO_SALIDA = join(RAIZ, "out")
const CASO_INEXISTENTE = "caso-inexistente"

function interpretar(resultado: string): ResultadoHerramienta<unknown> {
  try {
    return JSON.parse(resultado) as ResultadoHerramienta<unknown>
  } catch {
    return { ok: false, error: "La herramienta devolvió una respuesta que no es JSON" }
  }
}

function describir(nombre: string, resultado: ResultadoHerramienta<unknown>): string {
  return resultado.ok ? `  [ok]    ${nombre}` : `  [error] ${nombre}: ${resultado.error}`
}

async function procesarCaso(caso: string): Promise<void> {
  const ctx: ContextoHerramienta = { directory: RAIZ, sessionId: "demo" }
  console.log(`\nCaso: ${caso}`)

  const solicitud = interpretar(await leer_solicitud.execute({ caso }, ctx))
  console.log(describir("leer_solicitud", solicitud))

  const mapeo = interpretar(await mapear_campos.execute({ caso, campos: ["Razón social"] }, ctx))
  console.log(describir("mapear_campos", mapeo))

  const formulario = interpretar(await generar_formulario.execute({ caso, mapeo: {} }, ctx))
  console.log(describir("generar_formulario", formulario))

  const paquete = interpretar(await armar_paquete.execute({ caso }, ctx))
  console.log(describir("armar_paquete", paquete))

  // Sin confirmación humana el envío debe rechazarse (DEC-06).
  const envio = interpretar(await simular_envio.execute({ caso, confirmado: true }, ctx))
  console.log(describir("simular_envio", envio))
}

async function main(): Promise<void> {
  await rm(DIRECTORIO_SALIDA, { recursive: true, force: true })
  await mkdir(DIRECTORIO_SALIDA, { recursive: true })

  const entradas = await readdir(DIRECTORIO_CASOS, { withFileTypes: true })
  const casos = entradas.filter((entrada) => entrada.isDirectory()).map((entrada) => entrada.name).sort()

  console.log(`Demo sin modelo: ${casos.length} casos encontrados en fixtures/reto-01/casos/`)
  for (const caso of [...casos, CASO_INEXISTENTE]) {
    await procesarCaso(caso)
  }
}

await main()
