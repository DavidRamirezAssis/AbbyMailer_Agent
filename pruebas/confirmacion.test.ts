import { describe, expect, test } from "bun:test"
import { type ConfirmacionPendiente, construirConfirmacion, interpretarTexto } from "../src/agente/confirmacion.ts"

// Interpretación determinista de respuestas a una confirmación pendiente (DEC-06, DEC-25).

describe("interpretación de la respuesta del usuario", () => {
  const casos: [string, ConfirmacionPendiente["accion"], string][] = [
    ["Sí", "confirmar_campos", "aceptar"],
    ["si, usa el NIT", "confirmar_campos", "aceptar"],
    ["Confirmo", "confirmar_campos", "aceptar"],
    ["De acuerdo, adelante", "confirmar_campos", "aceptar"],
    ["No", "confirmar_campos", "descartar"],
    ["Descártalo", "confirmar_campos", "descartar"],
    ["No. Logística del Istmo nos pidió tramitar primero el RUC panameño; no pongas el NIT.", "confirmar_campos", "descartar"],
    ["sí, pero no lo uses", "confirmar_campos", "ninguna"],
    ["tal vez", "confirmar_campos", "ninguna"],
    ["Si el cliente acepta el NIT úsalo, si no déjalo vacío porque todavía no sabemos", "confirmar_campos", "ninguna"],
    ["envía", "enviar", "aceptar"],
    ["Sí, envía", "enviar", "aceptar"],
    ["envía", "confirmar_campos", "ninguna"],
    ["no envíes nada", "enviar", "descartar"],
    ["¿quieres revisar el borrador?", "enviar", "ninguna"],
  ]
  for (const [texto, accion, esperado] of casos) {
    test(`"${texto}" (${accion}) -> ${esperado}`, () => {
      expect(interpretarTexto(texto, accion)).toBe(esperado as ReturnType<typeof interpretarTexto>)
    })
  }
})

describe("confirmación que recibe la herramienta", () => {
  const campos: ConfirmacionPendiente = { accion: "confirmar_campos", caso: "pa-logistica-istmo", etiquetas: ["RUC"], pregunta: "?" }
  const envio: ConfirmacionPendiente = { accion: "enviar", caso: "pa-logistica-istmo", etiquetas: [], pregunta: "?" }

  test("la decisión sobre campos se registra por etiqueta", () => {
    expect(construirConfirmacion(campos, "descartar")).toEqual({
      accion: "confirmar_campos",
      caso: "pa-logistica-istmo",
      etiquetas: ["RUC"],
      decisiones: { RUC: "descartar" },
    })
  })

  test("un envío solo se autoriza con una respuesta afirmativa", () => {
    expect(construirConfirmacion(envio, "aceptar")).toEqual({ accion: "enviar", caso: "pa-logistica-istmo" })
    expect(construirConfirmacion(envio, "descartar")).toBeUndefined()
  })
})
