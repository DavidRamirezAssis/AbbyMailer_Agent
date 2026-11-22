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
        : `Paquete no listo para firma (${largo(motivos)} ${largo(motivos) === 1 ? "motivo" : "motivos"})`
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

function etiquetasDe(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : []
}

/**
 * Resumen de respaldo construido solo con resultados de herramientas (CA2). Se usa cuando
 * el modelo cierra el turno con una confirmación sin escribir el resumen (PRD §11, HU-17).
 */
export function resumenDeterminista(llamadas: LlamadaEjecutada[]): string {
  const ultima = (nombre: string) => llamadas.filter((l) => l.ok && l.nombre === nombre).at(-1)?.resultado
  const paquete = ultima("proveedor_armar_paquete")
  if (paquete === undefined) return ""
  const mapeo = ultima("proveedor_mapear_campos")
  const checklist = campo(paquete, "checklist")
  const faltantes = etiquetasDe(campo(checklist, "faltantes"))
  const porConfirmar = etiquetasDe(campo(checklist, "por_confirmar"))
  const motivos = etiquetasDe(campo(checklist, "motivos"))
  const ruta = String(campo(paquete, "ruta") ?? "").replace(/\/paquete$/, "")
  const lineas = ["Resumen del caso:"]
  if (mapeo !== undefined) lineas.push(`- Campos llenos: ${largo(campo(mapeo, "llenos"))}.`)
  lineas.push(`- Campos faltantes: ${faltantes.length > 0 ? faltantes.join(", ") : "ninguno"}.`)
  lineas.push(`- Campos por confirmar: ${porConfirmar.length > 0 ? porConfirmar.join(", ") : "ninguno"}.`)
  lineas.push(campo(paquete, "listo_para_firma") === true ? "- Paquete: listo para firma." : `- Paquete: no listo para firma. ${motivos.join(" ")}`)
  if (ruta !== "") lineas.push(`- Archivos: ${ruta}/`)
  return lineas.join("\n")
}

/** Rutas de archivos generados que el front puede ofrecer para descarga (HU-18). */
export function archivosGenerados(llamadas: LlamadaEjecutada[]): string[] {
  const rutas = llamadas
    .filter((l) => l.ok && ["proveedor_generar_formulario", "proveedor_armar_paquete", "proveedor_simular_envio"].includes(l.nombre))
    .map((l) => campo(l.resultado, "ruta"))
    .filter((r): r is string => typeof r === "string")
  return [...new Set(rutas)]
}
