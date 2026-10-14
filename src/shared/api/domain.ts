import { dispatchQuantity } from "./dispatchQuantity";
export type Destination = "HOSPITAL" | "CASA";
export const destinations = {
  HOSPITAL: "Administrar en el hospital",
  CASA: "Para llevar a casa",
};
export type RequestStatus =
  | "PENDIENTE"
  | "EN PREPARACION"
  | "LISTO PARA ENTREGA"
  | "ENVIADO"
  | "COMPLETADO"
  | "RECHAZADO"
  | "DESPACHADO"
  | "DEVUELTO";
export interface CatalogRecord {
  id: string;
  tipo: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
  categoria: string;
  accion: string;
  marca: string;
  unidad: string;
  minimo: number;
  correos: string[];
  telefonos: string[];
  contenidoMl?: number;
  indicaciones?: string;
  sintomas?: string;
  sintomaIds?: string[];
  presentacion?: string;
  uxe?: number;
  imagen?: string;
}
export interface Stock {
  virtual?: boolean;
  apiLoteId?: number;
  apiDisponible?: number;
  apiReservado?: number;
  apiSolicitudId?: string;
  apiDetalleId?: number;
  codigoLote?: string;
  id: string;
  productoId: string;
  lote: string;
  vencimiento: string | null;
  cantidad: number;
  ubicacion: "Bodega Central" | "Farmacia" | "En tránsito" | "En revisión";
}
export interface DispatchItem {
  stockId: string;
  cantidad: number;
  destino?: Destination;
  unidadSalida?: "BASE" | "ML";
}
export interface RequestItem {
  stockId: string;
  cantidad: number;
}
export interface PreparationLine extends RequestItem {
  apiAsignacionId?: number;
  apiDetalleId?: number;
  apiCantidadAsignada?: number;
  requestedStockId: string;
  lote: string;
  vencimiento: string;
  comentario: string;
  lista: boolean;
}
export interface Preparation {
  version: number;
  lines: PreparationLine[];
  usuario: string;
  fecha: string;
  lista: boolean;
}
export interface ReceiptCheck {
  stockId: string;
  cantidad: number;
  lote: string;
  vencimiento: string;
  conforme: boolean;
}
export interface SupplyRequest {
  estadoServidor?: string;
  referencia?: string;
  apiDetalles?: {
    id: number;
    productoId: string;
    solicitada: number;
    aprobada: number;
  }[];
  apiEnvios?: {
    id: number;
    estado: string;
    fecha: string;
    items: {
      stockId: string;
      idDetalle: number;
      loteId: number;
      cantidad: number;
    }[];
  }[];
  preparacion?: Preparation;
  approvedItems?: RequestItem[];
  id: string;
  fecha: string;
  solicitante: string;
  area: string;
  destino?: Destination;
  prioridad: string;
  estado: RequestStatus;
  nota: string;
  observacion: string;
  items: RequestItem[];
  entregado?: string;
  despachado?: string;
  recibido?: string;
  receptor?: string;
  comprobacion?: ReceiptCheck[];
  incidencia?: {
    id?: number;
    tipo?: string;
    fecha: string;
    receptor: string;
    nota: string;
    checks: ReceiptCheck[];
    revision?: string;
    resuelta: boolean;
  };
}
export interface Movement {
  cantidadEntregada?: number;
  unidadEntrega?: string;
  saldoAnterior?: number;
  saldoPosterior?: number;
  contenidoMlSalida?: number;
  responsableSalida?: string;
  observacionSalida?: string;
  id: string;
  fecha: string;
  productoId: string;
  lote: string;
  cantidad: number;
  tipo: "ENTRADA" | "TRASLADO" | "SALIDA";
  area: string;
  destino?: Destination;
  documento: string;
}
export interface Receipt {
  version?: number;
  referencia?: string;
  total?: number;
  tipoIngreso?: "COMPRA" | "DONACION";
  donante?: string;
  id: string;
  proveedorId: string;
  fecha: string;
  responsable: string;
  documento?: string;
  evidencia?: { nombre: string; contenido: string };
  estado?: "BORRADOR" | "COMPLETADO" | "CANCELADO";
  items: {
    productoId: string;
    codigoLote?: string;
    lote: string;
    vencimiento: string | null;
    cantidad: number;
  }[];
}
export interface Database {
  catalogos: CatalogRecord[];
  existencias: Stock[];
  solicitudes: SupplyRequest[];
  movimientos: Movement[];
  recepciones: Receipt[];
  notificaciones: Notification[];
  actividad?: Activity[];
}
export interface Activity {
  id: string;
  fecha: string;
  usuario: string;
  localidad: string;
  accion: string;
  documento: string;
  detalle: string;
}
export interface Notification {
  ownerId?: number;
  categoria?: string;
  procedencia?: string;
  id: string;
  fecha: string;
  rol: "farmacia" | "bodega";
  solicitudId: string;
  titulo: string;
  mensaje: string;
  leidaPor: string[];
}
export type Command = (
  | { type: "catalog.save"; record: CatalogRecord }
  | { type: "request.create"; request: SupplyRequest }
  | {
      type: "request.status";
      id: string;
      estado: RequestStatus;
      observacion: string;
    }
  | {
      type: "request.receive";
      id: string;
      checks: ReceiptCheck[];
      note: string;
      receiver: string;
      mode: "confirm" | "report" | "return";
    }
  | {
      type: "request.review";
      id: string;
      note: string;
      resolucion?: "COMENTARIO" | "RESPUESTA" | "REINTEGRAR_BODEGA" | "PERDIDA";
    }
  | {
      type: "request.prepare";
      id: string;
      version: number;
      lines: PreparationLine[];
      ready: boolean;
    }
  | { type: "notification.read"; id: string; user: string }
  | { type: "receipt.create"; receipt: Receipt }
  | { type: "receipt.draft"; receipt: Receipt }
  | { type: "receipt.cancel"; id: string }
  | {
      type: "pharmacy.dispatch";
      id: string;
      area: string;
      destino?: Destination;
      nota: string;
      items: DispatchItem[];
    }
) & { actor?: string; localidad?: string };
export const emptyDatabase: Database = {
  catalogos: [],
  existencias: [],
  solicitudes: [],
  movimientos: [],
  recepciones: [],
  notificaciones: [],
};
export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" });
export const newId = () => crypto.randomUUID();

