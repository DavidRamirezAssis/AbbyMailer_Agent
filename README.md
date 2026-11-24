# AbbyMailer_Agent

Este repositorio contiene una prueba técnica que implementa un agente conversacional para automatizar el registro de proveedores: interpreta la solicitud del cliente, completa el formulario con datos verificados y prepara el paquete para firma, dejando siempre la decisión final en manos de las personas. Construido con TypeScript, Bun y Claude.

Reto técnico 01: Agente "Registro como Proveedor". El agente prepara el registro de Periferia IT Group como proveedor ante sus clientes: lee la solicitud, llena el formulario desde el repositorio maestro y arma el paquete para firma. Nunca firma ni envía sin confirmación humana.


## Requisitos

- [Bun](https://bun.sh) 1.4 o superior.

## Levantar en local

```bash
bun install
cp .env.example .env   # completar ANTHROPIC_API_KEY
bun run dev            # front y backend en una sola URL
```

La aplicación queda disponible en `http://localhost:3000`.

## Demo sin modelo

Ejecuta todos los casos llamando directamente a las herramientas. No requiere clave de ningún proveedor.

```bash
bun install && bun run demo.ts
```

## Pruebas

Pruebas del ciclo del agente, la API y el flujo con un modelo simulado. No requieren clave ni consumen créditos.

```bash
bun test            # 53 pruebas
bun run typecheck   # revisión de tipos
```

## Variables de entorno

Ver `.env.example`: cada variable está comentada. La única obligatoria para el chat es `ANTHROPIC_API_KEY`; `demo.ts` y las pruebas no la necesitan.

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servicio, proveedor y modelo, sin exponer claves. |
| `POST` | `/api/chat` | `{ sessionId?, message?, confirmacion?: { decision } }` -> `{ sessionId, reply, toolCalls[], needsConfirmation, confirmacion, archivos[], modelo, uso }`. Sin `sessionId` crea una sesión. |
| `GET` | `/api/sessions/:id` | Historial completo de la sesión: turnos, llamadas a herramientas, confirmación pendiente y consumo. |
| `GET` | `/api/files/:caso` | Archivos generados del caso (sin los archivos internos de trabajo). |
| `GET` | `/api/files/:caso/<ruta>` | Descarga de un archivo generado. Si hay `ACCESS_KEY`, acepta la cabecera `x-access-key` o el parámetro `?clave=`. |

## Link de prueba

**https://abbymailer-agent.onrender.com**

- No requiere clave de acceso.
- El servicio está en la capa gratuita de Render: si estuvo inactivo más de 15 minutos, el primer acceso puede tardar cerca de un minuto.
- Ejemplo para empezar: `Procesa el caso ec-corp-andina. Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.`

## Documentación

| Documento | Contenido |
|---|---|
| `SOLUCION.md` | Planteamiento de la solución (estructura de PRD §9.1). |
| `docs/HISTORIAS-USUARIO.md` | Historias de usuario granulares con criterios de aceptación. |
| `docs/DECISIONES.md` | Registro de decisiones con su trazabilidad al PRD. |
| `docs/PRUEBAS.md` | Pruebas de robustez del agente y arranque en máquina limpia. |
