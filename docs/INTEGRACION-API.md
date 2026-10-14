# Integración API de SIVET

Implementada contra la documentación local **1.3.0**, base `/api/v1`. Referencia: `api-openapi-integracion-1.3.json`.

## Ejecutar

1. Inicia el backend en `http://localhost:3000`.
2. El archivo `.env.local` tiene `VITE_API_URL=/api/v1`.
3. Ejecuta `npm run dev -- --host 127.0.0.1` y abre `http://127.0.0.1:5173`.
4. Inicia sesión con una cuenta real del backend. El rol se obtiene desde `/auth/me`.

Vite redirige `/api` al backend. Así funciona el acceso local desde 127.0.0.1 aunque el backend no publique CORS para ese origen. En producción configura un reverse proxy `/api` al servidor o una URL absoluta autorizada por CORS. No uses el servidor de desarrollo de Vite como servidor de producción.

Para modo JSON, deja `VITE_API_URL=` vacía y reinicia Vite. Ese modo conserva su almacenamiento local propio. Con la API activa no se mezclan los JSON ni sus credenciales con los datos del servidor.

## Recursos conectados

| Pantalla o acción | API |
|---|---|
| Login y sesión | `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout` |
| Usuarios | `/usuarios`, `/usuarios/{id}`, `/usuarios/{id}/password`, `/roles` |
| Catálogos | `/medicamentos`, `/marcas`, `/categorias`, `/presentaciones`, `/unidades-medida`, `/acciones-terapeuticas`, `/sintomas`, `/areas-destino`, `/proveedores` |
| Imagen y síntomas | `/medicamentos/{id}/imagen`, `/medicamentos/{id}/sintomas` |
| Inventario | `/inventario` |
| Pedidos de ingreso | `/lotes`, `/recepciones/borradores`, `/recepciones/{id}`, `/confirmar`, `/cancelar` |
| Evidencia del ingreso | `/recepciones/{id}/adjuntos`, `/recepciones/{id}/adjuntos/{adjuntoId}` |
| Solicitudes | `/solicitudes`, `/solicitudes/{id}`, `/aprobar`, `/rechazar` |
| Preparación | `/solicitudes/{id}/lotes-elegibles`, `/reservas/reasignar`, `/preparacion`, `/estado` |
| Envío y salida parcial | `/movimientos` |
| Recepción física | `/movimientos/{id}/recepcion` |
| Devolución | `/movimientos/{id}/devolucion` |
| Revisión de incidencia | `/solicitudes/{id}/incidencias/{incidenciaId}/revision` |
| Notificaciones | `/notificaciones`, `/notificaciones/{id}/leida` |
| Actividad | `/actividad` |
| Dashboard y reportes | Recursos anteriores, recorriendo todas las páginas y adaptando sus datos a los selectores existentes |

El adaptador `server.ts` reemplaza `/sivet`, `/sivet/commands` y `/users`. Mantiene la estructura de las pantallas, transforma los DTOs `{data,…}`, IDs numéricos y cantidades decimales. Los IDs de catálogos se distinguen internamente por tipo para evitar colisiones entre registros con ID 1.

## Comportamiento

- Bearer y refresh rotativo: las renovaciones simultáneas se serializan. Tokens en sessionStorage; una sesión rechazada se elimina. No se envía rol ni actor como autoridad al backend.
- Cambiar sesión vacía el almacén de datos y descarta cargas anteriores. El servidor conserva la autorización efectiva.
- CONSULTA accede al inventario con lectura. PREPARADOR consulta únicamente solicitudes autorizadas, sus detalles y lotes elegibles; no descarga catálogos o inventario globales.
- Las solicitudes nuevas se agrupan por medicamento. Bodega aprueba cantidades solicitadas; el servidor asigna reservas FEFO. Se preservan asignaciones y versiones al preparar/reasignar.
- El envío de Bodega y las salidas de Farmacia usan UUID de operación. Farmacia envía cantidad y unidad de salida; el servidor convierte y calcula el saldo. Modalidad por línea.
- Recepción física se vincula a un movimiento específico y a sus IDs de detalle. Se usa modo COMPLETA: una diferencia bloquea acreditación del envío. No se repite una recepción ya verificada.
- Incidencias permiten seguimiento, reintegro físico y pérdida ADMIN según contrato. Comentar no equivale a resolver una diferencia. El frontend no sobrescribe la recepción histórica.
- Ingresos siguen borrador → adjunto → confirmar con versión. Donaciones conservan donante, total y vencimiento null. El lote de cada línea debe estar completo para poder persistirlo mediante el contrato actual de borradores.
- El total de una recepción se guarda en la recepción; no se crea una factura fiscal ni se solicitan subtotal o impuesto.
- Las imágenes y los adjuntos se obtienen con Bearer como blobs y se liberan sus URLs al desmontarse. Nuevos archivos se envían en multipart campo `archivo`.
- Usuarios API requieren nombre, apellido y contraseña de 12 caracteres. Edición y cambio de contraseña usan operaciones separadas. Las opciones de catálogo respetan los permisos publicados.
- Se recorre toda la paginación para conservar los filtros, orden y reportes actuales. Esta primera integración carga los recursos completos autorizados; para históricos grandes conviene migrar la navegación a paginación por pantalla y usar la exportación NDJSON del backend. No se afirma una instantánea transaccional entre todas las consultas.

## Verificación

- Autenticación y carga mediante el adaptador real comprobadas con ADMIN, BODEGA, FARMACIA, PREPARADOR y CONSULTA.
- Login, carga administrativa y usuarios también comprobados a través del proxy local de Vite.
- El backend de desarrollo estaba vacío de medicamentos, lotes, recepciones, solicitudes y movimientos. No se crearon registros de negocio para la prueba.
- `npm test`: 58 pruebas de dominio, contratos del adaptador y sesión. Cubren decimales, modalidad por línea, solicitudes por medicamento, recepción, cambio de lote/versiones, donaciones, confirmación y refresh concurrente/rechazado.
- Los tests de escritura usan transporte simulado: validan rutas y payloads del frontend. No sustituyen una prueba de todo el flujo con registros reales y las pruebas de integración del backend.
- Se conserva la validación de producción en el servidor; ocultar controles o comprobar el formulario no sustituye la autorización ni las transacciones del backend.

Los scripts `scripts/api-read-smoke.cjs` y `scripts/api-adapter-smoke.cjs` reciben cuentas por stdin, no guardan ni imprimen contraseñas o tokens y solo prueban autenticación, consultas y cierre de sesión. El segundo acepta `SIVET_API_TEST_URL` para comprobar el proxy local.
