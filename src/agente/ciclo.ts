import { z } from "zod"
import {
  type AdaptadorLLM,
  type BloqueMensaje,
  ErrorProveedorLLM,
  type LlamadaHerramienta,
  type Mensaje,
  type UsoTokens,
} from "../llm/adapter.ts"
import type { ContextoHerramienta } from "../tools/contrato.ts"
import type { HerramientaRegistrada } from "../tools/index.ts"
import { definicionesDesde } from "./definiciones.ts"

// Ciclo del agente para un turno (PRD §6.3): prompt -> modelo -> herramientas -> respuesta.
// CA1 tope de iteraciones; CA5 errores del proveedor en lenguaje claro sin terminar la sesión;
// PRD §6.2 validación de argumentos antes de ejecutar; DEC-28 gancho previo contra repeticiones.

export interface OpcionesTurno {
  adaptador: AdaptadorLLM
  herramientas: ReadonlyMap<string, HerramientaRegistrada>
  sistema: string
  ctx: ContextoHerramienta
  maxIteraciones: number
  /** Tokens que la sesión todavía puede consumir (PRD §8 Costo). */
  presupuestoTokens: number
  /** Herramientas que modifican el estado del caso; las demás se consideran de solo lectura. */
  herramientasConEstado?: ReadonlySet<string>
  /** Herramientas que, al ejecutarse con éxito, cierran el turno sin volver al modelo. */
  herramientasDeCierre?: ReadonlySet<string>
}

export interface LlamadaEjecutada {
  id: string
  nombre: string
  argumentos: unknown
  ok: boolean
  resultado: unknown
}

export type MotivoCierre =
  | "respuesta"
  | "herramienta_de_cierre"
  | "tope_iteraciones"
  | "presupuesto_tokens"
  | "limite_respuesta"
  | "rechazo_modelo"
  | "error_proveedor"

export interface ResultadoTurno {
  respuesta: string
  llamadas: LlamadaEjecutada[]
  mensajesNuevos: Mensaje[]
  uso: UsoTokens
  motivo: MotivoCierre
}

const MENSAJE_RECHAZO = "El modelo no pudo atender esta solicitud. Reformule el mensaje o indique el caso a procesar."
const MENSAJE_PRESUPUESTO =
  "Esta sesión alcanzó su límite de uso del modelo. Inicie una sesión nueva para continuar; los archivos generados se conservan."

interface EstadoTurno {
  version: number
  ejecutadas: Map<string, number>
}

export async function ejecutarTurno(historial: Mensaje[], textoUsuario: string, opciones: OpcionesTurno): Promise<ResultadoTurno> {
  const mensajeUsuario: Mensaje = { rol: "usuario", bloques: [{ tipo: "texto", texto: textoUsuario }] }
  const mensajes = [...historial, mensajeUsuario]
  const nuevos: Mensaje[] = [mensajeUsuario]
  const llamadas: LlamadaEjecutada[] = []
  const uso: UsoTokens = { tokensEntrada: 0, tokensSalida: 0 }
  const definiciones = definicionesDesde(opciones.herramientas)
  const estado: EstadoTurno = { version: 0, ejecutadas: new Map() }
  let ultimoTexto = ""

  const cerrar = (motivo: MotivoCierre, respuesta: string): ResultadoTurno => ({
    respuesta,
    llamadas,
    mensajesNuevos: nuevos,
    uso,
    motivo,
  })

  for (let iteracion = 0; ; iteracion++) {
    if (iteracion >= opciones.maxIteraciones) return cerrar("tope_iteraciones", resumenTope(opciones.maxIteraciones, llamadas))
    if (uso.tokensEntrada + uso.tokensSalida >= opciones.presupuestoTokens) return cerrar("presupuesto_tokens", MENSAJE_PRESUPUESTO)

    let respuesta
    try {
      respuesta = await opciones.adaptador.enviar(mensajes, definiciones, opciones.sistema)
    } catch (error) {
      const mensaje = error instanceof ErrorProveedorLLM ? error.message : new ErrorProveedorLLM("desconocido").message
      return cerrar("error_proveedor", mensaje)
    }

    uso.tokensEntrada += respuesta.uso.tokensEntrada
    uso.tokensSalida += respuesta.uso.tokensSalida
    mensajes.push(respuesta.mensaje)
    nuevos.push(respuesta.mensaje)
    const texto = textoDe(respuesta.mensaje.bloques)
    if (texto !== "") ultimoTexto = texto

    if (respuesta.motivoFin === "rechazo") return cerrar("rechazo_modelo", MENSAJE_RECHAZO)
    if (respuesta.motivoFin === "limite_tokens") {
      return cerrar("limite_respuesta", `${ultimoTexto}\n\n(La respuesta se interrumpió por su extensión. Escriba "continúa" para seguir.)`.trim())
    }
    if (respuesta.motivoFin !== "uso_herramienta") return cerrar("respuesta", ultimoTexto)

    const { resultados, cierra } = await ejecutarLlamadas(llamadasDe(respuesta.mensaje.bloques), opciones, estado, llamadas)
    const mensajeResultados: Mensaje = { rol: "usuario", bloques: resultados }
    mensajes.push(mensajeResultados)
    nuevos.push(mensajeResultados)
    if (cierra) return cerrar("herramienta_de_cierre", ultimoTexto)
  }
}

