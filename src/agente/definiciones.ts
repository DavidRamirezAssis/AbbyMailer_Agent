import { z } from "zod"
import type { DefinicionHerramienta } from "../llm/adapter.ts"
import type { HerramientaRegistrada } from "../tools/index.ts"

// Definiciones que ve el modelo, derivadas de los esquemas zod de cada herramienta.
// El orden es estable (alfabético) para no invalidar la caché del prefijo.

export function definicionesDesde(registro: ReadonlyMap<string, HerramientaRegistrada>): DefinicionHerramienta[] {
  return [...registro.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, herramienta]) => {
      const { $schema: _, ...esquema } = z.toJSONSchema(z.object(herramienta.args)) as Record<string, unknown>
      return { nombre, descripcion: herramienta.description, esquema }
    })
}
