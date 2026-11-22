import type { ConfirmacionUsuario, DecisionUsuario } from "../tools/contrato.ts"
import { normalizar } from "../tools/mapeo.ts"

// Interpretación determinista de la respuesta del usuario a una confirmación
// pendiente (DEC-06, DEC-25). El modelo nunca decide si el usuario confirmó.

export interface ConfirmacionPendiente {
  accion: "confirmar_campos" | "enviar"
  caso: string
  etiquetas: string[]
  pregunta: string
}

export type Interpretacion = DecisionUsuario | "ninguna"

const AFIRMATIVAS = new Set([
  "si", "confirmo", "confirmado", "confirmar", "acepto", "aceptar", "aceptado", "adelante",
  "procede", "proceder", "ok", "okay", "dale", "correcto", "hazlo", "claro", "usalo", "usala",
])
const AFIRMATIVAS_ENVIO = new Set(["envia", "envialo", "enviar", "enviarlo"])
const NEGATIVAS = new Set([
  "no", "descarta", "descartalo", "descartala", "descartar", "rechazo", "rechazar", "cancela", "cancelar", "nunca",
])
const FRASES_AFIRMATIVAS = ["de acuerdo"]
const MAX_PALABRAS_AFIRMATIVA = 8

/**
 * Una respuesta es afirmativa solo si es corta, empieza por una expresión afirmativa
 * y no contiene negaciones. Es negativa si empieza por una negación. Lo demás no confirma.
 */
export function interpretarTexto(texto: string, accion: ConfirmacionPendiente["accion"]): Interpretacion {
  const normalizado = normalizar(texto)
  const palabras = normalizado.split(" ").filter((p) => p !== "")
  const primera = palabras[0]
  if (primera === undefined) return "ninguna"
  if (NEGATIVAS.has(primera)) return "descartar"

  const afirmativa =
    AFIRMATIVAS.has(primera) ||
    (accion === "enviar" && AFIRMATIVAS_ENVIO.has(primera)) ||
    FRASES_AFIRMATIVAS.some((frase) => normalizado.startsWith(frase))
  const contieneNegacion = palabras.some((p) => NEGATIVAS.has(p))
  if (afirmativa && !contieneNegacion && palabras.length <= MAX_PALABRAS_AFIRMATIVA) return "aceptar"
  return "ninguna"
}

/** Confirmación que recibe la herramienta en ctx. Solo existe si el usuario confirmó (envío) o decidió (campos). */
export function construirConfirmacion(pendiente: ConfirmacionPendiente, decision: DecisionUsuario): ConfirmacionUsuario | undefined {
  if (pendiente.accion === "enviar") return decision === "aceptar" ? { accion: "enviar", caso: pendiente.caso } : undefined
  return {
    accion: "confirmar_campos",
    caso: pendiente.caso,
    etiquetas: pendiente.etiquetas,
    decisiones: Object.fromEntries(pendiente.etiquetas.map((etiqueta) => [etiqueta, decision])),
  }
}

/** Nota que acompaña el mensaje del usuario para que el modelo aplique lo que el backend ya decidió. */
export function notaParaModelo(pendiente: ConfirmacionPendiente, interpretacion: Interpretacion): string {
  const { caso, etiquetas } = pendiente
  if (pendiente.accion === "confirmar_campos") {
    if (interpretacion === "ninguna") {
      return `La respuesta no es una decisión inequívoca sobre ${etiquetas.join(", ")} del caso ${caso}; la confirmación pendiente se anuló. Si corresponde, vuelva a solicitarla con agente_solicitar_confirmacion.`
    }
    const confirmaciones = etiquetas.map((e) => `{ etiqueta: "${e}", decision: "${interpretacion}" }`).join(", ")
    return `El usuario decidió "${interpretacion}" para ${etiquetas.join(", ")} del caso ${caso}. Aplique la decisión con proveedor_generar_formulario (mapeo.confirmaciones = [${confirmaciones}]) y luego vuelva a armar el paquete.`
  }
  if (interpretacion === "aceptar") {
    return `El usuario confirmó el envío del caso ${caso}. Llame a proveedor_simular_envio con confirmado = true e informe la ruta del archivo.`
  }
  if (interpretacion === "descartar") return `El usuario no autorizó el envío del caso ${caso}. No llame a proveedor_simular_envio.`
  return `La respuesta no es una confirmación inequívoca del envío del caso ${caso}; la confirmación pendiente se anuló. No llame a proveedor_simular_envio sin volver a solicitarla.`
}
