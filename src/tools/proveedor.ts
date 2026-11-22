import { copyFile, mkdir, rm } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { z } from "zod"
import { cargarConfig, fechaReferencia } from "../config.ts"
import { type ContextoHerramienta, type ResultadoHerramienta, definirHerramienta, exito, fallo } from "./contrato.ts"
import {
  type Caso,
  type Maestro,
  camposSolicitados,
  cargarCaso,
  cargarGlosario,
  cargarIndiceSoportes,
  cargarMaestro,
  leerJson,
  rutas,
} from "./fuentes.ts"
import { type CampoMapeado, esAmbiguo, formatearValor, mapearCampo } from "./mapeo.ts"
import { evaluarPaquete, evaluarSoportes, redactarBorradorCorreo, redactarChecklist } from "./paquete.ts"
import { registrar } from "./registro.ts"
import { generarPdf, generarValoresPortal, generarXlsx } from "./salidas.ts"

// Herramientas del proceso de registro como proveedor (PRD §6.2).
// El nombre que ve el modelo es proveedor_<export>. Ninguna lanza excepciones.

const argCaso = z.string().min(1).describe("Nombre de la carpeta del caso en fixtures/reto-01/casos/")

// ---------------------------------------------------------------------------
// Persistencia del estado del caso en out/<caso>/ (DEC-04, DEC-05)
// ---------------------------------------------------------------------------

const esquemaCampoMapeado = z.object({
  etiqueta: z.string(),
  obligatorio: z.boolean(),
  estado: z.enum(["lleno", "faltante", "requiere_confirmacion"]),
  ruta: z.string().nullable(),
  valor: z.union([z.string(), z.number()]).nullable(),
  confianza: z.number(),
  nota: z.string().optional(),
  confirmadoPorUsuario: z.boolean().optional(),
})

const esquemaMapeoGuardado = z.object({
  caso: z.string(),
  campos: z.array(esquemaCampoMapeado),
})

const esquemaEstadoPaquete = z.object({
  caso: z.string(),
  listo_para_firma: z.boolean(),
  motivos: z.array(z.string()),
  adjuntos: z.array(z.string()),
})

type MapeoGuardado = z.infer<typeof esquemaMapeoGuardado>

const ARCHIVO_FORMULARIO: Record<Caso["solicitud"]["formato"], string> = {
  xlsx: "formulario.xlsx",
  pdf: "formulario.pdf",
  portal: "valores-portal.md",
}

const archivoMapeo = (ctx: ContextoHerramienta, caso: string) => join(rutas.salidaCaso(ctx.directory, caso), "mapeo.json")
const archivoEstado = (ctx: ContextoHerramienta, caso: string) =>
  join(rutas.salidaCaso(ctx.directory, caso), "estado-paquete.json")

function rutaRelativa(ctx: ContextoHerramienta, absoluta: string): string {
  return relative(ctx.directory, absoluta).split(sep).join("/")
}

async function guardarJson(destino: string, contenido: unknown): Promise<void> {
  await Bun.write(destino, JSON.stringify(contenido, null, 2))
}

async function leerMapeo(ctx: ContextoHerramienta, caso: string): Promise<ResultadoHerramienta<MapeoGuardado>> {
  const ruta = archivoMapeo(ctx, caso)
  if (!(await Bun.file(ruta).exists())) return { ok: false, error: "Primero mapea los campos del caso." }
  return leerJson(ruta, esquemaMapeoGuardado, "el mapeo registrado del caso")
}

// ---------------------------------------------------------------------------
// Envoltura común: registro (RN5) y captura de errores inesperados (HU-5)
// ---------------------------------------------------------------------------

interface Salida<T> {
  resultado: ResultadoHerramienta<T>
  resumen: string
}

async function ejecutar<T>(
  ctx: ContextoHerramienta,
  herramienta: string,
  caso: string,
  cuerpo: () => Promise<Salida<T>>,
): Promise<string> {
  let salida: Salida<T>
  try {
    salida = await cuerpo()
  } catch {
    salida = {
      resultado: { ok: false, error: `Ocurrió un error inesperado al ejecutar ${herramienta}. Intente de nuevo o revise los archivos del caso.` },
      resumen: "error inesperado",
    }
  }
  const { resultado } = salida
  await registrar(ctx, {
    herramienta,
    caso,
    ok: resultado.ok,
    resumen: resultado.ok ? salida.resumen : resultado.error,
  })
  return resultado.ok ? exito(resultado.data) : fallo(resultado.error)
}

