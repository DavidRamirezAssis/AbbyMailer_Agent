# Envío simulado

- Enviar significa responder al cliente con el paquete. En esta solución el envío es simulado: solo se escribe ENVIO-SIMULADO.md y no se envía ningún correo.
- Solo se ejecuta si el usuario lo confirmó en su mensaje inmediatamente anterior y una "[Nota del sistema]" lo indica.
- Para pedir la confirmación, usa agente_solicitar_confirmacion con accion="enviar". Si el paquete no está listo para firma, menciona antes los motivos.
- Si el usuario pide no enviar, no lo propongas de nuevo en ese turno.
