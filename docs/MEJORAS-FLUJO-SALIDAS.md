# Salidas de Farmacia: cantidades parciales

## Implementado
- El formulario y el dominio usan un mismo cálculo para disponibilidad, conversión y saldo. Hasta tres decimales en la cantidad entregada.
- La cantidad comienza vacía y debe completarse expresamente. Valida localidad activa, lote vigente, medicamento activo, precisión y existencias antes de confirmar.
- Frascos con contenido configurado se despachan en ml (cc) por defecto. Tabletas admiten unidades y fracciones. No representa una recomendación de dosificación.
- Los resultados de búsqueda se ordenan por vencimiento; la selección del lote es manual.
- Resumen separado por unidad, modalidad por registro, interfaz móvil sin tabla horizontal y confirmación con detalle.
- Identificador de salida estable durante los reintentos; se renueva tras guardar correctamente. El formulario se mantiene al cerrar el modal mientras la pantalla siga montada.
- Nuevos movimientos guardan saldoAnterior y saldoPosterior en unidadEntrega, cantidadEntregada, contenidoMlSalida, responsableSalida y observacionSalida. El historial permite consultar estos datos sin reconstruir saldos a partir del stock actual. No se inventan valores para movimientos anteriores.

## Pendiente para producción
1. El backend debe calcular las conversiones, comprobar los permisos y derivar responsableSalida de la sesión; nunca aceptar como válidos saldos calculados por el cliente.
2. Descuento atómico por lote y control de concurrencia, con idempotencia por identificador de salida. Revalidar disponibilidad dentro de la transacción.
3. Persistir el movimiento, unidades, factor de conversión y saldos históricos. Usar precisión decimal consistente en la base de datos.
4. Definir una política operativa para recipientes abiertos, caducidad tras apertura, desperdicios y devoluciones. El modelo actual conserva saldo agregado por lote; no identifica físicamente cada frasco abierto.
5. Para borradores entre dispositivos, implementar almacenamiento de borradores en servidor. Actualmente cerrar el modal conserva datos únicamente en la pantalla abierta.
6. Pruebas de aceptación con Farmacia: 200 ml menos 5 ml, consumo posterior del remanente, 0.5 tableta, múltiples lotes, doble confirmación y dos usuarios despachando el mismo lote.
