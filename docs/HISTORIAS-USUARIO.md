# Historias de Usuario Extendidas

## Reto técnico 01: Agente conversacional "Registro como Proveedor"

---

## 1. Control del documento

| Atributo | Valor |
|---|---|
| Documento | Historias de Usuario Extendidas (documento fuente para el desarrollo) |
| Versión | 1.3 |
| Fecha | 2026-11-21 |
| Estado | Aprobado |
| Documentos base | `PRD-01-agente-registro-proveedor 4.md` v2.0 (historias HU-1 a HU-5 y requisitos asociados); `docs/DECISIONES.md` |
| Ubicación | `docs/HISTORIAS-USUARIO.md` del repositorio |
| Uso | Una vez aprobado, cada commit y cada PR se relacionan con los identificadores de este documento |

### 1.1 Historial de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| 1.0 | 2026-11-21 | Versión inicial: 27 historias derivadas de las 5 historias del PRD, de los requisitos de arquitectura y no funcionales, y de las decisiones DEC-01 a DEC-23. |
| 1.1 | 2026-11-21 | Se retiran los actores Evaluador técnico y Responsable de la plataforma, que no corresponden al negocio, y las siete historias que dependían de ellos (criterios de validación de la prueba y requisitos no funcionales; ver sección 7.3). La descarga de archivos, el historial de sesión y la auditoría quedan con la analista administrativa como único actor. |
| 1.2 | 2026-11-21 | Se renumeran las historias para eliminar huecos, dado que el documento no había sido versionado: la auditoría de acciones pasa a HU-20 con sus ítems. Documento aprobado y versionado en `docs/` del repositorio como fuente para el desarrollo. |
| 1.3 | 2026-11-24 | Se actualiza el estado de implementación (§7.4) y la referencia al registro de decisiones, ahora en `docs/DECISIONES.md`. |

---

## 2. Propósito y alcance

Este documento descompone las historias de usuario del PRD (HU-1 a HU-5) en historias granulares, verificables de forma independiente. Incorpora los requisitos funcionales del PRD que no estaban formulados como historias (interfaz de chat, descarga de archivos, historial y auditoría) y las decisiones que cerraron vacíos en el registro de decisiones.

Quedan fuera de este documento los criterios de validación de la prueba (demo sin modelo, estado del servicio, arranque local, documentación de la solución, módulo reutilizable) y los requisitos no funcionales (costos, seguridad de la clave, intercambio del modelo o proveedor). No obedecen a una interacción de un actor del negocio con el sistema.

Cada historia tiene una sola acción principal, de modo que su funcionamiento pueda validarse con criterios de aceptación concretos.

---

## 3. Convenciones

### 3.1 Identificadores

| Elemento | Formato | Ejemplo | Regla |
|---|---|---|---|
| Historia de usuario | `HU-NN` | HU-07 | Numeración propia de este documento. Las historias del PRD se citan como `PRD HU-n`. |
| Criterio de aceptación | `CA-NN.MM` | CA-07.03 | `NN` es la historia; `MM`, el criterio dentro de ella. |
| Precondición | `PRE-NN.MM` | PRE-07.01 | Igual que los criterios. |
| Postcondición | `POST-NN.MM` | POST-07.02 | Igual que los criterios. |

A partir de su versionado en el repositorio, los identificadores no se reutilizan. Si un ítem se elimina, su identificador queda retirado y se indica en el historial de cambios.

### 3.2 Origen de los criterios

Cada criterio indica su origen:
- `PRD §x Lnn`: sección y línea del PRD v2.0.
- `PRD HU-n`: historia original del PRD.
- `DEC-nn`: decisión registrada en el registro de decisiones.

### 3.3 Atributos de cada historia

| Atributo | Descripción |
|---|---|
| Origen | Historia o sección del PRD de la que se deriva |
| Actor | Rol que ejecuta la acción (sección 4) |
| Prioridad | P0, P1 o P2 según el PRD; "Requerido" para requisitos obligatorios sin prioridad explícita |
| Componente | Parte de la solución que la implementa: Herramientas, Agente, Front, API, Documentación |
| Decisiones | Decisiones de el registro de decisiones que la condicionan |

### 3.4 Trazabilidad con commits y pull requests

| Elemento | Convención |
|---|---|
| Rama | `hu-NN-descripcion-corta`; una rama puede agrupar historias del mismo componente: `hu-04-05-mapeo` |
| Mensaje de commit | Primera línea: `HU-NN: descripción`. Cuerpo: `Criterios: CA-NN.MM, CA-NN.MM`. Un commit sin historia asociada cita la sección del PRD: `PRD §x.y: descripción` |
| Pull request | Título con los identificadores de las historias. Cuerpo con una tabla de criterios cubiertos y su forma de verificación |
| Cobertura parcial | Si un commit cubre solo parte de una historia, el PR lista los criterios cubiertos y los pendientes |

---

## 4. Actores

| Actor | Descripción | Origen |
|---|---|---|
| Analista administrativa | Usuaria principal. Conversa con el asistente, revisa faltantes, confirma decisiones y aprueba el paquete. | PRD §4 L80 |
| Recepción | Deposita la solicitud en la carpeta de entrada. No usa el asistente. | PRD §4 L79 |
| Representante legal | Firma el formulario. Nunca interactúa con el asistente. | PRD §4 L81 |

El asistente de registro es el sistema bajo especificación, no un actor. Recepción y el representante legal participan en el proceso de negocio, pero no interactúan con el asistente; por eso las historias tienen como actor a la analista administrativa.

---

## 5. Resumen de historias

