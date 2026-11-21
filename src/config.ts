import { z } from "zod"

// Configuración del backend leída de variables de entorno y validada al arrancar.
// Ningún secreto se expone fuera de este módulo (PRD §8 Seguridad).

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/

const esquemaConfig = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  FECHA_REFERENCIA: z
    .string()
    .default("")
    .refine((valor) => valor === "" || FECHA_ISO.test(valor), "FECHA_REFERENCIA debe tener formato AAAA-MM-DD"),
  LLM_PROVIDER: z.string().min(1).default("anthropic"),
  LLM_MODEL: z.string().min(1).default("claude-haiku-5-5"),
  LLM_EFFORT: z.enum(["low", "medium", "high"]).default("low"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  MAX_ITERACIONES: z.coerce.number().int().positive().default(25),
  MAX_TOKENS_SESION: z.coerce.number().int().positive().default(90000),
  LIMITE_PETICIONES_POR_MINUTO: z.coerce.number().int().positive().default(20),
  ACCESS_KEY: z.string().default(""),
})

export type Config = z.infer<typeof esquemaConfig>

export function cargarConfig(entorno: Record<string, string | undefined> = process.env): Config {
  const resultado = esquemaConfig.safeParse(entorno)
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Configuración inválida: ${detalle}`)
  }
  return resultado.data
}

/** Fecha (AAAA-MM-DD) contra la que se evalúan las vigencias (DEC-02). */
export function fechaReferencia(config: Config, hoy: Date = new Date()): string {
  if (config.FECHA_REFERENCIA !== "") return config.FECHA_REFERENCIA
  const mes = String(hoy.getMonth() + 1).padStart(2, "0")
  const dia = String(hoy.getDate()).padStart(2, "0")
  return `${hoy.getFullYear()}-${mes}-${dia}`
}
