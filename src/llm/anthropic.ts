import Anthropic from "@anthropic-ai/sdk"
import {
  type AdaptadorLLM,
  type BloqueMensaje,
  type DefinicionHerramienta,
  ErrorProveedorLLM,
  type Mensaje,
  type MotivoFin,
  type RespuestaModelo,
} from "./adapter.ts"

// Implementación del adaptador para Anthropic (DEC-21: Claude Haiku 5.5).

const PROVEEDOR = "anthropic"
const MAX_TOKENS_RESPUESTA = 16000

export interface OpcionesAnthropic {
  apiKey: string
  modelo: string
  esfuerzo: "low" | "medium" | "high"
  tiempoMaximoMs: number
}

export class AdaptadorAnthropic implements AdaptadorLLM {
  readonly proveedor = PROVEEDOR
  readonly modelo: string
  private readonly cliente: Anthropic
  private readonly esfuerzo: OpcionesAnthropic["esfuerzo"]

  constructor(opciones: OpcionesAnthropic) {
    this.modelo = opciones.modelo
    this.esfuerzo = opciones.esfuerzo
    this.cliente = new Anthropic({ apiKey: opciones.apiKey, timeout: opciones.tiempoMaximoMs, maxRetries: 1 })
  }

  async enviar(mensajes: Mensaje[], herramientas: DefinicionHerramienta[], sistema: string): Promise<RespuestaModelo> {
    let respuesta: Anthropic.Message
    try {
      respuesta = await this.cliente.messages.create({
        model: this.modelo,
        max_tokens: MAX_TOKENS_RESPUESTA,
        // Caché automática del prefijo estable (prompt de sistema y herramientas).
        cache_control: { type: "ephemeral" },
        system: sistema,
        tools: herramientas.map(aHerramientaAnthropic),
        output_config: { effort: this.esfuerzo },
        messages: mensajes.map(aMensajeAnthropic),
      })
    } catch (error) {
      throw traducirError(error)
    }
    return {
      mensaje: { rol: "asistente", bloques: aBloques(respuesta.content), nativo: { proveedor: PROVEEDOR, contenido: respuesta.content } },
      motivoFin: aMotivoFin(respuesta.stop_reason),
      uso: { tokensEntrada: totalEntrada(respuesta.usage), tokensSalida: respuesta.usage.output_tokens },
    }
  }
}

function aHerramientaAnthropic(definicion: DefinicionHerramienta): Anthropic.Tool {
  return {
    name: definicion.nombre,
    description: definicion.descripcion,
    input_schema: definicion.esquema as Anthropic.Tool.InputSchema,
    strict: true,
  }
}

function aMensajeAnthropic(mensaje: Mensaje): Anthropic.MessageParam {
  if (mensaje.rol === "asistente" && mensaje.nativo?.proveedor === PROVEEDOR && Array.isArray(mensaje.nativo.contenido)) {
    // El turno del asistente se reenvía tal como lo devolvió la API (incluye razonamiento).
    return { role: "assistant", content: mensaje.nativo.contenido as Anthropic.ContentBlockParam[] }
  }
  const contenido: Anthropic.ContentBlockParam[] = mensaje.bloques.map((bloque) => {
    switch (bloque.tipo) {
      case "texto":
        return { type: "text", text: bloque.texto }
      case "llamada":
        return { type: "tool_use", id: bloque.llamada.id, name: bloque.llamada.nombre, input: bloque.llamada.argumentos }
      case "resultado":
        return { type: "tool_result", tool_use_id: bloque.idLlamada, content: bloque.contenido, is_error: bloque.esError }
    }
  })
  return { role: mensaje.rol === "usuario" ? "user" : "assistant", content: contenido }
}

function aBloques(contenido: Anthropic.ContentBlock[]): BloqueMensaje[] {
  const bloques: BloqueMensaje[] = []
  for (const bloque of contenido) {
    if (bloque.type === "text") bloques.push({ tipo: "texto", texto: bloque.text })
    else if (bloque.type === "tool_use") {
      bloques.push({ tipo: "llamada", llamada: { id: bloque.id, nombre: bloque.name, argumentos: bloque.input } })
    }
  }
  return bloques
}

function aMotivoFin(motivo: Anthropic.Message["stop_reason"]): MotivoFin {
  switch (motivo) {
    case "tool_use":
      return "uso_herramienta"
    case "max_tokens":
      return "limite_tokens"
    case "refusal":
      return "rechazo"
    default:
      return "fin_turno"
  }
}

function totalEntrada(uso: Anthropic.Usage): number {
  return uso.input_tokens + (uso.cache_creation_input_tokens ?? 0) + (uso.cache_read_input_tokens ?? 0)
}

function traducirError(error: unknown): ErrorProveedorLLM {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return new ErrorProveedorLLM("tiempo_agotado")
  if (error instanceof Anthropic.APIConnectionError) return new ErrorProveedorLLM("conexion")
  if (error instanceof Anthropic.RateLimitError) return new ErrorProveedorLLM("limite_uso")
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new ErrorProveedorLLM("autenticacion")
  }
  if (error instanceof Anthropic.BadRequestError) return new ErrorProveedorLLM("solicitud_invalida")
  if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500) return new ErrorProveedorLLM("no_disponible")
  return new ErrorProveedorLLM("desconocido")
}
