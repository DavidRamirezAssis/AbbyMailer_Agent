import ExcelJS from "exceljs"
import { PDFDocument, type PDFFont, type PDFPage, StandardFonts, rgb } from "pdf-lib"
import type { CampoPlantilla, CeldaPlantilla, Solicitud } from "./fuentes.ts"
import type { CampoMapeado } from "./mapeo.ts"

// Generadores de salida por formato (HU-3, DEC-14, DEC-17, DEC-07).
// Reciben campos ya resueltos desde el maestro; no deciden valores.

const RELLENO_FALTANTE = "FFF8CECC"
const RELLENO_POR_CONFIRMAR = "FFFFF2CC"
const NOTA_FALTANTE = "Faltante: no existe en el repositorio maestro."
const NOTA_POR_CONFIRMAR = "Pendiente de confirmación por la analista."

function indexar(campos: CampoMapeado[]): Map<string, CampoMapeado> {
  return new Map(campos.map((c) => [c.etiqueta, c]))
}

function columnaDe(celda: string): string {
  return celda.replace(/\d+$/, "")
}

export async function generarXlsx(celdas: CeldaPlantilla[], campos: CampoMapeado[], destino: string): Promise<void> {
  const porEtiqueta = indexar(campos)
  const libro = new ExcelJS.Workbook()
  libro.creator = "Asistente de registro"

  for (const ubicacion of celdas) {
    const hoja = libro.getWorksheet(ubicacion.hoja) ?? libro.addWorksheet(ubicacion.hoja)
    const etiqueta = hoja.getCell(ubicacion.celda_etiqueta)
    etiqueta.value = ubicacion.etiqueta
    etiqueta.font = { bold: true }
    hoja.getColumn(columnaDe(ubicacion.celda_etiqueta)).width = 36
    hoja.getColumn(columnaDe(ubicacion.celda_valor)).width = 48

    const celda = hoja.getCell(ubicacion.celda_valor)
    const campo = porEtiqueta.get(ubicacion.etiqueta)
    if (campo === undefined || campo.estado === "faltante" || campo.valor === null) {
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: RELLENO_FALTANTE } }
      celda.note = NOTA_FALTANTE
      continue
    }
    if (typeof campo.valor === "string") celda.numFmt = "@"
    celda.value = campo.valor
    if (campo.estado === "requiere_confirmacion") {
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: RELLENO_POR_CONFIRMAR } }
      celda.note = campo.nota ? `${NOTA_POR_CONFIRMAR} ${campo.nota}` : NOTA_POR_CONFIRMAR
    }
  }
  await libro.xlsx.writeFile(destino)
}

/** Las fuentes estándar de PDF usan WinAnsi: se reemplazan caracteres no representables. */
function aWinAnsi(texto: string): string {
  return Array.from(texto)
    .map((c) => {
      const codigo = c.codePointAt(0) ?? 0
      return codigo <= 0xff || "—–“”‘’•".includes(c) ? c : "?"
    })
    .join("")
}

function partirEnLineas(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
  const lineas: string[] = []
  let actual = ""
  for (const palabra of texto.split(/\s+/)) {
    const candidata = actual === "" ? palabra : `${actual} ${palabra}`
    if (fuente.widthOfTextAtSize(candidata, tamano) <= ancho || actual === "") actual = candidata
    else {
      lineas.push(actual)
      actual = palabra
    }
  }
  if (actual !== "") lineas.push(actual)
  return lineas
}

interface LienzoPdf {
  documento: PDFDocument
  pagina: PDFPage
  y: number
}

const PAGINA: [number, number] = [595.28, 841.89]
const MARGEN = 56
const ANCHO_UTIL = PAGINA[0] - MARGEN * 2

