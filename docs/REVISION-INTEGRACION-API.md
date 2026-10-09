# Revisión de integración de SIVET

> Revisión histórica. Las conclusiones actuales están en [la revisión del 7 de octubre de 2026](REVISION-INTEGRACION-API-2026-10-07.md), basada en 100 operaciones documentadas. No usar esta lista de 69 operaciones como pendientes vigentes.

Fuente: [Swagger local](http://localhost:3000/docs/), OpenAPI 3.1.0, SIVET API 1.0.0, base `/api/v1`. Se revisaron las 69 operaciones documentadas y el frontend actual. La especificación consultada está guardada en `api-openapi-snapshot.json`.

Alcance: revisión estática del contrato publicado frente al código del frontend. No se ejecutaron escrituras, ni se verificó la implementación interna del servidor. «Falta» significa que la capacidad no está documentada; un campo ausente del esquema de respuesta puede existir en ejecución, pero no se puede dar por garantizado.

## Conclusión

La API cubre autenticación, usuarios, varios catálogos, lotes, inventario, recepciones completadas, solicitudes básicas, movimientos y lectura de notificaciones. No basta con configurar `VITE_API_URL`: el frontend todavía espera `/sivet`, `/sivet/commands`, `/users` y sesión por cookie. La API ofrece recursos separados, `/usuarios`, respuestas envueltas en `data` y tokens Bearer.

Los bloqueos principales son las reservas al aprobar, verificación de recepción en Farmacia, incidencias y devoluciones, borradores de recepción, archivos adjuntos, catálogos de marcas/categorías y permisos de Bodega/Farmacia. No hay evidencia de endpoints duplicados que deban eliminarse inmediatamente.

## 1. Capacidades faltantes y rutas propuestas

Todas las rutas siguientes son propuestas relativas a `/api/v1`, no endpoints existentes. Los nombres pueden ajustarse; no es necesario crear varias rutas si una operación documentada cubre el mismo flujo.

| Prioridad | Método y ruta propuestos | Qué resuelve y contrato mínimo |
|---|---|---|
| Alta | `POST /recepciones/borradores` | Guardar una recepción incompleta, con documento, fecha, proveedor, líneas y adjunto opcionales, sin modificar inventario. |
| Alta | `PATCH /recepciones/{id}` | Editar exclusivamente un borrador; rechazar recepciones completadas/canceladas. |
| Alta | `POST /recepciones/{id}/confirmar` | Validar y confirmar el borrador una sola vez; crear existencias/movimientos de forma atómica. |
| Alta | `POST /recepciones/{id}/cancelar` | Cancelar un borrador conservando historial. No equivale a anular una recepción ya contabilizada. |
| Alta | `POST /recepciones/{id}/adjuntos` | Subir factura/remisión PDF o imagen con `multipart/form-data`; vincularla también a un borrador. |
| Alta | `GET /recepciones/{id}/adjuntos/{adjuntoId}` | Obtener archivo protegido para vista previa y descarga. El detalle de recepción debe incluir metadatos del adjunto. Puede usarse almacenamiento compartido de archivos y referencias, sin duplicar rutas por entidad. |
| Alta | `PATCH /solicitudes/{id}/estado` | Cubrir preparación y listo para entrega con transiciones explícitas; evitar un cambio arbitrario de estado. El envío puede seguir usando `POST /movimientos`, debidamente ampliado. |
| Alta | `POST /solicitudes/{id}/recepcion` | Farmacia verifica por línea lote, vencimiento, cantidad y condición. Solo conformidad acredita inventario; registrar receptor desde la sesión. |
| Alta | `POST /solicitudes/{id}/incidencias` | Registrar diferencias con datos observados sin acreditar inventario disponible. |
| Alta | `POST /solicitudes/{id}/incidencias/{incidenciaId}/revision` | Bodega responde a la incidencia, con trazabilidad y notificación a Farmacia. |
| Alta | `POST /solicitudes/{id}/devolucion` | Devolver envío pendiente de recibir y mantenerlo en revisión, sin reintegro automático a disponible. |
| Alta | `GET /marcas`, `POST /marcas`, `PATCH /marcas/{id}` | Administrar marcas/laboratorios usados por el formulario de medicamentos. |
| Alta | `GET /categorias`, `POST /categorias`, `PATCH /categorias/{id}` | Clasificar medicamentos y alimentar filtros, dashboard y reportes. |
| Alta | `POST /medicamentos/{id}/imagen`, `GET /medicamentos/{id}/imagen` | Persistir y consultar imagen; alternativamente usar el mismo servicio de archivos de adjuntos. |
| Alta | `GET /actividad` | Actividad reciente y auditoría, filtrable por fechas, usuario, localidad, acción y documento, con paginación y orden. Los movimientos solos no registran cambios de catálogo, aprobaciones, borradores e incidencias. |
| Media | `PATCH /usuarios/{id}/password` | Cubrir «Nueva contraseña» en edición de usuarios por Administración, con invalidación de sesiones y auditoría. `PATCH /auth/password` solo cambia la contraseña propia y no cubre este control actual. |

Los cuatro endpoints de borradores también pueden resolverse ampliando `POST /recepciones` con una modalidad BORRADOR y documentando edición/confirmación/cancelación. No hace falta duplicar la creación de recepciones completadas que ya existe.

Las operaciones de recepción/incidencia/devolución pueden unificarse con un campo `mode` y validaciones diferentes, como en el comando local actual. Lo imprescindible es conservar las reglas, no reproducir exactamente estos nombres.

## 2. Endpoints existentes que necesitan ampliación

| Endpoint existente | Diferencia con SIVET | Cambio requerido |
|---|---|---|
| `POST /solicitudes/{id}/aprobar` | Swagger dice expresamente que no reserva existencias. La UI calcula disponible descontando reservas. | Verificar stock/vigencia y reservar lotes atómicamente; impedir doble reserva concurrente, liberar al rechazar y consumir al enviar. No requiere otra ruta de aprobación. |
| `POST /solicitudes` | Solicita por medicamento; la UI selecciona existencias por lote. No documenta prioridad. | Acordar asignación de lotes (en solicitud o aprobación), incluir prioridad y devolver asignaciones. No convertir `stockId` directamente en `id_medicamento`. |
| `POST /solicitudes/{id}/rechazar` | Solo admite pendientes según descripción. La UI también rechaza durante preparación/listo. | Definir transiciones permitidas y liberar reservas. Mantener motivo obligatorio. |
| `POST /movimientos` con `BODEGA_FARMACIA` | No hay recepción verificada ni ubicaciones de tránsito/revisión documentadas. | Separar envío de ingreso disponible en Farmacia. Enlazar solicitud, lotes y cantidades; emitir notificaciones. No dar por hecho que el traslado existente cumple la verificación. |
| `POST /movimientos` con `FARMACIA_AREA` | Ya cubre salidas a localidades, pero falta modalidad hospital/casa. | Añadir campo estructurado `modalidad_entrega: HOSPITAL | CASA`, devolverlo en detalle/listado y conservar observaciones. No usar solo texto libre si se requieren gráficas por destino. |
| `POST /movimientos` | La documentación advierte que cada POST genera un movimiento nuevo. | Añadir idempotencia o identificador de operación único para reintentos seguros; no reenviar automáticamente con resultado incierto. |
| `GET /inventario` | Solo documenta BODEGA/FARMACIA y cantidad; no reserva/disponible. | Exponer ubicación, físico, reservado y disponible; incluir tránsito/revisión o un recurso equivalente de envíos. Filtros por categoría, búsqueda y alertas para las cards. |
| `POST/PATCH /medicamentos` | Solo ADMIN. Faltan marca, categoría, cantidad por empaque e imagen en escritura. | Permitir BODEGA además de ADMIN, restringiendo a catálogo; agregar relaciones/campos faltantes. Acordar restricciones sobre cambiar unidad base con movimientos existentes. |
| `POST/PATCH /areas-destino` | Solo ADMIN. | Habilitar FARMACIA para crear/editar sus ubicaciones, según el alcance de permisos acordado. No crear un catálogo paralelo `/ubicaciones`. |
| `POST/PATCH /acciones-terapeuticas` | Solo ADMIN; el frontend permite editarlo a Bodega. | Alinear permiso o visibilidad del control. Revisar la misma matriz para el resto de catálogos generales; no ampliar todos los permisos por defecto. |
| `POST/PATCH /proveedores` | Solo un `correo` y un `telefono`. | Admitir `correos[]` y `telefonos[]`, o contactos asociados. Ampliar estas rutas es suficiente; no es obligatorio crear un CRUD de contactos separado. |
| `POST /recepciones` | Exige lotes existentes y `costo_unitario`; no acepta la fecha elegida en la UI. | Resolver creación/búsqueda de lote y fecha de ingreso. Añadir captura de costo en frontend o cambiar contrato explícitamente: no inventar costos cero. |
| `POST /facturas` | Exige subtotal, mientras el formulario actual captura documento y archivo. | Decidir si habrá captura financiera o evidencia documental independiente. Una factura de datos no equivale a subir el PDF. |
| `GET /recepciones` | Solo `page/limit`. | Añadir búsqueda por documento/proveedor, estado y fechas. Incluir referencias a factura, adjuntos y responsable para el historial. |
| `GET /movimientos` | Solo `page/limit`. | Filtrar por tipo, fecha, ubicación, área, producto y modalidad; devolver referencias y detalles suficientes para historial y reportes. |
| `GET /solicitudes` | Solo `page/limit`. | Filtrar estados, fechas, prioridad y solicitante; contadores globales para cards si se pagina en servidor. |
| `GET /notificaciones` | Solo propias y filtro leída; faltan categoría, procedencia y enlace al documento. | Añadir tipo, área de origen/destino y referencia a solicitud/movimiento. Definir bandejas de Administración para Bodega/Farmacia con autorización, manteniendo lectura individual. |

El contador de no leídas puede aprovechar `GET /notificaciones?leida=false` y su `total`; un endpoint `/contador` no es obligatorio. Para «marcar todas», la UI puede usar el PATCH individual; una operación masiva es una optimización opcional. Los avisos de aprobación/envío/incidencia deben generarse en servidor en la misma transacción, sin un POST libre desde el navegador.

## 3. Esquemas de respuesta incompletos

Estas ausencias corresponden al OpenAPI, no a una comprobación de la base de datos:

| Esquema | Campos necesarios no declarados |
|---|---|
| `usuarios` | `nombre`, aunque se exige al crear. |
| `medicamentos` | `id_unidad_medida` y `descripcion`, aunque aparecen en creación; además relaciones a marca/categoría, UXE e imagen para cubrir la UI. |
| `lotes` | `numero_lote`, aunque se exige al crear. |
| `inventario` | `ubicacion`, esencial para distinguir existencias de Bodega/Farmacia en una consulta combinada. |
| `facturas` | `numero_factura`, aunque se exige al crear. |
| `recepciones` | `numero_recepcion`, `id_factura` y adjuntos. |
| `detalle_recepciones` | `id_lote`. |
| `solicitudes` | `numero_solicitud`, prioridad, reservas/asignaciones, recepción/incidencias. |
| `detalle_solicitudes` | `id_medicamento`. |
| `movimientos` | `tipo_movimiento`, `id_solicitud` y modalidad hospital/casa. |
| `detalle_movimientos` | `id_lote`. |
| `conversiones_unidad` | `id_unidad_origen` y `factor`, exigidos en creación. |

Corregir estos esquemas antes de generar tipos o adaptadores. Los estados de respuesta son strings genéricos: documentar enums y transiciones. No se puede equiparar APROBADA con COMPLETADO o con recibido físicamente.

## 4. Dashboard, reportes y PDF

No hay rutas específicas de dashboard/reportes. Esto no obliga a crear una por gráfica: se pueden calcular en cliente si recibe todos los registros autorizados y los campos completos. Con páginas de hasta 100 filas, calcular usando solo la primera página daría totales y comparativas incorrectos.

Para un volumen real recomiendo, como alternativa a descargar todo:

- `GET /dashboard/resumen?desde=&hasta=&ubicacion=&categoria=`: KPI actuales y período anterior, alertas y agregados por categoría/acción/área.
- `GET /reportes/{tipo}?desde=&hasta=&ubicacion=&categoria=&page=&limit=`: tipos `existencias`, `movimientos`, `bajo-stock`, `vencimientos`, `salidas-area`, `auditoria`; filas paginadas y agregados sobre el conjunto completo filtrado. Auditoría necesita datos propios aunque se exponga aquí en lugar de `/actividad`.
- Filtros de stock bajo/vencimiento en inventario, o consulta de alertas equivalente. Los umbrales deben ser coherentes con las cards y con la fecha de Managua.

Estas rutas son recomendaciones de consulta/escala, no duplicados obligatorios de los recursos existentes. Incluir ingresos desde recepciones al componer el flujo histórico; no asumir que GET movimientos incluye ingresos si el contrato no lo garantiza. Mantener distinción entre traslados y salidas finales, unidades base y operaciones anuladas.

El PDF de historial y reportes ya se genera en frontend. No falta obligatoriamente `/recepciones/exportar/pdf`: debe obtener todas las filas filtradas para exportar. PDF servidor sería opcional para exportaciones grandes/oficiales. Tamaño, arrastre, orientación, leyenda, color y tipo de gráfica son presentación; no requieren endpoints. Guardar diseños/preferencias en servidor solo si se quiere compartirlos o sincronizarlos entre dispositivos.

## 5. Qué está de más o puede aplazarse

No recomiendo borrar endpoints únicamente porque la interfaz todavía no los use.

| Operaciones | Evaluación |
|---|---|
| `GET/POST /sintomas`, `GET/PATCH /sintomas/{id}`, `PUT /medicamentos/{id}/sintomas` | Fuera del flujo actual: la UI usa texto libre en descripción. Mantener si se quiere clasificación clínica estructurada; aplazable para esta integración. |
| `GET/POST /conversiones-unidad`, `GET/PATCH /conversiones-unidad/{id}` | La UI no administra conversiones y usa unidades base/UXE informativo. Aplazable; no aplicar factores automáticamente. No suple por sí solo el campo cantidad por empaque. |
| `GET /roles/{id}` y GET individuales de catálogos pequeños | Pueden no ser necesarios en la primera conexión si el listado basta, pero son recursos válidos, no duplicados funcionales probados. |
| `POST /auth/logout-all`, `PATCH /auth/password` | No tienen una pantalla equivalente completa hoy; útiles para gestión de sesión. No eliminarlos por eso. `POST /auth/refresh` sí es necesario con este contrato. |
| `POST /recepciones/{id}/anular`, `POST /movimientos/{id}/anular` y ajustes de inventario | No están expuestos en la UI actual, pero sirven para correcciones trazables. No confundir anulación con cancelar borrador ni devolución con reversión automática. |
| `POST /solicitudes/{id}/cancelar` | Capacidad adicional útil (cancelación propia pendiente), no redundante con rechazar por Bodega. |

Evitar añadir por duplicado: `/users` junto a `/usuarios`; `/ubicaciones` junto a `/areas-destino`; `/salidas` si `FARMACIA_AREA` ampliado cubre todo; `/sivet` y `/sivet/commands` solo para conservar el prototipo. Un adaptador explícito a recursos REST es preferible aquí a mantener ambos modelos sin necesidad.

## 6. Cambios del frontend necesarios aunque la API estuviera completa

1. Base URL `http://localhost:3000/api/v1`; verificar CORS para el origen del frontend sin asumir que ya está configurado.
2. Login devuelve `{data: Token}` y `/auth/me` devuelve `{data: usuario}`; no devuelve directamente el `User` esperado. Resolver rol mediante `id_rol` y catálogo de roles, sin asumir IDs fijos.
3. Enviar `Authorization: Bearer ...`; implementar renovación serializada de un solo uso, reemplazar ambos tokens y enviar `refresh_token` en logout. `withCredentials` solo no cubre este contrato.
4. Cambiar `/users` a `/usuarios`; separar POST creación/PATCH edición. Capturar nombre/apellido obligatorios; ajustar contraseña mínima de 8 a 12 y el flujo de cambio administrativo pendiente.
5. Sustituir `/sivet` y comandos por servicios de recursos y adaptadores. Mapear IDs numéricos, nombres de campos y estados. No enviar los UUID locales como IDs de base de datos.
6. Desenvolver `{data,total,page,limit}` y preservar paginación. Leer errores desde `error.message`/`error.details`, no solo `message` raíz.
7. Convertir cantidades/montos según cadenas decimales del backend; la UI hoy exige cantidades enteras. Acordar si se admitirán fracciones antes de aceptarlas silenciosamente.
8. Usar archivos/URLs protegidas en lugar de `data:`; el visor actual acepta solo base64, por lo que necesita adaptación. Normalizar fechas de vencimiento sin desplazar el día por zona horaria.
9. Invalidar/refrescar inventario, solicitudes, notificaciones, actividad y resúmenes tras las mutaciones. Los controles de permisos y usuarios activos deben imponerse en servidor.

## Orden recomendado

Primero corregir OpenAPI y acordar campos/permisos. Después autenticación y catálogos; luego reservas, tránsito/verificación, incidencias y salidas; después borradores/archivos e historial; finalmente consultas agregadas y exportación paginada. Probar concurrencia, reintentos, usuarios inactivos y contadores sobre más de una página antes de considerar la integración completa.

Referencias de código: `src/shared/api/domain.ts`, `useSivet.ts`, `client.ts`, `accounts.ts`, `permissions.ts`, `selectors.ts`, `reports.ts`; `src/shared/context/AuthContext.tsx`; formularios de Catálogos, Pedidos, Solicitudes y Usuarios.

## Inventario de operaciones documentadas

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/refresh` | Rotar refresh token y renovar access token |
| POST | `/auth/logout` | Cerrar una sesión mediante su refresh token |
| POST | `/auth/logout-all` | Cerrar todas las sesiones propias |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/me` | Usuario actual |
| PATCH | `/auth/password` | Cambiar contraseña propia |
| GET | `/usuarios` | Listar usuarios |
| POST | `/usuarios` | Crear usuario |
| GET | `/usuarios/{id}` | Consultar usuario |
| PATCH | `/usuarios/{id}` | Actualizar usuario o desactivar acceso |
| GET | `/roles` | Listar |
| GET | `/roles/{id}` | Consultar por ID |
| GET | `/presentaciones` | Listar |
| POST | `/presentaciones` | Crear |
| GET | `/presentaciones/{id}` | Consultar por ID |
| PATCH | `/presentaciones/{id}` | Actualizar |
| GET | `/unidades-medida` | Listar |
| POST | `/unidades-medida` | Crear |
| GET | `/unidades-medida/{id}` | Consultar por ID |
| PATCH | `/unidades-medida/{id}` | Actualizar |
| GET | `/acciones-terapeuticas` | Listar |
| POST | `/acciones-terapeuticas` | Crear |
| GET | `/acciones-terapeuticas/{id}` | Consultar por ID |
| PATCH | `/acciones-terapeuticas/{id}` | Actualizar |
| GET | `/sintomas` | Listar |
| POST | `/sintomas` | Crear |
| GET | `/sintomas/{id}` | Consultar por ID |
| PATCH | `/sintomas/{id}` | Actualizar |
| GET | `/areas-destino` | Listar |
| POST | `/areas-destino` | Crear |
| GET | `/areas-destino/{id}` | Consultar por ID |
| PATCH | `/areas-destino/{id}` | Actualizar |
| GET | `/proveedores` | Listar |
| POST | `/proveedores` | Crear |
| GET | `/proveedores/{id}` | Consultar por ID |
| PATCH | `/proveedores/{id}` | Actualizar |
| GET | `/medicamentos` | Listar |
| POST | `/medicamentos` | Crear |
| GET | `/medicamentos/{id}` | Consultar por ID |
| PATCH | `/medicamentos/{id}` | Actualizar |
| GET | `/conversiones-unidad` | Listar |
| POST | `/conversiones-unidad` | Crear |
| GET | `/conversiones-unidad/{id}` | Consultar por ID |
| PATCH | `/conversiones-unidad/{id}` | Actualizar |
| GET | `/lotes` | Listar |
| POST | `/lotes` | Crear |
| GET | `/lotes/{id}` | Consultar por ID |
| PATCH | `/lotes/{id}` | Actualizar |
| GET | `/facturas` | Listar |
| POST | `/facturas` | Crear |
| GET | `/facturas/{id}` | Consultar por ID |
| PUT | `/medicamentos/{id}/sintomas` | Reemplazar síntomas relacionados |
| GET | `/inventario` | Consultar existencias por lote y ubicación |
| GET | `/recepciones` | Listar recepciones |
| POST | `/recepciones` | Recibir medicamentos en Bodega |
| GET | `/recepciones/{id}` | Consultar recepción con detalles |
| POST | `/recepciones/{id}/anular` | Anular recepción y revertir existencias |
| GET | `/solicitudes` | Listar solicitudes |
| POST | `/solicitudes` | Solicitar medicamentos a Bodega |
| GET | `/solicitudes/{id}` | Consultar solicitud con detalles |
| POST | `/solicitudes/{id}/aprobar` | Aprobar cantidades de una solicitud pendiente |
| POST | `/solicitudes/{id}/rechazar` | Rechazar solicitud pendiente |
| POST | `/solicitudes/{id}/cancelar` | Cancelar solicitud propia pendiente |
| GET | `/movimientos` | Listar movimientos |
| POST | `/movimientos` | Trasladar, entregar o ajustar existencias |
| GET | `/movimientos/{id}` | Consultar movimiento con detalles |
| POST | `/movimientos/{id}/anular` | Anular movimiento y revertir existencias |
| GET | `/notificaciones` | Listar notificaciones propias |
| PATCH | `/notificaciones/{id}/leida` | Marcar notificación propia como leída |