async function ejecutarLlamadas(
  pendientes: LlamadaHerramienta[],
  opciones: OpcionesTurno,
  estado: EstadoTurno,
  registro: LlamadaEjecutada[],
): Promise<{ resultados: BloqueMensaje[]; cierra: boolean }> {
  const resultados: BloqueMensaje[] = []
  let cierra = false
  for (const llamada of pendientes) {
    // Toda llamada recibe un resultado, aunque el turno ya se haya cerrado.
    const contenido = cierra
      ? fallo("El turno ya se cerró para esperar la respuesta del usuario; esta llamada no se ejecutó.")
      : await ejecutarLlamada(llamada, opciones, estado)
    const interpretado = interpretar(contenido)
    registro.push({ id: llamada.id, nombre: llamada.nombre, argumentos: llamada.argumentos, ok: interpretado.ok, resultado: interpretado.cuerpo })
    resultados.push({ tipo: "resultado", idLlamada: llamada.id, contenido, esError: !interpretado.ok })
    if (interpretado.ok && opciones.herramientasDeCierre?.has(llamada.nombre)) cierra = true
  }
  return { resultados, cierra }
}

async function ejecutarLlamada(llamada: LlamadaHerramienta, opciones: OpcionesTurno, estado: EstadoTurno): Promise<string> {
  const herramienta = opciones.herramientas.get(llamada.nombre)
  if (herramienta === undefined) return fallo(`La herramienta "${llamada.nombre}" no existe.`)

  const validacion = z.object(herramienta.args).safeParse(llamada.argumentos)
  if (!validacion.success) {
    const detalle = validacion.error.issues.map((i) => `${i.path.join(".") || "argumentos"}: ${i.message}`).join("; ")
    return fallo(`Argumentos inválidos para ${llamada.nombre}: ${detalle}. Corrija la llamada.`)
  }

  // Gancho previo (DEC-28): la misma llamada sin cambios de estado de por medio no se repite.
  const clave = `${llamada.nombre}:${JSON.stringify(validacion.data)}`
  if (estado.ejecutadas.get(clave) === estado.version) {
    return fallo(`La llamada a ${llamada.nombre} ya se ejecutó en este turno con los mismos argumentos y el estado no cambió. Use el resultado anterior.`)
  }

  let contenido: string
  try {
    contenido = await herramienta.execute(validacion.data, opciones.ctx)
  } catch {
    contenido = fallo(`Ocurrió un error inesperado al ejecutar ${llamada.nombre}.`)
  }
  if (interpretar(contenido).ok && opciones.herramientasConEstado?.has(llamada.nombre)) estado.version++
  estado.ejecutadas.set(clave, estado.version)
  return contenido
}

function textoDe(bloques: BloqueMensaje[]): string {
  return bloques
    .filter((b): b is Extract<BloqueMensaje, { tipo: "texto" }> => b.tipo === "texto")
    .map((b) => b.texto)
    .join("\n")
    .trim()
}

function llamadasDe(bloques: BloqueMensaje[]): LlamadaHerramienta[] {
  return bloques.filter((b): b is Extract<BloqueMensaje, { tipo: "llamada" }> => b.tipo === "llamada").map((b) => b.llamada)
}

function fallo(error: string): string {
  return JSON.stringify({ ok: false, error })
}

function interpretar(contenido: string): { ok: boolean; cuerpo: unknown } {
  try {
    const valor: unknown = JSON.parse(contenido)
    if (typeof valor === "object" && valor !== null && "ok" in valor) {
      const { ok, data, error } = valor as { ok: unknown; data?: unknown; error?: unknown }
      return { ok: ok === true, cuerpo: ok === true ? data : error }
    }
  } catch {
    // Un resultado que no es JSON se trata como error.
  }
  return { ok: false, cuerpo: "Resultado ilegible." }
}

/** CA1: al alcanzar el tope se responde con lo obtenido y lo que falta, sin otra llamada al modelo. */
function resumenTope(maximo: number, llamadas: LlamadaEjecutada[]): string {
  const exitosas = [...new Set(llamadas.filter((l) => l.ok).map((l) => l.nombre))]
  const fallidas = [...new Set(llamadas.filter((l) => !l.ok).map((l) => l.nombre))]
  const lineas = [`Se alcanzó el límite de ${maximo} pasos para este mensaje.`]
  lineas.push(exitosas.length > 0 ? `Completado: ${exitosas.join(", ")}.` : "No se completó ninguna acción.")
  if (fallidas.length > 0) lineas.push(`Con errores: ${fallidas.join(", ")}.`)
  lineas.push('Escriba "continúa" para retomar desde este punto.')
  return lineas.join(" ")
}
