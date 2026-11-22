import { beforeAll, describe, expect, test } from "bun:test"
import { rm } from "node:fs/promises"
import { join } from "node:path"
import type { ContextoHerramienta } from "../src/tools/contrato.ts"
import { armar_paquete, generar_formulario, leer_solicitud, mapear_campos, simular_envio } from "../src/tools/proveedor.ts"

// Columna vertebral del flujo (DEC-28): cada resultado trae el paso siguiente y,
// solo cuando la variante aplica, su guía. Se verifica con los casos reales, sin modelo.

const RAIZ = join(import.meta.dir, "..")
process.env.FECHA_REFERENCIA = "2026-09-03"
const ctx: ContextoHerramienta = { directory: RAIZ, sessionId: "flujo" }

interface Resultado {
  ok: boolean
  data?: Record<string, unknown>
  error?: string
  siguiente_paso: string
  guia?: string
}

const leer = (json: string) => JSON.parse(json) as Resultado
const resultados = new Map<string, Record<string, Resultado>>()

beforeAll(async () => {
  for (const caso of ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"]) {
    await rm(join(RAIZ, "out", caso), { recursive: true, force: true })
    const lectura = leer(await leer_solicitud.execute({ caso }, ctx))
    const campos = (lectura.data?.campos as { etiqueta: string }[]).map((c) => c.etiqueta)
    const mapeo = leer(await mapear_campos.execute({ caso, campos }, ctx))
    const formulario = leer(await generar_formulario.execute({ caso, mapeo: {} }, ctx))
    const paquete = leer(await armar_paquete.execute({ caso }, ctx))
    resultados.set(caso, { lectura, mapeo, formulario, paquete })
  }
})

function de(caso: string, paso: string): Resultado {
  const resultado = resultados.get(caso)?.[paso]
  if (resultado === undefined) throw new Error(`Sin resultado para ${caso}/${paso}`)
  return resultado
}

describe("paso siguiente en el camino feliz", () => {
  test("cada herramienta indica la siguiente del flujo", () => {
    expect(de("co-industrias-delta", "lectura").siguiente_paso).toContain("proveedor_mapear_campos")
    expect(de("co-industrias-delta", "mapeo").siguiente_paso).toContain("proveedor_generar_formulario")
    expect(de("co-industrias-delta", "formulario").siguiente_paso).toContain("proveedor_armar_paquete")
  })

  test("sin campos pendientes, el turno cierra con la confirmación de envío", () => {
    const paso = de("co-industrias-delta", "paquete").siguiente_paso
    expect(paso).toContain('accion="enviar"')
    expect(paso).not.toContain("motivos")
    expect(de("co-industrias-delta", "paquete").guia).toBeUndefined()
  })

  test("con campos pendientes, el turno cierra con la confirmación de esos campos", () => {
    expect(de("ec-corp-andina", "paquete").siguiente_paso).toContain('etiquetas=["RUC"]')
    expect(de("hn-agroexport-sula", "paquete").siguiente_paso).toContain('etiquetas=["RTN"]')
    expect(de("pa-logistica-istmo", "paquete").siguiente_paso).toContain('accion="confirmar_campos"')
  })

  test("con campos pendientes, el mapeo pide no confirmar todavía", () => {
    expect(de("ec-corp-andina", "mapeo").siguiente_paso).toContain("Todavía no pidas confirmación")
    expect(de("co-industrias-delta", "mapeo").siguiente_paso).not.toContain("Todavía no pidas confirmación")
  })
})

describe("guías por variante", () => {
  test("campos por confirmar: se adjunta en el mapeo y en el paquete", () => {
    expect(de("ec-corp-andina", "mapeo").guia).toContain("# Campos por confirmar")
    expect(de("ec-corp-andina", "paquete").guia).toContain("# Campos por confirmar")
    expect(de("co-industrias-delta", "mapeo").guia).toBeUndefined()
  })

  test("paquete bloqueado: solo cuando el paquete no está listo", () => {
    expect(de("hn-agroexport-sula", "paquete").guia).toContain("# Paquete no listo para firma")
    expect(de("pa-logistica-istmo", "paquete").guia).not.toContain("# Paquete no listo para firma")
  })

  test("formato portal: se adjunta al leer y al generar", () => {
    expect(de("pa-logistica-istmo", "lectura").guia).toContain("# Formato portal web")
    expect(de("pa-logistica-istmo", "formulario").guia).toContain("# Formato portal web")
    expect(de("co-industrias-delta", "lectura").guia).toBeUndefined()
  })

  test("caso no disponible: se adjunta cuando la lectura falla", async () => {
    const resultado = leer(await leer_solicitud.execute({ caso: "caso-inexistente" }, ctx))
    expect(resultado.ok).toBe(false)
    expect(resultado.guia).toContain("# Caso no disponible")
    expect(resultado.siguiente_paso).toContain("verifique el nombre del caso")
  })

  test("envío: se adjunta cuando falta la confirmación", async () => {
    const resultado = leer(await simular_envio.execute({ caso: "co-industrias-delta", confirmado: true }, ctx))
    expect(resultado.ok).toBe(false)
    expect(resultado.guia).toContain("# Envío simulado")
  })
})
