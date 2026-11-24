# Registro de Decisiones de Diseño

## Reto técnico 01: Agente conversacional "Registro como Proveedor"

---

## 1. Control del documento

| Atributo | Valor |
|---|---|
| Documento | Registro de Decisiones de Diseño |
| Versión | 1.14 |
| Fecha | 2026-11-24 |
| Documento fuente | `PRD-01-agente-registro-proveedor 4.md`, versión 2.0 del 2026-09-03 |
| Insumos complementarios | Fixtures en `fixtures/reto-01/` |
| Ubicación | `docs/DECISIONES.md` del repositorio |
| Relación con otros documentos | `SOLUCION.md` resume estas decisiones y las referencia por identificador y sección; `docs/HISTORIAS-USUARIO.md` las cita en cada historia |

### 1.1 Historial de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| 1.0 | 2026-11-20 | Versión inicial con 20 decisiones derivadas del análisis del PRD. |
| 1.1 | 2026-11-20 | Formato formal. Se agrega trazabilidad de cada decisión con el PRD y los fixtures. El documento se mueve fuera del repositorio. |
| 1.2 | 2026-11-20 | Se aprueban DEC-09 (el campo por confirmar bloquea y se resuelve en el chat) y DEC-10 (el envío requiere confirmación, no preparación completa). Se ajustan DEC-04 y DEC-06 para soportar la confirmación de campos. Se amplía el análisis de DEC-18. Se aprueba DEC-20 con un cronograma. Se actualizan los resultados esperados y la matriz de trazabilidad. |
| 1.3 | 2026-11-20 | Se aprueba DEC-18 (Render). Se confirma el trabajo en fin de semana para DEC-20. Se agrega DEC-21 (proveedor y modelo de lenguaje) con un análisis comparativo que prioriza costo e integración. Se agrega la sección 8 con los criterios de decisión y los trade-offs de la selección de plataformas. |
| 1.4 | 2026-11-20 | Se aprueba DEC-21 (Claude Haiku 5.5). No quedan decisiones pendientes. Se inicia el andamiaje del repositorio. |
| 1.5 | 2026-11-21 | Se registran DEC-22 y DEC-23, surgidas durante la implementación de las herramientas, pendientes de validación junto con el documento de historias de usuario. |
| 1.6 | 2026-11-21 | Se aprueban DEC-22 y DEC-23. No quedan decisiones pendientes. |
| 1.7 | 2026-11-22 | Se aprueban DEC-24 a DEC-27, surgidas al detallar el flujo técnico del ciclo del agente: herramienta de control de confirmaciones, decisión registrada por el backend, conservación de decisiones al volver a mapear y sesión inexistente en el front. |
| 1.8 | 2026-11-22 | Se aprueba DEC-28: columna vertebral del flujo con tabla de pasos, ganchos y guías por variante activadas por el sistema. |
| 1.9 | 2026-11-22 | Se registra DEC-29: diseño de la interfaz de chat según los requisitos del equipo, con detalles complementarios a validar en el PR del front. |
| 1.10 | 2026-11-22 | DEC-26 se precisa: las decisiones del usuario se conservan dentro de la misma sesión. |
| 1.11 | 2026-11-22 | DEC-04 se precisa: el argumento `mapeo` solo transporta confirmaciones. |
| 1.12 | 2026-11-22 | Se aprueba la precisión de DEC-04. |
| 1.13 | 2026-11-22 | DEC-21 se corrige: el tope de tokens por sesión sube de 90 000 a 400 000; el umbral de precio aplica por consulta. Se distingue del tope de iteraciones por mensaje. |
| 1.14 | 2026-11-24 | El documento se versiona en `docs/` del repositorio. DEC-18 se ajusta: el servicio se mantiene en la capa gratuita de Render durante la evaluación. |

---

## 2. Propósito y alcance

Este documento registra los vacíos, ambigüedades e inconsistencias encontrados en el PRD y en los fixtures. Para cada uno deja la decisión de diseño adoptada, las alternativas que se evaluaron y el lugar de `SOLUCION.md` donde se documentará.

No reemplaza a `SOLUCION.md`. Su objetivo es dejar validado el contenido de las secciones 6 (Decisiones y trade-offs) y 7 (Supuestos) de ese entregable antes de empezar a implementar.

---

## 3. Convenciones

### 3.1 Referencias al documento fuente

Las referencias tienen el formato `PRD §<sección> L<línea>`. Las líneas corresponden al archivo `PRD-01-agente-registro-proveedor 4.md` en su versión 2.0. Las referencias a fixtures indican la ruta del archivo dentro de `fixtures/reto-01/`.

### 3.2 Tipología del vacío

| Código | Tipo | Definición |
|---|---|---|
| INC | Inconsistencia | Dos partes del PRD, o el PRD y un fixture, se contradicen. |
| OMI | Omisión | El PRD exige un comportamiento pero no define cómo debe hacerse. |
| AMB | Ambigüedad | El texto admite más de una interpretación válida. |
| ENT | Restricción de entorno | Una condición externa al PRD (fecha, infraestructura) altera el resultado esperado. |

### 3.3 Estado de la decisión

| Estado | Definición |
|---|---|
| Aprobada | Validada por el equipo. Se puede implementar. |
| Pendiente | Hay una propuesta formulada, pero requiere validación expresa antes de implementar. |

### 3.4 Destino en SOLUCION.md

Se indica la sección de `SOLUCION.md` (PRD §9.1 L308 a L317) donde se documentará cada decisión. Los destinos principales son:
- §6 Decisiones y trade-offs.
- §7 Supuestos.
- §2 Arquitectura.
- §3 Ciclo del agente.
- §10 Riesgos.

---

## 4. Resumen de decisiones

| ID | Título | Tipo | Referencia principal | Estado | Destino |
|---|---|---|---|---|---|
| DEC-01 | Ubicación de los fixtures | INC | PRD §6.5 L229; §7.1 L254 | Aprobada | §2 |
| DEC-02 | Fecha de referencia para vigencias | ENT | PRD encabezado L4; HU-4 L116 | Aprobada | §7 |
| DEC-03 | Responsable de marcar campos ambiguos | INC | HU-1 L93; PRD §6.2 L187-L188 | Aprobada | §6 |
| DEC-04 | Forma del argumento `mapeo` | OMI | PRD §6.2 L189; CA2 L198 | Aprobada | §6 |
| DEC-05 | Precondiciones de `armar_paquete` | OMI | PRD §6.2 L190; HU-5 L123 | Aprobada | §2 |
| DEC-06 | Aplicación de la confirmación humana | OMI | PRD §6.2 L191; CA3 L199; RN4 L278 | Aprobada | §3, §6 |
| DEC-07 | Respuesta del formato portal | AMB | HU-3 L109; HU-5 L124 | Aprobada | §5 |
| DEC-08 | Cálculo de confianza del mapeo | OMI | HU-2 L99, L101 | Aprobada | §6 |
| DEC-09 | Tratamiento de `requiere_confirmacion` | AMB | RN1 L275; RN3 L277; CA3 L199 | Aprobada | §3, §6, §7 |
| DEC-10 | Semántica y precondición del envío | INC | PRD §2.3 L52; HU-4 L117; RN4 L278; §11 L368 | Aprobada | §6, §7, §10 |
| DEC-11 | Antigüedad máxima de la Cámara de Comercio | OMI | PRD §7.2 L268; fixture `co-industrias-delta/solicitud.json` | Aprobada | §7 |
| DEC-12 | Soportes emitidos en un país distinto al del cliente | OMI | PRD §7.2 L268; fixture `hn-agroexport-sula/solicitud.json` | Aprobada | §7 |
| DEC-13 | Ubicación del registro de ejecución | INC | CA4 L200; RN5 L279 | Aprobada | §2 |
| DEC-14 | Tipos de dato en la salida xlsx | OMI | HU-3 L107; fixture `repositorio/maestro.json` | Aprobada | §6 |
| DEC-15 | Transformaciones de valor permitidas | AMB | HU-2 L100; CA2 L198 | Aprobada | §7 |
| DEC-16 | Montos con moneda | OMI | fixture `hn-agroexport-sula/plantilla-celdas.json`; `maestro.json` | Aprobada | §7 |
| DEC-17 | Representación de campos faltantes | OMI | HU-2 L100; O2 L64 | Aprobada | §6 |
| DEC-18 | Hosting y acceso a archivos generados | OMI | PRD §9.3 L325; §6.1 L154; §3.2 L71 | Aprobada | §2, §6, §10 |
| DEC-19 | Fuente canónica del módulo reutilizable | INC | PRD §6.5 L218, L227; §9.4 L338 | Aprobada | §6 |
| DEC-20 | Priorización según la duración | ENT | PRD §0 L12; §9.5 L342 | Aprobada | §7, §8, §10 |
| DEC-21 | Proveedor y modelo de lenguaje | OMI | PRD §0 L15; §8 L297; §9.1 L311 | Aprobada | §4, §6, §10 |
| DEC-22 | Mapeo de la plantilla completa | OMI | PRD §6.2 L188; HU-3 L107 | Aprobada | §6 |
| DEC-23 | Fecha de referencia por defecto en la demo | ENT | PRD §6.6; §8 L295 | Aprobada | §7 |
| DEC-24 | Herramienta de control para solicitar confirmación | OMI | CA3 L199; RN4 L278; §6.4 L209 | Aprobada | §3, §6 |
| DEC-25 | La decisión sobre cada campo la registra el backend | OMI | RN4 L278; CA2 L198 | Aprobada | §3, §6 |
| DEC-26 | El mapeo conserva las decisiones del usuario | OMI | PRD §1 L26 | Aprobada | §6 |
| DEC-27 | Sesión inexistente en el front | ENT | PRD §6.1 L154; §3.2 L71 | Aprobada | §7, §10 |
| DEC-28 | Columna vertebral del flujo: ganchos y guías por variante | OMI | PRD §6.1 L151, L153; §6.5 L238; CA1, CA2 | Aprobada | §2, §3, §6 |
| DEC-29 | Diseño de la interfaz de chat | OMI | PRD §0 L14; §6.1 L149; §8 L297 | Aprobada | §2, §4, §6 |

---

