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

/**
 * Contenido original del proveedor para un turno del asistente. Algunos
 * proveedores exigen reenviar el turno sin cambios (por ejemplo, con bloques
 * de razonamiento). El ciclo lo conserva sin interpretarlo.
 */
export interface ContenidoNativo {
  proveedor: string
  contenido: unknown
}

export interface Mensaje {
  rol: "usuario" | "asistente"
  bloques: BloqueMensaje[]
  nativo?: ContenidoNativo
}

export type MotivoFin = "fin_turno" | "uso_herramienta" | "limite_tokens" | "rechazo"

export interface UsoTokens {
  tokensEntrada: number
  tokensSalida: number
}

export interface RespuestaModelo {
  mensaje: Mensaje
  motivoFin: MotivoFin
  uso: UsoTokens
}

export interface AdaptadorLLM {
  readonly proveedor: string
  readonly modelo: string
  enviar(mensajes: Mensaje[], herramientas: DefinicionHerramienta[], sistema: string): Promise<RespuestaModelo>
}

export type TipoErrorProveedor =
  | "tiempo_agotado"
  | "limite_uso"
  | "autenticacion"
  | "no_disponible"
  | "solicitud_invalida"
  | "conexion"
  | "desconocido"

const MENSAJES_ERROR: Record<TipoErrorProveedor, string> = {
  tiempo_agotado: "El modelo de lenguaje tardó demasiado en responder. Intente de nuevo en unos segundos.",
  limite_uso: "El modelo de lenguaje alcanzó su límite de uso momentáneo. Espere un minuto e intente de nuevo.",
  autenticacion: "El servicio no pudo autenticarse con el proveedor del modelo. Revise la configuración de la clave.",
  no_disponible: "El proveedor del modelo no está disponible en este momento. Intente de nuevo más tarde.",
  solicitud_invalida: "El proveedor del modelo rechazó la solicitud. La sesión sigue activa; intente reformular el mensaje.",
  conexion: "No fue posible conectar con el proveedor del modelo. Verifique la conexión e intente de nuevo.",
  desconocido: "Ocurrió un error inesperado con el proveedor del modelo. Intente de nuevo.",
}

/** Error del proveedor traducido a lenguaje claro (CA5, HU-14). Nunca expone claves ni trazas. */
export class ErrorProveedorLLM extends Error {
  readonly tipo: TipoErrorProveedor

  constructor(tipo: TipoErrorProveedor) {
    super(MENSAJES_ERROR[tipo])
    this.name = "ErrorProveedorLLM"
    this.tipo = tipo
  }
}
