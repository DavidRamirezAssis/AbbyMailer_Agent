import { join } from "node:path"

// Prompt de sistema: comportamiento (agent/prompt.md) más conocimiento del
// proceso (src/knowledge/registro-proveedor.md). Ninguno se embebe en código (PRD §6.1, §6.5).

export async function cargarPromptSistema(raiz: string): Promise<string> {
  const [comportamiento, conocimiento] = await Promise.all([
    Bun.file(join(raiz, "agent", "prompt.md")).text(),
    Bun.file(join(raiz, "src", "knowledge", "registro-proveedor.md")).text(),
  ])
  return `${comportamiento.trim()}\n\n---\n\n${conocimiento.trim()}\n`
}