function error<T>(mensaje: string): Salida<T> {
  return { resultado: { ok: false, error: mensaje }, resumen: mensaje }
}

// ---------------------------------------------------------------------------
// proveedor_leer_solicitud (HU-1)
// ---------------------------------------------------------------------------

export const leer_solicitud = definirHerramienta({
  description:
    "Lee la solicitud de un caso y devuelve país, cliente, formato de salida, campos solicitados y soportes exigidos.",
  args: { caso: argCaso },
  async execute({ caso }, ctx) {
    return ejecutar(ctx, "proveedor_leer_solicitud", caso, async () => {
      const cargado = await cargarCaso(ctx.directory, caso)
      if (!cargado.ok) return error(cargado.error)
      const glosario = await cargarGlosario(ctx.directory)
      if (!glosario.ok) return error(glosario.error)

      const { solicitud } = cargado.data
      const campos = camposSolicitados(cargado.data.plantilla).map((campo) => {
        const { ambiguo, equivalente } = esAmbiguo(campo.etiqueta, solicitud.pais, glosario.data)
        return { ...campo, ambiguo, ...(equivalente ? { equivalente_pais: equivalente } : {}) }
      })
      const data = {
        caso,
        pais: solicitud.pais,
        cliente: solicitud.cliente,
        formato: solicitud.formato,
        asunto: solicitud.asunto,
        fecha_solicitud: solicitud.fecha,
        campos,
        soportes: cargado.data.soportesExigidos,
      }
      const ambiguos = campos.filter((c) => c.ambiguo).length
      return {
        resultado: { ok: true, data },
        resumen: `formato ${solicitud.formato}; ${campos.length} campos (${ambiguos} ambiguos); ${data.soportes.length} soportes`,
      }
    })
  },
})

// ---------------------------------------------------------------------------
// proveedor_mapear_campos (HU-2)
// ---------------------------------------------------------------------------

export const mapear_campos = definirHerramienta({
  description:
    "Cruza los campos solicitados con el repositorio maestro y los clasifica en llenos, faltantes o que requieren confirmación.",
  args: {
    caso: argCaso,
    campos: z
      .array(z.string().min(1))
      .min(1)
      .describe("Etiquetas de los campos solicitados, tal como las devolvió proveedor_leer_solicitud"),
  },
  async execute({ caso, campos }, ctx) {
    return ejecutar(ctx, "proveedor_mapear_campos", caso, async () => {
      const cargado = await cargarCaso(ctx.directory, caso)
      if (!cargado.ok) return error(cargado.error)
      const [glosario, maestro] = await Promise.all([cargarGlosario(ctx.directory), cargarMaestro(ctx.directory)])
      if (!glosario.ok) return error(glosario.error)
      if (!maestro.ok) return error(maestro.error)

      // Se mapea siempre la plantilla completa para que el formulario quede trazable.
      const plantilla = camposSolicitados(cargado.data.plantilla)
      const etiquetasPlantilla = new Set(plantilla.map((c) => c.etiqueta))
      const solicitadas = new Set(campos)
      const advertencias = [
        ...campos.filter((e) => !etiquetasPlantilla.has(e)).map((e) => `"${e}" no pertenece a la plantilla y se ignoró.`),
        ...plantilla.filter((c) => !solicitadas.has(c.etiqueta)).map((c) => `"${c.etiqueta}" no se solicitó pero se mapeó por pertenecer a la plantilla.`),
      ]

      const mapeados = plantilla.map((c) => mapearCampo(c, cargado.data.solicitud.pais, glosario.data, maestro.data))
      await mkdir(rutas.salidaCaso(ctx.directory, caso), { recursive: true })
      await guardarJson(archivoMapeo(ctx, caso), { caso, campos: mapeados } satisfies MapeoGuardado)

      const data = resumirMapeo(caso, mapeados, advertencias)
      return {
        resultado: { ok: true, data },
        resumen: `${data.llenos.length} llenos, ${data.faltantes.length} faltantes, ${data.requiere_confirmacion.length} por confirmar`,
      }
    })
  },
})

