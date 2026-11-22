// Tabla del flujo (DEC-28): según la herramienta y su resultado, define el paso
// siguiente que se entrega al modelo y las guías de variante que se adjuntan.
// Un cambio en el flujo de negocio se hace aquí, sin tocar el ciclo ni el servidor.

export type Guia = "campos-por-confirmar" | "paquete-bloqueado" | "formato-portal" | "envio" | "caso-no-disponible"

export interface Orientacion {
  siguiente_paso: string
  guias: Guia[]
}

type Datos = Record<string, unknown>

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : []
}

function etiquetas(valor: unknown): string[] {
  return lista(valor)
    .map((v) => (typeof v === "string" ? v : typeof v === "object" && v !== null ? (v as Datos).etiqueta : undefined))
    .filter((e): e is string => typeof e === "string")
}

const NO_REINTENTAR = "No repitas la misma llamada."

function trasExito(herramienta: string, caso: string, datos: Datos): Orientacion {
  switch (herramienta) {
    case "proveedor_leer_solicitud":
      return {
        siguiente_paso: `Llama a proveedor_mapear_campos con caso="${caso}" y las etiquetas de "campos".`,
        guias: datos.formato === "portal" ? ["formato-portal"] : [],
      }
    case "proveedor_mapear_campos": {
      const pendientes = etiquetas(datos.requiere_confirmacion)
      return {
        siguiente_paso: `Llama a proveedor_generar_formulario con caso="${caso}" y mapeo={}.${pendientes.length > 0 ? " Todavía no pidas confirmación: primero genera el formulario y arma el paquete." : ""}`,
        guias: pendientes.length > 0 ? ["campos-por-confirmar"] : [],
      }
    }
    case "proveedor_generar_formulario":
      return { siguiente_paso: `Llama a proveedor_armar_paquete con caso="${caso}".`, guias: datos.soportado === false ? ["formato-portal"] : [] }
    case "proveedor_armar_paquete": {
      const checklist = (datos.checklist ?? {}) as Datos
      const pendientes = etiquetas(checklist.por_confirmar)
      const listo = datos.listo_para_firma === true
      // La guía de paquete bloqueado solo aporta si hay motivos distintos a los campos por confirmar.
      const otrosMotivos = lista(checklist.motivos).some((m) => typeof m === "string" && !m.startsWith("Campos pendientes de confirmación"))
      const resumen =
        "Escribe primero, como texto de tu respuesta, el resumen para el usuario: campos llenos, faltantes, campos por confirmar, si el paquete está listo para firma y por qué no, soportes que debe actualizar y la carpeta del caso. En ese mismo mensaje, después del resumen,"
      if (pendientes.length > 0) {
        return {
          siguiente_paso: `${resumen} llama a agente_solicitar_confirmacion con accion="confirmar_campos", caso="${caso}", etiquetas=${JSON.stringify(pendientes)} y una pregunta que indique, por cada campo, la etiqueta solicitada, el valor propuesto y su origen.`,
          guias: otrosMotivos ? ["campos-por-confirmar", "paquete-bloqueado"] : ["campos-por-confirmar"],
        }
      }
      return {
        siguiente_paso: `${resumen} llama a agente_solicitar_confirmacion con accion="enviar", caso="${caso}", etiquetas=[] y una pregunta sobre si simular el envío al cliente${listo ? "" : ", después de indicar los motivos por los que el paquete no está listo para firma"}.`,
        guias: listo ? [] : ["paquete-bloqueado"],
      }
    }
    case "proveedor_simular_envio":
      return {
        siguiente_paso: "Informa la ruta del archivo de envío simulado y recuerda que la firma y el envío real los hacen personas. No llames más herramientas.",
        guias: [],
      }
    case "agente_solicitar_confirmacion":
      return { siguiente_paso: "El turno termina aquí; espera la respuesta del usuario.", guias: [] }
    default:
      return { siguiente_paso: "Continúa con lo que pidió el usuario.", guias: [] }
  }
}

function trasError(herramienta: string, error: string): Orientacion {
  switch (herramienta) {
    case "proveedor_leer_solicitud":
      return {
        siguiente_paso: `Explica el problema al usuario en lenguaje claro y pídele que verifique el nombre del caso. No llames otras herramientas para este caso. ${NO_REINTENTAR}`,
        guias: ["caso-no-disponible"],
      }
    case "proveedor_simular_envio":
      return {
        siguiente_paso: `No se envió nada. Si el usuario quiere enviar, llama a agente_solicitar_confirmacion con accion="enviar". ${NO_REINTENTAR}`,
        guias: ["envio"],
      }
    case "proveedor_generar_formulario":
      if (error.includes("confirm")) {
        return {
          siguiente_paso: `La confirmación no se aplicó. Explícalo al usuario y, si corresponde, vuelve a solicitarla con agente_solicitar_confirmacion. ${NO_REINTENTAR}`,
          guias: ["campos-por-confirmar"],
        }
      }
      return { siguiente_paso: `Explica el error al usuario en lenguaje claro y continúa con lo que sí se pueda hacer. ${NO_REINTENTAR}`, guias: [] }
    case "agente_solicitar_confirmacion":
      return { siguiente_paso: "Corrige la llamada según el error indicado o explica al usuario por qué no se puede confirmar.", guias: [] }
    default:
      return { siguiente_paso: `Explica el error al usuario en lenguaje claro y continúa con lo que sí se pueda hacer. ${NO_REINTENTAR}`, guias: [] }
  }
}

export function orientar(herramienta: string, caso: string, resultado: { ok: true; data: unknown } | { ok: false; error: string }): Orientacion {
  if (resultado.ok) {
    const datos = typeof resultado.data === "object" && resultado.data !== null ? (resultado.data as Datos) : {}
    return trasExito(herramienta, caso, datos)
  }
  return trasError(herramienta, resultado.error)
}