| ID | Título | Origen | Actor | Prioridad | Componente |
|---|---|---|---|---|---|
| HU-01 | Iniciar el procesamiento de una solicitud desde el chat | PRD HU-1; §4 | Analista | P0 | Agente |
| HU-02 | Conocer los datos de la solicitud | PRD HU-1 | Analista | P0 | Herramientas |
| HU-03 | Identificar campos ambiguos del identificador tributario | PRD HU-1 | Analista | P0 | Herramientas |
| HU-04 | Completar los campos desde el repositorio maestro | PRD HU-2 | Analista | P0 | Herramientas |
| HU-05 | Conocer los datos faltantes | PRD HU-2; O2 | Analista | P0 | Herramientas, Agente |
| HU-06 | Resolver en el chat los campos que requieren confirmación | PRD HU-2; RN1 | Analista | P0 | Herramientas, Agente, Front |
| HU-07 | Obtener el formulario en Excel | PRD HU-3 | Analista | P0 | Herramientas |
| HU-08 | Obtener el formulario en PDF | PRD HU-3 | Analista | P1 | Herramientas |
| HU-09 | Obtener los valores para un portal web | PRD HU-3; §7.4 | Analista | P2 | Herramientas, Documentación |
| HU-10 | Armar el paquete para firma | PRD HU-4 | Analista | P0 | Herramientas |
| HU-11 | Conocer el estado de los soportes y si el paquete está listo para firma | PRD HU-4; RN3 | Analista | P0 | Herramientas, Agente |
| HU-12 | Revisar el borrador de correo de respuesta | PRD HU-4; RN2 | Analista | P0 | Herramientas |
| HU-13 | Confirmar y simular el envío | PRD HU-4; RN4 | Analista | P1 | Herramientas, Agente, API |
| HU-14 | Recibir mensajes de error claros sin perder la sesión | PRD HU-5; CA5 | Analista | P0 | Herramientas, Agente, API |
| HU-15 | Ver cada llamada a herramienta en el historial del chat | PRD §6.1; CA4 | Analista | Requerido | Front, API |
| HU-16 | Identificar cuándo el asistente espera una confirmación | PRD §6.1; CA3 | Analista | Requerido | Front, API |
| HU-17 | Recibir un resumen final del procesamiento | PRD §11; CA1; CA2 | Analista | Requerido | Agente |
| HU-18 | Descargar los archivos generados desde el link | DEC-18 | Analista | Requerido | API, Front |
| HU-19 | Consultar el historial completo de una sesión | PRD §6.4 | Analista | Requerido | API |
| HU-20 | Auditar las acciones del asistente | CA4; RN5 | Analista | Requerido | Herramientas |

---

## 6. Detalle de historias

### 6.1 Lectura de la solicitud

#### HU-01. Iniciar el procesamiento de una solicitud desde el chat

| Atributo | Valor |
|---|---|
| Origen | PRD HU-1 (L88 a L93); PRD §4 L80; PRD §11 L362 |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Agente |
| Decisiones | DEC-01 |

**Historia.** Como analista administrativa, quiero pedirle al asistente en lenguaje natural que procese una solicitud indicando su caso, para iniciar el registro sin abrir cada archivo.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-01.01 | El asistente acepta en lenguaje natural una petición que identifica el caso por su nombre, por ejemplo: "Procesa el caso ec-corp-andina". | PRD §4 L80; §11 L362 |
| CA-01.02 | Si el caso no existe, el asistente lo informa con un mensaje claro, sin traza técnica, y la sesión sigue activa. | PRD HU-5 L123 |
| CA-01.03 | Si el mensaje no identifica un caso, el asistente pregunta por el caso en lugar de suponerlo. | PRD CA2 L198 |
| CA-01.04 | Un nombre de caso con caracteres no permitidos (separadores de ruta, puntos consecutivos) se rechaza sin acceder al sistema de archivos. | PRD §8 L296 |
| CA-01.05 | Mientras procesa, el chat muestra el indicador de "pensando". | PRD §6.1 L149 |

**Precondiciones**
- PRE-01.01 Recepción depositó la solicitud del cliente en la carpeta de entrada (`fixtures/reto-01/casos/<caso>/`).
- PRE-01.02 La analista tiene acceso al chat, desde el link público o en local.
- PRE-01.03 El backend tiene configurada la clave del proveedor de lenguaje.
- PRE-01.04 Existe una sesión de chat abierta.

**Postcondiciones**
- POST-01.01 El caso queda identificado en la conversación y el asistente inicia la lectura de la solicitud (HU-02).
- POST-01.02 Si el caso no existe o es inválido, la analista recibe el motivo y puede indicar otro caso en la misma sesión.

#### HU-02. Conocer los datos de la solicitud

| Atributo | Valor |
|---|---|
| Origen | PRD HU-1 (L92) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_leer_solicitud`) |
| Decisiones | DEC-03, DEC-07, DEC-12 |

**Historia.** Como analista administrativa, quiero que el asistente lea el correo del cliente y su plantilla, para saber qué campos y qué soportes me piden sin abrir cada archivo.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-02.01 | El resultado incluye el país del cliente, el cliente, el formato de salida (`xlsx`, `pdf` o `portal`), la lista de campos solicitados y la lista de soportes exigidos. | PRD HU-1 L92; §6.2 L187 |
| CA-02.02 | Cada campo incluye su etiqueta, si es obligatorio y su ubicación: hoja y celda en Excel; posición en PDF y portal. | DEC-03 |
| CA-02.03 | Para el formato `xlsx` se usa `plantilla-celdas.json`; para `pdf` y `portal`, `plantilla-campos.json`. | PRD §7.1 L259, L260; DEC-07 |
| CA-02.04 | La lista de soportes exigidos se toma de `soportes-exigidos.json`. El cuerpo del correo es solo contexto. | DEC-12 |
| CA-02.05 | Si un archivo del caso está corrupto o no tiene la estructura esperada, el resultado es un error claro que indica qué archivo falla y por qué. | PRD HU-5 L123 |

**Precondiciones**
- PRE-02.01 La carpeta del caso contiene `solicitud.json`, la plantilla que corresponde a su formato y `soportes-exigidos.json`.
- PRE-02.02 El glosario de campos está disponible y es válido.
- PRE-02.03 El caso fue identificado (HU-01).

**Postcondiciones**
- POST-02.01 La analista conoce país, cliente, formato, campos y soportes del caso.
- POST-02.02 La lista de campos queda disponible para el mapeo (HU-04).
- POST-02.03 La ejecución queda registrada (HU-20).

#### HU-03. Identificar campos ambiguos del identificador tributario

| Atributo | Valor |
|---|---|
| Origen | PRD HU-1 (L93); RN1 (L275) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_leer_solicitud`) |
| Decisiones | DEC-03 |

