# Prompt para completar el backend de SIVET

Necesito que revises e implementes los cambios pendientes del backend para integrar el frontend SIVET, incluyendo el nuevo portal móvil del preparador de Bodega.

Consulta primero http://localhost:3000/docs/ y el código del backend. La base publicada es `/api/v1`. La revisión del 8 de octubre de 2026 encontró 100 operaciones, sin cambios en rutas ni esquemas respecto de la revisión anterior. Esta es una comparación del contrato publicado y del frontend, no una prueba de fallos de ejecución. Si alguna capacidad ya está implementada pero no documentada, actualiza Swagger y sus pruebas en lugar de duplicarla.

## 1. Flujo que debemos soportar

Farmacia solicita → Bodega aprueba y reserva existencias → Preparador registra y verifica los medicamentos → Pedido listo para enviar → Bodega confirma el traslado → Farmacia verifica físicamente y recibe.

El preparador trabaja desde un portal pensado para celular. Solo necesita pedidos aprobados, sus detalles y lotes elegibles, guardar avances y marcar preparación completa. Este trabajo también lo pueden hacer BODEGA y ADMIN desde el módulo principal. No debe depender de notificaciones para acceder a los pedidos.

## 2. Rol y autenticación: ampliar lo existente

Añade un rol estable `PREPARADOR` (el frontend lo denomina `preparador`) y documenta su correspondencia. Reutiliza `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout` y los recursos `/usuarios` y `/roles`; no crees una autenticación paralela.

- ADMIN puede crear, asignar y desactivar este perfil. Una cuenta inactiva no inicia ni conserva acceso conforme a la política de revocación de sesiones.
- PREPARADOR solo consulta datos operativos necesarios y modifica preparación. No aprueba, rechaza, envía, recibe, ajusta stock, edita catálogos ni administra usuarios.
- Deriva actor y permisos de la sesión; nunca del rol o usuario enviado en el body.
- Aplica la autorización también a consultas por ID, lotes, inventario, exportaciones y rutas existentes; ocultar módulos en el frontend no es suficiente.
- Incluye un mecanismo de creación de una cuenta de desarrollo, sin credenciales predeterminadas en producción. Respeta la política de contraseñas del backend: la clave JSON del frontend no implica una cuenta existente en la base de datos.

## 3. Endpoint nuevo necesario: persistir el checklist

Propuesta: `PUT /api/v1/solicitudes/{id}/preparacion`. No está publicado actualmente. Puede ser un PATCH equivalente si sigue mejor las convenciones existentes, pero define una sola escritura de avance con contrato inequívoco.

Permisos: ADMIN, BODEGA, PREPARADOR. Recibe versión esperada y líneas identificadas por el detalle aprobado y su asignación de lote. La propuesta de representación es:

```json
{
  "version": 0,
  "detalles": [
    {
      "id_detalle_solicitud": 123,
      "id_lote": 456,
      "cantidad_preparada": "5",
      "numero_lote_observado": "LOTE-004",
      "vencimiento_observado": "2028-12-31",
      "comentario": "Empaque verificado",
      "verificado": true
    }
  ]
}
```

El ejemplo ilustra una asignación; define identificadores estables para varias asignaciones de lote de un mismo detalle cuando FEFO distribuya la aprobación. No impongas un solo lote por medicamento si el modelo actual admite varios.

- Permite borradores incompletos: cantidad cero, valores observados desconocidos y verificado=false. Documenta cómo representar esos campos vacíos sin inventar datos.
- Conserva lo solicitado y aprobado; el preparador no modifica cantidades autorizadas ni el catálogo del lote.
- Una línea verificada exige cantidad válida, medicamento correcto, lote activo/vigente, datos observados coincidentes y disponibilidad real descontando reservas de otras solicitudes.
- Cambiar cantidad, lote o vencimiento invalida la verificación anterior. El servidor vuelve a validar; no confía solo en el booleano.
- Si se permite cambiar el lote reservado, conserva trazabilidad y define cuándo se reasigna la reserva. La reasignación debe ser transaccional y no duplicar ni liberar indebidamente reservas. Los borradores no descuentan stock.
- Rechaza escrituras sobre solicitudes canceladas, rechazadas, enviadas o preparación finalizada. Contempla concurrencia con cancelación y con otro preparador.
- Devuelve 409 cuando la versión está desactualizada, sin sobreescribir. Devuelve versión nueva, datos persistidos, autor, fecha y progreso. Ante respuesta perdida, el cliente podrá consultar y reconciliar el resultado.

## 4. Reutilizar consultas y transición de estado

Amplía `GET /solicitudes` y `GET /solicitudes/{id}` para el preparador, con alcance limitado a pedidos aprobados operables. Mantén paginación, búsqueda, prioridad y filtros. Documenta cómo consultar pendientes y listos, incluyendo APROBADA/EN_PREPARACION/LISTA_ENTREGA según corresponda, y obtener los contadores sin contar solo la página actual.

El detalle debe incluir checklist persistido, versión, cantidades aprobadas, reservas por lote, progreso, autor y fechas. Puede devolverse integrado en el detalle; no hace falta un GET separado si este contrato lo cubre.

