import { timingSafeEqual } from "node:crypto"
import { resolve, sep } from "node:path"
import { z } from "zod"
import { type LlamadaEjecutada, ejecutarTurno } from "../agente/ciclo.ts"
import { type ConfirmacionPendiente, type Interpretacion, construirConfirmacion, interpretarTexto, notaParaModelo } from "../agente/confirmacion.ts"
import { archivosGenerados, resumirLlamada } from "../agente/resumen.ts"
import { type AlmacenSesiones, type Sesion, totalTokens } from "../agente/sesiones.ts"
import type { Config } from "../config.ts"
import type { AdaptadorLLM, UsoTokens } from "../llm/adapter.ts"
import { estimarCostoUsd } from "../llm/precios.ts"
import type { ConfirmacionUsuario } from "../tools/contrato.ts"
import { HERRAMIENTAS_CON_ESTADO, HERRAMIENTAS_DE_CIERRE, HERRAMIENTA_CONFIRMACION, type HerramientaRegistrada } from "../tools/index.ts"

// API HTTP (PRD §6.4): estado, chat, historial de sesión y front estático en una sola URL (DEC-18).

export interface Dependencias {
  config: Config
  raiz: string
  sistema: string
  adaptador: AdaptadorLLM | null
  errorAdaptador?: string
  herramientas: ReadonlyMap<string, HerramientaRegistrada>
  sesiones: AlmacenSesiones
  ahora?: () => number
}

interface ServidorConIp {
  requestIP(peticion: Request): { address: string } | null
}

const esquemaChat = z
  .object({
    sessionId: z.string().min(1).max(100).optional(),
    message: z.string().trim().max(4000).optional(),
    confirmacion: z.object({ decision: z.enum(["aceptar", "descartar"]) }).optional(),
  })
  .refine((cuerpo) => (cuerpo.message ?? "") !== "" || cuerpo.confirmacion !== undefined, "Envíe un mensaje o una confirmación.")

const esquemaPendiente = z.object({
  accion: z.enum(["confirmar_campos", "enviar"]),
  caso: z.string(),
  etiquetas: z.array(z.string()),
  pregunta: z.string(),
})

function json(estado: number, cuerpo: unknown): Response {
  return Response.json(cuerpo, { status: estado })
}

function errorApi(estado: number, codigo: string, mensaje: string): Response {
  return json(estado, { ok: false, codigo, error: mensaje })
}

export function crearManejador(deps: Dependencias): (peticion: Request, servidor?: ServidorConIp) => Promise<Response> {
  const ahora = deps.ahora ?? Date.now
  const peticionesPorOrigen = new Map<string, number[]>()
  const directorioWeb = resolve(deps.raiz, "web")

  function excedeLimite(origen: string): boolean {
    const ventana = ahora() - 60_000
    const recientes = (peticionesPorOrigen.get(origen) ?? []).filter((t) => t > ventana)
    recientes.push(ahora())
    peticionesPorOrigen.set(origen, recientes)
    return recientes.length > deps.config.LIMITE_PETICIONES_POR_MINUTO
  }

  function accesoPermitido(peticion: Request): boolean {
    const esperada = deps.config.ACCESS_KEY
    if (esperada === "") return true
    const recibida = Buffer.from(peticion.headers.get("x-access-key") ?? "")
    const clave = Buffer.from(esperada)
    return recibida.length === clave.length && timingSafeEqual(recibida, clave)
  }

  async function servirEstatico(ruta: string): Promise<Response> {
    const relativa = ruta === "/" ? "index.html" : decodeURIComponent(ruta).replace(/^\/+/, "")
    const absoluta = resolve(directorioWeb, relativa)
    if (absoluta !== directorioWeb && !absoluta.startsWith(directorioWeb + sep)) return errorApi(404, "no_encontrado", "Recurso no encontrado")
    const archivo = Bun.file(absoluta)
    if (!(await archivo.exists())) return errorApi(404, "no_encontrado", "Recurso no encontrado")
    return new Response(archivo)
  }

  return async function manejar(peticion, servidor) {
    const url = new URL(peticion.url)
    const ruta = url.pathname

    if (ruta === "/api/health") return json(200, { ok: true, provider: deps.config.LLM_PROVIDER, model: deps.config.LLM_MODEL })

    if (ruta.startsWith("/api/")) {
      if (!accesoPermitido(peticion)) return errorApi(401, "acceso_denegado", "Se requiere la clave de acceso.")
      if (ruta === "/api/chat") {
        if (peticion.method !== "POST") return errorApi(405, "metodo_no_permitido", "Use POST.")
        const origen = peticion.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || servidor?.requestIP(peticion)?.address || "desconocido"
        if (excedeLimite(origen)) return errorApi(429, "limite_peticiones", "Demasiadas solicitudes. Espere un minuto e intente de nuevo.")
        return chat(peticion, deps)
      }
      const sesion = ruta.match(/^\/api\/sessions\/([^/]+)$/)
      if (sesion?.[1] !== undefined && peticion.method === "GET") return historial(deps, sesion[1])
      return errorApi(404, "no_encontrado", "Ruta no encontrada")
    }

    if (peticion.method !== "GET") return errorApi(405, "metodo_no_permitido", "Método no permitido")
    return servirEstatico(ruta)
  }
}