**Historia.** Como analista administrativa, quiero que el asistente me señale los campos del identificador tributario que no corresponden al término de Colombia, para saber desde el inicio qué datos tendré que confirmar.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-03.01 | Una etiqueta de identificador tributario que no es el término colombiano (por ejemplo "Identificación tributaria", "RUC" o "RTN") se señala como ambigua y se propone el equivalente del país: NIT en Colombia; RUC en Ecuador, Perú y Panamá; RTN en Honduras. | PRD HU-1 L93; RN1 L275 |
| CA-03.02 | En un caso de Colombia, la etiqueta "NIT" no se señala como ambigua. | RN1 L275 |
| CA-03.03 | La lectura solo señala la ambigüedad. El estado final del campo lo asigna el mapeo (HU-04 y HU-06). | DEC-03 |

**Precondiciones**
- PRE-03.01 El glosario contiene los sinónimos del identificador tributario.
- PRE-03.02 El conocimiento del proceso contiene el identificador tributario de cada país.

**Postcondiciones**
- POST-03.01 Cada campo de identificador tributario queda marcado como ambiguo o no ambiguo, con el equivalente del país cuando aplica.

### 6.2 Mapeo contra el repositorio maestro

#### HU-04. Completar los campos desde el repositorio maestro

| Atributo | Valor |
|---|---|
| Origen | PRD HU-2 (L95 a L101) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_mapear_campos`) |
| Decisiones | DEC-04, DEC-08, DEC-15, DEC-16, DEC-22 |

**Historia.** Como analista administrativa, quiero que el asistente cruce cada campo solicitado con el repositorio maestro, para que el llenado sea exacto y trazable sin transcribir información.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-04.01 | Cada campo termina en uno de tres estados: `lleno`, `faltante` o `requiere_confirmacion`. | PRD HU-2 L99 |
| CA-04.02 | Un campo `lleno` incluye la ruta del dato en el maestro, el valor y la confianza del mapeo. | PRD HU-2 L99 |
| CA-04.03 | Los sinónimos del glosario se resuelven automáticamente. | PRD HU-2 L101 |
| CA-04.04 | La confianza vale 1.00 si la etiqueta coincide exactamente con el glosario, 0.95 si coincide tras normalizar (mayúsculas, tildes, puntuación) y el coeficiente de Dice sobre palabras significativas en los demás casos. | DEC-08 |
| CA-04.05 | Con confianza de 0.8 o más el campo es `lleno`; entre 0.5 y menos de 0.8, `requiere_confirmacion` con la ruta candidata; por debajo de 0.5, `faltante`. | PRD HU-2 L99; DEC-08 |
| CA-04.06 | El mapeo es determinista y no usa el modelo de lenguaje: la misma entrada produce siempre el mismo resultado. | DEC-08; PRD §8 L295 |
| CA-04.07 | Se mapea la plantilla completa del caso. Las etiquetas recibidas que no pertenecen a la plantilla se ignoran con una advertencia. | DEC-22 |
| CA-04.08 | El país se presenta con su nombre según el catálogo del conocimiento del proceso (CO corresponde a Colombia). | DEC-15 |
| CA-04.09 | Los montos se presentan con su moneda y su año de referencia, por ejemplo "COP 98.000.000.000 (año 2025)". | DEC-16 |
| CA-04.10 | Los datos bancarios solo se llenan si la plantilla los pide explícitamente. | RN2 L276 |
| CA-04.11 | El resultado del mapeo queda registrado en `out/<caso>/mapeo.json` para los pasos siguientes. | DEC-04 |

**Precondiciones**
- PRE-04.01 La solicitud del caso es legible (HU-02).
- PRE-04.02 El repositorio maestro y el glosario están disponibles y son válidos.

**Postcondiciones**
- POST-04.01 Cada campo de la plantilla tiene un estado, una confianza y, si corresponde, una ruta y un valor provenientes del maestro.
- POST-04.02 El mapeo queda registrado y disponible para generar el formulario y armar el paquete.
- POST-04.03 La analista conoce cuántos campos quedaron llenos, faltantes y por confirmar.

#### HU-05. Conocer los datos faltantes

| Atributo | Valor |
|---|---|
| Origen | PRD HU-2 (L100); objetivo O2 (L64) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas, Agente |
| Decisiones | DEC-08, DEC-17 |

**Historia.** Como analista administrativa, quiero que el asistente me liste los datos solicitados que no existen en el repositorio, para gestionarlos sabiendo que ninguno fue inventado.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-05.01 | El asistente nunca inventa un valor. Un campo sin fuente en el maestro es `faltante`. | PRD HU-2 L100 |
| CA-05.02 | Un dato que existe en el maestro pero está vacío también se trata como `faltante`. | DEC-08 |
| CA-05.03 | Todo campo faltante aparece en el reporte de faltantes del mapeo y en la lista de verificación del paquete, indicando si es obligatorio. | Objetivo O2 L64; PRD HU-4 L115 |
| CA-05.04 | En el formulario, un faltante nunca se llena con un texto de relleno. | DEC-17 |
| CA-05.05 | Un campo faltante no bloquea el estado `listo_para_firma`. | RN3 L277 |
| CA-05.06 | El asistente informa los faltantes en el chat. | PRD §11 L368 |

**Precondiciones**
- PRE-05.01 El mapeo del caso se ejecutó (HU-04).

**Postcondiciones**
- POST-05.01 La analista conoce la lista completa de faltantes y su obligatoriedad.
- POST-05.02 Ningún faltante tiene un valor asignado en el formulario ni en el paquete.

#### HU-06. Resolver en el chat los campos que requieren confirmación

| Atributo | Valor |
|---|---|
| Origen | PRD HU-2 (L99); RN1 (L275); CA3 (L199) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_generar_formulario`), Agente, Front |
| Decisiones | DEC-04, DEC-06, DEC-09 |