## 5. Detalle de decisiones

### 5.1 Estructura del proyecto y entorno

#### DEC-01. Ubicación de los fixtures

| Atributo | Contenido |
|---|---|
| Tipo | INC |
| Estado | Aprobada |
| Referencias | PRD §6.5 L216 y L229 (estructura sugerida); PRD §7.1 L254 (`fixtures/reto-01/casos/<caso>/`); PRD §7.2 L267 a L269 |
| Vacío | Los fixtures se entregaron en `reto-01/casos/`, `reto-01/repositorio/` y `reto-01/glosario-campos.json`. Las rutas que cita el PRD incluyen el prefijo `fixtures/reto-01/`. |
| Decisión | La raíz del repositorio es `reto-01/`. Los fixtures se reubican en `reto-01/fixtures/reto-01/` sin modificar su contenido. |
| Alternativas descartadas | Hacer la ruta base configurable y conservar la ubicación original. Se descarta porque se aparta de la estructura que el evaluador espera encontrar. |
| Destino en SOLUCION.md | §2 Arquitectura |
| Estado de ejecución | Aplicada. |

#### DEC-02. Fecha de referencia para la evaluación de vigencias

| Atributo | Contenido |
|---|---|
| Tipo | ENT |
| Estado | Aprobada |
| Referencias | PRD encabezado L4 (versión del 2026-09-03); HU-4 L116 ("anterior a la fecha de ejecución"); PRD §8 L295 (determinismo); fixture `repositorio/soportes/index.json` |
| Vacío | La fecha real de ejecución (2026-11-20) es posterior al vencimiento de la Cámara de Comercio (2026-09-30). Por eso todos los casos quedan bloqueados y se pierde la variedad de comportamientos que los fixtures fueron diseñados para mostrar. Además, si se depende del reloj del sistema, el resultado de `demo.ts` cambia según el día de ejecución. |
| Decisión | Se define la variable de entorno `FECHA_REFERENCIA` (formato AAAA-MM-DD), con valor documentado `2026-09-03` en `.env.example`. Si está vacía, se usa la fecha del sistema. Un soporte está vencido cuando `vigencia_hasta` es estrictamente anterior a la fecha de referencia. Un valor `null` significa que el soporte no tiene vencimiento. |
| Alternativas descartadas | (a) Usar siempre la fecha del sistema: hace que el resultado dependa del día de ejecución. (b) Escribir la fecha directamente en el código: impide demostrar los dos escenarios. |
| Destino en SOLUCION.md | §7 Supuestos |
| Estado de ejecución | Aplicada en `reto-01/.env.example`. |

### 5.2 Contrato de herramientas

#### DEC-03. Responsable de marcar campos ambiguos

| Atributo | Contenido |
|---|---|
| Tipo | INC |
| Estado | Aprobada |
| Referencias | HU-1 L93 (`leer_solicitud` reporta `requiere_confirmacion`); PRD §6.2 L187 (salida de `leer_solicitud` sin estados); HU-2 L99 y PRD §6.2 L188 (los estados los produce `mapear_campos`) |
| Vacío | HU-1 asigna el estado `requiere_confirmacion` a la lectura de la solicitud, mientras que el contrato asigna los estados al mapeo. |
| Decisión | `leer_solicitud` devuelve `campos[]` como objetos con `etiqueta`, `obligatorio`, `ubicacion`, `ambiguo` y `equivalente_pais` (este último es opcional). La herramienta solo señala la ambigüedad y propone el identificador del país según RN1 (L275). El estado final lo asigna únicamente `mapear_campos`. |
| Alternativas descartadas | Que ambas herramientas emitan estados. Se descarta porque duplica la regla de negocio y permite resultados contradictorios. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

#### DEC-04. Forma del argumento `mapeo` y protección de los valores

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §6.2 L189 (`{ caso, mapeo }` sin esquema); CA2 L198; PRD §6.1 L151 (las herramientas son la única fuente de valores) |
| Vacío | No se define la estructura de `mapeo`. Si el modelo transmite valores en ese argumento, puede alterarlos antes de que se escriban en el formulario. |
| Decisión | (1) `mapear_campos` guarda su resultado en `out/<caso>/mapeo.json`. (2) `generar_formulario` recibe `mapeo` pero solo toma de él `etiqueta` y `ruta`; vuelve a leer cada valor desde `maestro.json` y lo compara con el `mapeo.json` guardado. Si encuentra una discrepancia, devuelve `{ ok: false, error }`. (3) Si `mapeo` falta o no es válido, usa el `mapeo.json` guardado. (4) `mapeo` puede incluir `confirmaciones: [{ etiqueta, decision: "aceptar" \| "descartar" }]` para los campos en `requiere_confirmacion` (DEC-09). La herramienta solo las aplica si coinciden con la confirmación pendiente que validó el backend (DEC-06). Con "aceptar" el campo pasa a `lleno` y queda registrado como confirmado por el usuario. Con "descartar" pasa a `faltante`. El resultado actualiza `mapeo.json`. |
| Alternativas descartadas | (a) Escribir los valores recibidos del modelo: viola CA2. (b) Eliminar el argumento `mapeo`: altera el contrato mínimo. |
| Ajuste de implementación | Aprobado. En la prueba con el modelo real, el modelo envió en `mapeo` la lista de campos con una ruta distinta para el RUC; la verificación la rechazó y el formulario no se generó. Como la herramienta nunca usa las rutas que envía el modelo, esa verificación no protegía nada y solo provocaba fallos y gasto de tokens. Se precisa la decisión: `mapeo` solo transporta `confirmaciones`; el mapeo registrado en `out/<caso>/mapeo.json` es la única fuente. El argumento `mapeo` se conserva, por lo que el contrato mínimo no cambia. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

#### DEC-05. Precondiciones de `armar_paquete`

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §6.2 L190 (entrada solo `{ caso }`); HU-4 L115; HU-5 L123 ("el proceso continúa con lo que sí puede hacer") |
| Vacío | La herramienta necesita el formulario y el resultado del mapeo, pero solo recibe el identificador del caso. Tampoco se define qué hacer si se invoca antes de los pasos previos. |
| Decisión | El estado de cada caso se guarda en `out/<caso>/` y las herramientas no se encadenan entre sí. Si no existe `mapeo.json`, la herramienta devuelve `{ ok: false, error: "Primero mapea los campos del caso" }`. Si no existe el formulario, arma el paquete igual, registra el formulario como ausente en el checklist y fija `listo_para_firma = false`. |
| Alternativas descartadas | Que la herramienta ejecute de forma implícita los pasos previos. Se descarta porque oculta las llamadas al historial visible que exige CA4 (L200). |
| Destino en SOLUCION.md | §2 Arquitectura |

#### DEC-06. Aplicación de la confirmación humana

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §6.2 L191 (`confirmado` como argumento); CA3 L199; RN4 L278 ("turno inmediatamente anterior"); PRD §10 L352 (riesgo de un modelo que actúa por su cuenta) |
| Vacío | El argumento `confirmado` lo llena el modelo, así que la confirmación depende solo de que el modelo obedezca el prompt. |
| Decisión | Se aplica un control doble. (1) Cuando el agente pide confirmación, el backend guarda en la sesión el estado `pendingConfirmation` con la acción y el caso, y responde `needsConfirmation: true`. Hay dos acciones posibles: `confirmar_campos` (DEC-09), que incluye las etiquetas en cuestión, y `enviar` (DEC-10). Las dos nunca se combinan en una misma pregunta. (2) En el turno siguiente, la confirmación es válida solo si llega por el control de confirmación del front o si el texto normalizado del usuario está en una lista cerrada de expresiones afirmativas. (3) El backend pasa esa validación a la herramienta en el campo opcional `ctx.confirmacionUsuario`, que indica la acción y las etiquetas confirmadas. `simular_envio` exige que `args.confirmado` sea verdadero y que `ctx.confirmacionUsuario` corresponda a la acción `enviar` del caso. `generar_formulario` solo aplica `mapeo.confirmaciones` si `ctx.confirmacionUsuario` corresponde a la acción `confirmar_campos` del caso y a esas mismas etiquetas. (4) La confirmación caduca al terminar el turno. |
| Alternativas descartadas | (a) Depender solo del prompt: es la mitigación débil que el propio PRD identifica como riesgo. (b) Clasificar la confirmación con el modelo: no es determinista. |
| Impacto | Se amplía la firma de `ctx` (PRD §6.2 L170) con un campo opcional. `demo.ts` no lo envía, por lo que allí `simular_envio` se rechaza, que es el comportamiento esperado. |
| Destino en SOLUCION.md | §3 Ciclo del agente; §6 Decisiones y trade-offs |

#### DEC-07. Respuesta de la herramienta para el formato portal

| Atributo | Contenido |
|---|---|
| Tipo | AMB |
| Estado | Aprobada |
| Referencias | HU-3 L109 (responder "formato no soportado" y producir `valores-portal.md`); HU-5 L124 (`{ ok, data }` o `{ ok: false, error }`); PRD §7.1 L260 (`plantilla-campos.json` solo para pdf); fixture `pa-logistica-istmo/plantilla-campos.json` |
| Vacío | La herramienta debe informar que el formato no está soportado y, al mismo tiempo, producir un artefacto. Esas dos cosas no encajan con el resultado binario del contrato. Además, el fixture del caso portal incluye `plantilla-campos.json`, lo que contradice L260. |
| Decisión | Se devuelve `{ ok: true, data: { ruta, formato: "portal", soportado: false, mensaje: "formato no soportado: se generaron los valores para copiar" } }`. Se usa `ok: true` porque la herramienta sí produjo un artefacto útil. Los campos se toman de `plantilla-campos.json` del caso. |
| Alternativas descartadas | Devolver `ok: false`. Se descarta porque el modelo lo interpretaría como un fallo y podría no informar del artefacto generado. |
| Destino en SOLUCION.md | §5 Diseño del portal web |

### 5.3 Reglas de negocio

