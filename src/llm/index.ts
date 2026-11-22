import type { Config } from "../config.ts"
import type { AdaptadorLLM } from "./adapter.ts"
import { AdaptadorAnthropic } from "./anthropic.ts"

// Selección del adaptador según LLM_PROVIDER. Agregar un proveedor es agregar
// un caso aquí y su implementación; el ciclo del agente no cambia (PRD §6.1).

export function crearAdaptador(config: Config, entorno: Record<string, string | undefined> = process.env): AdaptadorLLM {
  switch (config.LLM_PROVIDER) {
    case "anthropic": {
      const apiKey = entorno.ANTHROPIC_API_KEY?.trim() ?? ""
      if (apiKey === "") throw new Error("Falta ANTHROPIC_API_KEY en las variables de entorno del backend.")
      return new AdaptadorAnthropic({
        apiKey,
        modelo: config.LLM_MODEL,
        esfuerzo: config.LLM_EFFORT,
        tiempoMaximoMs: config.LLM_TIMEOUT_MS,
      })
    }
    default:
      throw new Error(`Proveedor de lenguaje no soportado: ${config.LLM_PROVIDER}.`)
  }
}
