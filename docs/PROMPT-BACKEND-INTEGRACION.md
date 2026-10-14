# Prompt de implementación: integración completa de SIVET

Revisión del **13 de octubre de 2026**, contra `http://localhost:3000/docs/`. Swagger publica **SIVET API 1.2.0**, base `/api/v1`, **102 operaciones**. Referencia guardada: `docs/api-openapi-2026-10-13.json`. Esta revisión comprueba el contrato publicado y el código frontend; no certifica el comportamiento interno de todos los endpoints. Antes de implementar, revisa código, migraciones y pruebas del backend. Si una capacidad existe pero falta en Swagger, documenta y prueba esa capacidad en lugar de duplicarla.

Actúa como responsable del backend. Implementa los cambios siguientes conservando datos, trazabilidad y permisos. Entrega migraciones, Swagger actualizado, pruebas de integración y ejemplos de contratos. No adaptes el backend a los objetos de los JSON de muestra ni a la forma del almacenamiento local del frontend.

## 1. Objetivo y reglas del negocio

SIVET tiene ADMIN, BODEGA, FARMACIA y PREPARADOR. Login requiere solamente username y password; el servidor determina el rol. PREPARADOR utiliza un portal móvil y también existe preparación dentro de Bodega.

Flujo: Farmacia solicita medicamentos → Bodega aprueba y reserva → Preparador comprueba y prepara los lotes → Bodega envía → Farmacia verifica físicamente → Farmacia entrega a una localidad. Una localidad puede recibir una cantidad parcial en ml/cc o unidades/fracciones de tableta, y cada línea indica HOSPITAL o CASA.

Las compras y las donaciones ingresan a Bodega. Las donaciones pueden tener vencimiento desconocido (`null`); esto permite registrar stock físico, pero no autoriza dispensar un lote sin vencimiento verificado. En una recepción se guarda únicamente el total monetario global; no se exige número de factura, subtotal, impuesto ni costo unitario. El comprobante se conserva como adjunto.

## 2. Qué ya existe: reutilizar, no volver a crear

