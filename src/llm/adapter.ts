// Interfaz propia del proveedor de lenguaje (PRD §6.1).
// El ciclo del agente depende solo de estos tipos; cambiar de proveedor
// implica una nueva implementación de AdaptadorLLM, no cambios en el ciclo.

export interface DefinicionHerramienta {
  nombre: string
  descripcion: string
  /** Esquema JSON de los argumentos, derivado del esquema zod de la herramienta. */
  esquema: Record<string, unknown>
}

export interface LlamadaHerramienta {
  id: string
  nombre: string
  argumentos: unknown
}

export type BloqueMensaje =
  | { tipo: "texto"; texto: string }
  | { tipo: "llamada"; llamada: LlamadaHerramienta }
  | { tipo: "resultado"; idLlamada: string; contenido: string; esError: boolean }

export interface Mensaje {
  rol: "usuario" | "asistente"
  bloques: BloqueMensaje[]
}

export type MotivoFin = "fin_turno" | "uso_herramienta" | "limite_tokens" | "rechazo"

export interface RespuestaModelo {
  bloques: BloqueMensaje[]
  motivoFin: MotivoFin
  uso: { tokensEntrada: number; tokensSalida: number }
}

export interface AdaptadorLLM {
  readonly proveedor: string
  readonly modelo: string
  enviar(mensajes: Mensaje[], herramientas: DefinicionHerramienta[], sistema: string): Promise<RespuestaModelo>
}
