import type { Mensaje, UsoTokens } from "../llm/adapter.ts"
import type { ConfirmacionPendiente } from "./confirmacion.ts"

// Sesiones en memoria (PRD §6.1 L154). Un reinicio las borra (DEC-27).

export interface LlamadaResumida {
  id: string
  nombre: string
  argumentos: unknown
  ok: boolean
  resumen: string
}

export interface TurnoRegistrado {
  ts: string
  mensaje: string
  respuesta: string
  llamadas: LlamadaResumida[]
  needsConfirmation: boolean
  uso: UsoTokens
}

export interface Sesion {
  id: string
  creada: string
  mensajes: Mensaje[]
  pendiente: ConfirmacionPendiente | null
  uso: UsoTokens
  turnos: TurnoRegistrado[]
  ocupada: boolean
}

const MAX_SESIONES = 200

export class AlmacenSesiones {
  private readonly sesiones = new Map<string, Sesion>()

  constructor(private readonly maximo = MAX_SESIONES) {}

  crear(): Sesion {
    if (this.sesiones.size >= this.maximo) {
      // Se descarta la sesión más antigua para acotar la memoria.
      const masAntigua = this.sesiones.keys().next().value
      if (masAntigua !== undefined) this.sesiones.delete(masAntigua)
    }
    const sesion: Sesion = {
      id: crypto.randomUUID(),
      creada: new Date().toISOString(),
      mensajes: [],
      pendiente: null,
      uso: { tokensEntrada: 0, tokensSalida: 0 },
      turnos: [],
      ocupada: false,
    }
    this.sesiones.set(sesion.id, sesion)
    return sesion
  }

  obtener(id: string): Sesion | undefined {
    return this.sesiones.get(id)
  }
}

export function totalTokens(uso: UsoTokens): number {
  return uso.tokensEntrada + uso.tokensSalida
}