**Historia.** Como analista administrativa, quiero confirmar o descartar en el chat, una sola vez, los datos que el asistente no puede asegurar, para que el formulario quede listo sin revisar ni corregir el documento.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-06.01 | En un cliente fuera de Colombia, el identificador tributario se propone con el NIT y queda en `requiere_confirmacion` con la nota "identificador extranjero". | RN1 L275 |
| CA-06.02 | Un mapeo aproximado (confianza entre 0.5 y menos de 0.8) queda en `requiere_confirmacion` con la ruta candidata. | PRD HU-2 L99; DEC-08 |
| CA-06.03 | Mientras exista al menos un campo en `requiere_confirmacion`, `listo_para_firma` es `false` con el motivo "campos pendientes de confirmación". | DEC-09 |
| CA-06.04 | El asistente cierra el turno con una pregunta por cada campo pendiente, indicando la etiqueta solicitada, el valor propuesto y su origen. | DEC-09; CA3 L199 |
| CA-06.05 | Si la analista acepta, el campo pasa a `lleno` y queda registrado como confirmado por el usuario. Si descarta, pasa a `faltante`. | DEC-09 |
| CA-06.06 | La decisión solo se aplica si la analista la expresó en su mensaje inmediatamente anterior y el backend la validó. La afirmación del modelo no basta. | DEC-06; RN4 L278 |
| CA-06.07 | La pregunta de confirmación de campos nunca se combina con la de envío. | DEC-06 |
| CA-06.08 | Tras la decisión, el formulario y el paquete se regeneran sin marcas de revisión en los campos resueltos. | DEC-09 |

**Precondiciones**
- PRE-06.01 El mapeo del caso tiene al menos un campo en `requiere_confirmacion`.
- PRE-06.02 El asistente presentó la pregunta de confirmación en el turno anterior.

**Postcondiciones**
- POST-06.01 Ningún campo resuelto queda en `requiere_confirmacion`.
- POST-06.02 El mapeo registrado refleja la decisión de la analista.
- POST-06.03 El formulario y el paquete regenerados reflejan la decisión.

### 6.3 Generación del formulario

#### HU-07. Obtener el formulario en Excel

| Atributo | Valor |
|---|---|
| Origen | PRD HU-3 (L107); objetivo O1 (L63) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_generar_formulario`) |
| Decisiones | DEC-04, DEC-09, DEC-14, DEC-17 |

**Historia.** Como analista administrativa, quiero obtener el formulario lleno en Excel con la misma estructura que envió el cliente, para no reformatear nada.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-07.01 | Se produce `out/<caso>/formulario.xlsx`. | PRD HU-3 L107 |
| CA-07.02 | Cada etiqueta y su valor se escriben exactamente en la hoja y la celda indicadas por `plantilla-celdas.json`. | PRD HU-3 L107 |
| CA-07.03 | Los textos se escriben como celdas de texto y conservan los ceros a la izquierda (por ejemplo `050021` y `03100012345`). Los números se escriben como número. | DEC-14 |
| CA-07.04 | Un faltante deja la celda de valor vacía, resaltada y con la nota "Faltante: no existe en el repositorio maestro". | DEC-17 |
| CA-07.05 | Un campo pendiente de confirmación se escribe con su valor, resaltado y con una nota, hasta que se resuelva (HU-06). | DEC-09 |
| CA-07.06 | Los valores se releen del maestro por su ruta y nunca se toman del modelo. Un mapeo recibido que no coincide con el registrado se rechaza. | DEC-04; CA2 L198 |
| CA-07.07 | Los casos `co-industrias-delta` y `hn-agroexport-sula` producen el formulario sin intervención humana en los campos que existen en el maestro. | Objetivo O1 L63 |

**Precondiciones**
- PRE-07.01 El formato del caso es `xlsx` y su plantilla de celdas es válida.
- PRE-07.02 El mapeo del caso está registrado (HU-04).

**Postcondiciones**
- POST-07.01 El archivo Excel existe en la ruta indicada y la analista la conoce.
- POST-07.02 El mapeo registrado se actualiza con los valores releídos del maestro.

#### HU-08. Obtener el formulario en PDF

| Atributo | Valor |
|---|---|
| Origen | PRD HU-3 (L108); objetivo O1 (L63) |
| Actor | Analista administrativa |
| Prioridad | P1 |
| Componente | Herramientas (`proveedor_generar_formulario`) |
| Decisiones | DEC-04, DEC-09, DEC-17 |

**Historia.** Como analista administrativa, quiero obtener el formulario lleno en PDF cuando el cliente lo pide en ese formato, para enviarlo sin transcribirlo.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-08.01 | Se produce `out/<caso>/formulario.pdf` a partir de `plantilla-campos.json`. | PRD HU-3 L108 |
| CA-08.02 | El PDF es generado (no un AcroForm rellenado) y reproduce todos los campos con etiqueta y valor en el orden de la plantilla. | PRD HU-3 L108 |
| CA-08.03 | Los campos obligatorios se identifican con un asterisco y una nota explicativa. | PRD §7.1 L260 |
| CA-08.04 | Un faltante se muestra como "pendiente". Un campo por confirmar se muestra con su valor, la marca "(*) por confirmar" y una nota al pie. | DEC-17; DEC-09 |
| CA-08.05 | Los caracteres que la fuente del PDF no puede representar se reemplazan sin que la generación falle. | PRD §8 L298 |
| CA-08.06 | El caso `ec-corp-andina` produce el formulario sin intervención humana en los campos que existen en el maestro. | Objetivo O1 L63 |

**Precondiciones**
- PRE-08.01 El formato del caso es `pdf` y su plantilla de campos es válida.
- PRE-08.02 El mapeo del caso está registrado (HU-04).

**Postcondiciones**
- POST-08.01 El archivo PDF existe en la ruta indicada y la analista la conoce.

#### HU-09. Obtener los valores para un portal web

| Atributo | Valor |
|---|---|
| Origen | PRD HU-3 (L109); PRD §7.4 (L281 a L287) |
| Actor | Analista administrativa |
| Prioridad | P2 |
| Componente | Herramientas (`proveedor_generar_formulario`), Documentación |
| Decisiones | DEC-07 |

**Historia.** Como analista administrativa, quiero recibir los valores listos para copiar cuando el cliente exige un portal web, para completar el formulario en línea sin buscar cada dato.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-09.01 | El asistente informa "formato no soportado" para el llenado automático del portal. | PRD HU-3 L109 |
| CA-09.02 | Se produce `out/<caso>/valores-portal.md` con cada campo, su valor y su estado (listo, por confirmar o faltante). | PRD HU-3 L109 |
| CA-09.03 | El resultado se informa como exitoso, con el indicador `soportado: false`, porque sí se produjo un artefacto útil. | DEC-07 |
| CA-09.04 | El archivo incluye la dirección del portal si figura en la solicitud, y la indicación de que las credenciales y el clic en "Enviar" son acciones humanas. | PRD §7.4 L286 |
| CA-09.05 | El asistente nunca solicita, almacena ni registra credenciales del portal. | PRD §7.4 L285 |
| CA-09.06 | El diseño completo de la automatización de portales queda documentado en `SOLUCION.md`, sección 5. | PRD HU-3 L109; §7.4 |

**Precondiciones**
- PRE-09.01 El formato del caso es `portal` y el caso incluye `plantilla-campos.json`.
- PRE-09.02 El mapeo del caso está registrado (HU-04).

**Postcondiciones**
- POST-09.01 La analista dispone de los valores para copiar en el portal.
- POST-09.02 Ninguna credencial fue solicitada ni almacenada.

### 6.4 Paquete para firma y envío

#### HU-10. Armar el paquete para firma

| Atributo | Valor |
|---|---|
| Origen | PRD HU-4 (L111 a L115) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_armar_paquete`) |
| Decisiones | DEC-05 |

