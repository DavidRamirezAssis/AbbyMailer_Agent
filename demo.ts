import { mkdir, readdir, rm } from "node:fs/promises"
import { join } from "node:path"
import type { ContextoHerramienta } from "./src/tools/contrato.ts"
import { armar_paquete, generar_formulario, leer_solicitud, mapear_campos, simular_envio } from "./src/tools/proveedor.ts"

// Verificación sin modelo (PRD §6.6): ejecuta todos los casos llamando
// directamente a las herramientas e imprime un resumen por caso.
// No requiere clave de ningún proveedor.
//
// Escenario A: sin confirmación humana (comportamiento por defecto del agente).
// Escenario B: confirmación humana simulada, para mostrar que el bloqueo se levanta
// y que el envío solo procede con confirmación explícita (DEC-06, DEC-09, DEC-10).

const RAIZ = import.meta.dir
const DIRECTORIO_CASOS = join(RAIZ, "fixtures", "reto-01", "casos")
const CASO_INEXISTENTE = "caso-inexistente"
const FECHA_POR_DEFECTO = "2026-09-03"

// Determinismo (PRD §8): sin .env se usa la fecha para la que se diseñaron los fixtures (DEC-02).
process.env.FECHA_REFERENCIA ||= FECHA_POR_DEFECTO

type Respuesta = { ok: true; data: Record<string, unknown> } | { ok: false; error: string }

function leer(json: string): Respuesta {
  return JSON.parse(json) as Respuesta
}

function contar(data: Record<string, unknown>, clave: string): number {
  const valor = data[clave]
  return Array.isArray(valor) ? valor.length : 0
}

function etiquetas(data: Record<string, unknown>, clave: string): string[] {
  const valor = data[clave]
  if (!Array.isArray(valor)) return []
  return valor.map((v: { etiqueta?: unknown }) => String(v.etiqueta))
}

async function procesar(caso: string): Promise<void> {
  const ctx: ContextoHerramienta = { directory: RAIZ, sessionId: "demo" }
  console.log(`\n=== ${caso}`)

  const solicitud = leer(await leer_solicitud.execute({ caso }, ctx))
  if (!solicitud.ok) {
    console.log(`  Solicitud: ${solicitud.error}`)
    const paquete = leer(await armar_paquete.execute({ caso }, ctx))
    console.log(`  Paquete:   ${paquete.ok ? "armado" : paquete.error}`)
    return
  }
  const campos = (solicitud.data.campos as { etiqueta: string }[]).map((c) => c.etiqueta)
  console.log(`  País ${solicitud.data.pais} | formato ${solicitud.data.formato} | ${campos.length} campos | soportes: ${(solicitud.data.soportes as string[]).join(", ")}`)

  const mapeo = leer(await mapear_campos.execute({ caso, campos }, ctx))
  if (!mapeo.ok) return void console.log(`  Mapeo: ${mapeo.error}`)
  const porConfirmar = etiquetas(mapeo.data, "requiere_confirmacion")
  console.log(
    `  Mapeo: ${contar(mapeo.data, "llenos")} llenos | ${contar(mapeo.data, "faltantes")} faltantes [${etiquetas(mapeo.data, "faltantes").join(", ")}] | ${porConfirmar.length} por confirmar [${porConfirmar.join(", ")}]`,
  )

  const formulario = leer(await generar_formulario.execute({ caso, mapeo: {} }, ctx))
  console.log(`  Formulario: ${formulario.ok ? formulario.data.ruta : formulario.error}`)

  const paqueteA = leer(await armar_paquete.execute({ caso }, ctx))
  if (paqueteA.ok) {
    const motivos = (paqueteA.data.checklist as { motivos: string[] }).motivos
    console.log(`  [A] listo_para_firma=${paqueteA.data.listo_para_firma}${motivos.length ? ` | ${motivos.join(" ")}` : ""}`)
  } else console.log(`  [A] Paquete: ${paqueteA.error}`)

  const envioSinConfirmar = leer(await simular_envio.execute({ caso, confirmado: true }, ctx))
  console.log(`  [A] Envío sin confirmación del usuario: ${envioSinConfirmar.ok ? "PROCEDIÓ (no esperado)" : `rechazado (${envioSinConfirmar.error})`}`)

  if (porConfirmar.length > 0) {
    const decisiones = Object.fromEntries(porConfirmar.map((etiqueta) => [etiqueta, "aceptar" as const]))
    const ctxCampos: ContextoHerramienta = {
      ...ctx,
      confirmacionUsuario: { accion: "confirmar_campos", caso, etiquetas: porConfirmar, decisiones },
    }
    const confirmaciones = porConfirmar.map((etiqueta) => ({ etiqueta, decision: "aceptar" as const }))
    const regenerado = leer(await generar_formulario.execute({ caso, mapeo: { confirmaciones } }, ctxCampos))
    console.log(`  [B] Confirmación simulada de ${porConfirmar.join(", ")}: ${regenerado.ok ? "formulario regenerado" : regenerado.error}`)
    const paqueteB = leer(await armar_paquete.execute({ caso }, ctx))
    if (paqueteB.ok) {
      const motivos = (paqueteB.data.checklist as { motivos: string[] }).motivos
      console.log(`  [B] listo_para_firma=${paqueteB.data.listo_para_firma}${motivos.length ? ` | ${motivos.join(" ")}` : ""}`)
    }
  }

  const ctxEnvio: ContextoHerramienta = { ...ctx, confirmacionUsuario: { accion: "enviar", caso } }
  const envio = leer(await simular_envio.execute({ caso, confirmado: true }, ctxEnvio))
  console.log(`  [B] Envío con confirmación simulada: ${envio.ok ? envio.data.ruta : envio.error}`)
}

async function main(): Promise<void> {
  await rm(join(RAIZ, "out"), { recursive: true, force: true })
  await mkdir(join(RAIZ, "out"), { recursive: true })

  const entradas = await readdir(DIRECTORIO_CASOS, { withFileTypes: true })
  const casos = entradas.filter((e) => e.isDirectory()).map((e) => e.name).sort()
  console.log(`Demo sin modelo | fecha de referencia ${process.env.FECHA_REFERENCIA} | ${casos.length} casos`)
  for (const caso of [...casos, CASO_INEXISTENTE]) await procesar(caso)
  console.log("\nSalidas en out/ y registro en out/log.jsonl")
}

await main()