#### DEC-08. Cálculo de la confianza del mapeo

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | HU-2 L99 (umbral de confianza 0.8); HU-2 L101 (sinónimos del glosario); PRD §8 L295 (determinismo); fixture `glosario-campos.json` |
| Vacío | El PRD fija un umbral de confianza pero no define cómo se calcula. |
| Decisión | El mapeo es determinista y no usa el modelo. Coincidencia exacta con una clave del glosario: 1.00. Coincidencia normalizada (minúsculas, sin tildes, sin puntuación, espacios colapsados): 0.95. Coincidencia aproximada: coeficiente de Dice sobre tokens, excluyendo palabras vacías. Con confianza mayor o igual a 0.8 el campo queda `lleno`; entre 0.5 y menos de 0.8, `requiere_confirmacion` con la ruta candidata; por debajo de 0.5, `faltante`. Si la ruta no existe en el maestro, el campo es `faltante`. La regla RN1 se aplica al final y prevalece. |
| Verificación con fixtures | "Número de contribuyente especial" frente a "Número de cuenta" da 0.4, por lo que queda `faltante`. "Referencias comerciales" no tiene candidato y también queda `faltante`. |
| Alternativas descartadas | Que el modelo proponga mapeos. Aumenta la cobertura pero compromete la trazabilidad y el determinismo de `demo.ts`. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

#### DEC-09. Tratamiento de los campos `requiere_confirmacion`

| Atributo | Contenido |
|---|---|
| Tipo | AMB |
| Estado | Aprobada |
| Referencias | RN1 L275 (se llena con el NIT y se marca); RN3 L277 (lista de bloqueos de `listo_para_firma`); CA3 L199 (turno de confirmación humana); HU-4 L115 (contenido del checklist); PRD §4 L80 (la analista interactúa por el chat); objetivo O3 L65 |
| Vacío | RN3 no establece si un campo pendiente de confirmación bloquea el estado `listo_para_firma`, ni da ningún tratamiento a esos campos. Tampoco existe un mecanismo para que la analista los confirme o descarte. |
| Decisión | (1) Mientras exista al menos un campo en `requiere_confirmacion`, el estado `listo_para_firma` queda en `false` con el motivo "campos pendientes de confirmación". (2) La confirmación se resuelve en el chat, no en el documento. El agente cierra el turno con una pregunta concreta por cada campo pendiente, indicando la etiqueta solicitada, el valor propuesto y su origen. Por ejemplo: "El cliente solicita RUC; Periferia solo dispone del NIT 900123456. ¿Se usa como identificador extranjero?". El backend registra `pendingConfirmation` con la acción `confirmar_campos` (DEC-06). (3) La respuesta de la analista se transmite en `mapeo.confirmaciones` (DEC-04). Si acepta, el campo pasa a `lleno`. Si descarta, pasa a `faltante`, que según RN3 no bloquea. Con cualquiera de las dos respuestas el bloqueo se levanta y el flujo no queda sin salida. (4) El formulario se genera sin marcas de revisión, porque los campos ya se resolvieron antes de escribirlo. (5) El prompt instruye al agente a resolver las confirmaciones antes de generar el formulario. Si el usuario pide el proceso completo en un solo mensaje (PRD §11 L362 a L366), el agente genera el paquete bloqueado e informa el motivo. Tras la confirmación, las herramientas regeneran el formulario y el paquete de forma determinista, sin intervención del modelo en el contenido. |
| Justificación | Responde al propósito de automatizar y reducir reprocesos (PRD §1 L26, §2.2 L45). La decisión humana se toma una sola vez, en la interfaz que la analista ya usa, y no requiere un ciclo de visualización, validación, corrección y carga del documento. No amplía el alcance: reutiliza el turno de confirmación exigido por CA3 y el argumento `mapeo` del contrato mínimo, sin agregar herramientas. |
| Alternativas descartadas | (a) Escribir el valor con una marca visual en el documento sin bloquear: traslada al humano la revisión del documento y genera reprocesos. (b) Bloquear sin un mecanismo de resolución: los casos de cuatro de los cinco países (todos excepto CO) quedarían bloqueados de forma permanente por RN1, contrario a O3. (c) Agregar una herramienta específica de confirmación de campos: amplía el contrato sin necesidad. |
| Impacto | Modifica DEC-04 (argumento `confirmaciones`) y DEC-06 (acción `confirmar_campos`). En `demo.ts`, sin confirmación humana, los casos EC, HN y PA quedan bloqueados con el motivo "campos pendientes de confirmación". Ese es el comportamiento esperado (sección 6 de este documento). |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs; §7 Supuestos |

#### DEC-10. Semántica y precondición del envío simulado

| Atributo | Contenido |
|---|---|
| Tipo | INC |
| Estado | Aprobada |
| Referencias | PRD §1 L26; PRD §2.1 L42 (armado del correo de respuesta); PRD §2.3 L52 ("envío del paquete al cliente"); HU-4 L112 ("enviarlo a firma"); HU-4 L117; RN3 L277 (bloquea el estado `listo_para_firma`); RN4 L278 (la acción externa exige confirmación); PRD §11 L362 a L368 |
| Vacío | HU-4 menciona tanto el envío a firma como el envío al cliente. El PRD no define si el envío procede cuando el paquete no está listo para firma. Además, el resultado esperado de PRD §11 L368 pide que el mensaje "envía" produzca `ENVIO-SIMULADO.md` en el caso `ec-corp-andina`, que nunca alcanza `listo_para_firma = true` porque le falta un soporte exigido. Exigir esa precondición contradiría el escenario de evaluación. |
| Decisión | (1) "Enviar" corresponde a la respuesta al cliente. (2) La única precondición de `simular_envio` es la confirmación explícita del usuario en el turno inmediatamente anterior (RN4, DEC-06). RN3 bloquea el estado `listo_para_firma`, no la acción de envío. (3) Si el paquete no está listo, el agente informa los motivos del bloqueo antes de formular la pregunta de confirmación. Esa pregunta es independiente de cualquier confirmación de campos (DEC-09). (4) `ENVIO-SIMULADO.md` registra el destinatario (`solicitud.de`), el asunto, el cuerpo tomado de `borrador-correo.md`, la relación de adjuntos, el valor de `listo_para_firma` con sus motivos y la condición "requiere formulario firmado por el representante legal". |
| Alternativas descartadas | (a) Rechazar el envío si `listo_para_firma = false`: es más estricto, pero contradice el resultado esperado de PRD §11 L368. (b) Interpretar el envío como la remisión al representante legal para firma: el borrador de correo está dirigido al cliente (PRD §2.1 L42). |
| Riesgo asociado | Se podría simular el envío de un paquete incompleto. Se mitiga con la advertencia previa en el chat y con el registro explícito del estado en `ENVIO-SIMULADO.md`. En producción, el envío real seguiría siendo una acción humana (PRD §2.3 L52). |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs; §7 Supuestos |

#### DEC-11. Antigüedad máxima exigida para la Cámara de Comercio

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | Fixture `co-industrias-delta/solicitud.json`, campo `cuerpo` ("no mayor a 30 días"); PRD §7.2 L268 (el índice solo tiene `vigencia_hasta`) |
| Vacío | El cliente exige una antigüedad máxima, pero el repositorio no registra la fecha de expedición del soporte. |
| Decisión | La regla se documenta en `src/knowledge/`. El checklist muestra una advertencia que no bloquea, para que se verifique manualmente la fecha de expedición. |
| Alternativas descartadas | Deducir la fecha de expedición del nombre del archivo (`camara-comercio-2026-08.txt`). Se descarta porque no es una fuente formal. |
| Destino en SOLUCION.md | §7 Supuestos |

#### DEC-12. Soportes emitidos en un país distinto al del cliente

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §7.2 L268 (`pais_emisor`); PRD §7.1 L261; fixture `hn-agroexport-sula/solicitud.json` ("registro tributario de su país", "obligaciones laborales"); fixture `hn-agroexport-sula/soportes-exigidos.json` |
| Vacío | Todos los soportes tienen `pais_emisor = CO`. El PRD no indica si un soporte emitido en otro país debe advertirse o rechazarse. |
| Decisión | Cuando `pais_emisor` es distinto de `solicitud.pais`, el checklist muestra una advertencia que no bloquea (verificar aceptación o apostilla). La fuente de verdad de los soportes exigidos es `soportes-exigidos.json`. El cuerpo del correo solo se usa como contexto. |
| Alternativas descartadas | Interpretar el cuerpo del correo para deducir los soportes. Se descarta porque no es determinista y duplica `soportes-exigidos.json`. |
| Destino en SOLUCION.md | §7 Supuestos |

#### DEC-13. Ubicación del registro de ejecución

| Atributo | Contenido |
|---|---|
| Tipo | INC |
| Estado | Aprobada |
| Referencias | CA4 L200 (`out/log.jsonl`); RN5 L279 (`out/<caso>/log.jsonl`); PRD §8 L296 (seguridad de los registros) |
| Vacío | El PRD fija dos ubicaciones distintas para el mismo registro. |
| Decisión | Se escriben ambos registros. `out/log.jsonl` es global e incluye `sessionId` y `caso`. `out/<caso>/log.jsonl` es por caso. El esquema común es `{ ts, sessionId, caso, herramienta, ok, resumen }`. El campo `resumen` no contiene datos sensibles (números de cuenta o identificadores completos), solo conteos y estados. |
| Alternativas descartadas | Escribir en una sola ubicación. Incumpliría uno de los dos requisitos. |
| Destino en SOLUCION.md | §2 Arquitectura |

### 5.4 Valores y formatos de salida

#### DEC-14. Tipos de dato en la salida xlsx

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | HU-3 L107; PRD §8 L300 (dependencias justificadas); fixture `repositorio/maestro.json` (`codigo_postal: "050021"`, `banco.numero_cuenta: "03100012345"`) |
| Vacío | El PRD no define el tipo de dato de las celdas. Si se escriben como números, se pierden los ceros a la izquierda del código postal y del número de cuenta. |
| Decisión | Los valores de tipo cadena del maestro se escriben como celdas de texto. Los valores numéricos (por ejemplo `numero_empleados`) se escriben como número. Se usa la librería `exceljs` porque soporta estilos y comentarios de celda. |
| Alternativas descartadas | SheetJS en su edición comunitaria, que no permite estilos de celda. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

#### DEC-15. Transformaciones de valor permitidas

