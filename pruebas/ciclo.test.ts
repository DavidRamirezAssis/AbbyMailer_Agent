import { describe, expect, test } from "bun:test"
import { join } from "node:path"
import { type OpcionesTurno, ejecutarTurno } from "../src/agente/ciclo.ts"
import {
  type AdaptadorLLM,
  type BloqueMensaje,
  ErrorProveedorLLM,
  type Mensaje,
  type RespuestaModelo,
} from "../src/llm/adapter.ts"
import { HERRAMIENTAS_CON_ESTADO, herramientas } from "../src/tools/index.ts"

// Pruebas del ciclo del agente sin modelo real: un adaptador simulado devuelve
// respuestas guionizadas. No consume créditos del proveedor.

const RAIZ = join(import.meta.dir, "..")
process.env.FECHA_REFERENCIA ||= "2026-09-03"

type Guion = (mensajes: Mensaje[]) => RespuestaModelo

function adaptadorSimulado(guiones: Guion[]): AdaptadorLLM & { llamadas: number } {
  const simulado = {
    proveedor: "simulado",
    modelo: "guion",
    llamadas: 0,
    async enviar(mensajes: Mensaje[]): Promise<RespuestaModelo> {
      const guion = guiones[Math.min(simulado.llamadas, guiones.length - 1)]
      simulado.llamadas++
      if (guion === undefined) throw new Error("Guion vacío")
      return guion(mensajes)
    },
  }
  return simulado
}

let contador = 0
function llamar(nombre: string, argumentos: unknown, texto = ""): Guion {
  return () => {
    const bloques: BloqueMensaje[] = texto ? [{ tipo: "texto", texto }] : []
    bloques.push({ tipo: "llamada", llamada: { id: `llamada-${++contador}`, nombre, argumentos } })
    return { mensaje: { rol: "asistente", bloques }, motivoFin: "uso_herramienta", uso: { tokensEntrada: 100, tokensSalida: 10 } }
  }
}

function responder(texto: string): Guion {
  return () => ({ mensaje: { rol: "asistente", bloques: [{ tipo: "texto", texto }] }, motivoFin: "fin_turno", uso: { tokensEntrada: 100, tokensSalida: 10 } })
}

function opciones(adaptador: AdaptadorLLM, cambios: Partial<OpcionesTurno> = {}): OpcionesTurno {
  return {
    adaptador,
    herramientas,
    sistema: "prueba",
    ctx: { directory: RAIZ, sessionId: "prueba" },
    maxIteraciones: 25,
    presupuestoTokens: 90000,
    herramientasConEstado: HERRAMIENTAS_CON_ESTADO,
    ...cambios,
  }
}

function ultimoResultado(mensajes: Mensaje[]): Extract<BloqueMensaje, { tipo: "resultado" }> | undefined {
  const bloque = mensajes.flatMap((m) => m.bloques).filter((b) => b.tipo === "resultado").at(-1)
  return bloque?.tipo === "resultado" ? bloque : undefined
}

