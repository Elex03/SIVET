# SIVET: datos, flujos e integración

## Ejecutar

`npm install`, `npm run dev`. Acceso de demostración: usuarios `admin`, `bodega` y `farmacia`, contraseña `Sivet2026!`, seleccionando su rol correspondiente. Axios carga `public/data/users.json`; las contraseñas se verifican con PBKDF2 y las cuentas inactivas no pueden iniciar ni conservar sesión. Las cuentas anteriores sin registro dejan de ser válidas. Sigue siendo una simulación local, no autenticación de producción.

## JSON y Axios

Axios consulta `public/data/sivet.json` por HTTP. Los cambios se guardan en `localStorage`, clave `sivet-data-v1`; el navegador no modifica el JSON. Los datos de ejemplo incluyen ocho alertas de stock bajo y ocho vencimientos, movimientos de octubre de 2026 y un envío pendiente (`SOL-DEMO-008`). No se rellenan las tablas con alertas inventadas si los datos reales no llegan a ocho.

Los datos ya guardados en el navegador se conservan. Para cargar un JSON de ejemplo modificado, retirar únicamente esa clave mediante las herramientas del navegador. `scripts/create-fixtures.cjs` regenera el JSON de muestra.

`client.ts` centraliza Axios y `useSivet.ts` comparte carga, errores, confirmaciones y actualizaciones entre pantallas. Definir `VITE_API_URL` en `.env.local` activa el contrato propuesto: `GET /sivet` devuelve `Database`; `POST /sivet/commands` recibe `Command` y devuelve el estado completo actualizado. No hay fallback silencioso a JSON si la API falla. Los tipos se encuentran en `src/shared/api/domain.ts`.

## Usuarios y permisos

Administración de usuarios permite crear cuentas, cambiar roles y activar/desactivar. Impide desactivar la cuenta propia o eliminar el último administrador activo. El almacén local usa la clave `sivet-accounts-v1` y sincroniza desactivaciones entre pestañas. Solo Bodega y Administración pueden editar información del catálogo de medicamentos; la operación no altera existencias. Farmacia tiene un catálogo exclusivo de ubicaciones de destino.

Contrato Axios propuesto cuando exista backend: `POST /auth/login` recibe username/password y devuelve User con cookie de sesión; `GET /auth/me` devuelve User o 401; `POST /auth/logout` invalida la sesión; `GET /users` devuelve usuarios sin hashes ni contraseñas (solo Administración); `POST /users` crea/actualiza username, role, active y password opcional. El servidor debe verificar rol, estado activo, unicidad y último administrador en cada operación y revocar sesiones al desactivar. Nunca confiar en localStorage ni en el actor enviado para autorización real.

## Presentación y preferencias

Actividad a la derecha en escritorio, debajo en pantallas pequeñas. El alto se limita al viewport y cada tabla, panel y filtros de reportes tiene su propio scroll. Las cards de inventario filtran los lotes y conservan sus bordes visibles. Las gráficas admiten orden por arrastre y tamaño mediante ocho tiradores accesibles con teclado; si el contenido necesita más altura mantiene scroll interno. Reportes muestra UNA en el encabezado.

Una campana sin texto y con contador rojo en el header; Administración reúne las bandejas de Bodega y Farmacia con filtro por área. Panel segmentado en traslados, solicitudes, incidencias, alertas y recordatorios. Claro/oscuro se cambia únicamente desde Configuración; silenciar avisos emergentes está únicamente en Configuración. Las preferencias persisten en el navegador. Salidas abre su historial y permite registrar desde un modal; los destinos deben estar activos en el catálogo.

## Flujos

- **Donaciones:** en Recepción se selecciona Compra o Donación. Donación registra donante, importe total y adjunto opcional, sin número de factura o acta; no exige proveedor. Cada línea permite marcar «Vencimiento desconocido», persistido como null. El stock físico queda visible y genera alerta, pero no se reserva ni se despacha mientras no se conozca la fecha. Los registros anteriores sin tipo siguen siendo compras. Reportes → Donaciones recibidas muestra ingresos confirmados, con filtros de fechas/categoría/ubicación, tabla exportable y gráficas por donante de unidades recibidas y sin fecha. Borradores y cancelados no cuentan. Es un reporte de ingresos históricos, no de saldo remanente de donaciones. Funciona en modo JSON; los cambios REST requeridos están en `PROMPT-BACKEND-INTEGRACION.md`.

