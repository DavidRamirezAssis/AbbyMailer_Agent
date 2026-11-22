import { join } from "node:path"
import { z } from "zod"
import type { ResultadoHerramienta } from "./contrato.ts"

// Lectura y validación de los fixtures (PRD §7.1 y §7.2). Nunca lanza:
// todo error se devuelve como { ok: false, error } en lenguaje claro.

const CELDA = /^[A-Z]{1,3}[1-9]\d*$/
const NOMBRE_CASO = /^[a-z0-9][a-z0-9-]{0,80}$/

export const esquemaSolicitud = z.object({
  id: z.string(),
  de: z.string(),
  asunto: z.string(),
  fecha: z.string(),
  pais: z.string().min(2),
  cliente: z.string(),
  cuerpo: z.string(),
  formato: z.enum(["xlsx", "pdf", "portal"]),
  adjuntos: z.array(z.string()),
})

export const esquemaPlantillaCeldas = z
  .array(
    z.object({
      hoja: z.string().min(1),
      celda_etiqueta: z.string().regex(CELDA),
      etiqueta: z.string().min(1),
      celda_valor: z.string().regex(CELDA),
    }),
  )
  .min(1)

export const esquemaPlantillaCampos = z.array(z.object({ etiqueta: z.string().min(1), obligatorio: z.boolean() })).min(1)

export const esquemaSoportesExigidos = z.array(z.string().min(1))

export const esquemaIndiceSoportes = z.array(
  z.object({
    tipo: z.string().min(1),
    archivo: z.string().min(1),
    vigencia_hasta: z.string().nullable(),
    pais_emisor: z.string(),
    descripcion: z.string().default(""),
  }),
)

export const esquemaGlosario = z.record(z.string(), z.string())
export const esquemaMaestro = z.record(z.string(), z.unknown())

export type Solicitud = z.infer<typeof esquemaSolicitud>
export type CeldaPlantilla = z.infer<typeof esquemaPlantillaCeldas>[number]
export type CampoPlantilla = z.infer<typeof esquemaPlantillaCampos>[number]
export type SoporteIndice = z.infer<typeof esquemaIndiceSoportes>[number]
export type Glosario = z.infer<typeof esquemaGlosario>
export type Maestro = z.infer<typeof esquemaMaestro>

/** Campo de la plantilla con su ubicación, común a los tres formatos. */
export interface CampoSolicitado {
  etiqueta: string
  obligatorio: boolean
  ubicacion: string
}

export type Plantilla =
  | { tipo: "celdas"; celdas: CeldaPlantilla[] }
  | { tipo: "campos"; campos: CampoPlantilla[] }

export interface Caso {
  nombre: string
  solicitud: Solicitud
  plantilla: Plantilla
  soportesExigidos: string[]
}

export const rutas = {
  fixtures: (raiz: string) => join(raiz, "fixtures", "reto-01"),
  caso: (raiz: string, caso: string) => join(raiz, "fixtures", "reto-01", "casos", caso),
  maestro: (raiz: string) => join(raiz, "fixtures", "reto-01", "repositorio", "maestro.json"),
  soportes: (raiz: string) => join(raiz, "fixtures", "reto-01", "repositorio", "soportes"),
  glosario: (raiz: string) => join(raiz, "fixtures", "reto-01", "glosario-campos.json"),
  salida: (raiz: string) => join(raiz, "out"),
  salidaCaso: (raiz: string, caso: string) => join(raiz, "out", caso),
}

export function nombreCasoValido(caso: string): boolean {
  return NOMBRE_CASO.test(caso)
}

async function leerJson<T>(ruta: string, esquema: z.ZodType<T>, descripcion: string): Promise<ResultadoHerramienta<T>> {
  const archivo = Bun.file(ruta)
  if (!(await archivo.exists())) return { ok: false, error: `No existe ${descripcion}.` }
  let contenido: unknown
  try {
    contenido = JSON.parse(await archivo.text())
  } catch {
    return { ok: false, error: `${descripcion} está corrupto: no es un JSON válido.` }
  }
  const validado = esquema.safeParse(contenido)
  if (!validado.success) {
    const primero = validado.error.issues[0]
    const detalle = primero ? ` (${primero.path.join(".") || "raíz"}: ${primero.message})` : ""
    return { ok: false, error: `${descripcion} no tiene la estructura esperada${detalle}.` }
  }
  return { ok: true, data: validado.data }
}

export function camposSolicitados(plantilla: Plantilla): CampoSolicitado[] {
  if (plantilla.tipo === "celdas") {
    return plantilla.celdas.map((c) => ({ etiqueta: c.etiqueta, obligatorio: true, ubicacion: `${c.hoja}!${c.celda_valor}` }))
  }
  return plantilla.campos.map((c, indice) => ({
    etiqueta: c.etiqueta,
    obligatorio: c.obligatorio,
    ubicacion: `posición ${indice + 1}`,
  }))
}

export async function cargarCaso(raiz: string, caso: string): Promise<ResultadoHerramienta<Caso>> {
  if (!nombreCasoValido(caso)) return { ok: false, error: `El nombre de caso "${caso}" no es válido.` }
  const carpeta = rutas.caso(raiz, caso)
  const solicitud = await leerJson(join(carpeta, "solicitud.json"), esquemaSolicitud, `la solicitud del caso "${caso}"`)
  if (!solicitud.ok) {
    const existe = await Bun.file(join(carpeta, "solicitud.json")).exists()
    return existe ? solicitud : { ok: false, error: `El caso "${caso}" no existe.` }
  }

  const plantilla = await cargarPlantilla(carpeta, solicitud.data.formato)
  if (!plantilla.ok) return plantilla

  const soportes = await leerJson(
    join(carpeta, "soportes-exigidos.json"),
    esquemaSoportesExigidos,
    "la lista de soportes exigidos",
  )
  if (!soportes.ok) return soportes

  return {
    ok: true,
    data: { nombre: caso, solicitud: solicitud.data, plantilla: plantilla.data, soportesExigidos: soportes.data },
  }
}

async function cargarPlantilla(carpeta: string, formato: Solicitud["formato"]): Promise<ResultadoHerramienta<Plantilla>> {
  if (formato === "xlsx") {
    const celdas = await leerJson(join(carpeta, "plantilla-celdas.json"), esquemaPlantillaCeldas, "la plantilla Excel del caso")
    return celdas.ok ? { ok: true, data: { tipo: "celdas", celdas: celdas.data } } : celdas
  }
  const campos = await leerJson(join(carpeta, "plantilla-campos.json"), esquemaPlantillaCampos, "la plantilla de campos del caso")
  return campos.ok ? { ok: true, data: { tipo: "campos", campos: campos.data } } : campos
}

export const cargarMaestro = (raiz: string) => leerJson(rutas.maestro(raiz), esquemaMaestro, "el repositorio maestro")
export const cargarGlosario = (raiz: string) => leerJson(rutas.glosario(raiz), esquemaGlosario, "el glosario de campos")
export const cargarIndiceSoportes = (raiz: string) =>
  leerJson(join(rutas.soportes(raiz), "index.json"), esquemaIndiceSoportes, "el índice de soportes")

export { leerJson }
