# Revisión actualizada de integración — 7 de octubre de 2026

> Revisión anterior dentro del mismo día. Consultar [la última revisión del backend](REVISION-BACKEND-ACTUAL.md): varios pendientes de este documento ya están corregidos en Swagger.

Fuente consultada: http://localhost:3000/docs/ y su `swagger-ui-init.js`. Se extrajo el OpenAPI sin ejecutar el JavaScript. Copia: `api-openapi-2026-10-07.json`. Comparación con `api-openapi-snapshot.json` y el frontend actual.

**Resultado: 100 operaciones documentadas frente a 69 anteriores, con 31 nuevas. La mayor parte de las rutas faltantes ya existe. Los pendientes principales son ampliar contratos y adaptar el frontend, no crear otro conjunto de endpoints.**

Revisión de documentación y código cliente, sin ejecutar transacciones ni probar permisos autenticados del backend. «Resuelto» significa cubierto en el contrato publicado, no certificación de su funcionamiento interno. Esta revisión sustituye las conclusiones de la revisión anterior.

## 1. Pendientes anteriores ya cubiertos

| Capacidad | Evidencia actual |
|---|---|
| Borradores | POST `/recepciones/borradores`, PATCH `/recepciones/{id}`, POST `/recepciones/{id}/confirmar` y `/cancelar`. Edición, confirmación y cancelación requieren `version`. |
| Facturas adjuntas | POST y GET `/recepciones/{id}/adjuntos`; GET `/recepciones/{id}/adjuntos/{adjuntoId}`. |
| Imágenes | POST/GET `/medicamentos/{id}/imagen`. |
| Marcas y categorías | GET/POST de cada colección y GET/PATCH por ID, con ADMIN/BODEGA. |
| Edición de medicamentos por Bodega | POST/PATCH ahora permiten ADMIN/BODEGA; admiten marca, categoría y cantidad por empaque. |
| Ubicaciones de Farmacia | POST/PATCH `/areas-destino` ahora permiten ADMIN/FARMACIA. |
| Contactos múltiples | Proveedores admite `correos[]` y `telefonos[]`. |
| Reservas | `/solicitudes/{id}/aprobar` documenta validación y reserva por lote FEFO; inventario declara `cantidad_reservada` y `cantidad_disponible`. |
| Preparación/verificación | PATCH `/solicitudes/{id}/estado`; POST `/solicitudes/{id}/recepcion` y `/movimientos/{id}/recepcion`. |
| Incidencias/devoluciones | Creación/listado/revisión de incidencias y devolución por solicitud o movimiento. |
| Hospital/casa | POST `/movimientos` admite `destino_salida: HOSPITAL | CASA`. |
| Contraseña administrativa | PATCH `/usuarios/{id}/password`. |
| Actividad/reportes | GET `/actividad`, `/reportes/resumen`, `/reportes/exportar`. |
| Notificaciones segmentadas | Filtros bandeja, categoría, procedencia, referencia y alcance; esos campos también aparecen en respuesta. |
| Fecha/costos de recepción | `fecha_recepcion` admitida; `costo_unitario` ya es opcional y nullable. |
| Respuestas incompletas anteriores | Ahora se declaran nombre de usuario, número de lote/factura/recepción/solicitud, ubicación de inventario, IDs de relaciones y factor/unidad origen de conversiones. |

## 2. Cambios todavía necesarios para conservar el comportamiento del frontend

Todas las rutas son relativas a `/api/v1` y ya existen salvo donde se indica una alternativa propuesta.