- **Recepción en Bodega:** proveedor, factura/remisión, responsable, fecha y líneas por lote. Un borrador conserva los campos y adjunto sin mover existencias. Confirmar crea ENTRADA y actualiza Bodega una sola vez. Se impide repetir el número de factura para el mismo proveedor. Cancelar un borrador conserva su historial.
- **Medicamentos:** código de barras, acción terapéutica, empaque, unidad interna, cantidad por empaque, marca, descripción/síntomas, imagen, categoría y mínimo. UXE es informativo: las cantidades de recepción se capturan en unidades internas y no se multiplican. La creación desde recepción agrega el producto a la tabla y conserva el pedido.
- **Solicitudes a Bodega:** abastecen Farmacia. No preguntan localidad final ni hospital/casa; permiten prioridad e instrucciones de envío. Aprobar valida vigencia y disponibilidad y reserva cantidades. El envío descuenta Bodega y crea stock en tránsito, notificando a Farmacia.
- **Verificación:** checklist por medicamento confirma cantidad completa, lote, vencimiento y condición; también se pueden escribir los datos observados. Una discrepancia deja pendiente el envío y avisa a Bodega. Solo la conformidad completa acredita Farmacia.
- **Devolución:** requiere motivo, registra DEVUELTO y mantiene productos en “En revisión”, sin acreditarlos automáticamente a ningún inventario disponible. Bodega puede registrar su revisión y avisar a Farmacia. No se implementa un reintegro automático de productos devueltos o dañados.
- **Salidas de Farmacia:** flujo independiente que permite cantidades parciales de sus propios lotes. Registra localidad (consultorio, quirófano, radiografía, etc.), administración en el lugar o entrega para casa y observación. Descuenta Farmacia y registra SALIDA; la localidad no confirma recepción. No cambia la solicitud que abasteció el inventario.

## Actividad y alertas

Cada mutación de negocio agrega un evento de actividad con fecha, usuario, localidad, acción, documento y detalle. Las pantallas principales muestran los últimos ocho eventos; el reporte de auditoría filtra por fechas y localidad e incluye tabla y gráficas. La actividad local es una demostración funcional; el backend debe conservar un historial inmutable y derivar el actor de la sesión autenticada, sin confiar en el campo enviado por el navegador.

Los avisos de aprobación/envío/incidencia se guardan junto con la transacción y tienen lectura por usuario. Los paneles incluyen alertas de stock y vencimiento. Mientras la aplicación esté abierta y visible se recuerda el total pendiente cada cinco minutos; el usuario puede silenciar y reactivar estos recordatorios. Esta preferencia pertenece al usuario en ese navegador. No se envían correos ni notificaciones con la aplicación cerrada. Con API se consultan novedades cada 30 segundos; en JSON se sincronizan pestañas del mismo navegador mediante `storage`.

## Presentación y reportes

Tarjetas con colores por función, información contextual y comparativas calculadas: pedidos/salidas por mes; ingresos del dashboard frente al período anterior equivalente. Un mes previo con cero se muestra como incremento absoluto, no porcentaje infinito. No se inventan históricos de stock. Las tablas de alertas muestran ocho registros por página y las tarjetas vecinas del dashboard comparten altura.

El lienzo de reportes usa tarjetas de ancho individual, sin posiciones vacías prefijadas. Cada gráfica tiene tirador, control de ancho accesible por teclado y botón de ancho completo. Al no caber una vecina, baja de fila. El arrastre y el selector de orden reorganizan las gráficas; en móvil se apilan al ancho disponible. Las métricas/tipos permitidos están en `reportDefinitions.ts`. PDF incluye gráficas y todas las filas, independiente de la paginación.

Los adjuntos locales aceptan PDF/PNG/JPEG/WebP (solo imágenes para medicamentos), hasta 1.5 MB por archivo. Se almacenan como data URL; el guardado informa un error si el navegador agota su cuota. Para producción usar almacenamiento de archivos del servidor y URLs, validar formato/tamaño y conservar permisos. No se publican ni suben archivos a servicios externos en modo JSON.

## Backend y verificación

Antes de producción: autenticación real, permisos de servidor, validación integral, transacciones, control de concurrencia/versiones y prevención de duplicados. Los permisos de rutas del cliente no sustituyen controles del servidor. Los comandos incluyen `catalog.save`, `receipt.draft/create/cancel`, `request.create/status/receive/review`, `pharmacy.dispatch` y `notification.read`.

`npm test` comprueba transacciones, reservas, devoluciones, facturas, borradores, salidas parciales, notificaciones, filtros y auditoría. `npm run build` valida TypeScript y genera la aplicación.

El historial de pedidos permite abrir cada factura adjunta (PDF o imagen) en un visor. Se retiraron las acciones de descarga de documentos y de exportación del historial. Las tarjetas compactas reservan más alto para las tablas.

Las gráficas admiten orden, límite de elementos, orientación, paleta, leyenda y valores. Las series temporales conservan cronología y permiten líneas, áreas y curvas; las barras múltiples permiten apilamiento y los gráficos circulares alternan entre pastel y dona. Estos ajustes se aplican también al PDF.