- Autenticación: `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `GET /auth/me`, `PATCH /auth/password`.
- Usuarios: `GET/POST /usuarios`, `GET/PATCH /usuarios/{id}`, `PATCH /usuarios/{id}/password`, `GET /roles` y `/roles/{id}`.
- Catálogos: marcas, categorías, presentaciones, unidades-medida, acciones-terapeuticas, síntomas, áreas-destino, proveedores, medicamentos y conversiones-unidad.
- Preparación: `PUT /solicitudes/{id}/preparacion`, `GET /solicitudes/{id}/lotes-elegibles`, `PATCH /solicitudes/{id}/estado`.
- Aprobación/rechazo/cancelación: `POST /solicitudes/{id}/aprobar`, `/rechazar`, `/cancelar`.
- Recepciones: creación, borradores, edición con versión, confirmación, cancelación, anulación y adjuntos.
- Movimiento: `POST /movimientos`, detalle, recepción, devolución y anulación.
- Incidencias: creación/listado y revisión para solicitudes y movimientos independientes.
- Imagen de medicamento y adjuntos autorizados ya tienen endpoints multipart y de lectura.
- Avisos: `GET /notificaciones`, `PATCH /notificaciones/{id}/leida`; actividad: `GET /actividad`.
- Reportes: `GET /reportes/resumen`, `GET /reportes/exportar`.

Las dos rutas de preparación anteriores estaban ausentes en la revisión guardada anterior y ahora están publicadas. No las vuelvas a proponer como faltantes.

## 3. Endpoint nuevo necesario: cambiar el lote sugerido

El contrato actual de lotes elegibles devuelve solamente reservas FEFO y la preparación rechaza otros lotes. Exige reaprobación de Bodega. Esto contradice el requisito: el lote es sugerido y el preparador puede escoger otro lote válido del mismo medicamento.

Implementa **`POST /solicitudes/{id}/reservas/reasignar`** para ADMIN, BODEGA y PREPARADOR, exclusivamente sobre pedidos operables que el usuario pueda preparar. Si una escritura existente ya realiza esta reasignación de manera segura, reutilízala y documenta un único contrato; no mantengas dos escrituras equivalentes.

Body propuesto, con IDs reales del backend:

```json
{
  "version": 3,
  "id_asignacion": "identificador-estable-del-ciclo",
  "id_lote_nuevo": 456,
  "cantidad": "5.000",
  "comentario": "Lote disponible físicamente"
}
```

- Usa el tipo real de `id_asignacion` y publícalo en el esquema. No inventes un ID paralelo al existente.
- La cantidad debe pertenecer a la asignación aprobada pendiente; no aumenta lo autorizado ni reasigna cantidades ya enviadas.
- Revalida mismo medicamento, lote activo, vencimiento conocido y vigente, ubicación BODEGA y stock libre considerando reserva propia y ajena.
- Reserva nueva y liberación anterior ocurren en una transacción. Un fallo no libera la reserva original. Dos preparadores concurrentes no reservan el mismo saldo.
- Mantén identificador estable, incrementa versión, invalida la verificación anterior y registra actor, fecha, lote anterior y lote nuevo.
- No descuenta stock ni envía el medicamento. Devuelve preparación/asignaciones y versión vigentes. Versiones obsoletas: 409.
- Amplía **`GET /solicitudes/{id}/lotes-elegibles`** para incluir alternativas reales del mismo medicamento, no solo lotes reservados. Informa `sugerido`, `reserva_propia`, `reserva_ajena`, `stock_fisico`, `cantidad_utilizable`, `elegible` y motivo de exclusión. El cálculo de disponibilidad no debe restar dos veces la reserva propia.
- Conserva `PUT /solicitudes/{id}/preparacion` para guardar el checklist y `PATCH /solicitudes/{id}/estado` para finalizarlo.

## 4. Modificaciones P0: donaciones, fechas desconocidas y total

Amplía estos endpoints y todos sus esquemas de respuesta:

- `POST /recepciones`, `POST /recepciones/borradores`, `PATCH /recepciones/{id}`, `GET /recepciones`, `GET /recepciones/{id}`.
- `POST /recepciones/{id}/confirmar`, `/cancelar`, `/anular` deben comprender las mismas reglas.
- `POST /lotes` y `PATCH /lotes/{id}`, sus consultas, inventario, preparación y exportación.

Añade en recepción `tipo_ingreso: COMPRA | DONACION`, `donante` y `total` decimal global. Permite `id_proveedor:null` para DONACION; compra exige proveedor. DONACION exige nombre de donante. `id_factura` queda opcional por compatibilidad; ninguna recepción nueva debe exigir crear una factura fiscal.

Ejemplo de borrador nuevo:

```json
{
  "tipo_ingreso": "DONACION",
  "id_proveedor": null,
  "donante": "Fundación de ejemplo",
  "numero_recepcion": "REC-2026-000123",
  "fecha_recepcion": "2026-10-13",
  "total": "0.00",
  "detalles": [{ "id_lote": 456, "cantidad": "12.000" }]
}
```

`numero_recepcion` es referencia interna, no número de factura. Puede generarse en el servidor si se documenta cómo reconciliar los reintentos.

- `lotes.fecha_vencimiento` debe ser nullable en base de datos, validación y respuestas. Documenta creación de lote sin fecha solo para donación y cómo se verifica/corrige después con auditoría. No uses fechas ficticias.
- Lote sin vencimiento: stock físico visible con estado explícito; no entra en FEFO, aprobación, alternativas preparables ni salidas. No se cuenta como vigente ni como vencido.
- Confirma compras solo con lotes de vencimiento válido. Confirma donaciones con fecha desconocida bajo la regla anterior.
- Mantén borrador incompleto sin mover stock. La documentación actual exige proveedor y cantidades positivas en cada línea; permite campos pendientes en borrador o documenta claramente una representación de borrador que preserve el trabajo incompleto. La confirmación valida de manera más estricta.
- El total acepta cero, exige decimal no negativo y permanece en la recepción confirmada/histórica. No deriva del costo por línea.
- Añade filtros `tipo_ingreso` y `donante` a listado, resumen y exportación de recepciones. El reporte de donaciones usa estos recursos; **no requiere un endpoint paralelo `/donaciones`**.
- Migración: conserva lotes existentes, facturas y totales históricos. No inventes donantes ni reclasifiques ingresos sin evidencia.

## 5. Modificaciones P0: ml/cc, frascos y fracciones

Hoy `POST /movimientos` solo recibe cantidad base y la documentación declara conversiones no automáticas. Esto admite decimales base, pero no el formulario requerido que introduce 5 cc desde frascos.

Amplía `POST /medicamentos` y `PATCH /medicamentos/{id}` y sus respuestas con `contenido_ml` positivo nullable para frasco/ampolla. Alternativa válida: representación inequívoca por medicamento usando `/conversiones-unidad`, con relación y unidad explícita en el DTO. Escoge una sola fuente de verdad. `cantidad_por_empaque` no sustituye el contenido en ml.

Define si el usuario de Bodega configura ese contenido desde la edición de medicamento o desde conversiones; hoy crear conversiones es ADMIN-only. La capacidad de configurar contenido en el formulario debe funcionar para ADMIN y BODEGA sin otorgar permisos generales de administración al preparador.

Amplía cada detalle de **`POST /movimientos`** para FARMACIA_AREA:

```json
{
  "id_operacion": "00000000-0000-4000-8000-000000000001",
  "tipo_movimiento": "FARMACIA_AREA",
  "ubicacion_origen": "FARMACIA",
  "id_area_destino": 12,
  "detalles": [
    { "id_lote": 456, "cantidad": "5.000", "unidad_salida": "ML", "destino_salida": "HOSPITAL" },
    { "id_lote": 789, "cantidad": "0.500", "unidad_salida": "BASE", "destino_salida": "CASA" }
  ]
}
```

- `unidad_salida`: BASE o ML. `cc` y `ml` son equivalentes en esta interfaz. ML requiere contenido/configuración válida; BASE permite unidades y fracciones conforme al medicamento.
- Servidor calcula cantidad base y saldo, valida stock y registra todo atómicamente. No confía en cantidades convertidas ni saldos enviados por el cliente.
- Ejemplo obligatorio: 2 frascos × 100 ml = 200 ml. Enviar 5 ml descuenta 0.05 frasco y deja 1.95 frascos / 195 ml. Un envío posterior puede utilizar los 195 ml restantes.
- Tabletas: 20 unidades menos 0.5 deja 19.5; no descuentas una caja entera.
- La entrada publicada admite tres decimales en unidades base y seis en factor de conversión. Revisa el almacenamiento: 0.001 ml / 100 ml produce 0.00001 frasco. No redondees ese débito a cero. Define precisión de almacenamiento y límite mínimo real; utiliza Decimal/Numeric, nunca float binario para stock.
- Reintento con mismo id_operacion y mismo body: mismo resultado sin doble descuento; mismo ID y diferente body: 409. El frontend debe usar UUID real, no `SAL-…`.
- Congela en el detalle histórico la unidad de salida, cantidad enviada, factor/contenido utilizado, cantidad base descontada, saldo anterior y posterior en ambas representaciones y destino por línea. Cambiar después el catálogo no debe cambiar el significado de una salida anterior.
- Impide cambios de unidad base/contenido que reinterpreten existencias actuales. Define migración controlada si ese cambio es necesario.
- Expón en inventario cantidad base, unidad, contenido y volumen disponible cuando aplique. No sumes ml y tabletas en un mismo total sin separar unidades.
- Este cambio no introduce automáticamente una política clínica de frascos abiertos, vida útil tras apertura, desperdicios o devoluciones parciales; si se modelan después necesitan reglas y trazabilidad propias.

## 6. Modificaciones P0: modalidad por registro

Actualmente `destino_salida` pertenece al movimiento completo. Debe pertenecer a **cada detalle** FARMACIA_AREA, tanto en request como en respuesta y persistencia. Una operación puede mezclar HOSPITAL y CASA.

- Valida el enum por línea. No exijas esta modalidad a traslados BODEGA_FARMACIA ni ajustes.
- Migra movimientos antiguos copiando su valor global a los detalles cuando exista. Mantén valor desconocido si no está registrado.
- Retira el campo global del contrato nuevo cuando termine la compatibilidad. Si temporalmente se acepta como default antiguo, rechaza combinaciones ambiguas y documenta la fecha de retiro.
- `GET /movimientos`, detalle y `GET /reportes/exportar` devuelven modalidad por detalle. Filtro por modalidad y resumen cuentan/suman las líneas correspondientes, no clasifican todo el documento como HOSPITAL o CASA.

## 7. Modificaciones P1: consultas, catálogo y códigos de lote

1. **Escaneo de lote.** El código general del medicamento no identifica inequívocamente su lote. Añade `codigo_lote` nullable, único normalizado, en `POST /lotes` y `PATCH /lotes/{id}` y sus respuestas. Amplía `GET /lotes?codigo_lote=…` para búsqueda exacta y la consulta restringida `/solicitudes/{id}/lotes-elegibles?codigo_lote=…` para PREPARADOR. No expongas todo el inventario al estudiante. Escanear identifica lote/producto; no marca verificación física automáticamente. No hace falta un endpoint QR si estas consultas lo resuelven.
2. **Información educativa.** Añade `indicaciones` nullable a medicamentos o documenta explícitamente que `descripcion` es su fuente. Conserva `/sintomas` y `PUT /medicamentos/{id}/sintomas`; no crees un catálogo de síntomas duplicado. El detalle limitado del pedido debe incluir nombre, imagen autorizada e información educativa del medicamento para PREPARADOR, aunque no tenga acceso al catálogo global.
3. **Proveedor.** `telefonos[]` y `correos[]` ya existen. Conserva y valida esos arrays. Los escalares `telefono/correo` pueden retirarse después de migrar consumidores; no elimines contactos históricos ni crees otra ruta de contactos si el proveedor ya los contiene.
4. **Orden de tablas.** Añade `sort_by` y `sort_order=asc|desc` a consultas paginadas de inventario, recepciones, solicitudes, movimientos, usuarios, actividad, incidencias y catálogos utilizados. Lista blanca por recurso; desempate por ID. Ordena antes de paginar y permite ordenar por campos relacionados que aparecen en la interfaz. Ordenar solo los 20 registros recibidos no equivale a ordenar toda la tabla.
5. **Permisos.** Farmacia solo crea/edita áreas-destino en sus catálogos. Medicamentos se editan por ADMIN/BODEGA y solo información general. Lote, stock y auditoría no deben alterarse por una edición de catálogo.

## 8. Reportes y notificaciones: ampliar lo existente

`GET /reportes/resumen` agrupa conteos y stock actual; su documentación dice que las series/comparativas se calculan desde exportaciones completas. Eso es una estrategia existente, no un endpoint faltante por sí mismo.

- Extiende resumen y exportación con donaciones, modalidades por línea, unidades y conversiones históricas.
- El PDF del frontend conserva diseño, orden de gráficas y hoja carta. No se necesita un endpoint por tipo de gráfica, ni guardar el layout visual dentro de movimientos.
- Para exportación NDJSON exige comprobar `fin:true`; timeout cliente superior a los 120 segundos documentados. Los filtros aplicados al reporte y a las filas exportadas deben coincidir. No construyas reportes usando solo la primera página.
- **Opcional para volumen alto:** `GET /reportes/series` con tipo, filtros y agrupación diaria/mensual/categoría/área. Si se implementa, devuelve agregados y unidades, comparación con período anterior y reglas para anulados. Este endpoint es optimización; no bloquea la integración si exportar completo es viable.
- `/notificaciones` ya tiene categoría, procedencia, bandeja y referencia; conserva una sola bandeja administrativa con segmentación. Lectura es por usuario, no una marca global.
- Alertas de inventario: el frontend las calcula localmente. Si el servidor pasa a generarlas, define deduplicación, lector, límites y filtros sobre `/notificaciones`; no generes una alerta idéntica en cada polling.
- SSE/WebSocket y persistencia de tema, silenciamiento o tours son mejoras opcionales, no endpoints faltantes obligatorios.

## 9. Incidencias: conservar el flujo real del backend

Ya existen recepción, devolución y revisión. No crees `/resolver-diferencias` duplicado.

El servidor distingue COMENTARIO, RESPUESTA, REINTEGRAR_BODEGA y PERDIDA. COMENTARIO no cierra una diferencia. Una diferencia física requiere reintegro autorizado/nuevo ciclo/nuevo envío o pérdida ADMIN; no se sobrescribe la recepción anterior. Conserva esa política y documenta el estado resultante y los saldos de cada resolución.

El frontend demo solo tiene una respuesta sencilla que marca la incidencia resuelta y permite repetir verificación. **Esto necesita cambio de frontend antes de conectarlo**, no eliminar la trazabilidad del backend. La guía debe elegir una incidencia pendiente o un envío verificable, y mostrar la acción que realmente está habilitada.

Si faltan relaciones o saldos en el DTO de detalle, amplíalos: IDs de incidencia, movimiento y líneas; observado/acreditado/pendiente/devuelto/reintegrado/perdido; tipo y estado de resolución; actor/fechas e historial de seguimiento. No calcules resolución desde el texto del título de una notificación.

## 10. Endpoints y campos que deben retirarse o que no se deben crear

**No hay evidencia para borrar inmediatamente una ruta completa de las 102 publicadas.** Las siguientes retiradas requieren migración y revisión de consumidores. Marca `deprecated:true` primero y entrega una lista verificada de dependencias antes de suprimirlas.

| Elemento | Cambio solicitado | Condición para retirarlo |
|---|---|---|
| `POST /facturas` | Dejar de usarlo en el ingreso de medicamentos; recepción guarda total y adjunto | Retirar como API pública del producto si ningún otro módulo necesita emisión/registro fiscal. Conservar datos y lecturas históricas |
| `POST /recepciones` de confirmación directa | Unificar interfaz nueva en borrador → confirmar | Solo deprecar/eliminar la escritura directa si no hay consumidores; no confundir con GET /recepciones |
| `POST /solicitudes/{id}/recepcion` | Mantener como wrapper de recepción de un movimiento explícito | Si se decide unificar exclusivamente en `/movimientos/{id}/recepcion`, migrar todos los clientes antes. No quitar ambas rutas |
| `POST /solicitudes/{id}/devolucion` | Misma consideración que recepción | Mantener mientras haya clientes de solicitudes; puede ser wrapper seguro de movimiento |
| `destino_salida` global | Migrar a detalle por línea y retirarlo del body nuevo | Datos históricos migrados y consumidores nuevos usando detalle |
| `costo_unitario`, obligación de `numero_factura/subtotal/impuesto` | Retirar del formulario y del requisito para nuevos ingresos | Conservar histórico si existe; no borrar evidencia contable |
| `proveedores.telefono/correo` escalares | Preferir arrays de contactos | Solo eliminar después de migrar consumidores e historial |
| `/sivet`, `/sivet/commands`, `/users` | No crear aliases nuevos en el backend | Sustituir esas llamadas del frontend por recursos reales |

Conserva `/conversiones-unidad`, `/sintomas`, `/roles`, `/auth/refresh`, rutas de adjuntos/imágenes, auditoría e incidencias. Que una pantalla no llame hoy a una ruta no demuestra que sobre en el sistema.

## 11. Cambios de frontend necesarios para consumir este backend

Incluye un documento de integración que indique estos cambios; no los resuelvas creando endpoints duplicados:

- `VITE_API_URL` termina en `/api/v1`. Sustituye `/sivet` y `/sivet/commands` por un adaptador de recursos y transiciones reales. PREPARADOR nunca descarga un snapshot global.
- Login devuelve `{data: Token}`; luego llamar `/auth/me` con Bearer para obtener `{data: Perfil}`. El frontend actual espera directamente `{username, role}`: corregir el adaptador.
- Mapear `ADMIN → administrador`, `BODEGA → bodega`, `FARMACIA → farmacia`, `PREPARADOR → preparador`. `CONSULTA` existe en Swagger pero no tiene pantalla definida en este frontend; no asignarle privilegios de otro rol ni eliminarlo sin revisar sus consumidores.
- Guardar y renovar sesión según la política de tokens; renovación serializada, no múltiples refresh simultáneos del mismo token. Logout envía refresh_token. `withCredentials:true` por sí solo no añade Bearer.
- `/users → /usuarios`; POST solo crea, PATCH edita/desactiva y endpoint de contraseña restablece. El formulario real requiere nombre, apellido, id_rol y contraseña mínima **12**, mientras el demo solo maneja username, role y contraseña mínima 8. Adaptar UI y validaciones al contrato de producción; no bajar la política del servidor.
- Consumir `{data,total,page,limit}` y los IDs numéricos, no arrays directos ni IDs locales `MED-…`/`SOL-…`.
- Serializar cantidades y montos como cadenas decimales; strings vacíos no se convierten silenciosamente en cero. El backend valida nuevamente todos los campos.
- Solicitud API es por medicamento; el demo solicita por stock/lote. Migrar formulario a medicamento y mostrar la asignación de lotes al aprobar/preparar.
- Aprobación usa `/aprobar`; envío usa `/movimientos`; finalizar checklist usa `/estado` con versión. No enviar ENVIADO ni COMPLETADO a ese PATCH: no pertenecen a su enum.
- Mantener todos los estados del servidor y acciones permitidas. PARCIAL, ATENDIDA, EN_REVISION, CANCELADA y ciclos múltiples no se reducen a una sola bandera local.
- Subidas: multipart campo `archivo`; frontend limita 1.5 MB y API permite 5 MiB. Alinear política/UX sin enviar base64 al endpoint multipart. Mostrar imágenes y PDFs autorizados, teniendo en cuenta Bearer al obtener blobs.
- Guía Reactour, tamaño/orden de gráficas, ancho de columnas, tema y resumen son interacción frontend; no necesitan endpoints propios para funcionar.

## 12. Pruebas y entrega obligatorias

Prueba login sin rol, cuenta inactiva y revocación; permisos de todos los roles; preparación con versión obsoleta y cambio de lote; donación sin vencimiento y bloqueo de despacho; compra sin vencimiento rechazada; dos confirmaciones sin doble stock; salida 200 ml → 195 ml → uso del saldo; 20 tabletas → 19.5; precisión del mínimo permitido; destinos distintos en una operación; saldo histórico inmutable; reintentos idempotentes; stock insuficiente concurrente; lectura individual de notificaciones; exportación completa y filtros de donación; recepción con diferencias y recuperación por nuevo ciclo; autorización de adjuntos.

Entrega una matriz final por operación: existente sin cambio, ampliada, nueva, deprecada o retirada, con rol permitido, request/response, validaciones y prueba asociada. Añade ejemplos 400/401/403/404/409 según corresponda y conserva mensajes estructurados. Explica cualquier requisito que dependa de una decisión de negocio. No declares integración completa únicamente porque Swagger compile.