| Prioridad | Endpoint | Diferencia comprobada | Acción recomendada |
|---|---|---|---|
| Alta | POST `/solicitudes/{id}/recepcion`, POST `/movimientos/{id}/recepcion` | Solo aceptan detalle y cantidad recibida. El frontend verifica lote, vencimiento y conformidad/condición por línea y bloquea el ingreso ante discrepancias. | Añadir campos observados y conformidad por línea, persistirlos en respuesta y validar en servidor antes de acreditar. Acordar explícitamente recepción parcial: la descripción de la API permite acreditar lo recibido; el flujo actual exige conformidad completa. No resolver esta diferencia solo con un mapeo. |
| Alta | POST `/solicitudes/{id}/incidencias` | Solo descripción e ID opcional de movimiento; no admite el checklist estructurado que muestra Farmacia. | Incorporar observaciones por línea: detalle/lote, cantidad, lote observado, vencimiento observado y condición. El texto libre no conserva el mismo contrato. |
| Alta | POST `/solicitudes` y respuestas de solicitudes | No existe `prioridad`. La UI la captura y muestra. | Añadir campo y enum acordado a creación/respuesta, opcionalmente filtro. No se necesita una ruta nueva. |
| Alta | GET `/actividad` | Solo ADMIN. Los paneles actuales de actividad también aparecen para Bodega y Farmacia. No se declaran localidad ni nombre del actor; `detalle` no tiene estructura. | Permitir lectura acotada por rol/localidad, manteniendo auditoría global ADMIN, o añadir una consulta específica de actividad reciente. Documentar actor visible y contexto sin abrir GET usuarios a otros roles. |
| Media | POST/PATCH `/acciones-terapeuticas` | Sigue limitado a ADMIN, pero el catálogo del frontend permite edición por Bodega. | Permitir BODEGA si se conserva esa función, o adaptar los controles al permiso real. No confundirlo con edición de medicamentos, que ya está corregida. |
| Media | POST `/solicitudes/{id}/rechazar` | Documenta solo pendientes; la UI permite rechazar también en preparación y listo para entrega. | Documentar/implementar rechazo de estados con reserva y liberarla, o restringir la UI si cambia la regla de negocio. |
| Media | POST `/solicitudes/{id}/incidencias/{incidenciaId}/revision` | `RESPUESTA` se limita a incidencias generales; la UI usa una respuesta libre también para diferencias y devoluciones. | Acordar comentario de seguimiento sin resolver o adaptar la pantalla a conciliación. No traducir una respuesta libre a `REINTEGRAR_BODEGA` o `PERDIDA`: son acciones con efecto en stock; PERDIDA requiere ADMIN. |
| Media | POST `/recepciones/borradores`, PATCH `/recepciones/{id}` | Crear exige proveedor y número. Si se envía `detalles`, exige al menos uno y cada línea completa. El borrador local admite campos sin completar. | Ajustar validación del botón Guardar y omitir colección vacía, o flexibilizar borradores. Confirmación debe mantener validación estricta. |
| Media | POST/PATCH `/medicamentos/{id}` | PATCH no acepta unidad base; la UI permite editarla. UXE usa número entero positivo local, API usa cadena decimal. | Bloquear unidad base cuando no se permite cambiarla, o definir una operación validada. Acordar UXE positivo/entero y qué ocurre con movimientos previos. |
| Media | Archivos | Backend documenta 5 MB y PNG/JPEG/PDF; la UI permite WebP y limita a 1.5 MB. | Añadir WebP en backend o retirarlo del selector. Alinear mensajes y validación. Mantener un límite local menor es válido si es intencional. |

## 3. Consultas, reportes y documentación por completar

- **GET `/reportes/resumen`:** existe, pero responde `data: object` sin propiedades. Documentar totales y agregados reales. No se puede asegurar que alimente comparativas, series temporales, categorías, acción terapéutica, alertas y salidas por área. Ampliarlo o documentar que se calculan desde recursos completos. No crear una ruta por gráfica.
- **Filtros:** inventario no documenta categoría, stock bajo ni vencimiento próximo; movimientos no documenta tipo, área, producto, ubicación ni destino hospital/casa. Resumen/exportación tampoco documentan esos filtros. Ampliar las rutas existentes para filtros globales sobre datos paginados; filtrar solo la página descargada daría resultados incompletos. Alternativamente, obtener todas las páginas autorizadas y calcular en cliente.
- **GET `/reportes/exportar`:** cubre recepciones, solicitudes y movimientos; no inventario ni actividad. Para los demás reportes, usar consultas completas/paginadas o extender `recurso`. No es obligatorio un endpoint PDF: la aplicación ya lo genera.
- **Exportación NDJSON:** requiere procesar filas `{data:registro}` y comprobar cierre `{fin:true,total}`. No es un JSON normal ni un PDF. Tiene hasta 120 segundos; el Axios actual corta a los 15. Configurar un cliente/timeout específico, informar errores o exportación incompleta y no producir un PDF parcial como si estuviera completo.
- **Tránsito/revisión:** GET inventario sigue limitado a BODEGA/FARMACIA. Ahora hay cantidades recibidas/devueltas/reintegradas/perdidas en movimientos e incidencias; se puede construir el seguimiento desde ellas. Documentar el cálculo de saldos pendientes o exponerlo explícitamente si se necesita inventario separado. No dar por inexistente el flujo de tránsito solo por no tener una tercera ubicación.
- **Estados:** respuestas de solicitudes/movimientos/incidencias continúan con strings sin enum exhaustivo. Documentar transiciones, recepción parcial, rechazo con reservas, envío y conciliación; también efecto exacto de cada POST sobre saldo y notificaciones.
- **Notificaciones:** ya hay `alcance=propias|todas`, pero no se describe quién puede usar todas ni cómo se marca leída una notificación ajena en vista administrativa. El PATCH sigue descrito como lectura propia. Mantener lectura individual y definir el comportamiento de la campana única sin marcar avisos de otra persona.
- **Idempotencia:** POST movimientos sigue advirtiendo que cada éxito crea otro movimiento. Documentar clave de idempotencia o identificador de operación para evitar duplicados tras cortes de red. Hasta entonces, no reintentar automáticamente una escritura de resultado desconocido. Documentar también reintentos de recepción y devolución.
- **Parámetros genéricos:** aparecen `id_marca/id_categoria/id_medicamento` hasta en GET roles/presentaciones. Revisar si realmente aplican o si se copiaron al generar Swagger; no asumir que un filtro documentado se ejecuta correctamente.

