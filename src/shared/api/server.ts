import { saveReceipt } from './receiptSave';
import { readNotificationsSequentially } from './notifications';
import { apiClient, apiData } from "./client";
import { getTokens, mapProfile } from "./session";
import {
  catalogRoutes,
  dateOnly,
  decimal,
  mapCatalog,
  mapReceipt,
  mapRequest,
  mapStock,
  numeric,
  type ApiRow,
} from "./apiMapping";
import { emptyDatabase, type Command, type Database } from "./domain";
import type { User } from "../types/auth";
const numberId = (id: string) => {
  const value = Number(id.split(":").at(-1));
  if (!Number.isSafeInteger(value) || value < 1)
    throw new Error("El registro todavía no existe en la API.");
  return value;
};
export async function allPages(
  path: string,
  params: Record<string, unknown> = {},
): Promise<ApiRow[]> {
  const rows: ApiRow[] = [];
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<{
      data: ApiRow[];
      total: number;
      page: number;
      limit: number;
    }>(path, { params: { ...params, page, limit: 100 } });
    if (!Array.isArray(data.data))
      throw new Error(`Respuesta inválida en ${path}.`);
    rows.push(...data.data);
    if (
      data.total == null ||
      rows.length >= data.total ||
      data.data.length === 0
    )
      break;
    if (page >= 10000)
      throw new Error("Demasiados registros; acota el histórico.");
  }
  return rows;
}
export async function currentApiUser(): Promise<User> {
  return mapProfile(await apiData("/auth/me"));
}
export async function loadServerNotifications(user: User): Promise<Database['notificaciones']> {
  const rows = await allPages('/notificaciones', user.role === 'administrador' ? { alcance: 'todas' } : {});
  return rows.map(n => ({ id: String(n.id_notificacion), ownerId: n.id_usuario, categoria: n.categoria,
    procedencia: n.procedencia, fecha: n.fecha_creacion, rol: n.bandeja === 'FARMACIA' ? 'farmacia' : 'bodega',
    solicitudId: /solicitud/i.test(n.referencia_tipo || '') ? String(n.referencia_id) : '', titulo: n.titulo, mensaje: n.mensaje,
    leidaPor: n.leida ? [`${user.role}:${user.username}`] : [] }));
}
export async function loadServerDatabase(): Promise<Database> {
  if (!getTokens()) return structuredClone(emptyDatabase);
  const user = await currentApiUser();
  const db: Database = structuredClone(emptyDatabase);
  db.actividad = [];
  if (user.role !== "preparador") {
    const types = Object.keys(catalogRoutes);
    const catalogs = await Promise.all(
      types.map(async (type) => ({
        type,
        rows: await allPages("/" + catalogRoutes[type][0]),
      })),
    );
    for (const { type, rows } of catalogs.filter(
      (c) => c.type !== "medicamentos",
    ))
      db.catalogos.push(...rows.map((r) => mapCatalog(type, r)));
    db.catalogos.push(
      ...(catalogs.find((c) => c.type === "medicamentos")?.rows || []).map(
        (r) => mapCatalog("medicamentos", r, db.catalogos),
      ),
    );
    if (user.role === "consulta") {
      db.existencias = (await allPages("/inventario")).map(mapStock);
      return db;
    }
    const [inventory, notifications, activities, movements, receipts] =
      await Promise.all([
        allPages("/inventario"),
        allPages(
          "/notificaciones",
          user.role === "administrador" ? { alcance: "todas" } : {},
        ),
        allPages("/actividad"),
        allPages("/movimientos"),
        user.role === "farmacia"
          ? Promise.resolve([])
          : allPages("/recepciones"),
      ]);
    db.existencias = inventory.map(mapStock);
    db.notificaciones = notifications.map((n) => ({
      id: String(n.id_notificacion),
      ownerId: n.id_usuario,
      categoria: n.categoria,
      procedencia: n.procedencia,
      fecha: n.fecha_creacion,
      rol: n.bandeja === "FARMACIA" ? "farmacia" : "bodega",
      solicitudId: /solicitud/i.test(n.referencia_tipo || "")
        ? String(n.referencia_id)
        : "",
      titulo: n.titulo,
      mensaje: n.mensaje,
      leidaPor: n.leida ? [`${user.role}:${user.username}`] : [],
    }));
    db.actividad = activities.map((a) => ({
      id: String(a.id_actividad),
      fecha: a.fecha,
      usuario: a.actor_nombre || "Sistema",
      localidad:
        a.localidad === "FARMACIA"
          ? "Farmacia"
          : a.localidad === "BODEGA"
            ? "Bodega Central"
            : "General",
      accion: a.accion,
      documento: String(a.recurso_id || ""),
      detalle:
        typeof a.detalle === "string"
          ? a.detalle
          : a.detalle
            ? JSON.stringify(a.detalle)
            : "",
    }));
    for (const m of movements.filter((m) => m.estado !== "ANULADO"))
      for (const d of m.detalle_movimientos_id_movimiento_list || []) {
        const lot = d.lotes_id_lote || {};
        db.movimientos.push({
          id: `${m.id_movimiento}:${d.id_detalle_movimiento}`,
          fecha: m.fecha_movimiento,
          productoId: `medicamentos:${lot.id_medicamento}`,
          lote: lot.numero_lote || "",
          cantidad: numeric(d.cantidad),
          cantidadEntregada:
            d.cantidad_salida == null ? undefined : numeric(d.cantidad_salida),
          unidadEntrega:
            d.unidad_salida === "ML"
              ? "ml (cc)"
              : d.unidad_base_nombre ||
                db.catalogos.find(
                  (c) => c.id === `medicamentos:${lot.id_medicamento}`,
                )?.unidad,
          tipo:
            m.tipo_movimiento === "BODEGA_FARMACIA"
              ? "TRASLADO"
              : m.tipo_movimiento === "AJUSTE_ENTRADA"
                ? "ENTRADA"
                : "SALIDA",
          area:
            db.catalogos.find(
              (c) => c.id === `ubicaciones:${m.id_area_destino}`,
            )?.nombre || "Farmacia",
          destino: d.destino_salida || undefined,
          documento: String(m.id_movimiento),
          saldoAnterior:
            d.unidad_salida === "ML"
              ? d.saldo_anterior_ml == null
                ? undefined
                : numeric(d.saldo_anterior_ml)
              : d.saldo_anterior_base == null
                ? undefined
                : numeric(d.saldo_anterior_base),
          saldoPosterior:
            d.unidad_salida === "ML"
              ? d.saldo_posterior_ml == null
                ? undefined
                : numeric(d.saldo_posterior_ml)
              : d.saldo_posterior_base == null
                ? undefined
                : numeric(d.saldo_posterior_base),
          contenidoMlSalida:
            d.contenido_ml_utilizado == null
              ? undefined
              : numeric(d.contenido_ml_utilizado),
          responsableSalida:
            m.usuarios_id_usuario?.username || `Usuario ${m.id_usuario}`,
          observacionSalida: m.observaciones || "",
        });
      }
    db.recepciones = (
      await Promise.all(
        receipts.map((r) => apiData<ApiRow>(`/recepciones/${r.id_recepcion}`)),
      )
    ).map(mapReceipt);
    for (const receipt of db.recepciones.filter(
      (r) => r.estado === "COMPLETADO",
    ))
      receipt.items.forEach((item, index) =>
        db.movimientos.push({
          id: `receipt:${receipt.id}:${index}`,
          fecha: receipt.fecha + "T12:00:00-06:00",
          productoId: item.productoId,
          lote: item.lote,
          cantidad: item.cantidad,
          tipo: "ENTRADA",
          area: "Bodega Central",
          documento: receipt.documento || receipt.id,
        }),
      );
  }
  const listed = await allPages("/solicitudes");
  const requests = await Promise.all(
    listed.map((r) => apiData<ApiRow>(`/solicitudes/${r.id_solicitud}`)),
  );
  for (const r of requests) {
    for (const d of r.detalle_solicitudes_id_solicitud_list || []) {
      const med = d.medicamentos_id_medicamento;
      if (
        med &&
        !db.catalogos.some((c) => c.id === `medicamentos:${med.id_medicamento}`)
      )
        db.catalogos.push(mapCatalog("medicamentos", med, db.catalogos));
      if (!db.existencias.some((s) => s.id === `product:${d.id_medicamento}`))
        db.existencias.push({
          id: `product:${d.id_medicamento}`,
          virtual: true,
          productoId: `medicamentos:${d.id_medicamento}`,
          lote: "Se asigna al aprobar",
          cantidad: numeric(d.cantidad_solicitada),
          vencimiento: "9999-12-31",
          ubicacion: "En revisión",
        });
    }
    if (
      ["APROBADA", "EN_PREPARACION", "LISTA_ENTREGA", "PARCIAL"].includes(
        r.estado,
      )
    ) {
      const eligible = await apiData<ApiRow[]>(
        `/solicitudes/${r.id_solicitud}/lotes-elegibles`,
      );
      for (const lot of eligible) {
        const product = r.detalle_solicitudes_id_solicitud_list.find(
          (d: ApiRow) => d.id_detalle_solicitud === lot.id_detalle_solicitud,
        )?.id_medicamento;
        if (!product) continue;
        const medication = db.catalogos.find(
          (p) => p.id === `medicamentos:${product}`,
        );
        if (medication && lot.unidad_base?.nombre)
          medication.unidad = lot.unidad_base.nombre;
        const existing = db.existencias.find(
          (s) =>
            s.apiLoteId === lot.id_lote && s.ubicacion === "Bodega Central",
        );
        if (!existing)
          db.existencias.push({
            id: `lot:${lot.id_lote}`,
            apiLoteId: lot.id_lote,
            productoId: `medicamentos:${product}`,
            lote: lot.numero_lote,
            codigoLote: lot.codigo_lote || "",
            vencimiento: dateOnly(lot.fecha_vencimiento),
            cantidad: numeric(lot.stock_fisico),
            apiDisponible: numeric(lot.cantidad_utilizable),
            apiSolicitudId: String(r.id_solicitud),
            apiDetalleId: lot.id_detalle_solicitud,
            ubicacion: "Bodega Central",
          });
      }
    }
    // Shipped lots can have zero remaining stock; retain their identity for physical receipt.
    for (const m of r.movimientos_id_solicitud_list || [])
      for (const d of m.detalle_movimientos_id_movimiento_list || [])
        if (
          !db.existencias.some(
            (s) =>
              s.apiLoteId === d.id_lote && s.ubicacion === "Bodega Central",
          )
        ) {
          const lot = d.lotes_id_lote;
          if (lot)
            db.existencias.push({
              id: `lot:${d.id_lote}`,
              apiLoteId: d.id_lote,
              productoId: `medicamentos:${lot.id_medicamento}`,
              lote: lot.numero_lote,
              codigoLote: lot.codigo_lote,
              vencimiento: dateOnly(lot.fecha_vencimiento),
              cantidad: 0,
              ubicacion: "Bodega Central",
            });
        }
    db.solicitudes.push(mapRequest(r, db));
  }
  return db;
}

