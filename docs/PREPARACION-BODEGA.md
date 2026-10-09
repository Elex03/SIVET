# Preparación de pedidos de Bodega

## Acceso de demostración

- Portal: `/preparacion/login`.
- Usuario: `preparador`.
- Contraseña: `Sivet2026!`.
- Perfil: Preparador de Bodega (preseleccionado).

En modo JSON, las cuentas guardadas en el navegador se actualizan para incorporar el preparador si no existe. No se reemplazan contraseñas ni se reactivan cuentas existentes. No hace falta borrar los datos del navegador.

## Flujo

1. Bodega aprueba la solicitud y reserva las existencias.
2. El preparador abre el pedido aprobado y registra cantidad, lote observado, vencimiento y comentario por medicamento.
3. Puede guardar avances; para marcar un medicamento debe coincidir con la cantidad aprobada y un lote válido de inventario.
4. Al completar el checklist deja el pedido listo para enviar. Bodega confirma el envío y Farmacia verifica la recepción.

El preparador solo tiene acceso al portal operativo. Administradores y usuarios de Bodega también pueden preparar desde `/bodega/preparacion`. Preparar no descuenta existencias: el descuento ocurre con el envío.

## Uso móvil

La lista y el checklist se muestran por separado en pantallas estrechas. Al abrir un pedido, el checklist ocupa el área disponible, con scroll interno y acciones al pie. El botón Pedidos regresa a la lista. Los controles del checklist tienen tamaño táctil y los campos usan una fuente de 16 px.

## Integración pendiente

La cuenta de muestra y su actualización pertenecen al modo JSON. En modo API el backend debe admitir el rol de preparador, autenticarlo y aplicar permisos del lado del servidor. También debe implementar guardado de avance y finalización del checklist con control de versión, validación de lotes, cantidades y reservas. Los permisos del frontend no sustituyen estas validaciones.