| Atributo | Contenido |
|---|---|
| Tipo | AMB |
| Estado | Aprobada |
| Referencias | HU-2 L100 ("nunca inventa un valor"); CA2 L198; PRD §6.5 L238 (el conocimiento vive en `src/knowledge/`); fixture `maestro.json` (`pais: "CO"`) |
| Vacío | Campos como "País" se guardan en el maestro como código ISO. No se define si se pueden presentar de otra forma sin violar la prohibición de inventar valores. |
| Decisión | Solo se permiten transformaciones deterministas declaradas en `src/knowledge/`, como el catálogo de países (CO corresponde a Colombia). El dato de origen sigue siendo el maestro y la transformación queda trazada. |
| Alternativas descartadas | Que el modelo formatee el valor. Viola CA2. |
| Destino en SOLUCION.md | §7 Supuestos |

#### DEC-16. Montos con moneda

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | Fixture `hn-agroexport-sula/plantilla-celdas.json` (campo "Ingresos anuales"); fixture `glosario-campos.json` (ruta `ingresos_ultimo_ano.valor`); fixture `maestro.json` (`moneda: "COP"`, `ano: 2025`) |
| Vacío | La ruta del glosario solo toma el valor numérico. El formulario de un cliente hondureño mostraría una cifra en pesos colombianos sin indicar la moneda. |
| Decisión | El valor se compone desde el maestro con su moneda y su año: "COP 98.000.000.000 (año 2025)". Regla general: ningún monto se escribe sin su moneda. |
| Alternativas descartadas | Marcar el campo como `requiere_confirmacion`. Se descarta porque el maestro sí tiene la información necesaria para presentar el monto sin ambigüedad. |
| Destino en SOLUCION.md | §7 Supuestos |

#### DEC-17. Representación de los campos faltantes en el formulario

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | HU-2 L100; objetivo O2 L64; HU-3 L107 y L108 |
| Vacío | No se define cómo se representa en el formulario un campo sin fuente en el maestro. |
| Decisión | En xlsx, la celda de valor queda vacía, con relleno de advertencia y el comentario "Faltante: no existe en el maestro". En pdf, se escribe la etiqueta y la indicación "pendiente". El campo se lista en el reporte de faltantes del checklist. |
| Alternativas descartadas | Escribir un texto de relleno como valor. El cliente podría procesarlo como un dato real. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

### 5.5 Despliegue y entregables

#### DEC-18. Hosting y acceso a los archivos generados

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §9.3 L325 (link público activo durante la defensa; penalización de -10 si no se despliega); PRD §6.1 L150 y L154 (backend con sesión en memoria o archivo); PRD §3.2 L71 (persistencia en el sistema de archivos local); PRD §6.4 L203 a L211 (API mínima); PRD §8 L294, L296 y L297 (arranque, seguridad y costo); PRD §6.1 L155 (autenticación opcional) |
| Vacío | El PRD exige un link público pero no establece criterios para escoger la plataforma. Quien evalúa desde el link tampoco tiene acceso a los archivos de `out/`. |

**Requisitos que impone la arquitectura.** Los requisitos R1 a R3 son excluyentes: una plataforma que no los cumpla queda descartada.

| ID | Requisito | Origen |
|---|---|---|
| R1 | Proceso persistente y una sola instancia. La sesión en memoria y los archivos de `out/` deben verse igual en todas las peticiones. | PRD §6.1 L150, L154 |
| R2 | Sistema de archivos escribible durante la vida del proceso. Que se pierda al reiniciar es aceptable. | PRD §3.2 L71 |
| R3 | Variables de entorno para secretos y HTTPS. | PRD §8 L296 |
| R4 | Disponibilidad durante la defensa, sin arranques en frío prolongados. | PRD §9.3 L325 |
| R5 | Tiempo de configuración bajo, dado el presupuesto de horas (DEC-20). | DEC-20 |
| R6 | Costo acotado y predecible. | PRD §8 L297 |
| R7 | Peticiones largas (el ciclo del agente puede tomar decenas de segundos) y soporte para Bun mediante contenedor. | PRD §0 L14; §6.3 L197 |

**Evaluación de alternativas** (consulta del 2026-11-20; las condiciones comerciales deben verificarse al contratar). Escala de 1 (bajo) a 5 (alto).

| Alternativa | R1-R3 | R4 Disponibilidad | R5 Configuración | R6 Costo | R7 Peticiones y Bun | Observaciones |
|---|---|---|---|---|---|---|
| Render, capa gratuita | Cumple | 2 | 5 | 5 | 5 | Suspende la instancia tras 15 minutos sin tráfico; reactivarla tarda cerca de un minuto. Sistema de archivos efímero. |
| Render, plan Starter | Cumple | 5 | 5 | 4 | 5 | Sin suspensión. Costo fijo de referencia de USD 7 al mes. |
| Railway, plan Hobby | Cumple | 5 | 5 | 4 | 5 | USD 5 al mes con USD 5 de consumo incluido; crédito de prueba único de USD 5 por 30 días. Cobro por uso, menos predecible. |
| Fly.io | Cumple | 4 | 3 | 4 | 5 | Sin capa gratuita estable; costo bajo por máquina. Requiere su propia CLI y archivo de configuración. |
| Google Cloud Run | No cumple R1 sin instancia mínima pagada | 4 | 2 | 4 | 5 | Escala a cero y pierde la sesión en memoria. Requiere proyecto de GCP, facturación y un registro de imágenes. |
| Vercel u otra plataforma sin servidor | No cumple R1 ni R2 | - | - | - | - | Funciones sin estado, varias instancias y sistema de archivos efímero. |
| Túnel desde el equipo local | Cumple | 2 | 4 | 5 | 5 | Depende de que el equipo esté encendido. Una URL estable requiere un túnel con nombre y un dominio propio. |

| Atributo | Contenido |
|---|---|
| Decisión | Render con despliegue por contenedor (imagen oficial de Bun) desde el repositorio de GitHub. (1) Durante el desarrollo se usa la capa gratuita, que no tiene costo ni exige tarjeta, y se despliega temprano para eliminar el riesgo. (2) Durante la evaluación y la defensa el servicio se mantiene en la capa gratuita, por decisión del equipo (2026-11-24); la instancia se activa minutos antes de la defensa. El plan Starter queda como opción si la suspensión afecta la evaluación. (3) Como contingencia, un túnel desde el equipo local con la misma imagen, que el PRD acepta como "túnel estable" (L325). |
| Justificación | Es la única opción que cumple los requisitos excluyentes con la mayor puntuación en configuración, costo fijo predecible y una ruta sin costo para el desarrollo. Railway Hobby es una alternativa equivalente si ya se dispone de una cuenta. |
| Decisiones de arquitectura derivadas | (a) Un solo servicio sirve el front y la API: una sola URL, sin CORS. (b) `GET /api/files/:caso` (listado) y `GET /api/files/:caso/*` (descarga), con validación contra path traversal; el front muestra los enlaces. (c) `GET /api/health` como verificación de salud de la plataforma. (d) Clave de acceso opcional (`ACCESS_KEY`), entregada en el README (PRD §6.1 L155), para que terceros no consuman la clave del modelo. (e) Tope de iteraciones, tope de tokens por sesión y límite de peticiones por origen, configurables por variables de entorno. (f) Límite de gasto configurado en la consola del proveedor del modelo. |
| Alternativas descartadas | Las indicadas en la tabla de evaluación por incumplir R1 o R2 o por mayor costo de configuración. |
| Riesgo asociado | Las condiciones comerciales pueden cambiar. Si el contenedor se reinicia se pierden las sesiones y `out/`, lo que es aceptable según PRD §3.2 L71. Si la plataforma falla durante la defensa, se usa el túnel de contingencia. |
| Acciones derivadas | Se dispone de una cuenta de GitHub. La cuenta de Render se crea y se vincula al repositorio durante el despliegue temprano del domingo 22 (DEC-20). Se decidió no contratar el plan Starter: el costo de infraestructura del proyecto es cero. |
| Fuentes | render.com/docs/free; docs.railway.com/pricing/plans; fly.io/pricing; cloud.google.com/run/pricing; docs.cloud.google.com/run/quotas |
| Destino en SOLUCION.md | §2 Arquitectura; §6 Decisiones y trade-offs; §10 Riesgos |

#### DEC-19. Fuente canónica del módulo reutilizable

| Atributo | Contenido |
|---|---|
| Tipo | INC |
| Estado | Aprobada |
| Referencias | PRD §6.5 L218 (`agent/prompt.md`) y L227 (`src/knowledge/registro-proveedor.md`); PRD §9.4 L329 a L338 ("las mismas piezas, no copias divergentes") |
| Vacío | El bonus pide los mismos artefactos en otra ubicación y con frontmatter, sin que existan copias divergentes. |
| Decisión | La fuente canónica son `src/` y `agent/`. `modulo/tools/proveedor.ts` re-exporta `src/tools/proveedor.ts`. Los archivos `modulo/agent.md` y `modulo/skill/registro-proveedor/SKILL.md` se generan con un script de construcción que antepone el frontmatter al contenido canónico. `demo.ts` verifica que el contenido coincida comparando hashes. |
| Alternativas descartadas | Usar `modulo/` como fuente canónica. Se aparta de la estructura obligatoria de PRD §6.1 L153. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

#### DEC-20. Priorización según la duración de la prueba

| Atributo | Contenido |
|---|---|
| Tipo | ENT |
| Estado | Aprobada |
| Referencias | PRD §0 L12 (la duración se comunica al inicio); HU-3 L107 a L109 (prioridades P0, P1 y P2); PRD §9.3 L325; PRD §9.4 L329; PRD §9.5 L342 (repositorio con historial de commits) |
| Vacío | Sin la duración no se puede fijar dónde se corta el alcance. |
| Restricción | Entrega el martes 2026-11-24 antes de las 15:00. Dedicación de 4 a 6 horas por día, no de tiempo completo. |
| Supuesto | Se trabaja todos los días calendario, incluido el fin de semana. Capacidad estimada: de 15 a 23 horas entre el viernes 20 y la mañana del martes 24. |
| Decisión | Cronograma por hitos verificables. Los commits son incrementales desde el primer día (PRD §9.5 L342). |