function lookupCatalog(
  db: Database,
  type: string,
  value: string,
  required = false,
): number | null {
  const record = db.catalogos.find(
    (c) => c.tipo === type && (c.nombre === value || c.id === value),
  );
  if (!record) {
    if (required)
      throw new Error(`Selecciona un registro existente de ${type}.`);
    return null;
  }
  return numberId(record.id);
}
async function upload(path: string, content: string, name: string) {
  const blob = await (await fetch(content)).blob();
  const body = new FormData();
  body.append("archivo", blob, name);
  await apiData(path, "POST", body);
}
const catalogIds = new Map<string, string>();
const transferIds = new Map<string, string>();

export async function executeServerCommand(
  command: Command,
  db: Database,
): Promise<string | undefined> {
  if (command.type === "medication.delete") {
    const medication = db.catalogos.find((r) => r.id === command.id && r.tipo === "medicamentos");
    if (!medication) throw new Error("El medicamento no existe. Actualiza los datos.");
    await apiData(`/medicamentos/${numberId(medication.id)}`, "DELETE");
    return;
  }
  if (command.type === "catalog.save") {
    const r = command.record;
    const [path, key] = catalogRoutes[r.tipo];
    if (!path) throw new Error("Catálogo no soportado.");
    const old = db.catalogos.find(
      (c) =>
        (c.id === r.id || c.id === catalogIds.get(r.id)) && c.tipo === r.tipo,
    );
    let payload: ApiRow = { nombre: r.nombre, estado: r.activo };
    if (r.tipo === "medicamentos")
      payload = {
        ...payload,
        codigo: r.codigo,
        descripcion: r.descripcion.trim() || null,
        indicaciones: r.indicaciones?.trim() || null,
        id_marca: lookupCatalog(db, "marcas", r.marca),
        id_categoria: lookupCatalog(db, "categorias", r.categoria),
        id_presentacion: lookupCatalog(
          db,
          "presentaciones",
          r.presentacion || "",
          true,
        ),
        id_unidad_medida: lookupCatalog(db, "unidades", r.unidad, true),
        id_accion_terapeutica: lookupCatalog(db, "terapeuticas", r.accion),
        stock_minimo: decimal(r.minimo),
        cantidad_por_empaque: decimal(r.uxe || 1),
        contenido_ml: r.contenidoMl == null ? null : decimal(r.contenidoMl),
      };
    else if (r.tipo === "proveedores")
      payload = { ...payload, correos: r.correos, telefonos: r.telefonos };
    else if (r.tipo === "unidades")
      payload = { ...payload, abreviatura: r.codigo || r.nombre.slice(0, 20) };
    else payload.descripcion = r.descripcion.trim() || null;
    const saved = await apiData<ApiRow>(
      old ? `/${path}/${numberId(old.id)}` : `/${path}`,
      old ? "PATCH" : "POST",
      payload,
    );
    catalogIds.set(r.id, `${r.tipo}:${saved[key]}`);
    if (
      r.tipo === "medicamentos" &&
      r.sintomaIds &&
      JSON.stringify(r.sintomaIds) !== JSON.stringify(old?.sintomaIds || [])
    )
      await apiData(`/medicamentos/${saved[key]}/sintomas`, "PUT", {
        ids_sintomas: r.sintomaIds.map(numberId),
      });
    if (r.tipo === "medicamentos" && r.imagen?.startsWith("data:"))
      await upload(
        `/medicamentos/${saved[key]}/imagen`,
        r.imagen,
        "medicamento.png",
      );
    return `${r.tipo}:${saved[key]}`;
  }
  if (command.type === "notification.read") {
    await apiData(`/notificaciones/${numberId(command.id)}/leida`, "PATCH");
    return;
  }
  if (command.type === 'notification.readAll') {
    await readNotificationsSequentially(command.ids, id => apiData(`/notificaciones/${numberId(id)}/leida`, 'PATCH'));
    return;
  }
  if (command.type === "receipt.draft" || command.type === "receipt.create") {
    await saveReceipt(command, db, allPages, upload);
    return;
  }
  if (command.type === "receipt.cancel") {
    const r = db.recepciones.find((r) => r.id === command.id);
    if (!r?.version)
      throw new Error("Actualiza la recepción antes de cancelarla.");
    await apiData(`/recepciones/${numberId(command.id)}/cancelar`, "POST", {
      motivo: "Cancelada desde SIVET",
      version: r.version,
    });
    return;
  }
  if (command.type === "pharmacy.dispatch") {
    const uuid = command.id.replace(/^SAL-/, "");
    await apiData("/movimientos", "POST", {
      id_operacion: uuid,
      tipo_movimiento: "FARMACIA_AREA",
      ubicacion_origen: "FARMACIA",
      id_area_destino: lookupCatalog(db, "ubicaciones", command.area, true),
      observaciones: command.nota.trim() || null,
      detalles: command.items.map((i) => ({
        id_lote: db.existencias.find((s) => s.id === i.stockId)?.apiLoteId,
        cantidad: decimal(i.cantidad),
        unidad_salida: i.unidadSalida || "BASE",
        destino_salida: i.destino || "HOSPITAL",
      })),
    });
    return;
  }
  if (command.type === "request.create") {
    const grouped = new Map<number, number>();
    for (const item of command.request.items) {
      const stock = db.existencias.find((s) => s.id === item.stockId);
      const med = numberId(stock?.productoId || item.stockId);
      grouped.set(med, (grouped.get(med) || 0) + item.cantidad);
    }
    const existing = db.solicitudes.find(
      (r) => r.referencia === command.request.id,
    );
    if (existing) {
      const same =
        existing.prioridad === command.request.prioridad &&
        existing.nota === (command.request.nota.trim() || "") &&
        existing.apiDetalles?.length === grouped.size &&
        existing.apiDetalles.every(
          (d) => grouped.get(numberId(d.productoId)) === d.solicitada,
        );
      if (same) return;
      throw new Error(
        "Esta referencia de solicitud ya fue registrada con otros datos. Revisa el historial.",
      );
    }
    await apiData("/solicitudes", "POST", {
      numero_solicitud: command.request.id,
      prioridad: command.request.prioridad,
      observaciones: command.request.nota.trim() || null,
      detalles: [...grouped].map(([id, cantidad]) => ({
        id_medicamento: id,
        cantidad_solicitada: decimal(cantidad),
      })),
    });
    return;
  }
  const request =
    "id" in command
      ? db.solicitudes.find((r) => r.id === command.id)
      : undefined;
  if (!request)
    throw new Error("Actualiza la solicitud antes de realizar esta acción.");
  const path = `/solicitudes/${numberId(request.id)}`;
  if (command.type === "request.status") {
    if (command.estado === "RECHAZADO")
      await apiData(path + "/rechazar", "POST", {
        motivo: command.observacion,
      });
    else if (command.estado === "EN PREPARACION")
      await apiData(path + "/aprobar", "POST", {
        detalles: request.apiDetalles?.map((d) => ({
          id_detalle_solicitud: d.id,
          cantidad_aprobada: decimal(d.solicitada),
        })),
      });
    else if (command.estado === "ENVIADO") {
      const operationKey = request.id + ":" + request.preparacion?.version;
      if (!transferIds.has(operationKey))
        transferIds.set(operationKey, crypto.randomUUID());
      await apiData("/movimientos", "POST", {
        id_operacion: transferIds.get(operationKey),
        tipo_movimiento: "BODEGA_FARMACIA",
        ubicacion_origen: "BODEGA",
        ubicacion_destino: "FARMACIA",
        id_solicitud: numberId(request.id),
        observaciones: command.observacion.trim() || null,
        detalles: (request.approvedItems || request.items).map((i) => ({
          id_lote: db.existencias.find((s) => s.id === i.stockId)?.apiLoteId,
          cantidad: decimal(i.cantidad),
        })),
      });
    } else
      throw new Error("Esta transición debe realizarse desde Preparación.");
    return;
  }
  if (command.type === "request.prepare") {
    let version = command.version;
    const persisted = request.preparacion?.lines || [];
    for (const line of command.lines) {
      const original = persisted.find((l) =>
        line.apiAsignacionId
          ? l.apiAsignacionId === line.apiAsignacionId
          : l.requestedStockId === line.requestedStockId,
      );
      if (original && original.stockId !== line.stockId) {
        const reassigned = await apiData<ApiRow>(
          path + "/reservas/reasignar",
          "POST",
          {
            version,
            id_asignacion: original.apiAsignacionId,
            id_lote_nuevo: db.existencias.find((s) => s.id === line.stockId)
              ?.apiLoteId,
            cantidad: decimal(
              line.apiCantidadAsignada ??
                (request.approvedItems || []).find(
                  (i) => i.stockId === line.requestedStockId,
                )?.cantidad ??
                line.cantidad,
            ),
            comentario: line.comentario.trim() || "Cambio del lote sugerido",
          },
        );
        version =
          reassigned.version ?? reassigned.preparacion_version ?? version + 1;
      }
    }
    const saved = await apiData<ApiRow>(path + "/preparacion", "PUT", {
      version,
      detalles: command.lines.map((l) => ({
        id_asignacion: l.apiAsignacionId,
        id_detalle_solicitud:
          l.apiDetalleId ||
          persisted.find((p) => p.requestedStockId === l.requestedStockId)
            ?.apiDetalleId,
        id_lote: db.existencias.find((s) => s.id === l.stockId)?.apiLoteId,
        cantidad_preparada: decimal(l.cantidad),
        numero_lote_observado: l.lote.trim() || null,
        vencimiento_observado: l.vencimiento || null,
        comentario: l.comentario.trim() || null,
        verificado: l.lista,
      })),
    });
    if (command.ready)
      await apiData(path + "/estado", "PATCH", {
        estado: "LISTA_ENTREGA",
        version: saved.version ?? saved.preparacion_version,
      });
    return;
  }
  if (command.type === "request.review") {
    if (!request.incidencia?.id)
      throw new Error("No hay una incidencia vigente.");
    await apiData(
      path + `/incidencias/${request.incidencia.id}/revision`,
      "POST",
      {
        resolucion: command.resolucion || "COMENTARIO",
        respuesta: command.note,
      },
    );
    return;
  }
  if (command.type === "request.receive") {
    const shipment = request.apiEnvios?.find((m) => m.estado === "EN_TRANSITO");
    if (!shipment)
      throw new Error("No hay un envío pendiente de verificación.");
    if (command.mode === "return") {
      await apiData(`/movimientos/${shipment.id}/devolucion`, "POST", {
        motivo: command.note,
      });
      return;
    }
    const details = command.checks.map((c) => {
      const item = shipment.items.find((i) => i.stockId === c.stockId);
      if (!item) throw new Error("La línea recibida no pertenece al envío.");
      return {
        id_detalle_movimiento: item.idDetalle,
        id_lote: item.loteId,
        cantidad_recibida: decimal(c.cantidad),
        numero_lote_observado: c.lote || null,
        vencimiento_observado: c.vencimiento || null,
        condicion: c.conforme ? "BUENA" : "NO_VERIFICABLE",
        conforme: c.conforme,
        observaciones: c.conforme
          ? null
          : command.note || "Diferencia en la recepción",
      };
    });
    await apiData(`/movimientos/${shipment.id}/recepcion`, "POST", {
      modo_recepcion: "COMPLETA",
      detalles: details,
      observaciones: command.note.trim() || null,
    });
    return;
  }
  throw new Error("Operación no soportada por el adaptador API.");
}