describe("ciclo del agente", () => {
  test("ejecuta una herramienta y devuelve la respuesta final del modelo", async () => {
    const adaptador = adaptadorSimulado([llamar("proveedor_leer_solicitud", { caso: "co-industrias-delta" }), responder("Solicitud leída.")])
    const turno = await ejecutarTurno([], "Lee el caso", opciones(adaptador))
    expect(turno.motivo).toBe("respuesta")
    expect(turno.respuesta).toBe("Solicitud leída.")
    expect(turno.llamadas).toHaveLength(1)
    expect(turno.llamadas[0]?.ok).toBe(true)
    expect(turno.mensajesNuevos.map((m) => m.rol)).toEqual(["usuario", "asistente", "usuario", "asistente"])
  })

  test("rechaza argumentos inválidos antes de ejecutar la herramienta (CA-14.03)", async () => {
    const adaptador = adaptadorSimulado([llamar("proveedor_simular_envio", { caso: "", confirmado: "si" }), responder("Corregido.")])
    const turno = await ejecutarTurno([], "Envía", opciones(adaptador))
    const resultado = ultimoResultado(turno.mensajesNuevos)
    expect(resultado?.esError).toBe(true)
    expect(resultado?.contenido).toContain("Argumentos inválidos para proveedor_simular_envio")
    expect(turno.llamadas[0]?.ok).toBe(false)
  })

  test("informa una herramienta inexistente sin romper el turno", async () => {
    const adaptador = adaptadorSimulado([llamar("proveedor_borrar_todo", {}), responder("Entendido.")])
    const turno = await ejecutarTurno([], "Hola", opciones(adaptador))
    expect(ultimoResultado(turno.mensajesNuevos)?.contenido).toContain("no existe")
    expect(turno.motivo).toBe("respuesta")
  })

  test("bloquea la repetición de una llamada sin cambios de estado (DEC-28)", async () => {
    const leer = { caso: "co-industrias-delta" }
    const adaptador = adaptadorSimulado([llamar("proveedor_leer_solicitud", leer), llamar("proveedor_leer_solicitud", leer), responder("Listo.")])
    const turno = await ejecutarTurno([], "Lee", opciones(adaptador))
    expect(turno.llamadas.map((l) => l.ok)).toEqual([true, false])
    expect(String(turno.llamadas[1]?.resultado)).toContain("ya se ejecutó")
  })

  test("permite repetir una llamada cuando otra herramienta cambió el estado", async () => {
    const caso = "co-industrias-delta"
    const adaptador = adaptadorSimulado([
      llamar("proveedor_mapear_campos", { caso, campos: ["Razón social"] }),
      llamar("proveedor_generar_formulario", { caso, mapeo: {} }),
      llamar("proveedor_armar_paquete", { caso }),
      llamar("proveedor_generar_formulario", { caso, mapeo: {} }),
      llamar("proveedor_armar_paquete", { caso }),
      responder("Paquete listo."),
    ])
    const turno = await ejecutarTurno([], "Procesa", opciones(adaptador))
    expect(turno.llamadas.every((l) => l.ok)).toBe(true)
  })

  test("responde con lo obtenido y lo que falta al alcanzar el tope de iteraciones (CA1)", async () => {
    const adaptador = adaptadorSimulado([
      llamar("proveedor_leer_solicitud", { caso: "co-industrias-delta" }),
      llamar("proveedor_leer_solicitud", { caso: "ec-corp-andina" }),
      llamar("proveedor_leer_solicitud", { caso: "hn-agroexport-sula" }),
    ])
    const turno = await ejecutarTurno([], "Lee todo", opciones(adaptador, { maxIteraciones: 2 }))
    expect(turno.motivo).toBe("tope_iteraciones")
    expect(adaptador.llamadas).toBe(2)
    expect(turno.respuesta).toContain("límite de 2 pasos")
    expect(turno.respuesta).toContain("proveedor_leer_solicitud")
  })

  test("muestra un error del proveedor en lenguaje claro sin lanzar (CA-14.04)", async () => {
    const adaptador = adaptadorSimulado([
      () => {
        throw new ErrorProveedorLLM("tiempo_agotado")
      },
    ])
    const turno = await ejecutarTurno([], "Procesa", opciones(adaptador))
    expect(turno.motivo).toBe("error_proveedor")
    expect(turno.respuesta).toContain("tardó demasiado")
  })

  test("un error inesperado del adaptador también se traduce a un mensaje claro", async () => {
    const adaptador = adaptadorSimulado([
      () => {
        throw new Error("detalle interno con sk-ant-clave")
      },
    ])
    const turno = await ejecutarTurno([], "Procesa", opciones(adaptador))
    expect(turno.motivo).toBe("error_proveedor")
    expect(turno.respuesta).not.toContain("sk-ant")
  })

  test("se detiene al agotar el presupuesto de tokens de la sesión (PRD §8)", async () => {
    const adaptador = adaptadorSimulado([llamar("proveedor_leer_solicitud", { caso: "co-industrias-delta" }), responder("No debería llegar.")])
    const turno = await ejecutarTurno([], "Procesa", opciones(adaptador, { presupuestoTokens: 50 }))
    expect(turno.motivo).toBe("presupuesto_tokens")
    expect(adaptador.llamadas).toBe(1)
  })

  test("una herramienta de cierre termina el turno y las llamadas siguientes no se ejecutan", async () => {
    const adaptador = adaptadorSimulado([
      () => ({
        mensaje: {
          rol: "asistente",
          bloques: [
            { tipo: "texto", texto: "Resumen y pregunta." },
            { tipo: "llamada", llamada: { id: "a", nombre: "proveedor_leer_solicitud", argumentos: { caso: "co-industrias-delta" } } },
            { tipo: "llamada", llamada: { id: "b", nombre: "proveedor_armar_paquete", argumentos: { caso: "co-industrias-delta" } } },
          ],
        },
        motivoFin: "uso_herramienta",
        uso: { tokensEntrada: 100, tokensSalida: 10 },
      }),
    ])
    const turno = await ejecutarTurno([], "Procesa", opciones(adaptador, { herramientasDeCierre: new Set(["proveedor_leer_solicitud"]) }))
    expect(turno.motivo).toBe("herramienta_de_cierre")
    expect(turno.respuesta).toBe("Resumen y pregunta.")
    expect(adaptador.llamadas).toBe(1)
    expect(turno.llamadas[1]?.ok).toBe(false)
    expect(String(turno.llamadas[1]?.resultado)).toContain("no se ejecutó")
  })
})