function resumirMapeo(caso: string, campos: CampoMapeado[], advertencias: string[]) {
  return {
    caso,
    llenos: campos
      .filter((c) => c.estado === "lleno")
      .map(({ etiqueta, ruta, valor, confianza, confirmadoPorUsuario }) => ({
        etiqueta,
        ruta,
        valor,
        confianza,
        ...(confirmadoPorUsuario ? { confirmado_por_usuario: true } : {}),
      })),
    faltantes: campos
      .filter((c) => c.estado === "faltante")
      .map(({ etiqueta, obligatorio, nota }) => ({ etiqueta, obligatorio, nota })),
    requiere_confirmacion: campos
      .filter((c) => c.estado === "requiere_confirmacion")
      .map(({ etiqueta, ruta, valor, confianza, nota }) => ({ etiqueta, ruta, valor, confianza, nota })),
    advertencias,
  }
}

// ---------------------------------------------------------------------------
// proveedor_generar_formulario (HU-3, DEC-04, DEC-07, DEC-09)
// ---------------------------------------------------------------------------

const esquemaArgMapeo = z
  .object({
    campos: z
      .array(
        z.object({
          etiqueta: z.string().describe("Etiqueta del campo en la plantilla del cliente"),
          ruta: z.string().nullable().describe("Ruta del dato en el maestro, o null si es faltante"),
        }),
      )
      .optional()
      .describe("Campos devueltos por proveedor_mapear_campos; los valores se vuelven a leer del maestro"),
    confirmaciones: z
      .array(
        z.object({
          etiqueta: z.string().describe("Etiqueta del campo que requería confirmación"),
          decision: z.enum(["aceptar", "descartar"]).describe("Decisión explícita del usuario"),
        }),
      )
      .optional()
      .describe("Decisiones del usuario sobre campos en requiere_confirmacion (solo si el usuario las dio)"),
  })
  .describe("Resultado del mapeo y confirmaciones del usuario")

type ArgMapeo = z.infer<typeof esquemaArgMapeo>

function verificarMapeoRecibido(recibido: ArgMapeo, guardado: MapeoGuardado): string | null {
  for (const campo of recibido.campos ?? []) {
    const registrado = guardado.campos.find((c) => c.etiqueta === campo.etiqueta)
    if (registrado === undefined) return `El campo "${campo.etiqueta}" no existe en el mapeo registrado del caso.`
    if (registrado.ruta !== campo.ruta && registrado.estado !== "faltante") {
      return `El mapeo recibido para "${campo.etiqueta}" no coincide con el mapeo registrado.`
    }
  }
  return null
}

function aplicarConfirmaciones(
  campos: CampoMapeado[],
  confirmaciones: NonNullable<ArgMapeo["confirmaciones"]>,
  ctx: ContextoHerramienta,
  caso: string,
): string | null {
  if (confirmaciones.length === 0) return null
  const confirmacion = ctx.confirmacionUsuario
  if (confirmacion?.accion !== "confirmar_campos" || confirmacion.caso !== caso) {
    return "Las confirmaciones de campos requieren una confirmación explícita del usuario en su último mensaje."
  }
  const autorizadas = new Set(confirmacion.etiquetas ?? [])
  for (const decision of confirmaciones) {
    if (!autorizadas.has(decision.etiqueta)) return `El usuario no confirmó el campo "${decision.etiqueta}".`
    const campo = campos.find((c) => c.etiqueta === decision.etiqueta)
    if (campo === undefined || campo.estado !== "requiere_confirmacion") {
      return `El campo "${decision.etiqueta}" no está pendiente de confirmación.`
    }
    if (decision.decision === "aceptar") {
      campo.estado = "lleno"
      campo.confirmadoPorUsuario = true
    } else {
      campo.estado = "faltante"
      campo.valor = null
      campo.nota = "Descartado por el usuario."
    }
  }
  return null
}

/** CA2: los valores se vuelven a leer del maestro por su ruta; nunca se toman del modelo. */
function releerValores(campos: CampoMapeado[], maestro: Maestro): void {
  for (const campo of campos) {
    if (campo.estado === "faltante" || campo.ruta === null) continue
    const valor = formatearValor(maestro, campo.ruta)
    if (valor === null) {
      campo.estado = "faltante"
      campo.valor = null
      campo.nota = "El dato ya no existe en el maestro."
    } else {
      campo.valor = valor
    }
  }
}

