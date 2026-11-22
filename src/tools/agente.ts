import { z } from "zod"
import { definirHerramienta } from "./contrato.ts"
import { ejecutar, error } from "./ejecucion.ts"
import { leerEstadoPaquete, leerMapeo } from "./estado.ts"
import { nombreCasoValido } from "./fuentes.ts"

// Herramientas de control del agente. El nombre que ve el modelo es agente_<export>.
// Todo lo que exporta este módulo se registra como herramienta.

/**
 * DEC-24: única vía para abrir una confirmación. El backend registra la confirmación
 * pendiente con estos datos y cierra el turno con la pregunta.
 */
export const solicitar_confirmacion = definirHerramienta({
  description:
    "Cierra el turno con una pregunta de confirmación al usuario. Es la única forma válida de pedirle que confirme campos o un envío.",
  args: {
    accion: z
      .enum(["confirmar_campos", "enviar"])
      .describe("confirmar_campos para campos en requiere_confirmacion; enviar para el envío simulado del paquete"),
    caso: z.string().min(1).describe("Nombre de la carpeta del caso en fixtures/reto-01/casos/"),
    etiquetas: z
      .array(z.string().min(1))
      .describe("Etiquetas de los campos a confirmar, tal como aparecen en el mapeo; lista vacía si la acción es enviar"),
    pregunta: z
      .string()
      .min(1)
      .describe("Pregunta explícita para el usuario: etiqueta solicitada, valor propuesto y su origen, o estado del paquete antes del envío"),
  },
  async execute({ accion, caso, etiquetas, pregunta }, ctx) {
    return ejecutar(ctx, "agente_solicitar_confirmacion", caso, async () => {
      if (!nombreCasoValido(caso)) return error(`El nombre de caso "${caso}" no es válido.`)

      if (accion === "confirmar_campos") {
        if (etiquetas.length === 0) return error("Indique las etiquetas de los campos que el usuario debe confirmar.")
        const mapeo = await leerMapeo(ctx, caso)
        if (!mapeo.ok) return error(mapeo.error)
        const pendientes = new Set(mapeo.data.campos.filter((c) => c.estado === "requiere_confirmacion").map((c) => c.etiqueta))
        const invalidas = etiquetas.filter((e) => !pendientes.has(e))
        if (invalidas.length > 0) return error(`Estos campos no están pendientes de confirmación: ${invalidas.join(", ")}.`)
      } else {
        const estado = await leerEstadoPaquete(ctx, caso)
        if (!estado.ok) return error(estado.error)
      }

      const data = { accion, caso, etiquetas: accion === "enviar" ? [] : etiquetas, pregunta }
      return { resultado: { ok: true, data }, resumen: `confirmación solicitada: ${accion}` }
    })
  },
})
