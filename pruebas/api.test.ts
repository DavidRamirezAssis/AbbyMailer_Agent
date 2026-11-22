import { beforeEach, describe, expect, test } from "bun:test"
import { rm } from "node:fs/promises"
import { join } from "node:path"
import { AlmacenSesiones } from "../src/agente/sesiones.ts"
import { crearManejador } from "../src/api/app.ts"
import { cargarConfig } from "../src/config.ts"
import type { AdaptadorLLM, BloqueMensaje, Mensaje, RespuestaModelo } from "../src/llm/adapter.ts"
import { herramientas } from "../src/tools/index.ts"

// Recorrido de la API con un modelo simulado (sin consumir créditos):
// confirmación de campos, envío, decisión registrada por el backend (DEC-24, DEC-25)
// y conservación de la decisión al volver a mapear (DEC-26).

const RAIZ = join(import.meta.dir, "..")
const CASO = "pa-logistica-istmo"
process.env.FECHA_REFERENCIA = "2026-09-03"

type Paso = (mensajes: Mensaje[]) => RespuestaModelo
let id = 0

function llamadas(...lista: [string, unknown][]): Paso {
  return () => ({
    mensaje: {
      rol: "asistente",
      bloques: lista.map(([nombre, argumentos]): BloqueMensaje => ({ tipo: "llamada", llamada: { id: `t${++id}`, nombre, argumentos } })),
    },
    motivoFin: "uso_herramienta",
    uso: { tokensEntrada: 1000, tokensSalida: 100 },
  })
}

function texto(contenido: string): Paso {
  return () => ({ mensaje: { rol: "asistente", bloques: [{ tipo: "texto", texto: contenido }] }, motivoFin: "fin_turno", uso: { tokensEntrada: 1000, tokensSalida: 100 } })
}

class ModeloSimulado implements AdaptadorLLM {
  readonly proveedor = "simulado"
  readonly modelo = "claude-haiku-5-5"
  readonly recibidos: Mensaje[][] = []
  private pasos: Paso[] = []

  guion(...pasos: Paso[]): void {
    this.pasos.push(...pasos)
  }

  async enviar(mensajes: Mensaje[]): Promise<RespuestaModelo> {
    this.recibidos.push(structuredClone(mensajes))
    const paso = this.pasos.shift()
    if (paso === undefined) throw new Error("Guion agotado")
    return paso(mensajes)
  }

  ultimoTextoUsuario(): string {
    const mensajes = this.recibidos.at(-1) ?? []
    const usuario = mensajes.filter((m) => m.rol === "usuario" && m.bloques.some((b) => b.tipo === "texto")).at(-1)
    return usuario?.bloques.map((b) => (b.tipo === "texto" ? b.texto : "")).join("") ?? ""
  }
}

let modelo: ModeloSimulado
let manejar: ReturnType<typeof crearManejador>

function preparar(entorno: Record<string, string> = {}, adaptador: AdaptadorLLM | null = modelo) {
  const config = cargarConfig({ FECHA_REFERENCIA: "2026-09-03", ...entorno })
  return crearManejador({ config, raiz: RAIZ, sistema: "prueba", adaptador, herramientas, sesiones: new AlmacenSesiones() })
}

async function enviar(cuerpo: unknown, cabeceras: Record<string, string> = {}, m = manejar) {
  const respuesta = await m(
    new Request("http://local/api/chat", { method: "POST", headers: { "content-type": "application/json", ...cabeceras }, body: JSON.stringify(cuerpo) }),
  )
  return { estado: respuesta.status, cuerpo: (await respuesta.json()) as Record<string, any> }
}

const PROCESO: [string, unknown][][] = [
  [["proveedor_leer_solicitud", { caso: CASO }]],
  [["proveedor_mapear_campos", { caso: CASO, campos: ["RUC"] }]],
  [["proveedor_generar_formulario", { caso: CASO, mapeo: {} }]],
  [["proveedor_armar_paquete", { caso: CASO }]],
]
const PREGUNTA_RUC = "El cliente pide RUC y Periferia solo tiene el NIT 900123456. ¿Lo uso como identificador extranjero?"

