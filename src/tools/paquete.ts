import { PATRON_ANTIGUEDAD_MAXIMA } from "../knowledge/reglas.ts"
import type { Maestro, Solicitud, SoporteIndice } from "./fuentes.ts"
import { type CampoMapeado, resolverRuta } from "./mapeo.ts"

// Evaluación del paquete para firma (HU-4, RN2, RN3, DEC-09, DEC-11, DEC-12).
// Funciones puras: el armado de archivos lo hace la herramienta.

export type EstadoSoporte = "vigente" | "vencido" | "ausente"

export interface SoporteEvaluado {
  tipo: string
  descripcion: string
  archivo: string | null
  vigencia_hasta: string | null
  estado: EstadoSoporte
  advertencias: string[]
}

export interface EvaluacionPaquete {
  listo_para_firma: boolean
  motivos: string[]
  formulario: "presente" | "ausente"
  soportes: SoporteEvaluado[]
  faltantes: string[]
  por_confirmar: string[]
}

export function evaluarSoportes(
  exigidos: string[],
  indice: SoporteIndice[],
  solicitud: Solicitud,
  fecha: string,
): SoporteEvaluado[] {
  const antiguedad = solicitud.cuerpo.match(PATRON_ANTIGUEDAD_MAXIMA)?.[1]
  return exigidos.map((tipo) => {
    const soporte = indice.find((s) => s.tipo === tipo)
    if (soporte === undefined) {
      return { tipo, descripcion: tipo, archivo: null, vigencia_hasta: null, estado: "ausente", advertencias: [] }
    }
    const advertencias: string[] = []
    if (tipo === "camara_comercio" && antiguedad !== undefined) {
      advertencias.push(`El cliente exige antigüedad máxima de ${antiguedad} días; verificar la fecha de expedición.`)
    }
    if (soporte.pais_emisor !== solicitud.pais) {
      advertencias.push(`Emitido en ${soporte.pais_emisor}; verificar aceptación o apostilla en ${solicitud.pais}.`)
    }
    const vencido = soporte.vigencia_hasta !== null && soporte.vigencia_hasta < fecha
    return {
      tipo,
      descripcion: soporte.descripcion || tipo,
      archivo: soporte.archivo,
      vigencia_hasta: soporte.vigencia_hasta,
      estado: vencido ? "vencido" : "vigente",
      advertencias,
    }
  })
}

export function evaluarPaquete(soportes: SoporteEvaluado[], campos: CampoMapeado[], formularioPresente: boolean): EvaluacionPaquete {
  const faltantes = campos.filter((c) => c.estado === "faltante").map((c) => c.etiqueta)
  const porConfirmar = campos.filter((c) => c.estado === "requiere_confirmacion").map((c) => c.etiqueta)
  const motivos: string[] = []
  if (!formularioPresente) motivos.push("El formulario no se ha generado.")
  for (const s of soportes) {
    if (s.estado === "ausente") motivos.push(`Soporte ausente: ${s.tipo}.`)
    if (s.estado === "vencido") motivos.push(`Soporte vencido: ${s.tipo} (vigente hasta ${s.vigencia_hasta}).`)
  }
  if (porConfirmar.length > 0) motivos.push(`Campos pendientes de confirmación: ${porConfirmar.join(", ")}.`)
  return {
    listo_para_firma: motivos.length === 0,
    motivos,
    formulario: formularioPresente ? "presente" : "ausente",
    soportes,
    faltantes,
    por_confirmar: porConfirmar,
  }
}

const ETIQUETA_ESTADO: Record<EstadoSoporte, string> = { vigente: "Vigente", vencido: "Vencido", ausente: "Ausente" }

export function redactarChecklist(evaluacion: EvaluacionPaquete, solicitud: Solicitud, fecha: string): string {
  const lista = (items: string[], vacio: string) => (items.length > 0 ? items.map((i) => `- ${i}`) : [`- ${vacio}`])
  const advertencias = evaluacion.soportes.flatMap((s) => s.advertencias.map((a) => `${s.tipo}: ${a}`))
  return [
    `# Lista de verificación: ${solicitud.cliente}`,
    "",
    `Fecha de referencia para vigencias: ${fecha}`,
    "",
    `## Estado: ${evaluacion.listo_para_firma ? "Listo para firma" : "No listo para firma"}`,
    "",
    ...lista(evaluacion.motivos, "Sin bloqueos."),
    "",
    "## Formulario",
    "",
    `- ${evaluacion.formulario === "presente" ? "Presente en el paquete" : "Ausente"}`,
    "",
    "## Soportes exigidos",
    "",
    "| Soporte | Descripción | Vigente hasta | Estado |",
    "|---|---|---|---|",
    ...evaluacion.soportes.map(
      (s) => `| ${s.tipo} | ${s.descripcion} | ${s.vigencia_hasta ?? "No aplica"} | ${ETIQUETA_ESTADO[s.estado]} |`,
    ),
    "",
    "## Campos faltantes (no bloquean la firma)",
    "",
    ...lista(evaluacion.faltantes, "Ninguno."),
    "",
    "## Campos pendientes de confirmación",
    "",
    ...lista(evaluacion.por_confirmar, "Ninguno."),
    "",
    "## Advertencias",
    "",
    ...lista(advertencias, "Ninguna."),
    "",
  ].join("\n")
}

function texto(maestro: Maestro, ruta: string, porDefecto: string): string {
  const valor = resolverRuta(maestro, ruta)
  return typeof valor === "string" && valor !== "" ? valor : porDefecto
}

/** Borrador de respuesta al cliente. Nunca incluye datos bancarios (RN2). */
export function redactarBorradorCorreo(solicitud: Solicitud, soportes: SoporteEvaluado[], maestro: Maestro): string {
  const adjuntos = soportes.filter((s) => s.estado !== "ausente").map((s) => `- ${s.descripcion}`)
  return [
    `Para: ${solicitud.de}`,
    `Asunto: RE: ${solicitud.asunto}`,
    "",
    `Buenos días, equipo de ${solicitud.cliente}:`,
    "",
    `En atención a su solicitud del ${solicitud.fecha}, remitimos el formulario de registro de proveedor de ${texto(maestro, "razon_social", "Periferia IT Group")} diligenciado y firmado por el representante legal, junto con los siguientes documentos soporte:`,
    "",
    "- Formulario de registro de proveedor",
    ...adjuntos,
    "",
    "Quedamos atentos a cualquier información adicional que requieran.",
    "",
    "Cordialmente,",
    "",
    texto(maestro, "representante_legal.nombre", "Representante legal"),
    texto(maestro, "representante_legal.cargo", ""),
    texto(maestro, "razon_social", "Periferia IT Group"),
    "",
  ].join("\n")
}
