import {
  CONFIANZA_EXACTA,
  CONFIANZA_NORMALIZADA,
  PAISES,
  PAIS_MAESTRO,
  PALABRAS_VACIAS,
  RUTA_IDENTIFICADOR_TRIBUTARIO,
  RUTA_PAIS,
  UMBRAL_CANDIDATO,
  UMBRAL_LLENO,
} from "../knowledge/reglas.ts"
import type { Glosario, Maestro } from "./fuentes.ts"

// Mapeo determinista de etiquetas a datos del maestro (HU-2, DEC-08, RN1, DEC-15, DEC-16).
// Funciones puras: no leen archivos ni lanzan excepciones.

export type EstadoCampo = "lleno" | "faltante" | "requiere_confirmacion"
export type Valor = string | number

export interface CampoMapeado {
  etiqueta: string
  obligatorio: boolean
  estado: EstadoCampo
  ruta: string | null
  valor: Valor | null
  confianza: number
  nota?: string
  /** Decisión explícita del usuario sobre un campo que requería confirmación (DEC-25, DEC-26). */
  decisionUsuario?: "aceptar" | "descartar"
  /** Sesión en que el usuario tomó la decisión; solo se conserva dentro de esa sesión (DEC-26). */
  sesionDecision?: string
}

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function tokens(texto: string): Set<string> {
  return new Set(normalizar(texto).split(" ").filter((t) => t !== "" && !PALABRAS_VACIAS.has(t)))
}

/** Coeficiente de Dice sobre tokens sin palabras vacías. */
export function similitud(a: string, b: string): number {
  const ta = tokens(a)
  const tb = tokens(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let comunes = 0
  for (const t of ta) if (tb.has(t)) comunes++
  return (2 * comunes) / (ta.size + tb.size)
}

export interface Coincidencia {
  ruta: string
  confianza: number
  sinonimo: string
}

export function buscarEnGlosario(etiqueta: string, glosario: Glosario): Coincidencia | null {
  const exacta = glosario[etiqueta]
  if (exacta !== undefined) return { ruta: exacta, confianza: CONFIANZA_EXACTA, sinonimo: etiqueta }

  const objetivo = normalizar(etiqueta)
  let mejor: Coincidencia | null = null
  for (const [sinonimo, ruta] of Object.entries(glosario)) {
    if (normalizar(sinonimo) === objetivo) return { ruta, confianza: CONFIANZA_NORMALIZADA, sinonimo }
    const puntaje = similitud(etiqueta, sinonimo)
    if (puntaje > 0 && (mejor === null || puntaje > mejor.confianza)) mejor = { ruta, confianza: puntaje, sinonimo }
  }
  return mejor
}

export function resolverRuta(maestro: Maestro, ruta: string): unknown {
  let actual: unknown = maestro
  for (const parte of ruta.split(".")) {
    if (typeof actual !== "object" || actual === null || Array.isArray(actual)) return undefined
    actual = (actual as Record<string, unknown>)[parte]
  }
  return actual
}

function separarMiles(numero: number): string {
  return Math.trunc(numero).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/** Convierte el dato del maestro en el valor a escribir, con transformaciones declaradas. */
export function formatearValor(maestro: Maestro, ruta: string): Valor | null {
  const dato = resolverRuta(maestro, ruta)
  if (dato === undefined || dato === null || dato === "") return null

  if (ruta === RUTA_PAIS && typeof dato === "string") return PAISES[dato]?.nombre ?? dato

  if (ruta.endsWith(".valor") && typeof dato === "number") {
    const padre = resolverRuta(maestro, ruta.slice(0, -".valor".length))
    if (typeof padre === "object" && padre !== null) {
      const { moneda, ano } = padre as Record<string, unknown>
      if (typeof moneda === "string") {
        const sufijo = typeof ano === "number" ? ` (año ${ano})` : ""
        return `${moneda} ${separarMiles(dato)}${sufijo}`
      }
    }
  }

  if (typeof dato === "string" || typeof dato === "number") return dato
  if (typeof dato === "boolean") return dato ? "Sí" : "No"
  return null
}

function reglaIdentificador(etiqueta: string, pais: string): { requiere: boolean; nota?: string } {
  const regla = PAISES[pais]
  const esperado = regla?.identificadorTributario ?? "identificador tributario local"
  const etiquetaEsDelPais = regla !== undefined && normalizar(etiqueta) === normalizar(esperado)
  if (pais === PAIS_MAESTRO && etiquetaEsDelPais) return { requiere: false }
  if (pais !== PAIS_MAESTRO) {
    return {
      requiere: true,
      nota: `Identificador extranjero: el cliente solicita ${esperado} (${regla?.nombre ?? pais}) y Periferia solo dispone de NIT colombiano.`,
    }
  }
  return { requiere: true, nota: `Etiqueta ambigua; el equivalente en ${regla?.nombre ?? pais} es ${esperado}.` }
}

export interface EntradaMapeo {
  etiqueta: string
  obligatorio: boolean
}

export function mapearCampo(entrada: EntradaMapeo, pais: string, glosario: Glosario, maestro: Maestro): CampoMapeado {
  const base = { etiqueta: entrada.etiqueta, obligatorio: entrada.obligatorio }
  const coincidencia = buscarEnGlosario(entrada.etiqueta, glosario)
  const confianza = coincidencia ? Number(coincidencia.confianza.toFixed(2)) : 0

  if (coincidencia === null || confianza < UMBRAL_CANDIDATO) {
    return { ...base, estado: "faltante", ruta: null, valor: null, confianza, nota: "No existe en el repositorio maestro." }
  }

  const valor = formatearValor(maestro, coincidencia.ruta)
  if (valor === null) {
    return { ...base, estado: "faltante", ruta: coincidencia.ruta, valor: null, confianza, nota: "El dato está vacío en el maestro." }
  }

  if (confianza < UMBRAL_LLENO) {
    return {
      ...base,
      estado: "requiere_confirmacion",
      ruta: coincidencia.ruta,
      valor,
      confianza,
      nota: `Mapeo aproximado con "${coincidencia.sinonimo}" (confianza ${confianza}).`,
    }
  }

  if (coincidencia.ruta === RUTA_IDENTIFICADOR_TRIBUTARIO) {
    const regla = reglaIdentificador(entrada.etiqueta, pais)
    if (regla.requiere) {
      return { ...base, estado: "requiere_confirmacion", ruta: coincidencia.ruta, valor, confianza, ...(regla.nota ? { nota: regla.nota } : {}) }
    }
  }

  return { ...base, estado: "lleno", ruta: coincidencia.ruta, valor, confianza }
}

/** Indica si la etiqueta corresponde al identificador tributario y difiere del término del país (HU-1). */
export function esAmbiguo(etiqueta: string, pais: string, glosario: Glosario): { ambiguo: boolean; equivalente?: string } {
  const coincidencia = buscarEnGlosario(etiqueta, glosario)
  if (coincidencia?.ruta !== RUTA_IDENTIFICADOR_TRIBUTARIO || coincidencia.confianza < UMBRAL_LLENO) return { ambiguo: false }
  const esperado = PAISES[pais]?.identificadorTributario
  if (esperado === undefined) return { ambiguo: true }
  if (pais === PAIS_MAESTRO && normalizar(etiqueta) === normalizar(esperado)) return { ambiguo: false }
  return { ambiguo: true, equivalente: esperado }
}
