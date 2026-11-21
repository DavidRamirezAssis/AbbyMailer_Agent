# Conocimiento del proceso: registro como proveedor

> Estado: borrador del andamiaje. Concentra las reglas de negocio para que un cambio de reglas no toque el servidor (PRD §6.5).

## Identificador tributario por país (RN1)

| País | Código | Identificador | Tratamiento |
|---|---|---|---|
| Colombia | CO | NIT | Se llena con el NIT del maestro. |
| Ecuador | EC | RUC | Se llena con el NIT y requiere confirmación: identificador extranjero. |
| Perú | PE | RUC | Se llena con el NIT y requiere confirmación: identificador extranjero. |
| Panamá | PA | RUC | Se llena con el NIT y requiere confirmación: identificador extranjero. |
| Honduras | HN | RTN | Se llena con el NIT y requiere confirmación: identificador extranjero. |

## Catálogo de países (DEC-15)

| Código | Nombre |
|---|---|
| CO | Colombia |
| EC | Ecuador |
| PE | Perú |
| PA | Panamá |
| HN | Honduras |

## Datos bancarios (RN2)

Se llenan solo si la plantilla del cliente los pide explícitamente. Nunca se incluyen en el borrador de correo.

## Vigencia de soportes (RN3, DEC-02)

- Un soporte está vencido si su `vigencia_hasta` es anterior a la fecha de referencia. El mismo día sigue vigente.
- `vigencia_hasta` nula: el soporte no vence.
- Un soporte vencido o ausente bloquea `listo_para_firma`. Un campo faltante no lo bloquea.
- Un campo que requiere confirmación bloquea `listo_para_firma` hasta que el usuario lo acepte o lo descarte (DEC-09).

## Advertencias no bloqueantes

- Cámara de Comercio: algunos clientes exigen antigüedad máxima de 30 días; el repositorio no registra la fecha de expedición (DEC-11).
- Soportes emitidos en un país distinto al del cliente: verificar aceptación o apostilla (DEC-12).

## Montos (DEC-16)

Ningún monto se escribe sin su moneda y su año de referencia.