export const generar_formulario = definirHerramienta({
  description:
    "Genera el formulario lleno en el formato pedido por el cliente usando solo valores del repositorio maestro.",
  args: { caso: argCaso, mapeo: esquemaArgMapeo },
  async execute({ caso, mapeo }, ctx) {
    return ejecutar(ctx, "proveedor_generar_formulario", caso, async () => {
      const cargado = await cargarCaso(ctx.directory, caso)
      if (!cargado.ok) return error(cargado.error)
      const guardado = await leerMapeo(ctx, caso)
      if (!guardado.ok) return error(guardado.error)
      const maestro = await cargarMaestro(ctx.directory)
      if (!maestro.ok) return error(maestro.error)

      const discrepancia = verificarMapeoRecibido(mapeo, guardado.data)
      if (discrepancia) return error(discrepancia)
      const campos = guardado.data.campos
      const rechazo = aplicarConfirmaciones(campos, mapeo.confirmaciones ?? [], ctx, caso)
      if (rechazo) return error(rechazo)
      releerValores(campos, maestro.data)
      await guardarJson(archivoMapeo(ctx, caso), { caso, campos } satisfies MapeoGuardado)

      const { solicitud, plantilla } = cargado.data
      const destino = join(rutas.salidaCaso(ctx.directory, caso), ARCHIVO_FORMULARIO[solicitud.formato])
      if (solicitud.formato === "xlsx" && plantilla.tipo === "celdas") await generarXlsx(plantilla.celdas, campos, destino)
      else if (solicitud.formato === "pdf" && plantilla.tipo === "campos") await generarPdf(plantilla.campos, campos, solicitud, destino)
      else if (solicitud.formato === "portal" && plantilla.tipo === "campos") {
        await Bun.write(destino, generarValoresPortal(plantilla.campos, campos, solicitud))
      } else return error(`La plantilla del caso no corresponde al formato ${solicitud.formato}.`)

      const pendientes = campos.filter((c) => c.estado === "requiere_confirmacion").length
      const soportado = solicitud.formato !== "portal"
      const data = {
        ruta: rutaRelativa(ctx, destino),
        formato: solicitud.formato,
        soportado,
        campos_pendientes_de_confirmacion: pendientes,
        ...(soportado ? {} : { mensaje: "Formato no soportado: se generaron los valores listos para copiar en el portal." }),
      }
      return { resultado: { ok: true, data }, resumen: `formulario ${solicitud.formato}; ${pendientes} por confirmar` }
    })
  },
})

// ---------------------------------------------------------------------------
// proveedor_armar_paquete (HU-4, RN3)
// ---------------------------------------------------------------------------

