# AbbyMailer_Agent

Este repositorio contiene una prueba técnica que implementa un agente conversacional para automatizar el registro de proveedores: interpreta la solicitud del cliente, completa el formulario con datos verificados y prepara el paquete para firma, dejando siempre la decisión final en manos de las personas. Construido con TypeScript, Bun y Claude.

Reto técnico 01: Agente "Registro como Proveedor". El agente prepara el registro de Periferia IT Group como proveedor ante sus clientes: lee la solicitud, llena el formulario desde el repositorio maestro y arma el paquete para firma. Nunca firma ni envía sin confirmación humana.


## Requisitos

- [Bun](https://bun.sh) 1.4 o superior.

## Levantar en local

```bash
bun install
cp .env.example .env   # completar ANTHROPIC_API_KEY
bun run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Demo sin modelo

Ejecuta todos los casos llamando directamente a las herramientas. No requiere clave de ningún proveedor.

```bash
bun install && bun run demo.ts
```

## Pruebas

Pruebas del ciclo del agente con un adaptador simulado. No requieren clave ni consumen créditos.

```bash
bun test
```

## Variables de entorno

Ver `.env.example`.

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servicio, proveedor y modelo, sin exponer claves. |
| `POST` | `/api/chat` | `{ sessionId?, message?, confirmacion?: { decision } }` -> `{ sessionId, reply, toolCalls[], needsConfirmation, confirmacion, archivos[], modelo, uso }`. Sin `sessionId` crea una sesión. |
| `GET` | `/api/sessions/:id` | Historial completo de la sesión: turnos, llamadas a herramientas, confirmación pendiente y consumo. |
| `GET` | `/api/files/:caso` | Archivos generados del caso (sin los archivos internos de trabajo). |
| `GET` | `/api/files/:caso/<ruta>` | Descarga de un archivo generado. Si hay `ACCESS_KEY`, acepta la cabecera `x-access-key` o el parámetro `?clave=`. |

## Link de prueba

Pendiente de despliegue.