async function procesarHastaPreguntaRuc() {
  modelo.guion(
    ...PROCESO.map((l) => llamadas(...l)),
    llamadas(["agente_solicitar_confirmacion", { accion: "confirmar_campos", caso: CASO, etiquetas: ["RUC"], pregunta: PREGUNTA_RUC }]),
  )
  return enviar({ message: `Procesa el caso ${CASO}` })
}

beforeEach(async () => {
  // Cada prueba parte sin estado previo del caso en out/.
  await rm(join(RAIZ, "out", CASO), { recursive: true, force: true })
  modelo = new ModeloSimulado()
  manejar = preparar()
})

describe("flujo con confirmaciones", () => {
  test("el primer turno termina con la confirmación registrada e indicadores de uso", async () => {
    const { estado, cuerpo } = await procesarHastaPreguntaRuc()
    expect(estado).toBe(200)
    expect(cuerpo.needsConfirmation).toBe(true)
    expect(cuerpo.confirmacion).toMatchObject({ accion: "confirmar_campos", caso: CASO, etiquetas: ["RUC"] })
    expect(cuerpo.reply).toContain(PREGUNTA_RUC)
    // El modelo simulado no escribió resumen: el backend agrega el resumen determinista.
    expect(cuerpo.reply).toContain("Resumen del caso:")
    expect(cuerpo.reply).toContain("- Campos por confirmar: RUC.")
    expect(cuerpo.toolCalls).toHaveLength(5)
    expect(cuerpo.toolCalls.every((l: { ok: boolean }) => l.ok)).toBe(true)
    expect(cuerpo.archivos).toContain(`out/${CASO}/valores-portal.md`)
    expect(cuerpo.uso.sesion).toMatchObject({ usados: 5500, limite: 90000, restante: 84500 })
    expect(cuerpo.uso.costoEstimadoUsd.sesion).toBeGreaterThan(0)
  })

  test("aceptar el campo, confirmar el envío y simularlo", async () => {
    const primero = await procesarHastaPreguntaRuc()
    const sessionId = primero.cuerpo.sessionId as string

    modelo.guion(
      llamadas(["proveedor_generar_formulario", { caso: CASO, mapeo: { confirmaciones: [{ etiqueta: "RUC", decision: "aceptar" }] } }]),
      llamadas(["proveedor_armar_paquete", { caso: CASO }]),
      llamadas(["agente_solicitar_confirmacion", { accion: "enviar", caso: CASO, etiquetas: [], pregunta: "¿Simulo el envío al cliente?" }]),
    )
    const segundo = await enviar({ sessionId, message: "Sí" })
    expect(modelo.ultimoTextoUsuario()).toContain('decidió "aceptar"')
    expect(segundo.cuerpo.toolCalls.map((l: { ok: boolean }) => l.ok)).toEqual([true, true, true])
    expect(segundo.cuerpo.toolCalls[1].resumen).toBe("Paquete listo para firma")
    expect(segundo.cuerpo.confirmacion).toMatchObject({ accion: "enviar" })

    modelo.guion(llamadas(["proveedor_simular_envio", { caso: CASO, confirmado: true }]), texto("Envío simulado."))
    const tercero = await enviar({ sessionId, message: "envía" })
    expect(tercero.cuerpo.toolCalls[0].ok).toBe(true)
    expect(tercero.cuerpo.needsConfirmation).toBe(false)
    expect(await Bun.file(join(RAIZ, "out", CASO, "ENVIO-SIMULADO.md")).exists()).toBe(true)
  })

  test("DEC-25: si el modelo invierte la decisión del usuario, la herramienta la rechaza", async () => {
    const { cuerpo } = await procesarHastaPreguntaRuc()
    modelo.guion(
      llamadas(["proveedor_generar_formulario", { caso: CASO, mapeo: { confirmaciones: [{ etiqueta: "RUC", decision: "aceptar" }] } }]),
      texto("Entendido."),
    )
    const respuesta = await enviar({ sessionId: cuerpo.sessionId, message: "No. Nos pidieron tramitar primero el RUC panameño; no pongas el NIT." })
    expect(respuesta.cuerpo.toolCalls[0].ok).toBe(false)
    expect(respuesta.cuerpo.toolCalls[0].resumen).toContain("no coincide con la del usuario")
  })

  test("una respuesta ambigua no confirma nada", async () => {
    const { cuerpo } = await procesarHastaPreguntaRuc()
    modelo.guion(
      llamadas(["proveedor_generar_formulario", { caso: CASO, mapeo: { confirmaciones: [{ etiqueta: "RUC", decision: "aceptar" }] } }]),
      texto("¿Me confirma si uso el NIT?"),
    )
    const respuesta = await enviar({ sessionId: cuerpo.sessionId, message: "tal vez" })
    expect(modelo.ultimoTextoUsuario()).toContain("no es una decisión inequívoca")
    expect(respuesta.cuerpo.toolCalls[0].ok).toBe(false)
    expect(respuesta.cuerpo.needsConfirmation).toBe(false)
  })

  test("el botón de la interfaz registra la decisión sin depender del texto", async () => {
    const { cuerpo } = await procesarHastaPreguntaRuc()
    modelo.guion(
      llamadas(["proveedor_generar_formulario", { caso: CASO, mapeo: { confirmaciones: [{ etiqueta: "RUC", decision: "descartar" }] } }]),
      texto("Descartado."),
    )
    const respuesta = await enviar({ sessionId: cuerpo.sessionId, confirmacion: { decision: "descartar" } })
    expect(respuesta.cuerpo.toolCalls[0].ok).toBe(true)
  })

  test("DEC-26: volver a mapear conserva la decisión del usuario", async () => {
    const { cuerpo } = await procesarHastaPreguntaRuc()
    modelo.guion(
      llamadas(["proveedor_generar_formulario", { caso: CASO, mapeo: { confirmaciones: [{ etiqueta: "RUC", decision: "aceptar" }] } }]),
      llamadas(["proveedor_mapear_campos", { caso: CASO, campos: ["RUC"] }]),
      texto("Campos actualizados."),
    )
    const respuesta = await enviar({ sessionId: cuerpo.sessionId, message: "Sí" })
    expect(respuesta.cuerpo.toolCalls[1].resumen).toBe("9 llenos, 0 faltantes, 0 por confirmar")
  })

  test("DEC-26: una sesión nueva no hereda la decisión de otra sesión", async () => {
    const { cuerpo } = await procesarHastaPreguntaRuc()
    modelo.guion(
      llamadas(["proveedor_generar_formulario", { caso: CASO, mapeo: { confirmaciones: [{ etiqueta: "RUC", decision: "aceptar" }] } }]),
      texto("Aceptado."),
    )
    await enviar({ sessionId: cuerpo.sessionId, message: "Sí" })

    // Otra sesión procesa el mismo caso: el RUC vuelve a requerir confirmación.
    const nueva = await procesarHastaPreguntaRuc()
    expect(nueva.cuerpo.sessionId).not.toBe(cuerpo.sessionId)
    expect(nueva.cuerpo.toolCalls[1].resumen).toBe("8 llenos, 0 faltantes, 1 por confirmar")
    expect(nueva.cuerpo.needsConfirmation).toBe(true)
  })

  test("el envío sin confirmación pendiente se rechaza", async () => {
    modelo.guion(llamadas(["proveedor_simular_envio", { caso: CASO, confirmado: true }]), texto("No pude enviar."))
    const { cuerpo } = await enviar({ message: "envía" })
    expect(cuerpo.toolCalls[0].ok).toBe(false)
    expect(cuerpo.toolCalls[0].resumen).toBe("requiere confirmación explícita")
  })
})