function escribir(lienzo: LienzoPdf, texto: string, fuente: PDFFont, tamano: number, color = rgb(0.12, 0.14, 0.16)): void {
  for (const linea of partirEnLineas(aWinAnsi(texto), fuente, tamano, ANCHO_UTIL)) {
    if (lienzo.y < MARGEN) {
      lienzo.pagina = lienzo.documento.addPage(PAGINA)
      lienzo.y = PAGINA[1] - MARGEN
    }
    lienzo.pagina.drawText(linea, { x: MARGEN, y: lienzo.y, size: tamano, font: fuente, color })
    lienzo.y -= tamano + 5
  }
}

export async function generarPdf(
  campos: CampoPlantilla[],
  mapeados: CampoMapeado[],
  solicitud: Solicitud,
  destino: string,
): Promise<void> {
  const porEtiqueta = indexar(mapeados)
  const documento = await PDFDocument.create()
  const normal = await documento.embedFont(StandardFonts.Helvetica)
  const negrita = await documento.embedFont(StandardFonts.HelveticaBold)
  const lienzo: LienzoPdf = { documento, pagina: documento.addPage(PAGINA), y: PAGINA[1] - MARGEN }

  escribir(lienzo, "Formulario de registro de proveedor", negrita, 16)
  escribir(lienzo, `Cliente: ${solicitud.cliente}`, normal, 10)
  escribir(lienzo, `Referencia de la solicitud: ${solicitud.asunto} (${solicitud.fecha})`, normal, 10)
  lienzo.y -= 10

  let hayPorConfirmar = false
  for (const campo of campos) {
    const mapeado = porEtiqueta.get(campo.etiqueta)
    const marca = campo.obligatorio ? " *" : ""
    escribir(lienzo, `${campo.etiqueta}${marca}`, negrita, 10)
    if (mapeado === undefined || mapeado.estado === "faltante" || mapeado.valor === null) {
      escribir(lienzo, "pendiente", normal, 10, rgb(0.72, 0.33, 0.31))
    } else if (mapeado.estado === "requiere_confirmacion") {
      hayPorConfirmar = true
      escribir(lienzo, `${mapeado.valor} (*) por confirmar`, normal, 10, rgb(0.6, 0.45, 0.05))
    } else {
      escribir(lienzo, String(mapeado.valor), normal, 10)
    }
    lienzo.y -= 6
  }

  lienzo.y -= 10
  escribir(lienzo, "Los campos marcados con * son obligatorios.", normal, 8)
  if (hayPorConfirmar) escribir(lienzo, `(*) por confirmar: ${NOTA_POR_CONFIRMAR}`, normal, 8)
  await Bun.write(destino, await documento.save())
}

export function generarValoresPortal(campos: CampoPlantilla[], mapeados: CampoMapeado[], solicitud: Solicitud): string {
  const porEtiqueta = indexar(mapeados)
  const url = solicitud.cuerpo.match(/https?:\/\/\S+?(?=[\s.,;)]*(?:\s|$))/)?.[0]
  const filas = campos.map((campo) => {
    const m = porEtiqueta.get(campo.etiqueta)
    const valor = m && m.valor !== null && m.estado !== "faltante" ? String(m.valor) : ""
    const estado = m === undefined || m.estado === "faltante" ? "Faltante" : m.estado === "lleno" ? "Listo" : "Por confirmar"
    return `| ${campo.etiqueta}${campo.obligatorio ? " *" : ""} | ${valor.replace(/\|/g, "\\|")} | ${estado} |`
  })
  return [
    "# Valores para el portal del cliente",
    "",
    `Cliente: ${solicitud.cliente}`,
    url ? `Portal: ${url}` : "Portal: no indicado en la solicitud",
    "",
    "Formato no soportado para llenado automático. Copie estos valores en el formulario en línea.",
    "El ingreso de credenciales y el clic en \"Enviar\" los realiza una persona.",
    "",
    "| Campo | Valor | Estado |",
    "|---|---|---|",
    ...filas,
    "",
    "Los campos marcados con * son obligatorios.",
    "",
  ].join("\n")
}