| Día | Horas | Alcance | Hito de cierre |
|---|---|---|---|
| Vie 20-nov | 2 a 3 | Cierre de decisiones pendientes y elección del proveedor de modelo. Andamiaje del proyecto: Bun, TypeScript, zod, estructura de §6.5, repositorio Git, `.gitignore`. | Repositorio inicializado y estructura creada. |
| Sáb 21-nov | 4 a 6 | Herramientas P0: `leer_solicitud`, `mapear_campos` (glosario, confianza, RN1), `generar_formulario` xlsx, `armar_paquete` (checklist, vigencias, borrador de correo). Registros de ejecución. `demo.ts`. | `demo.ts` reproduce los resultados de la sección 6 de este documento. |
| Dom 22-nov | 4 a 6 | Adaptador del modelo, ciclo del agente (tope de iteraciones, validación, errores, doble confirmación), API, `agent/prompt.md`, `src/knowledge/`, front de chat. Despliegue temprano del esqueleto. | El flujo de PRD §11 funciona en local y el link público responde a `/api/health`. |
| Lun 23-nov | 4 a 6 | P1: pdf y `simular_envio`. P2: `valores-portal.md`. Endpoints de archivos. Despliegue completo. README y borrador de `SOLUCION.md`. | Flujo de PRD §11 operando en el link público. |
| Mar 24-nov | 2 a 3 (hasta las 12:00) | Pruebas de humo sobre el link, cierre de `SOLUCION.md`, módulo reutilizable solo si sobra margen, empaquetado y entrega. | Entregado antes de las 15:00, con al menos 3 horas de margen. |

| Atributo | Contenido |
|---|---|
| Criterio de recorte | Si hay retraso respecto a un hito, el alcance se recorta en este orden: (1) módulo reutilizable (bonus); (2) presentación visual del pdf (se conserva el contenido exigido por HU-3 L108); (3) streaming del chat (opcional según PRD §6.1 L149). No se recortan las herramientas P0, el ciclo del agente, la confirmación humana, `demo.ts`, el despliegue ni `SOLUCION.md`. |
| Riesgo asociado | Si el fin de semana no se trabaja, la capacidad baja a unas 8 horas. En ese caso se aplica el criterio de recorte completo y se prioriza el despliegue por su penalización de -10 (L325). |
| Confirmación | Se confirma el trabajo en fin de semana. Aplica la capacidad estimada de 15 a 23 horas. |
| Destino en SOLUCION.md | §8 Cobertura |

### 5.6 Selección del modelo de lenguaje

#### DEC-21. Proveedor y modelo de lenguaje

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §0 L15 (modelo a elección; clave en variable de entorno); PRD §6.1 L152 (adaptador intercambiable); PRD §6.2 L180 (argumentos con zod); PRD §6.3 L197 a L201 (reglas del ciclo); PRD §8 L297 (topes de costo); PRD §9.1 L311 (proveedor, modelo, justificación y costo por caso) |
| Vacío | El PRD deja libre la elección, pero exige justificarla con costo estimado por caso. La clave la paga el candidato. |
| Restricción del equipo | Priorizar el costo, para que la prueba no implique erogaciones altas, y la facilidad de integración y configuración. |

**Requisitos excluyentes.**

| ID | Requisito | Origen |
|---|---|---|
| M1 | Llamado a herramientas (tool use) con esquemas JSON, en conversaciones de varios turnos. | PRD §6.1 L151; §6.3 L197 |
| M2 | Modelo accesible por API desde la plataforma de despliegue (Render, sin GPU). | DEC-18 |
| M3 | Autenticación por clave en variable de entorno del backend. | PRD §0 L15; §8 L296 |

**Supuestos de consumo por caso procesado** (flujo completo de PRD §11): cerca de 6 llamadas al modelo (leer, mapear, generar, armar, respuesta final y una de corrección o confirmación). El contexto crece con cada resultado de herramienta, lo que da unos 50 000 tokens de entrada acumulados y unos 5 000 de salida (incluido el razonamiento interno del modelo). La estimación se valida con los registros de uso del adaptador al ejecutar el flujo real.

**Evaluación de alternativas** (consulta del 2026-11-20). Los precios de Anthropic provienen de su documentación oficial con corte al 2026-11-03. Los precios de los demás proveedores provienen de fuentes secundarias que no coinciden entre sí y deben verificarse al crear la cuenta.

| Alternativa | Precio USD por millón de tokens (entrada / salida) | Costo estimado por caso | Integración con TypeScript y Bun | Observaciones |
|---|---|---|---|---|
| Anthropic Claude Haiku 5.5 | 0.10 / 0.50 (prompts de hasta 100 000 tokens) | ~0.01 | SDK oficial `@anthropic-ai/sdk` con soporte de herramientas definidas en zod | Precio sube a 0.50 / 2.50 cuando una consulta supera 100 000 tokens de prompt; las consultas del agente rondan los 30 000. Requiere créditos prepagados. |
| Anthropic Claude Sonnet 5.5 | 2.00 / 10.00 | ~0.15 | Igual que Haiku 5.5 | Mayor capacidad de razonamiento y cumplimiento de reglas, 20 veces el costo de Haiku 5.5. |
| Anthropic Claude Opus 5.5 | 4.00 / 20.00 | ~0.30 | Igual que Haiku 5.5 | Modelo más capaz de la familia; desproporcionado para la complejidad del reto. |
| OpenAI, modelo pequeño vigente | ~0.20 / ~1.20 (no verificado) | ~0.02 | SDK oficial con soporte de zod | Nombres y precios de modelos inconsistentes entre fuentes. Sin capa gratuita. |
| Google Gemini Flash, capa gratuita | 0 (capa gratuita); ~0.75 / ~3.75 de pago (no verificado) | 0 a ~0.06 | SDK oficial `@google/genai` | En la capa gratuita los datos pueden usarse para mejorar los productos de Google, y los límites de peticiones son bajos y variables. |
| Groq, capa gratuita (modelos abiertos) | 0 (capa gratuita); ~0.15 / ~0.60 de pago (no verificado) | 0 a ~0.01 | SDK propio | Límite de tokens por minuto reportado de unos 8 000 en algunos modelos, inferior al contexto de una sola llamada del agente (unos 10 000 tokens). |
| Mistral, plan Experiment | 0 (plan gratuito) | 0 | SDK propio | Las peticiones del plan gratuito pueden usarse para entrenamiento. Hay reportes no confirmados de restricción a clientes empresariales. |
| Modelo local (Ollama) | 0 | 0 | Requiere servidor propio | No cumple M2: Render no ofrece GPU ni memoria suficiente para el link público. |

**Criterios ponderados.** Escala de 1 (bajo) a 5 (alto). La fiabilidad del tool use de los modelos que no son de Anthropic es una valoración cualitativa que se confirma con la ejecución del flujo de PRD §11.

| Criterio | Peso | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 | OpenAI pequeño | Gemini Flash gratuito | Groq gratuito | Mistral gratuito |
|---|---|---|---|---|---|---|---|---|
| C1 Costo por caso y costo total del proyecto | 35 % | 5 | 2 | 1 | 4 | 5 | 5 | 5 |
| C2 Facilidad de integración con TypeScript, Bun y zod | 25 % | 5 | 5 | 5 | 5 | 4 | 3 | 3 |
| C3 Fiabilidad del tool use y cumplimiento de reglas (CA2, CA3) | 20 % | 4 | 5 | 5 | 4 | 3 | 3 | 3 |
| C4 Alta de cuenta y control de gasto | 10 % | 4 | 4 | 4 | 4 | 5 | 5 | 4 |
| C5 Límites de uso y disponibilidad durante la defensa | 5 % | 5 | 5 | 5 | 5 | 2 | 1 | 2 |
| C6 Tratamiento de los datos enviados | 5 % | 5 | 5 | 5 | 5 | 2 | 3 | 1 |
| Puntaje ponderado | 100 % | 4.70 | 3.85 | 3.50 | 4.35 | 4.05 | 3.80 | 3.65 |

| Atributo | Contenido |
|---|---|
| Decisión | Anthropic Claude Haiku 5.5 (`claude-haiku-5-5`) mediante el SDK oficial `@anthropic-ai/sdk`. |
| Justificación | Es la opción de pago de menor costo por caso entre las evaluadas con precio verificado: unos USD 0.01 por caso, lo que da un costo total estimado de USD 2 a 3 para unas 300 ejecuciones entre desarrollo, pruebas y evaluación. Su SDK oficial soporta herramientas definidas con zod, que el PRD hace obligatorio. Evita las limitaciones de las capas gratuitas: límites de uso que pueden fallar durante la defensa y uso de los datos para entrenamiento. |
| Parámetros de uso | (1) Esfuerzo de razonamiento `low`, con revisión a `medium` si las pruebas muestran incumplimientos. (2) Caché del prompt de sistema y de las definiciones de herramientas, que son estables entre llamadas, para reducir el costo de entrada. (3) Tope de tokens por sesión de 400 000 (`MAX_TOKENS_SESION`), con un costo máximo cercano a USD 0,05 por sesión, para cumplir PRD §8 L297. El umbral de precio de 100 000 tokens aplica a cada consulta, no al acumulado de la sesión. (3a) Tope de iteraciones por mensaje de 25 (`MAX_ITERACIONES`, CA1); es un límite distinto del de tokens. (4) Tiempo máximo de espera al proveedor con mensaje claro al usuario (PRD §8 L298). (5) Límite de gasto mensual configurado en la consola del proveedor. |
| Plan de escalamiento | El modelo se define en la variable `LLM_MODEL`. Si Haiku 5.5 no cumple las reglas CA2 y CA3 en el flujo de PRD §11, se cambia a `claude-sonnet-5-5` sin modificar el código, con un costo estimado de USD 0.15 por caso. El cambio de proveedor se resuelve con otra implementación del adaptador (PRD §6.1 L152), sin tocar el ciclo del agente. |
| Alternativas descartadas | (a) Sonnet 5.5 y Opus 5.5 como modelo base: mayor fiabilidad, pero de 15 a 30 veces el costo, sin necesidad demostrada; Sonnet 5.5 queda como escalamiento. (b) Capas gratuitas de Gemini, Groq y Mistral: costo cero, pero con límites de uso insuficientes o variables, uso de los datos para entrenamiento y riesgo de fallo durante la defensa. (c) OpenAI: comparable en integración, pero de mayor costo y con precios no verificados. (d) Modelo local: incumple M2. |
| Corrección | 2026-11-22, aprobada. El tope inicial de 90 000 tokens por sesión partía de interpretar el umbral de precio de 100 000 tokens como acumulado de la sesión, cuando aplica a cada consulta. En las pruebas, tres turnos consumieron 79 577 tokens, porque cada turno reenvía el historial (unos 30 000 tokens por consulta), y la sesión se agotaba al cuarto mensaje. El tope sube a 400 000. |
| Riesgo asociado | Un modelo de menor tamaño puede saltarse reglas del prompt. Se mitiga con el diseño: los valores solo provienen de herramientas (DEC-04), la confirmación se aplica en el backend (DEC-06), y existe el escalamiento por variable de entorno. Las tarifas pueden cambiar y se verifican al comprar los créditos. |
| Fuentes | Documentación oficial de precios de Anthropic (corte 2026-11-03); developers.openai.com/api/docs/pricing; ai.google.dev/gemini-api/docs/pricing; mistral.ai/pricing; help.mistral.ai (plan Experiment); community.groq.com (límites de la capa gratuita) |
| Destino en SOLUCION.md | §4 Elección del modelo; §6 Decisiones y trade-offs; §10 Riesgos |