Expón lotes elegibles y disponibilidad para esa solicitud mediante una ampliación segura de consulta existente o un recurso acotado si es necesario. Informa número de lote, vencimiento, unidad base, reserva propia, reserva ajena y cantidad utilizable. No uses disponibilidad general excluyendo también la reserva propia, porque impediría preparar stock ya aprobado.

Amplía `PATCH /solicitudes/{id}/estado`, que hoy solo recibe `estado` y permite ADMIN/BODEGA:

- Admite PREPARADOR exclusivamente para transiciones de preparación autorizadas.
- Incluye versión esperada de preparación y exige checklist completo para LISTA_ENTREGA, aunque lo invoque ADMIN o BODEGA.
- Valida todas las asignaciones, suma cantidades por medicamento y por lote, exige completar lo aprobado pendiente de este ciclo, y comprueba reservas dentro de la misma transacción.
- Finalizar no descuenta stock ni acredita Farmacia. Bloquea la edición posterior y registra autor, fecha y auditoría.
- No añadas otro endpoint de finalizar si esta ruta lo resuelve. Define la migración de solicitudes antiguas LISTA_ENTREGA sin checklist para que no eludan la nueva validación.

## 5. Conectar preparación con el envío existente

Amplía las validaciones de `POST /movimientos` para BODEGA_FARMACIA vinculado a solicitud:

- Solo BODEGA/ADMIN envían; PREPARADOR no puede hacerlo.
- Exige preparación finalizada y usa sus lotes y cantidades. Impide enviar datos distintos o volver a consumir la misma preparación.
- Revalida disponibilidad, reservas, vigencia y estado al enviar; una preparación no congela estos datos para siempre.
- Conserva idempotencia con `id_operacion`, libera/consume reservas correctamente y descuenta Bodega una sola vez, dejando el envío en tránsito sin acreditar Farmacia.
- Mantén compatibles los envíos parciales existentes: define la preparación por envío/ciclo y su saldo, o documenta la restricción aplicable. Nunca vuelvas a preparar cantidades ya enviadas.
- No permitas eludir la validación omitiendo `id_solicitud` cuando la operación corresponda a un pedido. Mantén los traslados independientes legítimos bajo su política propia.
- Mantén los avisos de aprobación y envío a Farmacia, con origen y referencia al documento. La preparación se opera en el módulo, no desde la bandeja de notificaciones.

## 6. Pendientes de recepción que siguen en el contrato

### Datos no verificables

Revisa `POST /solicitudes/{id}/recepcion`, `POST /movimientos/{id}/recepcion` y el checklist de `POST /solicitudes/{id}/incidencias`. Actualmente admiten NO_VERIFICABLE pero exigen lote observado no vacío y vencimiento válido.

Permite null/ausencia de esos valores únicamente en casos no verificables o no recibidos, exige observación y conforme=false, y no acredites esa línea. Define explícitamente cómo representar un medicamento completamente ausente. Mantén obligatorios y coincidentes los datos de líneas conformes y actualiza también esquemas de respuestas y auditoría.

### Recuperación de EN_REVISION

Actualmente la recepción COMPLETA con diferencias devuelve 200, acredita cero, deja EN_REVISION y repetir recepción devuelve 409. No está documentada la nueva verificación después de corregir una diferencia.

Implementa o documenta una recuperación inequívoca: preferentemente re-verificación versionada del saldo pendiente tras la corrección autorizada, conservando el historial y evitando doble acreditación. Si el diseño requiere reintegro físico y un nuevo envío, explica y prueba el efecto sobre solicitud, reservas y cantidades pendientes. Distingue reintento por red de una nueva verificación. No uses COMENTARIO como si reintegrara stock o cerrara la incidencia.

### Enum de actividad

La revisión de incidencias permite COMENTARIO pero `actividad.detalle.resolucion` no lo enumera. Añádelo si esa es la estructura real o documenta la estructura correcta. Extiende igualmente el detalle de actividad para guardar avance/finalizar preparación.

## 7. Evitar endpoints innecesarios

No crees `/sivet`, `/sivet/commands` ni `/users` para imitar el adaptador JSON: el frontend debe migrar a los recursos REST y `/usuarios`. Tampoco hacen falta endpoints distintos para barras, líneas, dona, tamaño de gráficas o drag and drop.

Ya existen recursos para usuarios, proveedores, medicamentos, inventario, recepciones y adjuntos, movimientos, notificaciones, actividad, resumen y exportación. No dupliques esas capacidades. El frontend visualiza la factura mediante los endpoints de adjuntos existentes; el historial ya no ofrece descarga.

Los ajustes de Axios, Bearer/refresh, envoltura data, paginación, IDs numéricos, decimales como cadenas, FormData, archivos protegidos como blob y consumo NDJSON son trabajo de integración del frontend. También lo son enviar modo_recepcion=COMPLETA y distinguir EN_REVISION de un ingreso exitoso aunque la respuesta sea 200. No elimines rutas existentes solo porque esta pantalla no las use.

## 8. Entrega y pruebas

### Ampliación del 9 de octubre: donaciones

