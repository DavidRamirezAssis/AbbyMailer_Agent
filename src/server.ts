import { resolve } from "node:path"
import { cargarPromptSistema } from "./agente/prompt.ts"
import { AlmacenSesiones } from "./agente/sesiones.ts"
import { crearManejador } from "./api/app.ts"
import { cargarConfig } from "./config.ts"
import type { AdaptadorLLM } from "./llm/adapter.ts"
import { crearAdaptador } from "./llm/index.ts"
import { herramientas } from "./tools/index.ts"

// Punto de entrada: una sola URL para el front y la API (DEC-18).

const config = cargarConfig()
const raiz = resolve(import.meta.dir, "..")
const sistema = await cargarPromptSistema(raiz)

// Sin clave del modelo el servicio arranca igual: /api/health responde y el chat informa el problema.
let adaptador: AdaptadorLLM | null = null
let errorAdaptador: string | undefined
try {
  adaptador = crearAdaptador(config)
} catch (error) {
  errorAdaptador = error instanceof Error ? error.message : "El modelo de lenguaje no está configurado."
}

const servidor = Bun.serve({
  port: config.PORT,
  // Un turno del agente puede tardar decenas de segundos; el valor por defecto de Bun es 10 s.
  idleTimeout: 255,
  fetch: crearManejador({ config, raiz, sistema, adaptador, ...(errorAdaptador ? { errorAdaptador } : {}), herramientas, sesiones: new AlmacenSesiones() }),
})

console.log(`Servidor escuchando en http://localhost:${servidor.port}`)
if (errorAdaptador) console.warn(`Chat deshabilitado: ${errorAdaptador}`)
