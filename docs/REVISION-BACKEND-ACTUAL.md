# Última revisión del backend — 7 de octubre de 2026

Fuente: [Swagger en ejecución](http://localhost:3000/docs/). Especificación guardada en `api-openapi-latest.json`, comparada con `api-openapi-2026-10-07.json` y con los flujos de `src/shared/api/domain.ts`. Continúan 100 operaciones; los cambios recientes amplían contratos existentes.

Esta revisión sustituye los pendientes de las anteriores. Es una revisión del contrato publicado y del código cliente: no se han ejecutado transacciones autenticadas ni inspeccionado la implementación del backend. Un comportamiento no documentado no se considera automáticamente inexistente.

## Resultado

Ya no hace falta implementar la lista amplia de cambios de la revisión anterior. El contrato permite comenzar la integración. Antes de darla por completa, quedan dos casos de recepción por resolver o documentar y una inconsistencia menor del esquema de actividad.

## Corregido en el Swagger actual

- Checklist obligatorio de recepción: cantidad, lote, vencimiento, condición y conformidad; persistencia de observaciones en detalles.
- Recepción `COMPLETA`, que bloquea todo el ingreso ante diferencias, y `PARCIAL`, que acredita líneas conformes. El servidor recalcula conformidad.
- Incidencias con checklist estructurado y seguimiento mediante `COMENTARIO`, sin cerrar la incidencia ni modificar stock.
- Prioridad BAJA/NORMAL/ALTA/URGENTE en solicitudes y filtros.
- Actividad acotada para Bodega/Farmacia, con actor y localidad; historial anterior restringido a Administración.
- Acciones terapéuticas editables por ADMIN/BODEGA.
- Rechazo/cancelación de solicitudes sin envíos, liberando reservas.
- Borradores con `detalles: []`, aunque siguen requiriendo proveedor y número.
- Cantidad por empaque como entero positivo y soporte WebP en archivos.
- Filtros de producto, categoría, stock bajo, vencimiento, tipo de movimiento, área, ubicación y modalidad, según recurso.
- Esquema `Resumen` definido; exportación de inventario y actividad además de recepciones, solicitudes y movimientos.
- Idempotencia opcional de movimientos mediante UUID `id_operacion`, por usuario; repetir el mismo cuerpo recupera el movimiento y cambiarlo genera 409.
- Notificaciones: `alcance=todas` solo ADMIN; lectura individual y campana sobre avisos propios no leídos.
- Enums de estados y descripción de tránsito, devoluciones, discrepancias y reintentos.

## 1. Ajuste concreto: datos físicamente no verificables

Rutas afectadas:

- POST `/solicitudes/{id}/recepcion`.
- POST `/movimientos/{id}/recepcion`.
- POST `/solicitudes/{id}/incidencias` cuando se incluye checklist.

El checklist permite condición `NO_VERIFICABLE`, pero exige `numero_lote_observado` no vacío y `vencimiento_observado` como fecha válida, sin null. Si la etiqueta está borrada, el usuario no puede representar correctamente que esos datos son desconocidos sin inventarlos. También debe definirse la representación de una línea completamente ausente.

**Recomendación:** permitir null/ausencia de valores observados únicamente para casos no verificables/no recibidos y con `conforme=false`, exigir explicación y bloquear acreditación. Para líneas conformes deben seguir siendo obligatorios y coincidir con el lote esperado. Aplicar el mismo contrato al checklist almacenado y al de incidencias.

No es necesario otro endpoint. La incidencia con texto libre sirve como alternativa actual, pero no conserva el detalle estructurado completo de ese caso.

## 2. Aclarar o implementar recuperación de un envío EN_REVISION

El contrato establece:

- Recepción COMPLETA con diferencias devuelve 200, deja EN_REVISION y acredita cero.
- Repetir recepción devuelve 409.
- COMENTARIO no modifica estado ni saldo.
- REINTEGRAR_BODEGA recupera todo el saldo pendiente; PERDIDA lo concilia como pérdida.
- RESPUESTA solo resuelve incidencias generales.
- Devolución por solicitud documenta EN_TRANSITO o COMPLETADO, no EN_REVISION.

No queda documentado un camino para que Farmacia corrija una verificación o reciba el producto corregido y acredite ese mismo envío EN_REVISION. El frontend local sí contempla reportar diferencia, recibir respuesta de Bodega y después confirmar conformidad.

**Recomendación:** decidir y documentar uno de estos caminos:

1. Permitir una nueva verificación versionada del saldo pendiente, conservando historial y sin volver a acreditar cantidades ya ingresadas; puede ampliar recepción existente.
2. Reintegrar físicamente a Bodega y generar un nuevo envío, explicando cómo queda la solicitud original, sus reservas y cantidades pendientes.

Si el backend ya implementa uno, basta completar su documentación y probarlo. No se afirma que esté ausente en ejecución. Es importante distinguir un reintento idéntico por error de red de una nueva verificación autorizada después de una corrección.

## 3. Corrección menor de OpenAPI

El body de revisión de incidencias admite `COMENTARIO`, pero el enum de `actividad.detalle.resolucion` solo declara RESPUESTA/REINTEGRAR_BODEGA/PERDIDA. Si esa acción se registra con el mismo detalle, agregar COMENTARIO al esquema; si usa otra estructura, documentarla. No representa una nueva ruta ni prueba de un fallo de ejecución, pero evita tipos generados incompatibles con la respuesta real.

## Lo restante es principalmente trabajo del frontend

- Enviar expresamente `modo_recepcion: COMPLETA`: el valor por defecto del backend es PARCIAL. No basta con omitirlo.
- Un 200 de recepción puede significar EN_REVISION y cero unidades acreditadas; mostrar el estado devuelto, no éxito automático de ingreso.
- Traducir «Notificar revisión» a COMENTARIO. No convertirlo en reintegro o pérdida.
- Mantener unidad base no editable si PATCH medicamentos no la admite; no requiere ampliar backend solo para conservar un input.
- Exigir proveedor y número antes de guardar borrador; mantener su versión, solicitar motivo al cancelar y manejar 409.
- Usar id_operacion estable durante un reintento de movimiento y uno nuevo para otra operación. No llamar las dos rutas de recepción para el mismo envío.
- Adaptar `/sivet`, `/sivet/commands` y `/users` a recursos REST; Bearer, refresh serializado, envoltura `data`, IDs, estados y decimales. Estas llamadas antiguas siguen en el cliente.
- Subir FormData y obtener archivos protegidos como blob. El frontend puede conservar un límite menor de archivo si lo comunica.
- Procesar exportaciones NDJSON completas, comprobar `fin:true` y ajustar el timeout específico por encima del límite del servidor.
- Calcular series/comparativas desde exportaciones completas, como ahora especifica Swagger. Excluir anulados de indicadores operativos y diferenciar stock actual de historia. No hacen falta endpoints por tipo de gráfica.
- Administración debe separar visualmente consulta global de lectura propia; no tratar avisos de otros usuarios como notificaciones propias pendientes.

## Validación posterior

Antes de considerar lista la integración, comprobar con cuentas de prueba: reservas concurrentes, reintento con el mismo id_operacion, diferencia en modo COMPLETA sin incremento de Farmacia, recuperación/conciliación de EN_REVISION, aislamiento de actividad por rol, desactivación de sesiones y exportación completa de más de una página. Estas son verificaciones pendientes, no defectos demostrados por esta revisión.

No recomiendo añadir más endpoints por ahora. Cerrar los casos de recepción anteriores y comenzar la conexión del frontend permitirá distinguir problemas reales de ejecución de diferencias que ya resuelve el contrato.