## 4. Qué cambiar en el frontend (no son endpoints faltantes)

1. Reemplazar GET `/sivet` y POST `/sivet/commands` por servicios de recursos. No añadir endpoints duplicados al backend únicamente para mantener el prototipo.
2. Conectar `/usuarios` en lugar de `/users`, separar POST creación/PATCH edición, y usar PATCH password. Añadir nombre/apellido y mínimo 12 caracteres; la UI actual exige 8.
3. Login devuelve tokens envueltos en `data`, no User directo. Consultar `/auth/me`, mapear `id_rol`, usar Bearer y renovación serializada de un solo uso; enviar refresh token al cerrar sesión. Leer errores desde `error.message` y `error.details`.
4. Mapear IDs numéricos, estados y cantidades decimales en texto; no enviar UUIDs locales como IDs del servidor. Preservar paginación y totales.
5. La API solicita por medicamento y reserva FEFO al aprobar; la UI elige lotes desde la solicitud. Adaptar selección a medicamentos y mostrar las reservas reales del servidor. Si se exige selección manual de lotes, acordar esa ampliación de aprobación en vez de reemplazar FEFO silenciosamente.
6. La aprobación y preparación tienen acciones separadas; no mapear automáticamente la transición local PENDIENTE → EN PREPARACION a un único cambio de estado que omita aprobar/reservar.
7. Conservar `version` del borrador en cada edición/confirmación/cancelación y tratar conflictos 409. Pedir motivo al cancelar: la UI actual no lo captura.
8. Crear/buscar lotes mediante sus endpoints antes de enviar detalles de recepción. Factura financiera sigue exigiendo subtotal; el adjunto puede vincularse directamente a recepción sin inventar un subtotal cero.
9. Subir `FormData` con campo `archivo` sin forzar Content-Type JSON. Obtener archivos protegidos con Axios Bearer como blob y crear URL temporal para el visor; un `<img src>` directo no agrega el Bearer. El visor actual solo admite data URLs.
10. Incorporar las colecciones de incidencias y los movimientos/envíos por solicitud; el modelo local solo conserva una incidencia y sus IDs sintéticos de tránsito no equivalen a IDs de backend.
11. Calcular las cards y reportes desde datos completos o resúmenes, incluyendo recepciones como ingresos y excluyendo anulaciones según contrato; no sumar únicamente una página ni contar traslados como salidas finales.

## 5. Endpoints nuevos realmente necesarios

**No identifico una nueva familia de endpoints obligatoria para el alcance principal.** Las funciones antes ausentes ya tienen rutas. Los bloqueos descritos se resuelven principalmente ampliando esas rutas y adaptando el cliente.

La única ruta adicional a considerar es una consulta de actividad reciente por rol si se decide mantener `/actividad` exclusivamente para auditoría administrativa. También se puede resolver ampliando sus permisos con alcance estricto, sin otra ruta. Las consultas agregadas específicas son una alternativa de rendimiento, no un requisito si los datos completos pueden consultarse correctamente.

## 6. Qué puede sobrar o aplazarse

- Recepción/devolución por solicitud y por movimiento se solapan para envíos vinculados. Elegir un camino canónico en el frontend y no llamar a ambos. Los de movimiento sí cubren envíos independientes, por lo que no se recomienda eliminarlos sin revisar esos usos.
- Síntomas estructurados y conversiones siguen fuera del flujo actual; pueden aplazarse, no necesitan borrarse.
- No agregar `/users`, `/ubicaciones`, `/salidas` ni `/sivet/commands` como duplicados de recursos que ya existen.
- No crear rutas para arrastre, tamaño, colores, leyendas o forma de gráfica. Son comportamiento del cliente.

Prioridad: cerrar checklist/recepción parcial, prioridad y actividad por rol; definir estados/permisos y esquemas de reportes; conectar auth/servicios y archivos; después verificar flujos reales, concurrencia, permisos y exportaciones completas.