describe("controles de la API", () => {
  test("una sesión inexistente devuelve un código específico (DEC-27)", async () => {
    const { estado, cuerpo } = await enviar({ sessionId: "no-existe", message: "Hola" })
    expect(estado).toBe(404)
    expect(cuerpo.codigo).toBe("sesion_inexistente")
  })

  test("un cuerpo inválido se rechaza", async () => {
    const { estado, cuerpo } = await enviar({ message: "" })
    expect(estado).toBe(400)
    expect(cuerpo.codigo).toBe("solicitud_invalida")
  })

  test("sin modelo configurado el chat responde 503 y el estado del servicio sigue disponible", async () => {
    const sinModelo = preparar({}, null)
    const { estado, cuerpo } = await enviar({ message: "Hola" }, {}, sinModelo)
    expect(estado).toBe(503)
    expect(cuerpo.codigo).toBe("modelo_no_configurado")
    expect((await sinModelo(new Request("http://local/api/health"))).status).toBe(200)
  })

  test("la clave de acceso protege la API cuando está configurada", async () => {
    const protegido = preparar({ ACCESS_KEY: "clave-de-prueba" })
    expect((await enviar({ message: "Hola" }, {}, protegido)).estado).toBe(401)
    modelo.guion(texto("Hola."))
    expect((await enviar({ message: "Hola" }, { "x-access-key": "clave-de-prueba" }, protegido)).estado).toBe(200)
  })

  test("el límite de peticiones por minuto se aplica por origen", async () => {
    const limitado = preparar({ LIMITE_PETICIONES_POR_MINUTO: "2" })
    modelo.guion(texto("1"), texto("2"))
    const cabecera = { "x-forwarded-for": "203.0.113.7" }
    expect((await enviar({ message: "a" }, cabecera, limitado)).estado).toBe(200)
    expect((await enviar({ message: "b" }, cabecera, limitado)).estado).toBe(200)
    expect((await enviar({ message: "c" }, cabecera, limitado)).estado).toBe(429)
  })

  test("lista y descarga los archivos generados del caso, sin exponer los internos (HU-18)", async () => {
    await procesarHastaPreguntaRuc()
    const listado = (await (await manejar(new Request(`http://local/api/files/${CASO}`))).json()) as { archivos: { ruta: string }[] }
    const rutasListadas = listado.archivos.map((a) => a.ruta)
    expect(rutasListadas).toContain("valores-portal.md")
    expect(rutasListadas).toContain("paquete/checklist.md")
    expect(rutasListadas.some((r) => r.endsWith("mapeo.json") || r.endsWith("log.jsonl") || r.endsWith("estado-paquete.json"))).toBe(false)

    const descarga = await manejar(new Request(`http://local/api/files/${CASO}/paquete/checklist.md`))
    expect(descarga.status).toBe(200)
    expect(descarga.headers.get("content-disposition")).toContain('filename="checklist.md"')
    expect(await descarga.text()).toContain("Lista de verificación")
  })

  test("rechaza rutas fuera de la carpeta del caso y archivos internos (HU-18)", async () => {
    await procesarHastaPreguntaRuc()
    for (const ruta of [
      `/api/files/${CASO}/..%2F..%2Fpackage.json`,
      `/api/files/${CASO}/%2E%2E%2F%2E%2E%2F.env`,
      `/api/files/${CASO}/mapeo.json`,
      `/api/files/..%2Ffixtures/maestro.json`,
    ]) {
      expect((await manejar(new Request(`http://local${ruta}`))).status).toBe(404)
    }
  })

  test("con clave de acceso, la descarga acepta el parámetro clave", async () => {
    const protegido = preparar({ ACCESS_KEY: "clave-de-prueba" })
    expect((await protegido(new Request(`http://local/api/files/${CASO}`))).status).toBe(401)
    expect((await protegido(new Request(`http://local/api/files/${CASO}?clave=clave-de-prueba`))).status).toBe(200)
  })

  test("el historial de la sesión incluye los turnos y las llamadas (HU-19)", async () => {
    const { cuerpo } = await procesarHastaPreguntaRuc()
    const respuesta = await manejar(new Request(`http://local/api/sessions/${cuerpo.sessionId}`))
    const historial = (await respuesta.json()) as Record<string, any>
    expect(historial.turnos).toHaveLength(1)
    expect(historial.turnos[0].llamadas).toHaveLength(5)
    expect(historial.confirmacion.accion).toBe("confirmar_campos")
  })
})
