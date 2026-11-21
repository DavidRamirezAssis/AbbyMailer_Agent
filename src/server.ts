import { resolve, sep } from "node:path"
import { cargarConfig } from "./config.ts"

// Servidor HTTP: sirve el front y la API desde una sola URL (DEC-18).
// Estado: andamiaje. El endpoint de chat y el ciclo del agente se agregan según DEC-20.

const config = cargarConfig()
const DIRECTORIO_WEB = resolve(import.meta.dir, "..", "web")

function respuestaError(estado: number, mensaje: string): Response {
  return Response.json({ ok: false, error: mensaje }, { status: estado })
}

async function servirEstatico(ruta: string): Promise<Response> {
  const relativa = ruta === "/" ? "index.html" : ruta.replace(/^\/+/, "")
  const absoluta = resolve(DIRECTORIO_WEB, relativa)
  if (absoluta !== DIRECTORIO_WEB && !absoluta.startsWith(DIRECTORIO_WEB + sep)) {
    return respuestaError(404, "Recurso no encontrado")
  }
  const archivo = Bun.file(absoluta)
  if (!(await archivo.exists())) return respuestaError(404, "Recurso no encontrado")
  return new Response(archivo)
}

const servidor = Bun.serve({
  port: config.PORT,
  async fetch(peticion) {
    const url = new URL(peticion.url)
    if (url.pathname === "/api/health") {
      return Response.json({ ok: true, provider: config.LLM_PROVIDER, model: config.LLM_MODEL })
    }
    if (url.pathname.startsWith("/api/")) return respuestaError(404, "Ruta no encontrada")
    if (peticion.method !== "GET") return respuestaError(405, "Método no permitido")
    return servirEstatico(url.pathname)
  },
})

console.log(`Servidor escuchando en http://localhost:${servidor.port}`)
