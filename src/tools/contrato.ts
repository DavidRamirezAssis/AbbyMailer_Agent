import type { z } from "zod"

// Contrato común de las herramientas (PRD §6.2).
// Cada herramienta expone description, args (zod) y execute, que nunca lanza.

/** Confirmación humana validada por el backend para el turno en curso (DEC-06). */
export interface ConfirmacionUsuario {
  accion: "confirmar_campos" | "enviar"
  caso: string
  etiquetas?: string[]
}

export interface ContextoHerramienta {
  /** Raíz del proyecto; las rutas se resuelven desde aquí, nunca absolutas. */
  directory: string
  sessionId: string
  /** Solo presente cuando el usuario confirmó en el turno inmediatamente anterior (RN4). */
  confirmacionUsuario?: ConfirmacionUsuario
}

export type ResultadoHerramienta<T> = { ok: true; data: T } | { ok: false; error: string }

export interface Herramienta<Args extends z.ZodRawShape> {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, ctx: ContextoHerramienta): Promise<string>
}

/** Identidad tipada: conserva la inferencia de los argumentos de cada herramienta. */
export function definirHerramienta<Args extends z.ZodRawShape>(herramienta: Herramienta<Args>): Herramienta<Args> {
  return herramienta
}

export function exito<T>(data: T): string {
  const resultado: ResultadoHerramienta<T> = { ok: true, data }
  return JSON.stringify(resultado)
}

export function fallo(error: string): string {
  const resultado: ResultadoHerramienta<never> = { ok: false, error }
  return JSON.stringify(resultado)
}