### 5.7 Decisiones de implementación

#### DEC-22. Mapeo de la plantilla completa

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §6.2 L188 (`mapear_campos` recibe `{ caso, campos[] }`); PRD HU-3 L107 (cada etiqueta en su celda); CA2 L198 |
| Vacío | El contrato permite que el modelo envíe una lista parcial o con etiquetas inexistentes. En ese caso el formulario quedaría incompleto o con campos que no pertenecen a la plantilla. |
| Decisión | `mapear_campos` mapea siempre todos los campos de la plantilla del caso. Las etiquetas recibidas que no pertenecen a la plantilla se ignoran, y las de la plantilla que no se recibieron se mapean igual; en ambos casos se devuelve una advertencia. |
| Alternativas descartadas | (a) Mapear solo la lista recibida: el formulario podría quedar incompleto por una omisión del modelo. (b) Rechazar la llamada si la lista no coincide: obliga a reintentos sin aportar control adicional. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

#### DEC-23. Fecha de referencia por defecto en la demo

| Atributo | Contenido |
|---|---|
| Tipo | ENT |
| Estado | Aprobada |
| Referencias | PRD §6.6 L240 a L246 (la demo corre sin configuración de proveedor); PRD §8 L295 (determinismo); DEC-02 |
| Vacío | En una máquina limpia, sin `.env`, la demo usaría la fecha del sistema y sus resultados no coincidirían con los esperados documentados. |
| Decisión | Si `FECHA_REFERENCIA` no está definida, `demo.ts` usa 2026-09-03 y lo informa en su primera línea. El servidor mantiene el comportamiento de DEC-02 (vacía equivale a la fecha del sistema). |
| Alternativas descartadas | Exigir el archivo `.env` para correr la demo: contradice el uso directo de `bun install && bun run demo.ts`. |
| Destino en SOLUCION.md | §7 Supuestos |

#### DEC-24. Herramienta de control para solicitar confirmación

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | CA3 L199 (el turno termina con una pregunta explícita y el front resalta ese estado); RN4 L278; PRD §6.4 L209 (`needsConfirmation`); DEC-06 |
| Vacío | DEC-06 exige que el backend registre la confirmación pendiente, pero el backend solo recibe texto libre del modelo y no puede saber con certeza que se pidió una confirmación, de qué tipo ni sobre qué campos. Si no registra nada, la confirmación posterior del usuario se rechaza y la analista queda en un ciclo de preguntas. Si lo deduce del texto, una pregunta cualquiera ("¿quieres revisar el borrador del envío?") puede terminar autorizando un envío. |
| Decisión | Se agrega la herramienta de control `agente_solicitar_confirmacion({ accion, caso, etiquetas?, pregunta })`. Es la única vía para abrir una confirmación: el backend registra la confirmación pendiente con esos datos, cierra el turno con la pregunta y responde `needsConfirmation: true`. Una pregunta que no pasa por esta herramienta no autoriza ninguna acción. |
| Alternativas descartadas | (a) Deducir la confirmación del texto del modelo: produce ciclos o autorizaciones no pedidas. (b) Deducirla de los resultados de las herramientas: no cubre el envío, que depende de lo que pide la analista. |
| Destino en SOLUCION.md | §3 Ciclo del agente; §6 Decisiones y trade-offs |

#### DEC-25. La decisión sobre cada campo la registra el backend

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | RN4 L278; CA2 L198; DEC-06; DEC-09 |
| Vacío | La confirmación de campos verificaba que la etiqueta estuviera autorizada, pero tomaba la decisión (aceptar o descartar) del argumento que envía el modelo. Si el modelo interpreta mal una respuesta como "No, no pongas el NIT", puede aceptar el campo, marcarlo como confirmado por el usuario y dejar el paquete listo para firma con un dato que la analista rechazó. |
| Decisión | La confirmación que el backend entrega a la herramienta incluye la decisión por etiqueta, tomada de los botones del front o de listas cerradas de expresiones afirmativas y negativas. `proveedor_generar_formulario` exige que la decisión enviada por el modelo coincida con la registrada; si no coincide, rechaza la llamada. Una respuesta de texto que no pertenece a ninguna lista no confirma nada y el agente vuelve a preguntar. |
| Alternativas descartadas | Confiar en la interpretación del modelo: puede registrar como confirmado por el usuario un dato que el usuario negó. |
| Destino en SOLUCION.md | §3 Ciclo del agente; §6 Decisiones y trade-offs |

#### DEC-26. El mapeo conserva las decisiones del usuario

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | DEC-04; DEC-09; PRD §1 L26 (reducción de reprocesos) |
| Vacío | Si el modelo vuelve a mapear un caso después de una confirmación, el mapeo registrado se sobrescribe y el campo vuelve a quedar pendiente. El formulario, el mapeo y el estado del paquete quedan inconsistentes entre sí y la analista debe confirmar de nuevo. |
| Decisión | `proveedor_mapear_campos` conserva las decisiones del usuario ya registradas para la misma etiqueta y la misma ruta del maestro, **dentro de la misma sesión**. Si la ruta cambió, el dato ya no existe o el caso se procesa en otra sesión, la decisión no se conserva y el campo vuelve a quedar pendiente. |
| Ajuste de implementación | El alcance por sesión se definió al implementar: sin él, una decisión tomada en una sesión anterior (o por `demo.ts`) se aplicaba en silencio a cualquier sesión nueva sobre el mismo caso, y la pregunta de confirmación no volvía a aparecer. |
| Alternativas descartadas | Indicar en el prompt que no se vuelva a mapear: depende del comportamiento del modelo. |
| Destino en SOLUCION.md | §6 Decisiones y trade-offs |

#### DEC-27. Sesión inexistente en el front

| Atributo | Contenido |
|---|---|
| Tipo | ENT |
| Estado | Aprobada |
| Referencias | PRD §6.1 L154 (sesiones en memoria o archivo); PRD §3.2 L71; DEC-18 |
| Vacío | Las sesiones viven en memoria. Un reinicio o un nuevo despliegue en Render las borra, y el front seguiría enviando un identificador que ya no existe. |
| Decisión | La API responde con un código específico de sesión inexistente. El front lo detecta, inicia una sesión nueva e informa a la analista con un aviso, sin mostrar un error. |
| Alternativas descartadas | Persistir las sesiones en disco: el sistema de archivos de Render también es efímero, así que no evita la pérdida en un nuevo despliegue. |
| Destino en SOLUCION.md | §7 Supuestos; §10 Riesgos |

#### DEC-28. Columna vertebral del flujo: ganchos y guías por variante activadas por el sistema

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada |
| Referencias | PRD §6.1 L151 y L153 (las herramientas son la única fuente de valores; el prompt va en un archivo aparte); PRD §6.5 L238 (comportamiento en el prompt, conocimiento en `src/knowledge/`, ejecución en `src/tools/`); CA1 L197; CA2 L198; DEC-09, DEC-10, DEC-21, DEC-24 a DEC-26 |
| Vacío | Las decisiones DEC-01 a DEC-27 agregaron reglas y variantes al flujo original. Si todo eso se pone en el prompt, el contexto crece y un modelo de razonamiento limitado (Claude Haiku 5.5) puede perder el orden del flujo, omitir una confirmación o repetir pasos. Además, no es posible ajustar `temperature`, `top_p` ni `top_k`: Claude Haiku 5.5 rechaza valores distintos a los predeterminados. |
| Principio | Las reglas de negocio las cumple el código. Al modelo solo se le entrega, en cada momento, la instrucción del paso siguiente. |

**Decisión.** Cinco elementos:

| # | Elemento | Ubicación | Comportamiento |
|---|---|---|---|
| 1 | Prompt base corto | `agent/prompt.md` | Rol, las 5 reglas que no se negocian y el camino feliz en pocos pasos. Sin variantes. |
| 2 | Tabla del flujo | `src/knowledge/flujo.ts` | Define en datos, no en el ciclo, cuál es el paso siguiente según el resultado de cada herramienta. Un cambio en el flujo de negocio no toca el ciclo ni el servidor. |
| 3 | Gancho posterior | Capa de herramientas, dentro de la envoltura común `ejecutar()` | Agrega a cada resultado el campo `siguiente_paso`, calculado con la tabla del flujo, y la guía de la variante cuando corresponde. Al vivir en las herramientas, funciona igual en el servidor, en `demo.ts` y en el módulo reutilizable (DEC-19). |
| 4 | Guías por variante | `src/knowledge/variantes/*.md` | Instrucciones breves que se adjuntan solo cuando el estado entra en esa variante. El modelo no decide cuándo cargarlas. |
| 5 | Gancho previo | Ciclo del agente (`src/agente/`) | Detiene repeticiones: la misma herramienta con los mismos argumentos y sin cambios de estado se rechaza con una indicación. Cierra el turno en cuanto se llama a `agente_solicitar_confirmacion`, sin ejecutar más herramientas. |

