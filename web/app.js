// Front de chat (DEC-29). JavaScript sin dependencias, servido por el mismo backend.
// HU-15 llamadas visibles, HU-16 confirmación resaltada, HU-18 descarga de archivos,
// HU-19 historial de la sesión, DEC-27 sesión inexistente.

const $ = (id) => document.getElementById(id)
const app = $("app")
const presentacion = $("presentacion")
const conversacion = $("conversacion")
const compositor = $("compositor")
const entrada = $("entrada")
const botonEnviar = $("enviar")
const aviso = $("aviso")

const CLAVE_SESION = "periferiait.sesion"
const CLAVE_ACCESO = "periferiait.clave"
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches

const NOMBRES_HERRAMIENTA = {
  proveedor_leer_solicitud: "Lectura de la solicitud",
  proveedor_mapear_campos: "Cruce con el repositorio maestro",
  proveedor_generar_formulario: "Generación del formulario",
  proveedor_armar_paquete: "Armado del paquete para firma",
  proveedor_simular_envio: "Envío simulado",
  agente_solicitar_confirmacion: "Solicitud de confirmación",
}

let ocupado = false

// ---------------------------------------------------------------------------
// Almacenamiento local (solo conveniencia del navegador)
// ---------------------------------------------------------------------------

function leerAlmacen(clave) {
  try {
    return sessionStorage.getItem(clave)
  } catch {
    return null
  }
}

function guardarAlmacen(clave, valor) {
  try {
    if (valor === null) sessionStorage.removeItem(clave)
    else sessionStorage.setItem(clave, valor)
  } catch {
    // Sin almacenamiento disponible: la sesión dura lo que dure la página.
  }
}

const claveUrl = new URLSearchParams(location.search).get("clave")
if (claveUrl) guardarAlmacen(CLAVE_ACCESO, claveUrl)
const claveAcceso = () => leerAlmacen(CLAVE_ACCESO)

function cabeceras() {
  const resultado = { "content-type": "application/json" }
  const clave = claveAcceso()
  if (clave) resultado["x-access-key"] = clave
  return resultado
}

// ---------------------------------------------------------------------------
// Markdown mínimo y seguro: se escapa todo el HTML antes de dar formato
// ---------------------------------------------------------------------------

function escapar(texto) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
}

function enLinea(texto) {
  return escapar(texto)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
}

function markdown(texto) {
  const html = []
  let lista = null
  let parrafo = []
  const cerrarParrafo = () => {
    if (parrafo.length) html.push(`<p>${parrafo.join("<br>")}</p>`)
    parrafo = []
  }
  const cerrarLista = () => {
    if (lista) html.push(`</${lista}>`)
    lista = null
  }
  for (const linea of texto.split("\n")) {
    const titulo = linea.match(/^#{1,4}\s+(.*)$/)
    const vineta = linea.match(/^\s*[-*]\s+(.*)$/)
    const numero = linea.match(/^\s*\d+[.)]\s+(.*)$/)
    if (titulo) {
      cerrarParrafo()
      cerrarLista()
      html.push(`<h3>${enLinea(titulo[1])}</h3>`)
    } else if (vineta || numero) {
      cerrarParrafo()
      const tipo = vineta ? "ul" : "ol"
      if (lista !== tipo) {
        cerrarLista()
        html.push(`<${tipo}>`)
        lista = tipo
      }
      html.push(`<li>${enLinea((vineta ?? numero)[1])}</li>`)
    } else if (linea.trim() === "") {
      cerrarParrafo()
      cerrarLista()
    } else {
      cerrarLista()
      parrafo.push(enLinea(linea))
    }
  }
  cerrarParrafo()
  cerrarLista()
  return html.join("")
}

// ---------------------------------------------------------------------------
// Transición de la pantalla inicial a la conversación
// ---------------------------------------------------------------------------

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