async function chat(peticion: Request, deps: Dependencias): Promise<Response> {
  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return errorApi(400, "solicitud_invalida", "El cuerpo debe ser JSON.")
  }
  const validado = esquemaChat.safeParse(cuerpo)
  if (!validado.success) return errorApi(400, "solicitud_invalida", validado.error.issues[0]?.message ?? "Solicitud inválida.")
  if (deps.adaptador === null) {
    return errorApi(503, "modelo_no_configurado", deps.errorAdaptador ?? "El modelo de lenguaje no está configurado.")
  }

  const { sessionId, confirmacion } = validado.data
  let sesion: Sesion | undefined
  if (sessionId !== undefined) {
    sesion = deps.sesiones.obtener(sessionId)
    if (sesion === undefined) {
      return errorApi(404, "sesion_inexistente", "La sesión ya no existe. Se iniciará una sesión nueva.")
    }
  } else sesion = deps.sesiones.crear()
  if (sesion.ocupada) return errorApi(409, "sesion_ocupada", "La sesión está procesando un mensaje. Espere la respuesta.")

  sesion.ocupada = true
  try {
    return await procesarTurno(sesion, validado.data.message ?? "", confirmacion?.decision, deps, deps.adaptador)
  } finally {
    sesion.ocupada = false
  }
}

async function procesarTurno(
  sesion: Sesion,
  mensaje: string,
  decisionBoton: "aceptar" | "descartar" | undefined,
  deps: Dependencias,
  adaptador: AdaptadorLLM,
): Promise<Response> {
  const textoUsuario = mensaje !== "" ? mensaje : decisionBoton === "aceptar" ? "Confirmo." : "Descarto."

  // La confirmación pendiente solo vale para este turno (DEC-06).
  const pendiente = sesion.pendiente
  sesion.pendiente = null
  let confirmacionUsuario: ConfirmacionUsuario | undefined
  let textoModelo = textoUsuario
  if (pendiente !== null) {
    const interpretacion: Interpretacion = decisionBoton ?? interpretarTexto(textoUsuario, pendiente.accion)
    if (interpretacion !== "ninguna") confirmacionUsuario = construirConfirmacion(pendiente, interpretacion)
    textoModelo = `${textoUsuario}\n\n[Nota del sistema] ${notaParaModelo(pendiente, interpretacion)}`
  }

  const limite = deps.config.MAX_TOKENS_SESION
  const turno = await ejecutarTurno(sesion.mensajes, textoModelo, {
    adaptador,
    herramientas: deps.herramientas,
    sistema: deps.sistema,
    ctx: { directory: deps.raiz, sessionId: sesion.id, ...(confirmacionUsuario ? { confirmacionUsuario } : {}) },
    maxIteraciones: deps.config.MAX_ITERACIONES,
    presupuestoTokens: Math.max(0, limite - totalTokens(sesion.uso)),
    herramientasConEstado: HERRAMIENTAS_CON_ESTADO,
    herramientasDeCierre: HERRAMIENTAS_DE_CIERRE,
  })

  sesion.mensajes.push(...turno.mensajesNuevos)
  sesion.uso.tokensEntrada += turno.uso.tokensEntrada
  sesion.uso.tokensSalida += turno.uso.tokensSalida
  sesion.pendiente = confirmacionSolicitada(turno.llamadas)

  let respuesta = turno.respuesta
  if (sesion.pendiente !== null && !respuesta.includes(sesion.pendiente.pregunta)) {
    respuesta = `${respuesta}\n\n${sesion.pendiente.pregunta}`.trim()
  }
  const llamadas = turno.llamadas.map(resumirLlamada)
  sesion.turnos.push({
    ts: new Date().toISOString(),
    mensaje: textoUsuario,
    respuesta,
    llamadas,
    needsConfirmation: sesion.pendiente !== null,
    uso: turno.uso,
  })

  return json(200, {
    ok: true,
    sessionId: sesion.id,
    reply: respuesta,
    toolCalls: llamadas,
    needsConfirmation: sesion.pendiente !== null,
    confirmacion: sesion.pendiente,
    archivos: archivosGenerados(turno.llamadas),
    modelo: adaptador.modelo,
    uso: indicadoresUso(adaptador.modelo, turno.uso, sesion.uso, limite),
  })
}

function confirmacionSolicitada(llamadas: LlamadaEjecutada[]): ConfirmacionPendiente | null {
  const solicitud = llamadas.filter((l) => l.ok && l.nombre === HERRAMIENTA_CONFIRMACION).at(-1)
  if (solicitud === undefined) return null
  const validado = esquemaPendiente.safeParse(solicitud.resultado)
  return validado.success ? validado.data : null
}

/** Indicadores de consumo para la interfaz (DEC-29, PRD §8 Costo). */
function indicadoresUso(modelo: string, turno: UsoTokens, sesion: UsoTokens, limite: number) {
  const usados = totalTokens(sesion)
  return {
    turno: { entrada: turno.tokensEntrada, salida: turno.tokensSalida },
    sesion: { entrada: sesion.tokensEntrada, salida: sesion.tokensSalida, usados, limite, restante: Math.max(0, limite - usados) },
    costoEstimadoUsd: { turno: estimarCostoUsd(modelo, turno), sesion: estimarCostoUsd(modelo, sesion) },
  }
}

function historial(deps: Dependencias, id: string): Response {
  const sesion = deps.sesiones.obtener(id)
  if (sesion === undefined) return errorApi(404, "sesion_inexistente", "La sesión ya no existe.")
  return json(200, {
    ok: true,
    sessionId: sesion.id,
    creada: sesion.creada,
    turnos: sesion.turnos,
    confirmacion: sesion.pendiente,
    uso: indicadoresUso(deps.config.LLM_MODEL, { tokensEntrada: 0, tokensSalida: 0 }, sesion.uso, deps.config.MAX_TOKENS_SESION).sesion,
  })
}