**Tabla del flujo (paso siguiente):**

| Después de | Condición | `siguiente_paso` |
|---|---|---|
| `leer_solicitud` | Correcto | Mapear con las etiquetas devueltas. |
| `mapear_campos` | Correcto | Generar el formulario. |
| `generar_formulario` | Correcto | Armar el paquete. |
| `armar_paquete` | Hay campos pendientes de confirmación | Presentar el resumen y solicitar confirmación de esos campos (`accion: confirmar_campos`). |
| `armar_paquete` | Sin campos pendientes | Presentar el resumen (con los motivos de bloqueo, si los hay) y solicitar confirmación de envío (`accion: enviar`). |
| `generar_formulario` con confirmaciones aplicadas | Correcto | Volver a armar el paquete y aplicar las dos filas anteriores. |
| `simular_envio` | Correcto | Informar la ruta de `ENVIO-SIMULADO.md`. No hay más acciones. |
| Cualquiera | Error | Explicar el error en lenguaje claro y adjuntar la guía de la variante. |

Con esta tabla, el primer turno del ejemplo de PRD §11 siempre termina con una sola pregunta registrada: la de los campos si hay pendientes, o la de envío si no los hay. Así, un segundo mensaje "envía" queda como confirmación explícita, sin combinar preguntas (DEC-06).

**Guías por variante:**

| Guía | Se adjunta cuando |
|---|---|
| `campos-por-confirmar.md` | El mapeo o el paquete reportan campos pendientes sin decisión del usuario. |
| `paquete-bloqueado.md` | `armar_paquete` devuelve `listo_para_firma: false`. |
| `formato-portal.md` | La solicitud es de formato portal o `generar_formulario` devuelve `soportado: false`. |
| `envio.md` | `simular_envio` se rechaza por falta de confirmación. |
| `caso-no-disponible.md` | La lectura falla porque el caso no existe o sus archivos son inválidos. |

**Controles del modelo:** esfuerzo de razonamiento inicial `low`, ajustable a `medium` con `LLM_EFFORT`; herramientas en modo estricto para garantizar argumentos válidos según el esquema; escalamiento a Claude Sonnet 5.5 con `LLM_MODEL` (DEC-21) solo si la verificación lo justifica.

**Verificación:** `demo.ts` verifica de forma determinista el `siguiente_paso` y las guías de cada caso, sin modelo. Un conjunto de conversaciones de prueba con el modelo real comprueba la secuencia de herramientas y el estado final en `out/` (flujo de PRD §11, aceptar, descartar, respuesta ambigua, "envía" sin confirmación y caso inexistente). Costo estimado: menos de USD 0,20 por corrida con Haiku. Se ejecuta a demanda y no forma parte de la demo.

| Atributo | Contenido |
|---|---|
| Alternativas descartadas | (a) Prompt extenso con todas las reglas: contexto grande y más errores de un modelo pequeño. (b) Una herramienta para que el modelo lea guías cuando lo considere: depende de su criterio y agrega llamadas. (c) Máquina de estados que oculta herramientas según la fase: más rígida y costosa en el cronograma, con control similar al de los ganchos. (d) Ajustar `temperature`, `top_p` o `top_k`: el modelo no lo admite, y además controlan la variedad del texto, no la fidelidad al flujo. (e) Escalar directamente a Sonnet 5.5: unas 15 veces el costo sin evidencia de que sea necesario. |
| Riesgos | (a) Si la tabla del flujo queda desactualizada, guiaría mal al modelo; lo mitiga la verificación en `demo.ts`. (b) El modelo podría ignorar el `siguiente_paso`; las reglas críticas siguen protegidas en el código (DEC-04, DEC-06, DEC-24, DEC-25). (c) Los resultados crecen un poco cuando se adjunta una guía; se mitiga con guías de pocas líneas, adjuntas solo en su variante. |
| Impacto | Archivos nuevos: `src/knowledge/flujo.ts`, `src/knowledge/variantes/*.md`, `src/tools/agente.ts` (DEC-24) y los ganchos del ciclo en `src/agente/`. Cambios: `ejecutar()` en `src/tools/proveedor.ts`, `agent/prompt.md` y `demo.ts`. Unas 2 horas adicionales en el cronograma del domingo 22. |
| Destino en SOLUCION.md | §2 Arquitectura; §3 Ciclo del agente; §6 Decisiones y trade-offs |

#### DEC-29. Diseño de la interfaz de chat

| Atributo | Contenido |
|---|---|
| Tipo | OMI |
| Estado | Aprobada (requisitos del equipo). Los detalles complementarios se validan visualmente en el PR del front. |
| Referencias | PRD §0 L14 (front libre); PRD §6.1 L149 (historial, entrada, indicador de "pensando", llamadas a herramientas visibles, confirmación resaltada); PRD §8 L297 (consumo acotado); HU-01, HU-15, HU-16, HU-17, HU-18; DEC-27 |
| Vacío | El PRD fija qué debe mostrar el front, pero no su diseño visual ni su comportamiento. |

**Requisitos del equipo:**

| # | Requisito |
|---|---|
| 1 | Colores predominantes verde claro y negro; texto en negro. Única interfaz: el chat. |
| 2 | Pantalla inicial en dos columnas. Izquierda: la marca "PeriferiaIT", con "Periferia" en verde claro e "IT" en negro, y debajo una descripción corta del uso de la plataforma en tono formal y cálido. Derecha: campo de texto con borde verde y texto negro para iniciar el chat. |
| 3 | Al enviar el primer mensaje, transición suave: la columna izquierda desaparece y el campo de texto desciende a la parte inferior central. |
| 4 | Las respuestas aparecen encima del campo de texto, como en las interfaces habituales de chat con IA generativa (lo más reciente, abajo). |
| 5 | Entre la conversación y el campo de texto se muestran los tokens y los indicadores de consumo y de sesión. |

**Detalles complementarios (validación visual en el PR del front):**

| Aspecto | Propuesta |
|---|---|
| Paleta | Verde claro `#7AC943` para la marca, bordes y fondos; verde de foco `#3F9C35`; negro `#111111` para el texto; fondo blanco. |
| Legibilidad | El verde claro sobre blanco tiene un contraste de 2,05:1, inferior al mínimo de 3:1 para texto grande y para bordes de controles (WCAG 1.4.3 y 1.4.11). Por eso el texto siempre es negro (contraste de 9,2:1 sobre verde claro). El verde claro se usa como texto solo en la marca, que está exenta como logotipo. El campo de texto usa borde verde claro de 2 px y, al tener el foco, `#3F9C35` (3,5:1). |
| Descripción inicial | "Asistente de registro como proveedor. Le ayudo a preparar los formularios de registro que solicitan nuestros clientes: tomo la información del repositorio de Periferia, le indico lo que falta y dejo el paquete listo para firma. Usted conserva siempre la decisión final." |
| Texto de ayuda del campo | "Escriba el caso que desea procesar, por ejemplo: Procesa el caso ec-corp-andina" |
| Indicadores | Tokens del último turno (entrada y salida); consumo acumulado de la sesión con una barra frente a `MAX_TOKENS_SESION`; costo estimado de la sesión en USD según la tarifa del modelo; modelo en uso; identificador corto de la sesión; acción "Nueva sesión". |
| Llamadas a herramientas | Tarjetas compactas y plegables bajo la respuesta: nombre, argumentos y resultado resumido. Borde izquierdo verde si fue correcta y rojo apagado si falló; el rojo solo se usa para errores. |
| Confirmación pendiente | Mensaje con fondo verde claro tenue, borde verde y dos botones: "Confirmar" (negro sólido) y "Descartar" (contorno negro). |
| Archivos generados | Enlaces de descarga bajo la respuesta que los generó. |
| Pantallas angostas | La marca y la descripción se apilan sobre el campo de texto. |
| Movimiento | La transición se desactiva si el sistema del usuario pide reducir el movimiento (`prefers-reduced-motion`). |
| Sesión inexistente | Aviso discreto y sesión nueva, sin error visible (DEC-27). |

| Atributo | Contenido |
|---|---|
| Alternativas descartadas | (a) Panel lateral con lista de casos y formularios: el PRD solo exige el chat y agrega superficie sin valor para la prueba. (b) Verde claro como color de texto general: no cumple el contraste mínimo de legibilidad. |
| Impacto | El front de chat se construye según esta decisión. La respuesta de `POST /api/chat` incluye los datos de los indicadores: uso del turno, uso acumulado y límite de la sesión, y costo estimado. |
| Destino en SOLUCION.md | §2 Arquitectura (front); §4 Elección del modelo (costo por caso visible en la interfaz); §6 Decisiones y trade-offs |

---

## 6. Resultado esperado de referencia

Se calcula con `FECHA_REFERENCIA = 2026-09-03` aplicando las decisiones DEC-02, DEC-08, DEC-09 y DEC-11 a DEC-13. Servirá para verificar `demo.ts` y el flujo conversacional.

### 6.1 Escenario A: sin confirmación humana (`demo.ts`)

| Caso | Formato | Llenos | Requiere confirmación | Faltantes | Situación de soportes | `listo_para_firma` | Motivos del bloqueo |
|---|---|---|---|---|---|---|---|
| co-industrias-delta | xlsx | 17 | 0 | 0 | 4 de 4 vigentes; advertencia de antigüedad (DEC-11) | true | Ninguno |
| ec-corp-andina | pdf | 13 | 1 (RUC) | 1 (Número de contribuyente especial) | Ausente `certificado_cumplimiento_tributario` | false | Soporte ausente; campo pendiente de confirmación |
| hn-agroexport-sula | xlsx | 9 | 1 (RTN) | 1 (Referencias comerciales) | `parafiscales` vencido el 2026-08-31 | false | Soporte vencido; campo pendiente de confirmación |
| pa-logistica-istmo | portal | 8 | 1 (RUC) | 0 | 2 de 2 vigentes | false | Campo pendiente de confirmación |