**Actualización posterior del mismo día, prevalece sobre requisitos anteriores de este documento:** el formulario de ingreso ya no solicita número de factura ni acta; usa el identificador interno del ingreso y guarda únicamente `total` como importe global, sin precios por línea. Conservar números históricos, pero no exigirlos para nuevos ingresos. Admitir donante sin número de acta y mantener idempotencia por identidad de operación/ingreso, no por un número que el usuario ya no captura.

El despacho a localidades ahora recibe modalidad por línea (`HOSPITAL`/`CASA`) y cantidades con hasta tres decimales. Medicamentos con inventario en Frasco/Ampolla pueden registrar `contenidoMl` positivo. Si la salida se captura en ml/cc, convertir a unidad de inventario mediante cantidad_ml/contenido_ml, comprobando stock y conservando en el movimiento la cantidad/unidad entregada y el equivalente descontado. No interpretar 5 ml como 5 frascos. Usar Decimal/transacciones en backend, mantener precisión suficiente y evitar cambiar contenido/unidad de un producto con stock de forma que reinterprete existencias. Documentar cómo revertir cada movimiento. El frontend mantiene compatibilidad de lectura con salidas antiguas de modalidad global.

Ampliar medicamentos con indicaciones/uso y síntomas tratados, consultables por PREPARADOR sin permisos de edición. Asociar códigos QR/barras a producto+lote de forma única y proporcionar consulta por código dentro del alcance autorizado del preparador. Un código de producto sin asociación de lote no basta para seleccionar un lote. La lectura identifica el lote, no confirma automáticamente cantidad, fecha o conformidad. Añadir estos campos también en recepción y consultas de inventario; no es necesario un endpoint para activar la cámara, eso corresponde al navegador.

Las altas rápidas de catálogos reutilizan sus endpoints existentes y permisos. Farmacia crea únicamente ubicaciones; ADMIN/BODEGA los catálogos autorizados. Eliminar requisitos de número de factura en DTOs/formularios nuevos sin perder los documentos adjuntos y su consulta.

El frontend ahora distingue `tipoIngreso: COMPRA | DONACION` en las recepciones. La ausencia de este campo en registros anteriores equivale a COMPRA. DONACION registra `donante`, `total`, responsable, fecha, adjunto opcional y líneas, sin exigir número de factura/acta; no exige un proveedor comercial. Adaptar nombres al contrato REST manteniendo una correspondencia explícita.

Amplía las rutas de creación, borrador, edición, confirmación y consulta de `/recepciones`, sus adjuntos y los esquemas de lotes/inventario. Para donaciones se permite `vencimiento: null` por línea, con significado «desconocido», no «sin caducidad». Compras siguen exigiendo vencimiento válido. No inventar fechas, usar cadenas vacías en persistencia ni transformar null en 1970. Mantener la consistencia de fecha de un mismo producto/lote y la idempotencia por identidad de la operación/ingreso.

Los ingresos sin vencimiento conocido se registran como stock físico, con alerta y estado distinguible, pero no están disponibles para aprobar, reservar, preparar o despachar. Este es el comportamiento actual del frontend y debe preservarse en el servidor mientras no exista un flujo autorizado para verificar y completar la fecha. No tratarlos como vigentes ni incluirlos entre próximos a vencer mediante una fecha ficticia.

Amplía reportes/exportación con filtro por tipo de ingreso y datos de donante, fecha, documento, producto, lote, vencimiento nullable, cantidad, unidad y responsable. El reporte de donaciones considera únicamente ingresos confirmados, excluye borradores/cancelados y permite fechas y categoría. Representa ingresos históricos a Bodega, no stock donado remanente. Sus gráficas agrupan unidades recibidas y unidades sin fecha conocida por donante. No hace falta crear rutas por tipo de gráfica.

Prueba borrador sin impacto de stock; confirmación idempotente; donante obligatorio sin exigir número de documento; null permitido solo en donaciones; bloqueo de salida de lotes sin fecha; consistencia de lotes; filtros y concordancia de tabla/gráficas/exportación. Documenta si reutilizas `/reportes/exportar` con filtros nuevos en lugar de añadir un endpoint específico.

Entrega migraciones, validaciones, permisos, servicios transaccionales, documentación OpenAPI actualizada, ejemplos de requests/responses y una matriz de permisos/estados. Mantén compatibilidad o explica explícitamente los cambios de contrato.

Prueba al menos: login/desactivación de PREPARADOR; acceso prohibido a acciones ajenas; guardar/reabrir borrador; dos preparadores y versión obsoleta; lotes vencidos/inactivos; suma de varias asignaciones del mismo lote; cambio de lote y reservas concurrentes; cancelación durante preparación; bloqueo de listo sin checklist; bloqueo de envío inconsistente; envío idempotente; recepción con diferencias sin crédito; recuperación EN_REVISION sin crédito duplicado; auditoría y avisos.

Al finalizar, lista qué rutas se crearon, cuáles se ampliaron, cuáles ya resolvían el requisito y qué queda pendiente para el frontend. No declares integración completa solo porque Swagger incluya las rutas: adjunta los resultados de las pruebas de comportamiento.