async function entrarEnConversacion({ animar }) {
  if (app.classList.contains("conversando")) return
  const antes = compositor.getBoundingClientRect()
  if (animar && !sinMovimiento) {
    presentacion.classList.add("saliendo")
    await esperar(260)
  }
  app.classList.add("conversando")
  conversacion.hidden = false
  $("indicadores").hidden = false
  if (!animar || sinMovimiento) return
  // FLIP: el campo de texto se desliza desde su posición inicial hasta la inferior central.
  const despues = compositor.getBoundingClientRect()
  compositor.animate(
    [
      { transform: `translate(${antes.left - despues.left}px, ${antes.top - despues.top}px)`, width: `${antes.width}px` },
      { transform: "translate(0, 0)", width: `${despues.width}px` },
    ],
    { duration: 520, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
  )
}

// ---------------------------------------------------------------------------
// Mensajes
// ---------------------------------------------------------------------------

function desplazarAlFinal() {
  conversacion.scrollTo({ top: conversacion.scrollHeight, behavior: sinMovimiento ? "auto" : "smooth" })
}

function agregarUsuario(texto) {
  const mensaje = document.createElement("div")
  mensaje.className = "mensaje usuario"
  const burbuja = document.createElement("div")
  burbuja.className = "burbuja"
  burbuja.textContent = texto
  mensaje.append(burbuja)
  conversacion.append(mensaje)
  desplazarAlFinal()
}

function agregarPensando() {
  const mensaje = document.createElement("div")
  mensaje.className = "mensaje asistente pensando"
  mensaje.innerHTML = '<span class="puntos"><span></span><span></span><span></span></span><span class="texto">Procesando la solicitud</span>'
  conversacion.append(mensaje)
  const inicio = Date.now()
  const texto = mensaje.querySelector(".texto")
  const temporizador = setInterval(() => {
    texto.textContent = `Procesando la solicitud (${Math.round((Date.now() - inicio) / 1000)} s)`
  }, 1000)
  desplazarAlFinal()
  return () => {
    clearInterval(temporizador)
    mensaje.remove()
  }
}

function agregarError(texto) {
  const mensaje = document.createElement("div")
  mensaje.className = "mensaje asistente error"
  const contenido = document.createElement("div")
  contenido.className = "contenido"
  contenido.textContent = texto
  mensaje.append(contenido)
  conversacion.append(mensaje)
  desplazarAlFinal()
}

function tarjetaHerramienta(llamada) {
  const tarjeta = document.createElement("details")
  tarjeta.className = `herramienta${llamada.ok ? "" : " fallida"}`
  const resumen = document.createElement("summary")
  const nombre = document.createElement("span")
  nombre.className = "nombre"
  nombre.textContent = NOMBRES_HERRAMIENTA[llamada.nombre] ?? llamada.nombre
  const detalle = document.createElement("span")
  detalle.className = "resumen"
  detalle.textContent = `${llamada.ok ? "" : "Error: "}${llamada.resumen}`
  resumen.append(nombre, detalle)

  const cuerpo = document.createElement("div")
  cuerpo.className = "detalle"
  const tecnico = document.createElement("div")
  tecnico.className = "tecnico"
  tecnico.textContent = llamada.nombre
  const argumentos = document.createElement("pre")
  argumentos.textContent = JSON.stringify(llamada.argumentos, null, 2)
  cuerpo.append(tecnico, argumentos)
  tarjeta.append(resumen, cuerpo)
  return tarjeta
}

function enlaceDescarga(caso, ruta) {
  const parametros = claveAcceso() ? `?clave=${encodeURIComponent(claveAcceso())}` : ""
  const enlace = document.createElement("a")
  enlace.href = `/api/files/${encodeURIComponent(caso)}/${ruta.split("/").map(encodeURIComponent).join("/")}${parametros}`
  enlace.textContent = ruta
  return enlace
}

async function bloqueArchivos(rutas) {
  // Las rutas llegan como "out/<caso>/<archivo>" o "out/<caso>/paquete" (carpeta).
  const porCaso = new Map()
  for (const ruta of rutas) {
    const [, caso, ...resto] = ruta.split("/")
    if (!caso) continue
    porCaso.set(caso, [...(porCaso.get(caso) ?? []), resto.join("/")])
  }
  const elementos = []
  for (const [caso, rutasCaso] of porCaso) {
    let disponibles = []
    try {
      const respuesta = await fetch(`/api/files/${encodeURIComponent(caso)}`, { headers: cabeceras() })
      if (respuesta.ok) disponibles = (await respuesta.json()).archivos.map((a) => a.ruta)
    } catch {
      continue
    }
    const visibles = disponibles.filter((d) => rutasCaso.some((r) => d === r || d.startsWith(`${r}/`)))
    for (const ruta of visibles) elementos.push(enlaceDescarga(caso, ruta))
  }
  if (elementos.length === 0) return null
  const bloque = document.createElement("div")
  bloque.className = "archivos"
  bloque.innerHTML = '<div class="archivos-titulo">Archivos generados</div>'
  const lista = document.createElement("ul")
  for (const enlace of elementos) {
    const item = document.createElement("li")
    item.append(enlace)
    lista.append(item)
  }
  bloque.append(lista)
  return bloque
}

function botonesConfirmacion(confirmacion) {
  const acciones = document.createElement("div")
  acciones.className = "acciones"
  const etiquetaConfirmar = confirmacion.accion === "enviar" ? "Confirmar envío" : "Confirmar"
  for (const [texto, decision, clase] of [
    [etiquetaConfirmar, "aceptar", "boton boton-principal"],
    ["Descartar", "descartar", "boton boton-secundario"],
  ]) {
    const boton = document.createElement("button")
    boton.type = "button"
    boton.className = clase
    boton.textContent = texto
    boton.addEventListener("click", () => enviar({ decision }))
    acciones.append(boton)
  }
  return acciones
}

async function agregarAsistente({ reply, toolCalls = [], needsConfirmation, confirmacion, archivos = [] }) {
  const mensaje = document.createElement("div")
  mensaje.className = "mensaje asistente"
  const contenido = document.createElement("div")
  contenido.className = `contenido${needsConfirmation ? " confirmacion" : ""}`
  contenido.innerHTML = markdown(reply ?? "")
  if (needsConfirmation && confirmacion) contenido.append(botonesConfirmacion(confirmacion))
  mensaje.append(contenido)

  if (toolCalls.length > 0) {
    const herramientas = document.createElement("div")
    herramientas.className = "herramientas"
    for (const llamada of toolCalls) herramientas.append(tarjetaHerramienta(llamada))
    mensaje.append(herramientas)
  }
  conversacion.append(mensaje)
  if (archivos.length > 0) {
    const bloque = await bloqueArchivos(archivos)
    if (bloque) mensaje.append(bloque)
  }
  desplazarAlFinal()
}

/** Una confirmación vale solo para el turno siguiente: sus botones se desactivan al responder. */
function desactivarConfirmaciones() {
  for (const boton of conversacion.querySelectorAll(".acciones button")) boton.disabled = true
}

// ---------------------------------------------------------------------------
// Indicadores (DEC-29)
// ---------------------------------------------------------------------------

const numero = (valor) => Number(valor ?? 0).toLocaleString("es-CO")

function actualizarIndicadores({ uso, modelo, sessionId }) {
  if (modelo) $("ind-modelo").textContent = modelo
  if (sessionId) $("ind-id").textContent = sessionId.slice(0, 8)
  if (!uso) return
  if (uso.turno) $("ind-turno").textContent = `${numero(uso.turno.entrada)} entrada · ${numero(uso.turno.salida)} salida`
  const sesion = uso.sesion
  if (sesion) {
    $("ind-sesion").textContent = `${numero(sesion.usados)} / ${numero(sesion.limite)} tokens`
    $("ind-barra").style.width = `${Math.min(100, (sesion.usados / Math.max(1, sesion.limite)) * 100)}%`
  }
  const costo = uso.costoEstimadoUsd?.sesion
  if (costo !== null && costo !== undefined) $("ind-costo").textContent = `USD ${costo.toFixed(4)}`
}

function mostrarAviso(texto) {
  aviso.textContent = texto
  aviso.hidden = false
  clearTimeout(mostrarAviso.temporizador)
  mostrarAviso.temporizador = setTimeout(() => (aviso.hidden = true), 6000)
}

// ---------------------------------------------------------------------------
// Envío de mensajes
// ---------------------------------------------------------------------------

function ajustarAltura() {
  entrada.style.height = "auto"
  entrada.style.height = `${Math.min(entrada.scrollHeight, 200)}px`
  entrada.style.overflowY = entrada.scrollHeight > 200 ? "auto" : "hidden"
}

function bloquear(estado) {
  ocupado = estado
  botonEnviar.disabled = estado || entrada.value.trim() === ""
}

async function solicitarChat(cuerpo) {
  const respuesta = await fetch("/api/chat", { method: "POST", headers: cabeceras(), body: JSON.stringify(cuerpo) })
  let datos = null
  try {
    datos = await respuesta.json()
  } catch {
    datos = null
  }
  return { estado: respuesta.status, datos }
}

async function enviar(confirmacion) {
  const texto = entrada.value.trim()
  if (ocupado || (!texto && !confirmacion)) return
  bloquear(true)
  desactivarConfirmaciones()
  await entrarEnConversacion({ animar: true })
  agregarUsuario(texto || (confirmacion.decision === "aceptar" ? "Confirmo." : "Descarto."))
  entrada.value = ""
  ajustarAltura()

  const quitarPensando = agregarPensando()
  const cuerpo = { message: texto || undefined, confirmacion }
  try {
    let sesion = leerAlmacen(CLAVE_SESION)
    let { estado, datos } = await solicitarChat({ ...cuerpo, sessionId: sesion ?? undefined })
    if (estado === 404 && datos?.codigo === "sesion_inexistente") {
      // DEC-27: la sesión anterior ya no existe; se continúa en una nueva sin mostrar error.
      guardarAlmacen(CLAVE_SESION, null)
      mostrarAviso("La sesión anterior ya no estaba disponible; se inició una sesión nueva.")
      ;({ estado, datos } = await solicitarChat({ message: texto || "Hola" }))
    }
    quitarPensando()
    if (estado === 200 && datos?.ok) {
      guardarAlmacen(CLAVE_SESION, datos.sessionId)
      actualizarIndicadores(datos)
      await agregarAsistente(datos)
    } else if (estado === 401) {
      agregarError("Este enlace requiere una clave de acceso. Abra el enlace con ?clave=<su clave>.")
    } else {
      agregarError(datos?.error ?? "No fue posible procesar el mensaje. Intente de nuevo.")
    }
  } catch {
    quitarPensando()
    agregarError("No fue posible comunicarse con el servicio. Verifique la conexión e intente de nuevo.")
  } finally {
    bloquear(false)
    entrada.focus()
  }
}

// ---------------------------------------------------------------------------
// Historial de la sesión al recargar la página (HU-19)
// ---------------------------------------------------------------------------

async function restaurarSesion() {
  const sesion = leerAlmacen(CLAVE_SESION)
  if (!sesion) return
  try {
    const respuesta = await fetch(`/api/sessions/${encodeURIComponent(sesion)}`, { headers: cabeceras() })
    if (!respuesta.ok) {
      guardarAlmacen(CLAVE_SESION, null)
      return
    }
    const datos = await respuesta.json()
    if (!datos.turnos?.length) return
    await entrarEnConversacion({ animar: false })
    datos.turnos.forEach((turno, indice) => {
      const ultimo = indice === datos.turnos.length - 1
      agregarUsuario(turno.mensaje)
      void agregarAsistente({
        reply: turno.respuesta,
        toolCalls: turno.llamadas,
        needsConfirmation: ultimo && turno.needsConfirmation,
        confirmacion: ultimo ? datos.confirmacion : null,
      })
    })
    actualizarIndicadores({ sessionId: datos.sessionId, uso: { sesion: datos.uso } })
  } catch {
    // Sin historial disponible: se empieza desde la pantalla inicial.
  }
}

async function cargarEstado() {
  try {
    const respuesta = await fetch("/api/health")
    const datos = await respuesta.json()
    if (datos.ok) $("ind-modelo").textContent = datos.model
  } catch {
    // El indicador de modelo queda vacío si el servicio no responde.
  }
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

compositor.addEventListener("submit", (evento) => {
  evento.preventDefault()
  void enviar()
})

entrada.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter" && !evento.shiftKey) {
    evento.preventDefault()
    void enviar()
  }
})

entrada.addEventListener("input", () => {
  ajustarAltura()
  if (!ocupado) botonEnviar.disabled = entrada.value.trim() === ""
})

$("nueva-sesion").addEventListener("click", () => {
  guardarAlmacen(CLAVE_SESION, null)
  location.href = location.pathname
})

botonEnviar.disabled = true
void cargarEstado()
void restaurarSesion()
entrada.focus()
