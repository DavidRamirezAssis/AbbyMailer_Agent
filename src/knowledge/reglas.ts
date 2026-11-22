// Reglas de negocio deterministas que consumen las herramientas.
// Fuente documental: src/knowledge/registro-proveedor.md (mismo contenido, en lenguaje de negocio).
// Un cambio de reglas se hace aquí y en el .md, sin tocar el servidor (PRD §6.5).

export interface ReglaPais {
  nombre: string
  identificadorTributario: string
}

/** RN1 y DEC-15: identificador tributario y nombre de cada país atendido. */
export const PAISES: Readonly<Record<string, ReglaPais>> = {
  CO: { nombre: "Colombia", identificadorTributario: "NIT" },
  EC: { nombre: "Ecuador", identificadorTributario: "RUC" },
  PE: { nombre: "Perú", identificadorTributario: "RUC" },
  PA: { nombre: "Panamá", identificadorTributario: "RUC" },
  HN: { nombre: "Honduras", identificadorTributario: "RTN" },
}

/** País de origen de los datos del maestro (Periferia solo tiene NIT colombiano). */
export const PAIS_MAESTRO = "CO"

/** Ruta del maestro que contiene el identificador tributario (RN1). */
export const RUTA_IDENTIFICADOR_TRIBUTARIO = "nit"

/** Ruta del maestro que contiene el código de país, presentado con su nombre (DEC-15). */
export const RUTA_PAIS = "pais"

/** HU-2 y DEC-08: umbrales de confianza del mapeo. */
export const UMBRAL_LLENO = 0.8
export const UMBRAL_CANDIDATO = 0.5
export const CONFIANZA_EXACTA = 1
export const CONFIANZA_NORMALIZADA = 0.95

/** Palabras sin carga semántica que se excluyen de la comparación aproximada (DEC-08). */
export const PALABRAS_VACIAS: ReadonlySet<string> = new Set([
  "de", "del", "la", "las", "el", "los", "y", "o", "en", "a", "para", "por", "su", "sus", "al",
])

/** DEC-11: patrón con el que un cliente exige antigüedad máxima de un soporte. */
export const PATRON_ANTIGUEDAD_MAXIMA = /no mayor a (\d+) d[ií]as/i
