import type { Command, Database } from "./domain";
import { destinations } from "./domain";
import type { Confirmation } from "../context/confirmation";

export function commandConfirmation(
  command: Command,
  db: Database,
): Confirmation {
  if (command.type === "request.prepare")
    return {
      title: command.ready
        ? "¿Dejar el pedido listo para enviar?"
        : "¿Guardar avance de preparación?",
      description: command.ready
        ? "Se verificarán todos los lotes y cantidades. Bodega podrá confirmar el envío desde Solicitudes. El inventario todavía no se descontará."
        : "El checklist quedará guardado para continuarlo desde Bodega o la vista operativa.",
      details: [
        command.id,
        ...command.lines.map(
          (l) =>
            `${l.lote || "Lote por verificar"} · ${l.cantidad} · ${l.lista ? "Preparado" : "Pendiente"}`,
        ),
      ],
      confirmLabel: command.ready ? "Marcar listo" : "Guardar avance",
    };
  if (command.type === "pharmacy.dispatch")
    return {
      title: "¿Registrar salida de Farmacia?",
      description:
        "Se descontarán estos productos del inventario disponible. La localidad no necesita confirmar la recepción.",
      details: [
        command.area,
        ...command.items.map((i) => {
          const stock = db.existencias.find((s) => s.id === i.stockId);
          const product = db.catalogos.find((p) => p.id === stock?.productoId);
          const unit = i.unidadSalida === "ML" ? "ml (cc)" : product?.unidad;
          const available =
            (stock?.cantidad || 0) *
            (i.unidadSalida === "ML" ? product?.contenidoMl || 0 : 1);
          return `${product?.nombre} · Lote ${stock?.lote} · Enviar: ${i.cantidad} ${unit} · Saldo: ${Number((available - i.cantidad).toFixed(3))} ${unit} · ${destinations[i.destino || command.destino || "HOSPITAL"]}`;
        }),
        command.nota,
      ],
      confirmLabel: "Registrar salida",
    };
  if (
    command.type === "receipt.create" &&
    command.receipt.tipoIngreso === "DONACION"
  )
    return {
      title: "¿Confirmar ingreso por donación?",
      description:
        "Se registrará el ingreso físico en Bodega. Los lotes sin vencimiento conocido no estarán disponibles para despacho.",
      details: [
        command.receipt.donante || "",
        command.receipt.documento || "",
        ...command.receipt.items.map(
          (i) =>
            i.lote +
            " · " +
            i.cantidad +
            " unidades · " +
            (i.vencimiento || "Vencimiento desconocido"),
        ),
      ],
      confirmLabel: "Confirmar donación",
    };
  if (command.type === "receipt.draft")
    return {
      title: "¿Guardar borrador?",
      description:
        "Podrás continuar desde el historial. No se modificará el inventario.",
      details: [command.receipt.documento || "Sin documento todavía"],
      confirmLabel: "Guardar borrador",
    };
  if (command.type === "receipt.cancel")
    return {
      title: "¿Cancelar borrador?",
      description:
        "Se conservará en el historial como cancelado, sin modificar existencias.",
      confirmLabel: "Cancelar borrador",
      danger: true,
    };
  if (command.type === "request.receive" && command.mode === "return")
    return {
      title: "¿Devolver el envío completo?",
      description:
        "Se notificará a Bodega. Los productos permanecerán separados hasta que Bodega revise la devolución.",
      details: [command.id, command.note],
      confirmLabel: "Registrar devolución",
      danger: true,
    };
  if (command.type === "notification.read")
    return { title: "Notificación", description: "Marcar como leída." };
  if (command.type === "request.receive")
    return {
      title:
        command.mode === "report"
          ? "¿Reportar diferencias a Bodega?"
          : "¿Confirmar los productos recibidos?",
      description:
        command.mode === "report"
          ? "Se notificará a Bodega. Los productos seguirán pendientes de recepción y no podrán despacharse."
          : "Confirmas que cantidades, lotes, vencimientos y productos coinciden físicamente con el envío. Ingresarán al inventario de Farmacia.",
      details: [
        command.id,
        `Recibe: ${command.receiver}`,
        ...command.checks.map(
          (c) =>
            `Lote recibido: ${c.lote || "Sin registrar"} · Cantidad: ${c.cantidad}`,
        ),
        ...(command.note ? [command.note] : []),
      ],
      confirmLabel:
        command.mode === "report" ? "Enviar reporte" : "Confirmar recepción",
    };
  if (command.type === "request.review")
    return {
      title: "¿Registrar revisión?",
      description:
        command.resolucion === "REINTEGRAR_BODEGA"
          ? "Confirmas la recuperación física de todo el saldo pendiente en Bodega. Se abrirá un nuevo ciclo para preparar y enviar."
          : command.resolucion === "PERDIDA"
            ? "El saldo pendiente se registrará como pérdida. Comprueba la revisión física antes de confirmar."
            : "Se registrará el seguimiento para Farmacia. Un comentario no cierra una diferencia física.",
      details: [command.id, command.note],
      confirmLabel: "Registrar revisión",
    };
  if (command.type === "catalog.save")
    return {
      title: "¿Guardar este registro?",
      description: db.catalogos.some((r) => r.id === command.record.id)
        ? "Se actualizará la información del registro."
        : "Se agregará el registro al catálogo.",
      details: [
        command.record.nombre,
        command.record.activo ? "Estado: activo" : "Estado: inactivo",
        ...(command.record.tipo === "proveedores"
          ? [
              `Correos: ${command.record.correos.join(", ") || "Sin registrar"}`,
              `Teléfonos: ${command.record.telefonos.join(", ") || "Sin registrar"}`,
            ]
          : []),
      ],
      confirmLabel: "Guardar registro",
    };
  if (command.type === "receipt.create")
    return {
      title: "¿Confirmar la recepción?",
      description:
        "Los productos ingresarán al inventario de Bodega y se registrarán sus movimientos.",
      details: [
        db.catalogos.find((p) => p.id === command.receipt.proveedorId)
          ?.nombre || "Proveedor sin seleccionar",
        `Fecha: ${command.receipt.fecha}`,
        ...command.receipt.items.map(
          (i) =>
            `${db.catalogos.find((p) => p.id === i.productoId)?.nombre} · ${i.lote} · Cantidad: ${i.cantidad}`,
        ),
      ],
      confirmLabel: "Confirmar recepción",
    };
  if (command.type === "request.create")
    return {
      title: "¿Enviar la solicitud a Bodega?",
      description: "Estos productos abastecerán el inventario de Farmacia.",
      details: [
        command.request.nota,
        ...command.request.items.map((i) => {
          const stock = db.existencias.find((s) => s.id === i.stockId);
          return `${db.catalogos.find((p) => p.id === stock?.productoId)?.nombre} · Cantidad: ${i.cantidad}`;
        }),
      ],
      confirmLabel: "Enviar solicitud",
    };
  const request = db.solicitudes.find((r) => r.id === command.id);
  const details = [command.id, "Abastecimiento de Farmacia"];
  if (command.estado === "RECHAZADO")
    return {
      title: "¿Rechazar esta solicitud?",
      description:
        "La solicitud quedará rechazada y no se descontarán existencias.",
      details: [...details, `Motivo: ${command.observacion}`],
      confirmLabel: "Rechazar solicitud",
      danger: true,
    };
  if (command.estado === "ENVIADO")
    return {
      title: "¿Confirmar envío a Farmacia?",
      description:
        "Se descontarán las cantidades de Bodega y quedarán en tránsito hasta que Farmacia verifique la recepción.",
      details,
      confirmLabel: "Confirmar envío",
    };
  if (command.estado === "DESPACHADO")
    return {
      title:
        request?.destino === "HOSPITAL"
          ? "¿Confirmar administración en hospital?"
          : "¿Confirmar entrega para casa?",
      description:
        "Confirma que el medicamento llegó al destino indicado. Se descontará del inventario de Farmacia y se registrará la salida final.",
      details,
      confirmLabel: "Confirmar despacho",
    };
  return {
    title:
      command.estado === "EN PREPARACION"
        ? "¿Aprobar esta solicitud?"
        : "¿Actualizar esta solicitud?",
    description:
      command.estado === "EN PREPARACION"
        ? "Se verificarán y reservarán las existencias de todos los productos. Farmacia recibirá una notificación de aprobación."
        : `La solicitud pasará al estado: ${command.estado}.`,
    details,
    confirmLabel:
      command.estado === "EN PREPARACION"
        ? "Aprobar y reservar"
        : "Actualizar estado",
  };
}
export function commandSuccess(command: Command): string {
  if (command.type === "request.prepare")
    return command.ready
      ? "Pedido listo. Bodega puede confirmar su envío."
      : "Avance de preparación guardado.";
  if (command.type === "pharmacy.dispatch")
    return "Salida registrada. Inventario de Farmacia actualizado.";
  if (command.type === "receipt.draft")
    return "Borrador guardado. Puedes retomarlo desde el historial.";
  if (command.type === "receipt.cancel") return "Borrador cancelado.";
  if (command.type === "request.receive" && command.mode === "return")
    return "Devolución registrada. Bodega fue notificada.";
  if (command.type === "notification.read") return "Notificación leída.";
  if (command.type === "request.receive")
    return command.mode === "confirm"
      ? "Recepción verificada. Inventario de Farmacia actualizado."
      : "Diferencias reportadas a Bodega. Recepción pendiente.";
  if (command.type === "request.review") return "Respuesta enviada a Farmacia.";
  if (command.type === "catalog.save")
    return "Registro guardado correctamente.";
  if (command.type === "receipt.create")
    return "Recepción registrada. Inventario de Bodega actualizado.";
  if (command.type === "request.create") return "Solicitud enviada a Bodega.";
  if (command.estado === "DESPACHADO")
    return "Despacho registrado con su destino. Inventario actualizado.";
  if (command.estado === "ENVIADO")
    return "Envío registrado. Farmacia debe verificar la recepción.";
  if (command.estado === "EN PREPARACION")
    return "Solicitud aprobada. Existencias reservadas y Farmacia notificada.";
  if (command.estado === "RECHAZADO")
    return "Solicitud rechazada con el motivo registrado.";
  return "Estado de solicitud actualizado.";
}
