import { z } from "zod"
import { definirHerramienta, fallo } from "./contrato.ts"

// Herramientas del proceso de registro como proveedor (PRD §6.2).
// El nombre que ve el modelo es proveedor_<export>.
// Estado: andamiaje. La lógica se implementa según el cronograma de DEC-20.

const EN_CONSTRUCCION = "Herramienta en construcción"

const argCaso = z.string().min(1).describe("Nombre de la carpeta del caso en fixtures/reto-01/casos/")

export const leer_solicitud = definirHerramienta({
  description:
    "Lee la solicitud de un caso y devuelve país, cliente, formato de salida, campos solicitados y soportes exigidos.",
  args: { caso: argCaso },
  async execute(_args, _ctx) {
    return fallo(EN_CONSTRUCCION)
  },
})

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
  async execute(_args, _ctx) {
    return fallo(EN_CONSTRUCCION)
  },
})

export const generar_formulario = definirHerramienta({
  description:
    "Genera el formulario lleno en el formato pedido por el cliente usando solo valores del repositorio maestro.",
  args: {
    caso: argCaso,
    mapeo: z
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
      .describe("Resultado del mapeo y confirmaciones del usuario"),
  },
  async execute(_args, _ctx) {
    return fallo(EN_CONSTRUCCION)
  },
})

export const armar_paquete = definirHerramienta({
  description:
    "Arma el paquete para firma con formulario, soportes, checklist y borrador de correo, e indica si está listo para firma.",
  args: { caso: argCaso },
  async execute(_args, _ctx) {
    return fallo(EN_CONSTRUCCION)
  },
})

export const simular_envio = definirHerramienta({
  description:
    "Simula el envío del paquete al cliente; solo procede si el usuario lo confirmó explícitamente en su último mensaje.",
  args: {
    caso: argCaso,
    confirmado: z.boolean().describe("true solo si el usuario confirmó explícitamente el envío en su último mensaje"),
  },
  async execute(_args, _ctx) {
    return fallo(EN_CONSTRUCCION)
  },
})