**Historia.** Como analista administrativa, quiero un paquete con el formulario, los soportes y un borrador de correo, para enviarlo a firma en un solo paso.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-10.01 | Se crea `out/<caso>/paquete/` con el formulario, copias de los soportes exigidos que existen en el repositorio, `checklist.md` y `borrador-correo.md`. | PRD HU-4 L115 |
| CA-10.02 | Si el mapeo del caso no está registrado, el resultado es el error "Primero mapea los campos del caso". | DEC-05 |
| CA-10.03 | Si el formulario no se generó, el paquete se arma igual, con el formulario marcado como ausente y `listo_para_firma` en `false`. | DEC-05; PRD HU-5 L123 |
| CA-10.04 | El paquete se reconstruye completo en cada ejecución, sin restos de ejecuciones anteriores. | PRD §8 L295 |
| CA-10.05 | El resultado incluye la ruta del paquete, `listo_para_firma` y el contenido de la lista de verificación. | PRD §6.2 L190 |

**Precondiciones**
- PRE-10.01 El mapeo del caso está registrado (HU-04).
- PRE-10.02 El índice de soportes del repositorio está disponible y es válido.
- PRE-10.03 Normalmente, el formulario ya se generó (HU-07, HU-08 o HU-09).

**Postcondiciones**
- POST-10.01 La carpeta del paquete contiene todos los elementos disponibles.
- POST-10.02 El estado del paquete queda registrado para el envío simulado (HU-13).

#### HU-11. Conocer el estado de los soportes y si el paquete está listo para firma