export function availableStock(
  db: Database,
  stockId: string,
  excludeRequest = "",
) {
  const reserved = db.solicitudes
    .filter(
      (r) =>
        r.id !== excludeRequest &&
        ["EN PREPARACION", "LISTO PARA ENTREGA"].includes(r.estado),
    )
    .reduce(
      (total, r) =>
        total +
        r.items
          .filter((i) => i.stockId === stockId)
          .reduce((n, i) => n + i.cantidad, 0),
      0,
    );
  const stock = db.existencias.find((s) => s.id === stockId);
  if (stock?.apiDisponible !== undefined && !excludeRequest)
    return stock.vencimiento ? stock.apiDisponible : 0;
  if (
    stock?.apiSolicitudId === excludeRequest &&
    stock.apiDisponible !== undefined
  )
    return stock.apiDisponible;
  return stock?.vencimiento ? Math.max(0, stock.cantidad - reserved) : 0;
}

/** Pure transaction: validation completes before the caller persists the returned state. */
export function applyCommand(source: Database, command: Command): Database {
  const db = structuredClone(source);
  db.notificaciones ??= [];
  db.actividad ??= [];
  const assert = (condition: unknown, message: string) => {
    if (!condition) throw new Error(message);
  };
  const notify = (
    rol: Notification["rol"],
    request: SupplyRequest,
    titulo: string,
    mensaje: string,
  ) =>
    db.notificaciones.push({
      id: newId(),
      fecha: new Date().toISOString(),
      rol,
      solicitudId: request.id,
      titulo,
      mensaje,
      leidaPor: [],
    });
  if (command.type === "catalog.save") {
    const r = command.record;
    assert(r.nombre.trim(), "Escribe un nombre.");
    assert(
      !db.catalogos.some(
        (c) =>
          c.id !== r.id &&
          c.tipo === r.tipo &&
          (c.nombre.toLowerCase() === r.nombre.toLowerCase() ||
            (r.codigo && c.codigo === r.codigo)),
      ),
      "Ya existe un registro con ese nombre o código.",
    );
    assert(
      r.correos.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      "Revisa los correos electrónicos.",
    );
    assert(
      r.telefonos.every((phone) => /^[+\d\s().-]{7,25}$/.test(phone)),
      "Revisa los números telefónicos.",
    );
    assert(
      Number.isFinite(r.minimo) && r.minimo >= 0,
      "El mínimo debe ser un número positivo o cero.",
    );
    if (r.tipo === "medicamentos") {
      const previous = db.catalogos.find((c) => c.id === r.id);
      assert(
        !r.contenidoMl || /^(frasco|ampolla)s?$/i.test(r.unidad.trim()),
        "Usa unidad Frasco o Ampolla para registrar contenido en ml.",
      );
      assert(
        r.contenidoMl === undefined ||
          (Number.isFinite(r.contenidoMl) && r.contenidoMl > 0),
        "El contenido del frasco debe ser mayor que cero.",
      );
      assert(
        !previous?.contenidoMl ||
          previous.contenidoMl === r.contenidoMl ||
          !db.existencias.some((s) => s.productoId === r.id && s.cantidad > 0),
        "No cambies el contenido por frasco mientras exista stock.",
      );
      assert(
        r.codigo.trim() && r.unidad.trim(),
        "Código de barras y unidad son obligatorios.",
      );
      assert(
        r.uxe === undefined || (Number.isInteger(r.uxe) && r.uxe > 0),
        "La cantidad por empaque debe ser un entero positivo.",
      );
      assert(
        !r.imagen ||
          (/^data:image\/(png|jpeg|webp);base64,/.test(r.imagen) &&
            r.imagen.length <= 2100000),
        "Imagen inválida o demasiado grande.",
      );
    }
    db.catalogos = [...db.catalogos.filter((c) => c.id !== r.id), r];
  }
  if (command.type === "request.create") {
    const r = command.request;
    assert(
      !db.solicitudes.some((s) => s.id === r.id),
      "Esta solicitud ya fue registrada.",
    );
    assert(r.solicitante.trim(), "Indica el solicitante.");
    assert(
      r.items.length &&
        new Set(r.items.map((i) => i.stockId)).size === r.items.length,
      "Añade productos sin repetir lotes.",
    );
    for (const item of r.items) {
      const stock = db.existencias.find(
        (s) => s.id === item.stockId && s.ubicacion === "Bodega Central",
      );
      assert(
        stock && stock.vencimiento && stock.vencimiento > today(),
        "El lote no está disponible o está vencido.",
      );
      assert(
        db.catalogos.some((p) => p.id === stock?.productoId && p.activo),
        "El producto está inactivo.",
      );
      assert(
        Number.isInteger(item.cantidad) &&
          item.cantidad > 0 &&
          item.cantidad <= availableStock(db, item.stockId),
        "Cantidad inválida o superior al stock disponible sin reservas.",
      );
    }
    db.solicitudes.push({
      ...r,
      preparacion: undefined,
      approvedItems: undefined,
      area: "Farmacia",
      destino: undefined,
      estado: "PENDIENTE",
      fecha: new Date().toISOString(),
    });
    notify(
      "bodega",
      r,
      "Nueva solicitud de Farmacia",
      `${r.area} solicita ${r.items.length} producto(s).`,
    );
  }
  if (command.type === "request.status") {
    const r = db.solicitudes.find((s) => s.id === command.id);
    assert(r, "Solicitud no encontrada.");
    const request = r!;
    const next: Partial<Record<RequestStatus, RequestStatus[]>> = {
      PENDIENTE: ["EN PREPARACION", "RECHAZADO"],
      "EN PREPARACION": ["LISTO PARA ENTREGA", "RECHAZADO"],
      "LISTO PARA ENTREGA": ["ENVIADO", "RECHAZADO"],
    };
    assert(
      next[request.estado]?.includes(command.estado),
      "La solicitud cambió de estado. Actualiza los datos.",
    );
    assert(
      command.estado !== "LISTO PARA ENTREGA",
      "Completa el checklist en Preparación de pedidos para marcar listo.",
    );
    if (command.estado === "RECHAZADO")
      assert(command.observacion.trim(), "Indica el motivo del rechazo.");
    if (
      ["EN PREPARACION", "LISTO PARA ENTREGA", "ENVIADO"].includes(
        command.estado,
      )
    ) {
      for (const item of request.items) {
        const stock = db.existencias.find(
          (s) => s.id === item.stockId && s.ubicacion === "Bodega Central",
        );
        assert(
          stock && stock.vencimiento && stock.vencimiento > today(),
          "El lote no está disponible o está vencido. No se aprobó la solicitud.",
        );
        assert(
          db.catalogos.some((p) => p.id === stock?.productoId && p.activo),
          "Hay un producto inactivo en la solicitud.",
        );
        assert(
          availableStock(db, item.stockId, request.id) >= item.cantidad,
          `Stock insuficiente en ${stock!.lote}. Disponible sin otras reservas: ${availableStock(db, item.stockId, request.id)}.`,
        );
      }
    }
    if (command.estado === "ENVIADO")
      assert(
        request.preparacion?.lista,
        "Completa el checklist en Preparación de pedidos antes de enviar.",
      );
    if (command.estado === "ENVIADO" || command.estado === "DESPACHADO") {
      for (const item of request.items) {
        const stock = db.existencias.find((s) => s.id === item.stockId);
        assert(
          stock && stock.vencimiento && stock.vencimiento > today(),
          "No se puede entregar un lote vencido.",
        );
        if (command.estado === "ENVIADO") {
          assert(
            stock!.cantidad >= item.cantidad,
            "Stock insuficiente. No se registró la entrega.",
          );
          stock!.cantidad -= item.cantidad;
          db.existencias.push({
            ...stock!,
            id: `transito-${request.id}-${stock!.id}`,
            ubicacion: "En tránsito",
            cantidad: item.cantidad,
          });
        } else {
          const pharmacy = db.existencias.find(
            (s) => s.id === `farmacia-${stock!.id}`,
          );
          assert(
            pharmacy && pharmacy.cantidad >= item.cantidad,
            "Stock insuficiente en Farmacia.",
          );
          pharmacy!.cantidad -= item.cantidad;
        }
        db.movimientos.push({
          id: newId(),
          fecha: new Date().toISOString(),
          productoId: stock!.productoId,
          lote: stock!.lote,
          cantidad: item.cantidad,
          tipo: command.estado === "ENVIADO" ? "TRASLADO" : "SALIDA",
          area: request.area,
          destino: request.destino,
          documento: request.id,
        });
      }
      if (command.estado === "ENVIADO")
        request.entregado = new Date().toISOString();
      else request.despachado = new Date().toISOString();
    }
    request.estado = command.estado;
    request.observacion = command.observacion;
    if (command.estado === "EN PREPARACION")
      notify(
        "farmacia",
        request,
        "Solicitud aprobada",
        `Bodega verificó y reservó las existencias de tu solicitud de ${request.area}.`,
      );
    if (command.estado === "LISTO PARA ENTREGA")
      notify(
        "farmacia",
        request,
        "Solicitud lista para entrega",
        "Bodega terminó de preparar los productos.",
      );
    if (command.estado === "ENVIADO")
      notify(
        "farmacia",
        request,
        "Envío pendiente de verificar",
        "Revisa producto, lote, vencimiento y cantidad recibida antes de confirmar el ingreso.",
      );
    if (command.estado === "RECHAZADO")
      notify("farmacia", request, "Solicitud rechazada", command.observacion);
  }
  if (command.type === "request.prepare") {
    const request = db.solicitudes.find((r) => r.id === command.id);
    assert(
      request &&
        (request.estado === "EN PREPARACION" ||
          (request.estado === "LISTO PARA ENTREGA" &&
            !request.preparacion?.lista)),
      "Solo se preparan solicitudes aprobadas pendientes de checklist.",
    );
    assert(
      command.version === (request!.preparacion?.version || 0),
      "Otra persona actualizó esta preparación. Vuelve a abrir el pedido para cargar los cambios.",
    );
    const approved = request!.approvedItems || request!.items;
    assert(
      command.lines.length === approved.length &&
        new Set(command.lines.map((l) => l.requestedStockId)).size ===
          approved.length,
      "Revisa todas las líneas aprobadas sin repetirlas.",
    );
    for (const line of command.lines) {
      const expected = approved.find(
        (i) => i.stockId === line.requestedStockId,
      );
      const original = db.existencias.find((s) => s.id === expected?.stockId);
      const stock = db.existencias.find(
        (s) => s.id === line.stockId && s.ubicacion === "Bodega Central",
      );
      assert(
        expected &&
          stock &&
          original &&
          stock.productoId === original.productoId,
        "El lote seleccionado debe corresponder al medicamento aprobado en Bodega.",
      );
      assert(
        Number.isInteger(line.cantidad) &&
          line.cantidad >= 0 &&
          line.cantidad <= expected!.cantidad,
        "La cantidad preparada debe estar entre cero y la cantidad aprobada.",
      );
      assert(
        typeof line.comentario === "string" &&
          line.comentario.length <= 1000 &&
          typeof line.lista === "boolean",
        "Revisa el comentario y el checklist.",
      );
      if (line.lista || command.ready) {
        assert(
          line.cantidad === expected!.cantidad && line.cantidad > 0,
          "Completa la cantidad aprobada antes de marcar el medicamento preparado.",
        );
        assert(
          stock!.vencimiento && stock!.vencimiento > today(),
          "El lote seleccionado está vencido.",
        );
        assert(
          line.lote.trim() === stock!.lote &&
            line.vencimiento === stock!.vencimiento,
          "El lote o vencimiento capturado no coincide con el inventario.",
        );
        assert(
          db.catalogos.some((p) => p.id === stock!.productoId && p.activo),
          "El medicamento está inactivo.",
        );
        assert(
          availableStock(db, stock!.id, request!.id) >= line.cantidad,
          "Stock insuficiente para preparar este lote; revisa las reservas.",
        );
      }
    }
    if (command.ready) {
      assert(
        command.lines.every((l) => l.lista),
        "Marca todos los medicamentos del checklist antes de dejar listo el pedido.",
      );
      const totals = new Map<string, number>();
      command.lines.forEach((l) =>
        totals.set(l.stockId, (totals.get(l.stockId) || 0) + l.cantidad),
      );
      for (const [id, quantity] of totals)
        assert(
          availableStock(db, id, request!.id) >= quantity,
          "Stock insuficiente al sumar las líneas del mismo lote.",
        );
      request!.approvedItems ??= structuredClone(approved);
      request!.items = [...totals].map(([stockId, cantidad]) => ({
        stockId,
        cantidad,
      }));
      request!.estado = "LISTO PARA ENTREGA";
    } else request!.estado = "EN PREPARACION";
    request!.preparacion = {
      version: command.version + 1,
      lines: structuredClone(command.lines),
      usuario: command.actor || "Bodega",
      fecha: new Date().toISOString(),
      lista: command.ready,
    };
  }
  if (command.type === "request.receive") {
    const request = db.solicitudes.find((r) => r.id === command.id);
    assert(
      request?.estado === "ENVIADO",
      "Solo se puede verificar un envío pendiente de recepción.",
    );
    assert(command.receiver.trim(), "Indica quién recibe.");
    assert(
      command.checks.length === request!.items.length &&
        new Set(command.checks.map((c) => c.stockId)).size ===
          request!.items.length,
      "Revisa todas las líneas del envío una sola vez.",
    );
    for (const check of command.checks) {
      const expected = request!.items.find((i) => i.stockId === check.stockId);
      assert(
        expected && Number.isInteger(check.cantidad) && check.cantidad >= 0,
        "Revisa las cantidades recibidas.",
      );
      const transit = db.existencias.find(
        (s) => s.id === `transito-${request!.id}-${check.stockId}`,
      );
      assert(transit, "No se encontró el lote en tránsito.");
      if (command.mode === "confirm") {
        assert(
          check.conforme &&
            check.cantidad === expected!.cantidad &&
            check.lote === transit!.lote &&
            check.vencimiento === transit!.vencimiento,
          "Hay diferencias. Repórtalas a Bodega antes de confirmar la recepción.",
        );
        assert(
          transit!.vencimiento &&
            transit!.vencimiento > today() &&
            transit!.cantidad >= check.cantidad,
          "El lote está vencido o no tiene la cantidad enviada.",
        );
        let pharmacy = db.existencias.find(
          (s) => s.id === `farmacia-${check.stockId}`,
        );
        if (!pharmacy) {
          pharmacy = {
            ...transit!,
            id: `farmacia-${check.stockId}`,
            ubicacion: "Farmacia",
            cantidad: 0,
          };
          db.existencias.push(pharmacy);
        }
        pharmacy.cantidad += check.cantidad;
        transit!.cantidad -= check.cantidad;
      }
    }
    if (command.mode === "return") {
      assert(command.note.trim(), "Indica el motivo de devolución.");
      for (const item of request!.items) {
        const transit = db.existencias.find(
          (s) => s.id === `transito-${request!.id}-${item.stockId}`,
        )!;
        assert(
          transit.cantidad === item.cantidad,
          "No se puede devolver un envío parcialmente recibido.",
        );
        transit.ubicacion = "En revisión";
      }
      request!.estado = "DEVUELTO";
      request!.incidencia = {
        fecha: new Date().toISOString(),
        receptor: command.receiver,
        nota: command.note,
        checks: command.checks,
        resuelta: false,
      };
      notify("bodega", request!, "Envío devuelto por Farmacia", command.note);
    } else if (command.mode === "report") {
      assert(
        command.note.trim(),
        "Describe la diferencia encontrada para informar a Bodega.",
      );
      request!.incidencia = {
        fecha: new Date().toISOString(),
        receptor: command.receiver,
        nota: command.note,
        checks: command.checks,
        resuelta: false,
      };
      notify(
        "bodega",
        request!,
        "Diferencia reportada por Farmacia",
        command.note,
      );
    } else {
      request!.estado = "COMPLETADO";
      request!.recibido = new Date().toISOString();
      request!.receptor = command.receiver;
      request!.comprobacion = command.checks;
      if (request!.incidencia) request!.incidencia.resuelta = true;
      notify(
        "bodega",
        request!,
        "Recepción verificada por Farmacia",
        `${command.receiver} verificó todas las cantidades y lotes recibidos.`,
      );
    }
  }
  if (command.type === "request.review") {
    const request = db.solicitudes.find((r) => r.id === command.id);
    assert(
      request &&
        ["ENVIADO", "DEVUELTO"].includes(request.estado) &&
        request.incidencia &&
        !request.incidencia.resuelta,
      "No hay una diferencia pendiente de revisión.",
    );
    assert(command.note.trim(), "Escribe la respuesta de Bodega.");
    request!.incidencia!.revision = command.note;
    notify(
      "farmacia",
      request!,
      "Bodega respondió a la diferencia",
      command.note,
    );
  }
  if (command.type === "notification.read") {
    const notification = db.notificaciones.find((n) => n.id === command.id);
    assert(notification, "Notificación no encontrada.");
    if (!notification!.leidaPor.includes(command.user))
      notification!.leidaPor.push(command.user);
  }
  if (command.type === "receipt.create" || command.type === "receipt.draft") {
    assert(
      command.receipt.total === undefined ||
        (Number.isFinite(command.receipt.total) && command.receipt.total >= 0),
      "El total del pedido debe ser un importe válido mayor o igual a cero.",
    );
  }
  if (command.type === "receipt.create") {
    const receipt = command.receipt;
    assert(
      receipt.total === undefined ||
        (Number.isFinite(receipt.total) && receipt.total >= 0),
      "El total del pedido debe ser un importe válido mayor o igual a cero.",
    );
    assert(
      !db.recepciones.some(
        (r) => r.id === receipt.id && r.estado !== "BORRADOR",
      ),
      "La recepción ya existe.",
    );
    assert(
      !receipt.documento ||
        !db.recepciones.some(
          (r) =>
            r.id !== receipt.id &&
            (r.tipoIngreso || "COMPRA") === (receipt.tipoIngreso || "COMPRA") &&
            (receipt.tipoIngreso === "DONACION"
              ? r.donante?.trim().toLowerCase() ===
                receipt.donante?.trim().toLowerCase()
              : r.proveedorId === receipt.proveedorId) &&
            r.documento === receipt.documento &&
            r.estado !== "CANCELADO",
        ),
      "Esta factura ya está registrada para el proveedor.",
    );
    assert(
      !receipt.tipoIngreso ||
        ["COMPRA", "DONACION"].includes(receipt.tipoIngreso),
      "Tipo de ingreso inválido.",
    );
    if (receipt.tipoIngreso === "DONACION")
      assert(receipt.donante?.trim(), "Indica el donante de la donación.");
    else
      assert(
        db.catalogos.some(
          (c) =>
            c.id === receipt.proveedorId &&
            c.tipo === "proveedores" &&
            c.activo,
        ),
        "Selecciona un proveedor activo.",
      );
    assert(
      receipt.fecha && receipt.fecha <= today() && receipt.items.length,
      "Revisa fecha y productos de la recepción.",
    );
    for (const item of receipt.items) {
      assert(
        db.catalogos.some(
          (c) =>
            c.id === item.productoId && c.tipo === "medicamentos" && c.activo,
        ),
        "Producto no disponible en catálogo.",
      );
      assert(
        item.lote.trim() &&
          ((receipt.tipoIngreso === "DONACION" && item.vencimiento === null) ||
            (!!item.vencimiento &&
              /^\d{4}-\d{2}-\d{2}$/.test(item.vencimiento) &&
              Number.isFinite(Date.parse(item.vencimiento)) &&
              item.vencimiento > today())) &&
          Number.isInteger(item.cantidad) &&
          item.cantidad > 0,
        "Revisa lote, vencimiento y cantidad de cada producto.",
      );
      const codigoLote = item.codigoLote?.trim();
      assert(
        !codigoLote ||
          !db.existencias.some(
            (s) =>
              s.codigoLote === codigoLote &&
              (s.productoId !== item.productoId || s.lote !== item.lote),
          ),
        "El código ya está asociado a otro lote.",
      );
      let stock = db.existencias.find(
        (s) =>
          s.productoId === item.productoId &&
          s.lote === item.lote &&
          s.ubicacion === "Bodega Central",
      );
      if (stock) {
        assert(
          !codigoLote || !stock.codigoLote || stock.codigoLote === codigoLote,
          "El lote ya tiene otro código asociado.",
        );
        stock.codigoLote ||= codigoLote;
        assert(
          stock.vencimiento === item.vencimiento,
          "El lote ya tiene otra fecha de vencimiento.",
        );
        stock.cantidad += item.cantidad;
      } else {
        stock = {
          ...item,
          codigoLote,
          id: newId(),
          ubicacion: "Bodega Central",
        };
        db.existencias.push(stock);
      }
      db.movimientos.push({
        id: newId(),
        fecha: `${receipt.fecha}T12:00:00-06:00`,
        productoId: item.productoId,
        lote: item.lote,
        cantidad: item.cantidad,
        tipo: "ENTRADA",
        area: "Bodega Central",
        documento: receipt.id,
      });
    }
    db.recepciones = [
      ...db.recepciones.filter((r) => r.id !== receipt.id),
      { ...receipt, estado: "COMPLETADO" },
    ];
  }
  if (command.type === "receipt.draft") {
    assert(
      !db.recepciones.some(
        (r) => r.id === command.receipt.id && r.estado !== "BORRADOR",
      ),
      "Solo se pueden editar borradores.",
    );
    db.recepciones = [
      ...db.recepciones.filter((r) => r.id !== command.receipt.id),
      { ...command.receipt, estado: "BORRADOR" },
    ];
  }
  if (command.type === "receipt.cancel") {
    const receipt = db.recepciones.find((r) => r.id === command.id);
    assert(
      receipt?.estado === "BORRADOR",
      "Solo se puede cancelar un borrador.",
    );
    receipt!.estado = "CANCELADO";
  }
  if (command.type === "pharmacy.dispatch") {
    assert(command.area.trim(), "Indica localidad y modalidad de entrega.");
    assert(
      db.catalogos.some(
        (c) =>
          c.tipo === "ubicaciones" &&
          c.activo &&
          c.nombre === command.area.trim(),
      ),
      "Selecciona una ubicación activa del catálogo de Farmacia.",
    );
    assert(
      !db.movimientos.some((m) => m.documento === command.id),
      "Esta salida ya fue registrada.",
    );
    assert(
      command.items.length &&
        new Set(command.items.map((i) => i.stockId)).size ===
          command.items.length,
      "Agrega productos sin repetir lotes.",
    );
    for (const item of command.items) {
      const stock = db.existencias.find(
        (s) => s.id === item.stockId && s.ubicacion === "Farmacia",
      );
      assert(
        stock &&
          stock.vencimiento &&
          stock.vencimiento > today() &&
          db.catalogos.some((p) => p.id === stock.productoId && p.activo),
        "Producto inactivo, vencido o no disponible en Farmacia.",
      );
      const product = db.catalogos.find((p) => p.id === stock!.productoId)!;
      assert(
        !item.unidadSalida || ["BASE", "ML"].includes(item.unidadSalida),
        "Unidad de salida inválida.",
      );
      assert(
        item.unidadSalida !== "ML" ||
          (product.contenidoMl && product.contenidoMl > 0),
        "Registra el contenido en ml del frasco antes de convertir.",
      );
      const calculation = dispatchQuantity(
        stock!.cantidad,
        item.cantidad,
        item.unidadSalida === "ML",
        product.contenidoMl,
      );
      const quantity = calculation.baseQuantity;
      assert(
        Object.hasOwn(destinations, item.destino || command.destino || ""),
        "Indica la modalidad de cada medicamento.",
      );
      assert(!calculation.error, calculation.error);
      stock!.cantidad = calculation.remainingBase;
      db.movimientos.push({
        id: newId(),
        fecha: new Date().toISOString(),
        productoId: stock!.productoId,
        lote: stock!.lote,
        cantidad: quantity,
        cantidadEntregada: item.cantidad,
        unidadEntrega: item.unidadSalida === "ML" ? "ml (cc)" : product.unidad,
        saldoAnterior: calculation.available,
        saldoPosterior: Math.max(0, calculation.remaining),
        contenidoMlSalida: product.contenidoMl,
        responsableSalida: command.actor || "Sistema",
        observacionSalida: command.nota.trim(),
        tipo: "SALIDA",
        area: command.area.trim(),
        destino: item.destino || command.destino,
        documento: command.id,
      });
    }
  }
  if (command.type !== "notification.read") {
    const documento =
      "id" in command
        ? command.id
        : "receipt" in command
          ? command.receipt.id
          : "record" in command
            ? command.record.id
            : command.request.id;
    const localidad = command.type.startsWith("receipt.")
      ? "Bodega Central"
      : command.type === "pharmacy.dispatch" ||
          command.type === "request.receive" ||
          command.type === "request.create"
        ? "Farmacia"
        : command.type.startsWith("request.")
          ? "Bodega Central"
          : command.localidad || "General";
    const detalle =
      command.type === "request.prepare"
        ? `${command.ready ? "Preparación lista" : "Avance de preparación"} · ${command.lines.filter((l) => l.lista).length}/${command.lines.length} medicamentos`
        : command.type === "catalog.save"
          ? command.record.nombre
          : command.type === "request.status"
            ? `${command.estado} · ${command.observacion}`
            : command.type === "request.receive"
              ? `${command.mode === "confirm" ? "Recepción conforme" : command.mode === "return" ? "Devolución" : "Recepción pendiente"} · ${command.note}`
              : command.type === "pharmacy.dispatch"
                ? `${command.area} · Modalidad por medicamento · ${command.nota}`
                : command.type === "request.review"
                  ? command.note
                  : "receipt" in command
                    ? `${command.receipt.documento || documento} · ${command.receipt.items.length} líneas`
                    : command.type === "request.create"
                      ? command.request.nota
                      : "Borrador cancelado";
    db.actividad.push({
      id: newId(),
      fecha: new Date().toISOString(),
      usuario:
        command.actor || ("receiver" in command ? command.receiver : "Sistema"),
      localidad,
      accion: command.type,
      documento,
      detalle,
    });
  }
  return db;
}
