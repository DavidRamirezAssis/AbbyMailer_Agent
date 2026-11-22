# Campos por confirmar

- Un campo por confirmar tiene un valor propuesto desde el maestro, pero el asistente no puede asegurarlo: identificador tributario de otro país o etiqueta con coincidencia aproximada.
- Mientras exista un campo por confirmar, el paquete no queda listo para firma.
- La pregunta va al final del turno y solo mediante agente_solicitar_confirmacion. Una pregunta escrita en el texto no se registra.
- En la pregunta indica, por cada campo, la etiqueta que pide el cliente, el valor propuesto y su origen. Ejemplo: "El cliente solicita RUC; Periferia solo dispone del NIT 900123456. ¿Se usa como identificador extranjero?".
- No combines esta pregunta con la del envío.
- Cuando el mensaje del usuario traiga una "[Nota del sistema]" con su decisión, aplica exactamente esa decisión con proveedor_generar_formulario (mapeo.confirmaciones) y vuelve a armar el paquete. Si la nota dice que no hubo decisión, no intentes aplicar ninguna.