| Atributo | Valor |
|---|---|
| Origen | PRD HU-4 (L115, L116); RN3 (L277); PRD §11 (L364) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_armar_paquete`), Agente |
| Decisiones | DEC-02, DEC-05, DEC-09, DEC-11, DEC-12 |

**Historia.** Como analista administrativa, quiero saber qué soportes están vigentes, vencidos o ausentes y si el paquete puede pasar a firma, para actualizar solo lo necesario.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-11.01 | Cada soporte exigido se clasifica como vigente, vencido o ausente. | PRD HU-4 L115 |
| CA-11.02 | Un soporte está vencido si su `vigencia_hasta` es anterior a la fecha de referencia. El mismo día sigue vigente. Un valor nulo significa que no vence. | PRD HU-4 L116; DEC-02 |
| CA-11.03 | La fecha de referencia se configura con `FECHA_REFERENCIA`. Si está vacía se usa la fecha del sistema. La fecha usada se informa en la lista de verificación. | DEC-02 |
| CA-11.04 | Bloquean `listo_para_firma`: un soporte vencido, un soporte ausente, un campo pendiente de confirmación y el formulario ausente. Un campo faltante no lo bloquea. | RN3 L277; DEC-09; DEC-05 |
| CA-11.05 | La lista de verificación enumera cada motivo de bloqueo. | PRD HU-4 L115 |
| CA-11.06 | Si el cliente exige una antigüedad máxima para la Cámara de Comercio, se muestra una advertencia no bloqueante para verificar la fecha de expedición. | DEC-11 |
| CA-11.07 | Si el país emisor de un soporte es distinto al del cliente, se muestra una advertencia no bloqueante para verificar su aceptación o apostilla. | DEC-12 |
| CA-11.08 | El asistente informa en el chat qué soportes debe actualizar la analista. | PRD §11 L364 |

**Precondiciones**
- PRE-11.01 La fecha de referencia está configurada o se acepta la fecha del sistema.
- PRE-11.02 El paquete se está armando (HU-10).

**Postcondiciones**
- POST-11.01 La lista de verificación refleja el estado de cada soporte, los motivos de bloqueo y las advertencias.
- POST-11.02 La analista sabe si el paquete está listo para firma y qué debe actualizar.

#### HU-12. Revisar el borrador de correo de respuesta

| Atributo | Valor |
|---|---|
| Origen | PRD HU-4 (L115); RN2 (L276); PRD §2.1 (L42) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas (`proveedor_armar_paquete`) |
| Decisiones | DEC-10 |

**Historia.** Como analista administrativa, quiero un borrador del correo de respuesta al cliente, para no redactarlo desde cero en cada solicitud.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-12.01 | `borrador-correo.md` está dirigido al remitente de la solicitud, con el asunto "RE: " seguido del asunto original. | DEC-10 |
| CA-12.02 | El borrador relaciona el formulario y los soportes incluidos en el paquete. | PRD HU-4 L115 |
| CA-12.03 | El borrador nunca incluye datos bancarios. | RN2 L276 |
| CA-12.04 | La firma del borrador usa el nombre y el cargo del representante legal y la razón social del maestro. | PRD §2.1 L42 |
| CA-12.05 | El borrador no se envía. Su uso es una decisión humana. | PRD §2.3 L52 |

**Precondiciones**
- PRE-12.01 El paquete se está armando (HU-10).
- PRE-12.02 El maestro contiene la razón social y el representante legal.

**Postcondiciones**
- POST-12.01 El borrador existe en el paquete, sin datos bancarios.

#### HU-13. Confirmar y simular el envío

| Atributo | Valor |
|---|---|
| Origen | PRD HU-4 (L117); RN4 (L278); CA3 (L199); PRD §11 (L368) |
| Actor | Analista administrativa |
| Prioridad | P1 |
| Componente | Herramientas (`proveedor_simular_envio`), Agente, API |
| Decisiones | DEC-06, DEC-10 |

**Historia.** Como analista administrativa, quiero que el asistente me pida una confirmación explícita antes de cualquier envío, para que ninguna acción externa ocurra sin mi decisión.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-13.01 | Antes de proponer cualquier envío, el asistente termina el turno con una pregunta explícita de confirmación. | PRD HU-4 L117; CA3 L199 |
| CA-13.02 | Si el paquete no está listo para firma, el asistente informa los motivos antes de preguntar. | DEC-10 |
| CA-13.03 | El envío solo procede si la confirmación se dio en el mensaje inmediatamente anterior, por el control de confirmación del front o con una expresión afirmativa de una lista cerrada, y el backend la validó. | RN4 L278; DEC-06 |
| CA-13.04 | Sin esa confirmación, el resultado es el error "requiere confirmación explícita". | PRD §6.2 L191 |
| CA-13.05 | La confirmación caduca al terminar el turno en que se usa. | DEC-06 |
| CA-13.06 | "Enviar" solo escribe `out/<caso>/ENVIO-SIMULADO.md`. No se envía ningún correo real. | PRD HU-4 L117 |
| CA-13.07 | `ENVIO-SIMULADO.md` registra el destinatario, el asunto, el cuerpo, los adjuntos, `listo_para_firma` con sus motivos y la condición "requiere formulario firmado por el representante legal". | DEC-10 |
| CA-13.08 | Si el paquete no se ha armado, el resultado es el error "Primero arma el paquete para firma". | DEC-05 |
| CA-13.09 | En el flujo de PRD §11, el mensaje "envía" produce solo `ENVIO-SIMULADO.md`, después de la confirmación explícita. | PRD §11 L368 |

**Precondiciones**
- PRE-13.01 El paquete del caso está armado (HU-10).
- PRE-13.02 El asistente formuló la pregunta de confirmación de envío en el turno anterior.
- PRE-13.03 La analista respondió con una confirmación explícita.

**Postcondiciones**
- POST-13.01 Existe `ENVIO-SIMULADO.md` con el estado del paquete, o la analista recibió el motivo del rechazo.
- POST-13.02 La confirmación usada ya no es válida para otro envío.
- POST-13.03 La firma y el envío real siguen siendo acciones humanas.

### 6.5 Manejo de errores

#### HU-14. Recibir mensajes de error claros sin perder la sesión

| Atributo | Valor |
|---|---|
| Origen | PRD HU-5 (L119 a L124); CA5 (L201); PRD §8 (L298) |
| Actor | Analista administrativa |
| Prioridad | P0 |
| Componente | Herramientas, Agente, API |
| Decisiones | DEC-05, DEC-07 |

**Historia.** Como analista administrativa, quiero que el asistente falle de forma clara, para no perder tiempo depurando.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-14.01 | Ante una plantilla corrupta, un caso inexistente o un formato no soportado, el asistente da un mensaje claro, sin traza técnica, y continúa con lo que sí puede hacer. | PRD HU-5 L123 |
| CA-14.02 | Ninguna herramienta lanza excepciones hacia el agente: todas devuelven `{ ok, data }` o `{ ok: false, error }`. | PRD HU-5 L124 |
| CA-14.03 | Los argumentos inválidos se rechazan con la validación antes de ejecutar la herramienta, y el error se devuelve al modelo. | PRD §6.2 L180 |
| CA-14.04 | Un error del proveedor de lenguaje, incluido un tiempo de espera agotado, se muestra en el chat en lenguaje claro y la sesión sigue activa. | CA5 L201; PRD §8 L298 |
| CA-14.05 | Un error inesperado dentro de una herramienta produce un mensaje genérico claro y queda registrado. | PRD HU-5 L123 |
| CA-14.06 | Un caso con error no impide procesar el siguiente. | PRD §8 L298 |

**Precondiciones**
- PRE-14.01 Ocurre una condición de error en los datos, en una herramienta o en el proveedor de lenguaje.

**Postcondiciones**
- POST-14.01 La analista conoce el problema en lenguaje claro.
- POST-14.02 La sesión sigue disponible para continuar o procesar otro caso.
- POST-14.03 El error queda registrado (HU-20).

### 6.6 Experiencia en el chat

#### HU-15. Ver cada llamada a herramienta en el historial del chat

| Atributo | Valor |
|---|---|
| Origen | PRD §6.1 (L149); CA4 (L200) |
| Actor | Analista administrativa |
| Prioridad | Requerido |
| Componente | Front, API |
| Decisiones | DEC-13 |

**Historia.** Como analista administrativa, quiero ver en el chat cada acción que ejecuta el asistente, para entender de dónde salen los resultados y confiar en ellos.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-15.01 | El chat muestra el historial de la conversación y un campo de entrada. | PRD §6.1 L149 |
| CA-15.02 | Cada llamada a herramienta se muestra con su nombre, sus argumentos y su resultado resumido. | PRD §6.1 L149; CA4 L200 |
| CA-15.03 | Las llamadas con error se distinguen visualmente y muestran el mensaje de error. | CA5 L201 |
| CA-15.04 | La respuesta de `POST /api/chat` incluye `reply`, `toolCalls[]` y `needsConfirmation`. | PRD §6.4 L209 |
| CA-15.05 | Ni el chat ni las respuestas de la API muestran claves ni secretos. | PRD §8 L296 |

**Precondiciones**
- PRE-15.01 La analista tiene una sesión de chat abierta.
- PRE-15.02 El asistente ejecutó al menos una herramienta en el turno.

**Postcondiciones**
- POST-15.01 El historial visible contiene todas las llamadas del turno.

#### HU-16. Identificar cuándo el asistente espera una confirmación

| Atributo | Valor |
|---|---|
| Origen | PRD §6.1 (L149); CA3 (L199) |
| Actor | Analista administrativa |
| Prioridad | Requerido |
| Componente | Front, API |
| Decisiones | DEC-06 |

**Historia.** Como analista administrativa, quiero que el chat resalte cuándo el asistente espera mi decisión, para no omitir una confirmación ni darla por error.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-16.01 | Cuando el asistente pide confirmación, el front resalta ese mensaje de forma visible. | PRD §6.1 L149; CA3 L199 |
| CA-16.02 | El front ofrece un control explícito de confirmación, además de la respuesta escrita. | DEC-06 |
| CA-16.03 | La API indica `needsConfirmation: true` mientras haya una confirmación pendiente. | PRD §6.4 L209 |
| CA-16.04 | El resaltado desaparece cuando la analista confirma o envía otro mensaje. | DEC-06 |

**Precondiciones**
- PRE-16.01 El asistente terminó el turno con una pregunta de confirmación (HU-06 o HU-13).

**Postcondiciones**
- POST-16.01 La analista distingue claramente el estado de espera de confirmación.

#### HU-17. Recibir un resumen final del procesamiento

| Atributo | Valor |
|---|---|
| Origen | PRD §11 (L358 a L368); CA1 (L197); CA2 (L198) |
| Actor | Analista administrativa |
| Prioridad | Requerido |
| Componente | Agente |
| Decisiones | DEC-09, DEC-10 |

**Historia.** Como analista administrativa, quiero recibir un resumen estructurado al terminar el procesamiento, para decidir el siguiente paso sin revisar cada archivo.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-17.01 | El resumen indica los campos llenos, los faltantes, los campos por confirmar, si el paquete está listo para firma, los soportes que deben actualizarse y la ruta `out/<caso>/`. | PRD §11 L368 |
| CA-17.02 | El resumen termina con una pregunta que cierra el turno. | PRD §11 L368 |
| CA-17.03 | Todo valor que afirma el asistente proviene del resultado de una herramienta. | CA2 L198 |
| CA-17.04 | Si se alcanza el tope de iteraciones del turno, el asistente responde con lo obtenido y lo que falta. | CA1 L197 |
| CA-17.05 | Si la analista pide no enviar nada, el asistente no ejecuta el envío simulado. | PRD §11 L365 |

**Precondiciones**
- PRE-17.01 El asistente ejecutó las herramientas que el procesamiento requería, o alcanzó el tope de iteraciones.

**Postcondiciones**
- POST-17.01 La analista conoce el estado completo del caso y el siguiente paso.

#### HU-18. Descargar los archivos generados desde el link

| Atributo | Valor |
|---|---|
| Origen | DEC-18; PRD §9.3 (L325) |
| Actor | Analista administrativa |
| Prioridad | Requerido |
| Componente | API, Front |
| Decisiones | DEC-18 |

**Historia.** Como analista administrativa, quiero descargar desde el chat los archivos generados para un caso, para revisarlos sin acceder al servidor.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-18.01 | `GET /api/files/:caso` lista los archivos generados del caso. | DEC-18 |
| CA-18.02 | `GET /api/files/:caso/<ruta>` descarga un archivo generado. | DEC-18 |
| CA-18.03 | Solo se sirven archivos dentro de `out/<caso>/`. Cualquier ruta fuera de esa carpeta se rechaza. | DEC-18; PRD §8 L296 |
| CA-18.04 | El chat muestra enlaces de descarga para los archivos que generó el asistente. | DEC-18 |

**Precondiciones**
- PRE-18.01 El caso tiene archivos generados en `out/<caso>/`.

**Postcondiciones**
- POST-18.01 La analista dispone de una copia local de los archivos solicitados.

#### HU-19. Consultar el historial completo de una sesión

| Atributo | Valor |
|---|---|
| Origen | PRD §6.4 (L210); PRD §6.1 (L150) |
| Actor | Analista administrativa |
| Prioridad | Requerido |
| Componente | API |
| Decisiones | DEC-18 |

**Historia.** Como analista administrativa, quiero consultar el historial completo de una sesión, para retomar o revisar lo que se hizo.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-19.01 | `GET /api/sessions/:id` devuelve el historial completo de la sesión, incluidas las llamadas a herramientas. | PRD §6.4 L210 |
| CA-19.02 | Si la sesión no existe, la respuesta es un mensaje claro. | PRD HU-5 L123 |
| CA-19.03 | La sesión se conserva en memoria o en archivo mientras el servicio está activo. Un reinicio puede borrarla. | PRD §6.1 L154; DEC-18 |

**Precondiciones**
- PRE-19.01 La sesión fue creada con al menos un mensaje.

**Postcondiciones**
- POST-19.01 Quien consulta obtiene el historial de la sesión o el motivo por el que no está disponible.

### 6.7 Trazabilidad de las acciones

#### HU-20. Auditar las acciones del asistente

| Atributo | Valor |
|---|---|
| Origen | CA4 (L200); RN5 (L279) |
| Actor | Analista administrativa |
| Prioridad | Requerido |
| Componente | Herramientas |
| Decisiones | DEC-13 |

**Historia.** Como analista administrativa, quiero que toda acción del asistente quede registrada, para poder revisar después qué se hizo en cada caso.

**Criterios de aceptación**

| ID | Criterio | Origen |
|---|---|---|
| CA-20.01 | Cada llamada a herramienta se registra en `out/log.jsonl` y en `out/<caso>/log.jsonl`. | CA4 L200; RN5 L279; DEC-13 |
| CA-20.02 | Cada registro contiene `ts`, `sessionId`, `caso`, `herramienta`, `ok` y `resumen`. | RN5 L279; DEC-13 |
| CA-20.03 | El resumen contiene solo conteos y estados, nunca datos sensibles. | DEC-13; PRD §8 L296 |
| CA-20.04 | Un fallo al escribir el registro no interrumpe la herramienta. | PRD HU-5 L124 |

**Precondiciones**
- PRE-20.01 Se ejecutó al menos una herramienta.

**Postcondiciones**
- POST-20.01 El historial de acciones del caso puede reconstruirse a partir de los registros.

---

## 7. Matriz de trazabilidad

### 7.1 Historias del PRD y requisitos frente a historias extendidas

| Fuente | Historias extendidas |
|---|---|
| PRD HU-1 (L88 a L93) | HU-01, HU-02, HU-03 |
| PRD HU-2 (L95 a L101) | HU-04, HU-05, HU-06 |
| PRD HU-3 (L103 a L109) | HU-07, HU-08, HU-09 |
| PRD HU-4 (L111 a L117) | HU-10, HU-11, HU-12, HU-13 |
| PRD HU-5 (L119 a L124) | HU-14 |
| PRD §6.1 Componentes (front de chat) | HU-15, HU-16 |
| PRD §6.3 Reglas del ciclo (CA1 a CA5) | HU-13, HU-14, HU-15, HU-16, HU-17, HU-20 |
| PRD §6.4 API mínima | HU-15, HU-16, HU-19 |
| PRD §7.3 Reglas de negocio (RN1 a RN5) | HU-03, HU-04, HU-06, HU-11, HU-12, HU-13, HU-20 |
| PRD §7.4 Portales web | HU-09 |
| PRD §11 Prompt de ejemplo | HU-01, HU-11, HU-13, HU-17 |

### 7.2 Decisiones frente a historias extendidas

| Decisión | Historias |
|---|---|
| DEC-01 Ubicación de fixtures | HU-01 |
| DEC-02 Fecha de referencia | HU-11 |
| DEC-03 Ambigüedad del identificador | HU-02, HU-03 |
| DEC-04 Mapeo y protección de valores | HU-04, HU-06, HU-07, HU-08 |
| DEC-05 Precondiciones del paquete | HU-10, HU-11, HU-13, HU-14 |
| DEC-06 Confirmación en el backend | HU-06, HU-13, HU-16 |
| DEC-07 Formato portal | HU-02, HU-09 |
| DEC-08 Confianza del mapeo | HU-04, HU-05, HU-06 |
| DEC-09 Campos por confirmar | HU-06, HU-07, HU-08, HU-11, HU-17 |
| DEC-10 Envío simulado | HU-12, HU-13, HU-17 |
| DEC-11 Antigüedad de la Cámara de Comercio | HU-11 |
| DEC-12 Soportes de otro país | HU-02, HU-11 |
| DEC-13 Registro de ejecución | HU-15, HU-20 |
| DEC-14 Tipos de dato en Excel | HU-07 |
| DEC-15 Transformaciones permitidas | HU-04 |
| DEC-16 Montos con moneda | HU-04 |
| DEC-17 Representación de faltantes | HU-05, HU-07, HU-08 |
| DEC-18 Hosting y archivos | HU-18, HU-19 |
| DEC-22 Mapeo de la plantilla completa | HU-04 |

Las decisiones DEC-19 (módulo reutilizable), DEC-20 (priorización), DEC-21 (modelo de lenguaje) y DEC-23 (fecha de la demo) no se asocian a historias de usuario. Corresponden a requisitos no funcionales o a criterios de validación de la prueba.

### 7.3 Contenido excluido de este documento

Los siguientes requisitos del PRD no son historias de usuario. Los commits que los implementan citan directamente la sección del PRD.

| Requisito | Tipo | Referencia del PRD |
|---|---|---|
| Verificar las herramientas sin modelo de lenguaje (`demo.ts`) | Criterio de validación de la prueba | PRD §6.6 |
| Consultar el estado del servicio (`/api/health`) | Criterio de validación de la prueba | PRD §6.4, §9.3 |
| Controlar el costo de uso y proteger la clave del modelo | Requisito no funcional | PRD §8 |
| Cambiar de modelo o de proveedor sin modificar el ciclo del agente | Requisito no funcional | PRD §6.1, §6.5 |
| Levantar la aplicación en local con un solo comando | Requisito no funcional y criterio de validación | PRD §8, §9.2 |
| Documentar la solución (`SOLUCION.md`, `README.md`) | Entregable de la prueba | PRD §9.1, §9.2 |
| Empaquetar el agente como módulo reutilizable | Entregable opcional de la prueba | PRD §9.4 |

### 7.4 Estado de implementación al 2026-11-24

| Historia | Estado | Evidencia |
|---|---|---|
| HU-01 a HU-08, HU-10 a HU-20 | Hecha | `demo.ts`, `bun test` (53 pruebas), pruebas con el modelo real y revisión de la interfaz (`docs/PRUEBAS.md`) |
| HU-09 | Hecha | CA-09.06 se cumple con la sección 5 de `SOLUCION.md` |

Hallazgo abierto fuera del alcance de las historias: H-01 (`docs/PRUEBAS.md` §5), reservado para una etapa de refinamiento del agente.
