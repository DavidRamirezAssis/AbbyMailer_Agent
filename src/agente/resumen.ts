import type { LlamadaEjecutada } from "./ciclo.ts"
import type { LlamadaResumida } from "./sesiones.ts"

// Resumen legible de cada llamada para el historial visible del chat (PRD §6.1, HU-15).

function campo(objeto: unknown, clave: string): unknown {
  return typeof objeto === "object" && objeto !== null ? (objeto as Record<string, unknown>)[clave] : undefined
}

function largo(valor: unknown): number {
  return Array.isArray(valor) ? valor.length : 0
}

function resumirExito(nombre: string, data: unknown): string {
  switch (nombre) {
    case "proveedor_leer_solicitud":
      return `${String(campo(data, "cliente"))} (${String(campo(data, "pais"))}); formato ${String(campo(data, "formato"))}; ${largo(campo(data, "campos"))} campos; ${largo(campo(data, "soportes"))} soportes`
    case "proveedor_mapear_campos":
      return `${largo(campo(data, "llenos"))} llenos, ${largo(campo(data, "faltantes"))} faltantes, ${largo(campo(data, "requiere_confirmacion"))} por confirmar`
    case "proveedor_generar_formulario":
      return `Formulario generado: ${String(campo(data, "ruta"))}`
    case "proveedor_armar_paquete": {
      const motivos = campo(campo(data, "checklist"), "motivos")
      return campo(data, "listo_para_firma") === true
        ? "Paquete listo para firma"
        : `Paquete no listo para firma (${largo(motivos)} motivos)`
    }
    case "proveedor_simular_envio":
      return `Envío simulado: ${String(campo(data, "ruta"))}`
    case "agente_solicitar_confirmacion":
      return `Confirmación solicitada: ${String(campo(data, "accion"))}`
    default:
      return "Correcto"
  }
}

export function resumirLlamada(llamada: LlamadaEjecutada): LlamadaResumida {
  return {
    id: llamada.id,
    nombre: llamada.nombre,
    argumentos: llamada.argumentos,
    ok: llamada.ok,
    resumen: llamada.ok ? resumirExito(llamada.nombre, llamada.resultado) : String(llamada.resultado),
  }
}

/** Rutas de archivos generados que el front puede ofrecer para descarga (HU-18). */
export function archivosGenerados(llamadas: LlamadaEjecutada[]): string[] {
  const rutas = llamadas
    .filter((l) => l.ok && ["proveedor_generar_formulario", "proveedor_armar_paquete", "proveedor_simular_envio"].includes(l.nombre))
    .map((l) => campo(l.resultado, "ruta"))
    .filter((r): r is string => typeof r === "string")
  return [...new Set(rutas)]
}