En este escenario, `simular_envio` se rechaza en todos los casos porque no existe confirmación del usuario (DEC-06).

### 6.2 Escenario B: confirmación aceptada en el chat

| Caso | Llenos | Requiere confirmación | Faltantes | `listo_para_firma` | Motivos del bloqueo |
|---|---|---|---|---|---|
| co-industrias-delta | 17 | 0 | 0 | true | Ninguno |
| ec-corp-andina | 14 | 0 | 1 | false | Soporte ausente |
| hn-agroexport-sula | 10 | 0 | 1 | false | Soporte vencido |
| pa-logistica-istmo | 9 | 0 | 0 | true | Ninguno |

Si la analista descarta el campo en lugar de aceptarlo, el campo pasa a faltantes y el estado `listo_para_firma` es el mismo de esta tabla. En cualquier caso, `simular_envio` produce `ENVIO-SIMULADO.md` después de una confirmación explícita de envío, registrando el estado del paquete (DEC-10).

### 6.3 Efecto de la fecha del sistema

Con la fecha del sistema (2026-11-20), la Cámara de Comercio está vencida (vigencia hasta 2026-09-30) y los cuatro casos quedan con `listo_para_firma = false` en ambos escenarios.

---

## 7. Matriz de trazabilidad

### 7.1 Elementos del PRD y decisiones asociadas

| Elemento del PRD | Líneas | Decisiones |
|---|---|---|
| §0 Ficha del reto (duración) | L12 | DEC-20 |
| §0 Ficha del reto (modelo de lenguaje) | L15 | DEC-21 |
| §1 Resumen ejecutivo y §2.2 Dolor | L26, L45 | DEC-09, DEC-10 |
| §2.1 Situación actual (correo de respuesta) | L42 | DEC-10 |
| §2.3 Lo que el reto no resuelve | L49 a L53 | DEC-10 |
| §3.1 Objetivo O2 | L64 | DEC-17 |
| §3.1 Objetivo O3 | L65 | DEC-09 |
| §3.2 No-objetivos (persistencia) | L71 | DEC-18 |
| §4 Usuarios y actores | L80 | DEC-09 |
| HU-1 | L88 a L93 | DEC-03 |
| HU-2 | L95 a L101 | DEC-08, DEC-15, DEC-17 |
| HU-3 | L103 a L109 | DEC-07, DEC-14, DEC-17, DEC-20 |
| HU-4 | L111 a L117 | DEC-02, DEC-05, DEC-09, DEC-10 |
| HU-5 | L119 a L124 | DEC-05, DEC-07 |
| §6.1 Componentes (backend, adaptador, sesión, autenticación) | L150, L152, L154, L155 | DEC-18, DEC-21 |
| §6.2 Contrato de herramientas | L157 a L191 | DEC-03, DEC-04, DEC-05, DEC-06, DEC-07, DEC-09, DEC-10 |
| §6.3 CA1 | L197 | DEC-18 |
| §6.3 CA2 | L198 | DEC-04, DEC-15 |
| §6.3 CA3 | L199 | DEC-06, DEC-09 |
| §6.3 CA4 | L200 | DEC-05, DEC-13 |
| §6.5 Estructura del repositorio | L213 a L238 | DEC-01, DEC-15, DEC-19 |
| §7.1 Estructura de un caso | L252 a L261 | DEC-01, DEC-07, DEC-12 |
| §7.2 Repositorio maestro | L263 a L269 | DEC-11, DEC-12 |
| §7.3 RN1 | L275 | DEC-03, DEC-09 |
| §7.3 RN3 | L277 | DEC-09, DEC-10 |
| §7.3 RN4 | L278 | DEC-06, DEC-10 |
| §7.3 RN5 | L279 | DEC-13 |
| §8 Requisitos no funcionales | L294 a L300 | DEC-02, DEC-08, DEC-13, DEC-14, DEC-18, DEC-21 |
| §9.1 Estructura de SOLUCION.md (elección del modelo) | L311 | DEC-21 |
| §9.3 Link para probar | L323 a L325 | DEC-18 |
| §9.4 Bonus módulo reutilizable | L327 a L338 | DEC-19, DEC-20 |
| §9.5 Forma de entrega | L340 a L342 | DEC-20 |
| §11 Prompt de ejemplo | L358 a L368 | DEC-09, DEC-10 |

### 7.2 Distribución de decisiones en SOLUCION.md

| Sección de SOLUCION.md | Decisiones |
|---|---|
| §2 Arquitectura | DEC-01, DEC-05, DEC-13, DEC-18, DEC-28, DEC-29 |
| §3 Ciclo del agente | DEC-06, DEC-09, DEC-24, DEC-25, DEC-28 |
| §4 Elección del modelo | DEC-21, DEC-29 |
| §5 Diseño del portal web | DEC-07 |
| §6 Decisiones y trade-offs | DEC-03, DEC-04, DEC-06, DEC-08, DEC-09, DEC-10, DEC-14, DEC-17, DEC-18, DEC-19, DEC-21, DEC-22, DEC-24, DEC-25, DEC-26, DEC-28, DEC-29 |
| §7 Supuestos | DEC-02, DEC-09, DEC-10, DEC-11, DEC-12, DEC-15, DEC-16, DEC-20, DEC-23, DEC-27 |
| §8 Cobertura | DEC-20 |
| §10 Riesgos | DEC-10, DEC-18, DEC-20, DEC-21, DEC-27 |

---

## 8. Consolidado de selección de plataformas

Esta sección reúne los criterios de decisión y los trade-offs de las dos elecciones de plataforma del proyecto: alojamiento (DEC-18) y modelo de lenguaje (DEC-21). Es el insumo directo para las secciones 4 y 6 de `SOLUCION.md`.

### 8.1 Principios de decisión

| ID | Principio | Origen |
|---|---|---|
| P1 | Costo mínimo para el candidato. Se prefiere una erogación baja, acotada y predecible a una gratuita con riesgo de fallo durante la evaluación. | Restricción del equipo; PRD §8 L297 |
| P2 | Facilidad de integración y configuración, coherente con un presupuesto de 15 a 23 horas. | DEC-20 |
| P3 | Disponibilidad durante la evaluación y la defensa, por la penalización de -10 si no hay link activo. | PRD §9.3 L325 |
| P4 | Cumplimiento de la arquitectura obligatoria: proceso persistente, adaptador intercambiable, secretos en variables de entorno. | PRD §6.1; §8 L296 |
| P5 | Reversibilidad: la elección se puede cambiar sin reescribir código (contenedor estándar; modelo y proveedor configurables). | PRD §6.1 L152 |

### 8.2 Criterios y pesos aplicados

| Decisión | Criterios excluyentes | Criterios ponderados (peso) |
|---|---|---|
| DEC-18 Alojamiento | R1 proceso persistente e instancia única; R2 sistema de archivos escribible; R3 secretos y HTTPS | Costo (35 %); configuración (30 %); disponibilidad (20 %); peticiones largas y soporte de Bun (15 %) |
| DEC-21 Modelo de lenguaje | M1 tool use multiturno; M2 accesible por API desde Render; M3 clave en variable de entorno | Costo (35 %); integración (25 %); fiabilidad del tool use (20 %); alta de cuenta y control de gasto (10 %); límites de uso (5 %); tratamiento de datos (5 %) |

Puntajes ponderados de alojamiento con estos pesos (escala de 1 a 5, a partir de la tabla de DEC-18): Render Starter 4.65; Railway Hobby 4.65; Render gratuito 4.40; túnel local 4.10; Fly.io 3.85. Cloud Run y Vercel quedan excluidos por R1 y R2. El empate entre Render Starter y Railway Hobby se resuelve a favor de Render por dos razones: tiene una capa gratuita sin tarjeta para todo el desarrollo, y su costo es fijo, mientras que Railway cobra por uso y su crédito de prueba vence a los 30 días.

### 8.3 Trade-offs asumidos

| ID | Se gana | Se cede | Decisión | Mitigación |
|---|---|---|---|---|
| TO-1 | Costo cero durante el desarrollo | Disponibilidad: la capa gratuita suspende la instancia tras 15 minutos sin tráfico | DEC-18 | Activación de la instancia antes de la defensa; plan Starter como opción. |
| TO-2 | Disponibilidad garantizada en la evaluación | Unos USD 7 de costo de infraestructura | DEC-18 | Es la única erogación de alojamiento y se limita a la ventana de evaluación. |
| TO-3 | Sencillez: un solo servicio con estado en memoria | Escalabilidad horizontal y persistencia entre reinicios | DEC-18 | Aceptado por PRD §3.2 L71. En producción se migraría a almacenamiento externo. |
| TO-4 | Costo por caso unas 15 veces menor que Sonnet 5.5 | Margen de razonamiento y cumplimiento de reglas complejas | DEC-21 | Las reglas críticas se garantizan por diseño (DEC-04, DEC-06), no por el modelo. Escalamiento a Sonnet 5.5 por variable de entorno. |
| TO-5 | Costo predecible con créditos prepagados | Gratuidad de las capas sin costo de otros proveedores | DEC-21 | El costo total estimado es de USD 2 a 3. Se evitan límites de uso y uso de datos para entrenamiento. |
| TO-6 | Integración inmediata con el SDK oficial y zod | Neutralidad: dependencia inicial de un solo proveedor | DEC-21 | El adaptador propio (PRD §6.1 L152) aísla el ciclo del agente del proveedor. |

### 8.4 Costo total estimado del proyecto

| Concepto | Estimación (USD) | Supuesto |
|---|---|---|
| Alojamiento en desarrollo (capa gratuita de Render) | 0 | Del 20 al 24 de noviembre |
| Alojamiento en evaluación (capa gratuita de Render) | 0 | Se decidió no contratar el plan Starter (DEC-18) |
| Modelo de lenguaje (Claude Haiku 5.5) | 2 a 3 | Unas 300 ejecuciones de caso completo |
| Total | hasta 10 | Si se escala a Sonnet 5.5, el modelo pasaría a unos USD 45 para el mismo volumen. |

---

## 9. Decisiones pendientes de validación

No hay decisiones pendientes a la fecha de esta versión. Las decisiones que surjan durante la implementación se registran con numeración a partir de DEC-30.