export const armar_paquete = definirHerramienta({
  description:
    "Arma el paquete para firma con formulario, soportes, checklist y borrador de correo, e indica si está listo para firma.",
  args: { caso: argCaso },
  async execute({ caso }, ctx) {
    return ejecutar(ctx, "proveedor_armar_paquete", caso, async () => {
      const cargado = await cargarCaso(ctx.directory, caso)
      if (!cargado.ok) return error(cargado.error)
      const guardado = await leerMapeo(ctx, caso)
      if (!guardado.ok) return error(guardado.error)
      const [indice, maestro] = await Promise.all([cargarIndiceSoportes(ctx.directory), cargarMaestro(ctx.directory)])
      if (!indice.ok) return error(indice.error)
      if (!maestro.ok) return error(maestro.error)

      const fecha = fechaReferencia(cargarConfig())
      const { solicitud, soportesExigidos } = cargado.data
      const carpetaCaso = rutas.salidaCaso(ctx.directory, caso)
      const carpetaPaquete = join(carpetaCaso, "paquete")
      await rm(carpetaPaquete, { recursive: true, force: true })
      await mkdir(join(carpetaPaquete, "soportes"), { recursive: true })

      const nombreFormulario = ARCHIVO_FORMULARIO[solicitud.formato]
      const formulario = join(carpetaCaso, nombreFormulario)
      const formularioPresente = await Bun.file(formulario).exists()
      const adjuntos: string[] = []
      if (formularioPresente) {
        await copyFile(formulario, join(carpetaPaquete, nombreFormulario))
        adjuntos.push(nombreFormulario)
      }

      const soportes = evaluarSoportes(soportesExigidos, indice.data, solicitud, fecha)
      for (const soporte of soportes) {
        if (soporte.archivo === null) continue
        const origen = join(rutas.soportes(ctx.directory), soporte.archivo)
        if (await Bun.file(origen).exists()) {
          await copyFile(origen, join(carpetaPaquete, "soportes", soporte.archivo))
          adjuntos.push(`soportes/${soporte.archivo}`)
        } else {
          soporte.estado = "ausente"
        }
      }

      const evaluacion = evaluarPaquete(soportes, guardado.data.campos, formularioPresente)
      await Bun.write(join(carpetaPaquete, "checklist.md"), redactarChecklist(evaluacion, solicitud, fecha))
      await Bun.write(join(carpetaPaquete, "borrador-correo.md"), redactarBorradorCorreo(solicitud, soportes, maestro.data))
      await guardarJson(archivoEstado(ctx, caso), {
        caso,
        listo_para_firma: evaluacion.listo_para_firma,
        motivos: evaluacion.motivos,
        adjuntos,
      })

      const data = {
        ruta: rutaRelativa(ctx, carpetaPaquete),
        listo_para_firma: evaluacion.listo_para_firma,
        fecha_referencia: fecha,
        checklist: evaluacion,
      }
      return {
        resultado: { ok: true, data },
        resumen: `listo_para_firma=${evaluacion.listo_para_firma}; ${evaluacion.motivos.length} motivos de bloqueo`,
      }
    })
  },
})

// ---------------------------------------------------------------------------
// proveedor_simular_envio (HU-4, RN4, DEC-06, DEC-10)
// ---------------------------------------------------------------------------

export const simular_envio = definirHerramienta({
  description:
    "Simula el envío del paquete al cliente; solo procede si el usuario lo confirmó explícitamente en su último mensaje.",
  args: {
    caso: argCaso,
    confirmado: z.boolean().describe("true solo si el usuario confirmó explícitamente el envío en su último mensaje"),
  },
  async execute({ caso, confirmado }, ctx) {
    return ejecutar(ctx, "proveedor_simular_envio", caso, async () => {
      const confirmacion = ctx.confirmacionUsuario
      if (!confirmado || confirmacion?.accion !== "enviar" || confirmacion.caso !== caso) {
        return error("requiere confirmación explícita")
      }
      const cargado = await cargarCaso(ctx.directory, caso)
      if (!cargado.ok) return error(cargado.error)
      const estado = await leerJson(archivoEstado(ctx, caso), esquemaEstadoPaquete, "el estado del paquete")
      if (!estado.ok) return error("Primero arma el paquete para firma.")
      const borrador = Bun.file(join(rutas.salidaCaso(ctx.directory, caso), "paquete", "borrador-correo.md"))
      const cuerpo = (await borrador.exists()) ? await borrador.text() : "(sin borrador)"

      const { solicitud } = cargado.data
      const destino = join(rutas.salidaCaso(ctx.directory, caso), "ENVIO-SIMULADO.md")
      const contenido = [
        "# Envío simulado",
        "",
        `Fecha de simulación: ${new Date().toISOString()}`,
        `Destinatario: ${solicitud.de}`,
        `Asunto: RE: ${solicitud.asunto}`,
        `Listo para firma: ${estado.data.listo_para_firma ? "Sí" : "No"}`,
        ...estado.data.motivos.map((m) => `- ${m}`),
        "",
        "Condición: requiere formulario firmado por el representante legal. Este archivo no envía ningún correo.",
        "",
        "## Adjuntos",
        "",
        ...estado.data.adjuntos.map((a) => `- ${a}`),
        "",
        "## Cuerpo del mensaje",
        "",
        cuerpo,
      ].join("\n")
      await Bun.write(destino, contenido)
      return {
        resultado: { ok: true, data: { ruta: rutaRelativa(ctx, destino), listo_para_firma: estado.data.listo_para_firma } },
        resumen: `envío simulado; listo_para_firma=${estado.data.listo_para_firma}`,
      }
    })
  },
})
